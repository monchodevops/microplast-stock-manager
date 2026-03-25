import { Injectable, inject } from '@angular/core';
import { 
  MaterialDomainService,
  MaterialAdjustment 
} from '../../domain';
import { Result, OperationResult } from '../../shared/utils/result';
import { ValidationError, NotFoundError } from '../../shared/utils/errors';
import { IInventoryRepository } from '../../infrastructure/repositories/inventory.repository.interface';
import { InventoryRepository } from '../../infrastructure/repositories/inventory.repository';
import { InventoryMapper } from '../../infrastructure/mappers/inventory.mapper';
import { TransactionLogger } from '../../infrastructure/logging/transaction-logger.service';

/**
 * Request object for stock update
 */
export interface UpdateStockRequest {
  materialId: string;
  newStock: number;
  newThreshold?: number;
  reason?: string;
}

/**
 * Command to handle material stock updates
 * Single responsibility: Update material stock with validation and audit trail
 */
@Injectable({
  providedIn: 'root'
})
export class UpdateStockCommand {
  private readonly repository: IInventoryRepository = inject(InventoryRepository);
  private readonly mapper = inject(InventoryMapper);
  private readonly materialService = inject(MaterialDomainService);
  private readonly logger = inject(TransactionLogger);

  /**
   * Execute stock update with validation
   */
  async execute(request: UpdateStockRequest): Promise<Result<OperationResult, Error>> {
    try {
      // 1. Load current material
      const dbMaterial = await this.repository.findMaterialById(request.materialId);
      if (!dbMaterial) {
        return Result.failure(new NotFoundError('Material no encontrado'));
      }

      const material = this.mapper.toDomainMaterial(dbMaterial);

      // 2. Validate stock adjustment
      const stockValidation = this.materialService.validateStockAdjustment(
        material.currentStockKg,
        request.newStock
      );
      if (!stockValidation.isValid) {
        return Result.failure(new ValidationError(stockValidation.error!));
      }

      // 3. Validate threshold if provided
      const newThreshold = request.newThreshold ?? material.alertThresholdKg;
      const thresholdValidation = this.materialService.validateThresholdAdjustment(newThreshold);
      if (!thresholdValidation.isValid) {
        return Result.failure(new ValidationError(thresholdValidation.error!));
      }

      // 4. Create adjustment object for logging
      const adjustment = this.materialService.createMaterialAdjustment(
        material,
        request.newStock,
        newThreshold,
        request.reason
      );

      // 5. Execute updates
      await this.repository.updateMaterialStock(material.id, request.newStock);
      
      if (request.newThreshold !== undefined) {
        await this.repository.updateMaterialThreshold(material.id, request.newThreshold);
      }

      // 6. Log adjustment if significant
      if (adjustment.isSignificant) {
        await this.logger.logMaterialAdjustment(adjustment);
      }

      return Result.success({
        success: true,
        message: 'Stock actualizado correctamente'
      });

    } catch (error) {
      console.error('Error in update stock command:', error);
      return Result.failure(error as Error);
    }
  }

  /**
   * Add incoming material (new stock arrival)
   */
  async addIncomingMaterial(
    colorName: string, 
    amount: number
  ): Promise<Result<OperationResult, Error>> {
    try {
      // 1. Validate amount
      const validation = this.materialService.validateIncomingMaterial(amount);
      if (!validation.isValid) {
        return Result.failure(new ValidationError(validation.error!));
      }

      // 2. Check if material exists
      const existingMaterial = await this.repository.findMaterialByColor(colorName);
      
      if (existingMaterial) {
        // Update existing material
        const newStock = existingMaterial.current_stock_kg + amount;
        await this.repository.updateMaterialStock(existingMaterial.id, newStock);
        
        // Log incoming material
        await this.logger.logIncomingMaterial(
          colorName,
          amount,
          existingMaterial.current_stock_kg,
          newStock
        );
      } else {
        // Create new material
        const defaultThreshold = this.materialService.calculateDefaultAlertThreshold(amount);
        const newMaterial = await this.repository.createMaterial({
          color_name: colorName,
          current_stock_kg: amount,
          alert_threshold_kg: defaultThreshold,
          last_updated: new Date().toISOString()
        });

        // Log creation
        await this.logger.logIncomingMaterial(colorName, amount, 0, amount);
      }

      return Result.success({
        success: true,
        message: 'Material agregado correctamente'
      });

    } catch (error) {
      console.error('Error adding incoming material:', error);
      return Result.failure(error as Error);
    }
  }
}