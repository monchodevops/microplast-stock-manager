import { Injectable, inject } from '@angular/core';
import { ProductDomainService, PriceUpdate } from '../../domain';
import { Result, OperationResult } from '../../shared/utils/result';
import { ValidationError, NotFoundError } from '../../shared/utils/errors';
import { IInventoryRepository } from '../../infrastructure/repositories/inventory.repository.interface';
import { InventoryRepository } from '../../infrastructure/repositories/inventory.repository';
import { InventoryMapper } from '../../infrastructure/mappers/inventory.mapper';
import { TransactionLogger } from '../../infrastructure/logging/transaction-logger.service';

/**
 * Request object for single price update
 */
export interface UpdatePriceRequest {
  finishedGoodId: string;
  newPrice: number;
}

/**
 * Command to handle price updates
 * Single responsibility: Update product prices with validation and audit trail
 */
@Injectable({
  providedIn: 'root'
})
export class UpdatePriceCommand {
  private readonly repository: IInventoryRepository = inject(InventoryRepository);
  private readonly mapper = inject(InventoryMapper);
  private readonly productService = inject(ProductDomainService);
  private readonly logger = inject(TransactionLogger);

  /**
   * Update price for a single finished good
   */
  async execute(request: UpdatePriceRequest): Promise<Result<OperationResult, Error>> {
    try {
      // 1. Validate price
      const validation = this.productService.validatePriceUpdate(request.newPrice);
      if (!validation.isValid) {
        return Result.failure(new ValidationError(validation.error!));
      }

      // 2. Check if finished good exists
      const finishedGood = await this.repository.findFinishedGoodById(request.finishedGoodId);
      if (!finishedGood) {
        return Result.failure(new NotFoundError('Producto terminado no encontrado'));
      }

      // 3. Get product details for logging
      const product = await this.repository.findProductById(finishedGood.product_definition_id);
      const productName = product?.name || 'Producto desconocido';

      // 4. Update price
      await this.repository.updateFinishedGoodPrice(request.finishedGoodId, request.newPrice);

      // 5. Log price update
      await this.logger.logPriceUpdate(productName, finishedGood.color_name, request.newPrice);

      return Result.success({
        success: true,
        message: 'Precio actualizado correctamente'
      });

    } catch (error) {
      console.error('Error updating price:', error);
      return Result.failure(error as Error);
    }
  }

  /**
   * Bulk update prices
   */
  async executeBulk(updates: PriceUpdate[]): Promise<Result<OperationResult, Error>> {
    try {
      // 1. Validate bulk updates
      const validation = this.productService.validateBulkPriceUpdates(updates);
      if (!validation.isValid) {
        return Result.failure(new ValidationError(validation.error!));
      }

      // 2. Execute updates in parallel
      const updatePromises = updates.map(update =>
        this.repository.updateFinishedGoodPrice(update.id, update.newPrice)
      );

      await Promise.all(updatePromises);

      // 3. Log bulk operation
      await this.logger.logBulkPriceUpdate(updates.length);

      return Result.success({
        success: true,
        message: `Se actualizaron ${updates.length} precios exitosamente`
      });

    } catch (error) {
      console.error('Error in bulk price update:', error);
      return Result.failure(error as Error);
    }
  }
}