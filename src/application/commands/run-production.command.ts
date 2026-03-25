import { Injectable, inject } from '@angular/core';
import { 
  ProductionRequest, 
  ProductionRequestWithProduct,
  MultiLayerProductionRequest,
  MultiLayerProductionRequestWithProduct,
  Material, 
  ProductDefinition,
  MaterialDomainService,
  ProductionDomainService 
} from '../../domain';
import { Result, OperationResult } from '../../shared/utils/result';
import { NotFoundError, ValidationError, InsufficientStockError } from '../../shared/utils/errors';
import { IInventoryRepository } from '../../infrastructure/repositories/inventory.repository.interface';
import { InventoryRepository } from '../../infrastructure/repositories/inventory.repository';
import { InventoryMapper } from '../../infrastructure/mappers/inventory.mapper';
import { TransactionLogger } from '../../infrastructure/logging/transaction-logger.service';

/**
 * Command to handle production run operations
 * Single responsibility: Execute production workflow with proper validation and state management
 */
@Injectable({
  providedIn: 'root'
})
export class RunProductionCommand {
  private readonly repository: IInventoryRepository = inject(InventoryRepository);
  private readonly mapper = inject(InventoryMapper);
  private readonly materialService = inject(MaterialDomainService);
  private readonly productionService = inject(ProductionDomainService);
  private readonly logger = inject(TransactionLogger);

  /**
   * Execute a production run with full validation and transaction logging.
   * Accepts both mono-layer (ProductionRequest) and multi-layer (MultiLayerProductionRequest).
   */
  async execute(request: ProductionRequest): Promise<Result<OperationResult, Error>> {
    // Delegate to the appropriate path based on request type
    if (request instanceof MultiLayerProductionRequest) {
      return this.executeMultiLayer(request);
    }
    return this.executeMonoLayer(request);
  }

  // ===== MONO-LAYER PATH (unchanged) =====

  private async executeMonoLayer(request: ProductionRequest): Promise<Result<OperationResult, Error>> {
    try {
      // 1. Validate request format
      const quantityValidation = this.productionService.validateProductionQuantity(request.quantity);
      if (!quantityValidation.isValid) {
        return Result.failure(new ValidationError(quantityValidation.error!));
      }

      // 2. Load fresh data from database
      const [dbMaterials, dbProducts] = await Promise.all([
        this.repository.findAllMaterials(),
        this.repository.findAllActiveProducts()
      ]);

      const materials = this.mapper.toDomainMaterials(dbMaterials);
      const products = this.mapper.toDomainProducts(dbProducts);

      // 3. Find required entities
      const product = products.find(p => p.id === request.productId);
      if (!product) {
        return Result.failure(new NotFoundError('Producto no encontrado'));
      }

      const material = this.materialService.findMaterialByColor(materials, request.colorName);
      if (!material) {
        return Result.failure(new NotFoundError(`Color ${request.colorName} no disponible en materia prima`));
      }

      // 4. Create enriched request with product
      const enrichedRequest = request.withProduct(product);

      // 5. Validate business rules
      const validation = this.productionService.validateProductionRequest(enrichedRequest as ProductionRequestWithProduct, material);
      if (!validation.isValid) {
        return Result.failure(new ValidationError(validation.error!));
      }

      // 6. Execute production transaction
      await this.executeProductionTransaction(enrichedRequest as ProductionRequestWithProduct, material);

      // 7. Log transaction
      const summary = this.productionService.createProductionSummary(enrichedRequest as ProductionRequestWithProduct);
      await this.logger.logProductionRun(summary);

      return Result.success({
        success: true,
        message: 'Producción registrada con éxito'
      });

    } catch (error) {
      console.error('Error in production command (mono-layer):', error);
      return Result.failure(error as Error);
    }
  }

  // ===== MULTI-LAYER PATH =====

  private async executeMultiLayer(request: MultiLayerProductionRequest): Promise<Result<OperationResult, Error>> {
    try {
      // 1. Validate quantity
      const quantityValidation = this.productionService.validateProductionQuantity(request.quantity);
      if (!quantityValidation.isValid) {
        return Result.failure(new ValidationError(quantityValidation.error!));
      }

      // 2. Load fresh data
      const [dbMaterials, dbProducts] = await Promise.all([
        this.repository.findAllMaterials(),
        this.repository.findAllActiveProducts()
      ]);

      const materials = this.mapper.toDomainMaterials(dbMaterials);
      const products = this.mapper.toDomainProducts(dbProducts);

      // 3. Find product
      const product = products.find(p => p.id === request.productId);
      if (!product) {
        return Result.failure(new NotFoundError('Producto no encontrado'));
      }

      // 4. Enrich request with product
      const enrichedRequest = new MultiLayerProductionRequestWithProduct(
        request.productId,
        request.layerColors,
        request.quantity,
        product
      );

      // 5. Build material map keyed by color for fast lookup
      const materialsByColor = new Map<string, Material>(
        materials.map(m => [m.colorName, m])
      );

      // 6. Validate per-layer stock
      const validation = this.productionService.validateMultiLayerProductionRequest(enrichedRequest, materialsByColor);
      if (!validation.isValid) {
        return Result.failure(new ValidationError(validation.error!));
      }

      // 7. Execute transaction
      await this.executeMultiLayerProductionTransaction(enrichedRequest, materialsByColor);

      // 8. Log transaction
      const colorsLabel = request.layerColors.join(' + ');
      await this.logger.logRawTransaction(
        'PRODUCTION_RUN',
        `Producción: ${request.quantity}u de ${product.name} (${colorsLabel})`,
        -enrichedRequest.calculateTotalMaterialNeeded()
      );

      return Result.success({
        success: true,
        message: 'Producción multicapa registrada con éxito'
      });

    } catch (error) {
      console.error('Error in production command (multi-layer):', error);
      return Result.failure(error as Error);
    }
  }

  /**
   * Execute the multi-layer production transaction:
   * - Deduct stock from each layer's material
   * - Update (or create) the finished good using the Capa 1 color
   */
  private async executeMultiLayerProductionTransaction(
    request: MultiLayerProductionRequestWithProduct,
    materialsByColor: Map<string, Material>
  ): Promise<void> {
    const layersConfig = request.product.layersConfig!;

    // 1. Update each layer's material stock
    for (let i = 0; i < layersConfig.length; i++) {
      const color = request.layerColors[i];
      const material = materialsByColor.get(color)!;
      const consumed = request.calculateMaterialNeededForLayer(i);
      const newStock = material.calculateStockAfterConsumption(consumed);
      await this.repository.updateMaterialStock(material.id, newStock);
    }

    // 2. Update or create finished good (identified by product + Capa 1 color)
    const primaryColor = request.layerColors[0];
    const existingFinishedGood = await this.repository.findFinishedGoodByProductAndColor(
      request.product.id,
      primaryColor
    );

    if (existingFinishedGood) {
      const newQuantity = existingFinishedGood.quantity_units + request.quantity;
      await this.repository.updateFinishedGoodQuantity(existingFinishedGood.id, newQuantity);
    } else {
      await this.repository.createFinishedGood({
        product_definition_id: request.product.id,
        color_name: primaryColor,
        quantity_units: request.quantity,
        unit_price: 0
      });
    }
  }

  /**
   * Execute the actual production transaction
   * This should ideally be wrapped in a database transaction
   */
  private async executeProductionTransaction(
    request: ProductionRequestWithProduct, 
    material: Material
  ): Promise<void> {
    const materialNeeded = request.calculateMaterialNeeded();
    
    // 1. Update material stock
    const newMaterialStock = material.calculateStockAfterConsumption(materialNeeded);
    await this.repository.updateMaterialStock(material.id, newMaterialStock);

    // 2. Update or create finished good
    const existingFinishedGood = await this.repository.findFinishedGoodByProductAndColor(
      request.product.id,
      request.colorName
    );

    if (existingFinishedGood) {
      // Update existing finished good
      const newQuantity = existingFinishedGood.quantity_units + request.quantity;
      await this.repository.updateFinishedGoodQuantity(existingFinishedGood.id, newQuantity);
    } else {
      // Create new finished good
      await this.repository.createFinishedGood({
        product_definition_id: request.product.id,
        color_name: request.colorName,
        quantity_units: request.quantity,
        unit_price: 0 // Default price
      });
    }
  }
}