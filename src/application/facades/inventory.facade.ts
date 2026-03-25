import { Injectable, inject } from '@angular/core';
import { 
  ProductionRequest,
  MultiLayerProductionRequest,
  Material,
  ProductDefinition,
  FinishedGood
} from '../../domain';
import { OperationResult } from '../../shared/utils/result';
import { InventoryStateStore } from '../../infrastructure/store/inventory-state.store';
import { IInventoryRepository } from '../../infrastructure/repositories/inventory.repository.interface';
import { InventoryRepository } from '../../infrastructure/repositories/inventory.repository';
import { InventoryMapper } from '../../infrastructure/mappers/inventory.mapper';
import { RunProductionCommand } from '../commands/run-production.command';
import { UpdateStockCommand, UpdateStockRequest } from '../commands/update-stock.command';
import { UpdatePriceCommand, UpdatePriceRequest } from '../commands/update-price.command';
import { PriceUpdate } from '../../domain';

/**
 * Facade providing a simplified API for inventory operations
 * Single responsibility: Coordinate between commands, store, and components
 */
@Injectable({
  providedIn: 'root'
})
export class InventoryFacade {
  private readonly store = inject(InventoryStateStore);
  private readonly repository: IInventoryRepository = inject(InventoryRepository);
  private readonly mapper = inject(InventoryMapper);
  private readonly runProductionCommand = inject(RunProductionCommand);
  private readonly updateStockCommand = inject(UpdateStockCommand);
  private readonly updatePriceCommand = inject(UpdatePriceCommand);

  // ===== READ API (for components) =====
  
  // State selectors
  readonly materials$ = this.store.materials;
  readonly products$ = this.store.products;
  readonly finishedGoods$ = this.store.finishedGoods;
  readonly loading$ = this.store.loading;
  readonly error$ = this.store.error;

  // Computed values
  readonly lowStockAlerts$ = this.store.lowStockAlerts;
  readonly totalStock$ = this.store.totalRawMaterialStock;
  readonly totalUnits$ = this.store.totalFinishedUnits;
  readonly totalValue$ = this.store.totalInventoryValue;
  readonly availableColors$ = this.store.availableColors;
  readonly activeProducts$ = this.store.activeProducts;
  readonly outOfStockProducts$ = this.store.outOfStockProducts;

  // ===== WRITE API (commands) =====

  /**
   * Execute a production run
   */
  async runProduction(productId: string, colorName: string, quantity: number): Promise<OperationResult> {
    const request = new ProductionRequest(productId, colorName, quantity);
    const result = await this.runProductionCommand.execute(request);
    
    if (result.success) {
      await this.refreshData(); // Refresh state after successful operation
    }
    
    return result.success ? result.data : {
      success: false,
      message: result.error.message
    };
  }

  /**
   * Execute a multi-layer production run (for bi/tri-layer Tanques).
   * layerColors[i] is the raw material color for layer i+1.
   */
  async runMultiLayerProduction(productId: string, layerColors: string[], quantity: number): Promise<OperationResult> {
    const request = new MultiLayerProductionRequest(productId, layerColors, quantity);
    const result = await this.runProductionCommand.execute(request);

    if (result.success) {
      await this.refreshData();
    }

    return result.success ? result.data : {
      success: false,
      message: result.error.message
    };
  }

  /**
   * Update material stock
   */
  async updateMaterialStock(
    materialId: string, 
    newStock: number, 
    newThreshold?: number, 
    reason?: string
  ): Promise<OperationResult> {
    const request: UpdateStockRequest = {
      materialId,
      newStock,
      newThreshold,
      reason
    };
    
    const result = await this.updateStockCommand.execute(request);
    
    if (result.success) {
      await this.refreshData();
    }
    
    return result.success ? result.data : {
      success: false,
      message: result.error.message
    };
  }

  /**
   * Add incoming material
   */
  async addIncomingMaterial(colorName: string, amount: number): Promise<OperationResult> {
    const result = await this.updateStockCommand.addIncomingMaterial(colorName, amount);
    
    if (result.success) {
      await this.refreshData();
    }
    
    return result.success ? result.data : {
      success: false,
      message: result.error.message
    };
  }

  /**
   * Update finished good price
   */
  async updateFinishedGoodPrice(finishedGoodId: string, newPrice: number): Promise<OperationResult> {
    const request: UpdatePriceRequest = {
      finishedGoodId,
      newPrice
    };
    
    const result = await this.updatePriceCommand.execute(request);
    
    if (result.success) {
      await this.refreshData();
    }
    
    return result.success ? result.data : {
      success: false,
      message: result.error.message
    };
  }

  /**
   * Bulk update prices
   */
  async bulkUpdatePrices(updates: PriceUpdate[]): Promise<OperationResult> {
    const result = await this.updatePriceCommand.executeBulk(updates);
    
    if (result.success) {
      await this.refreshData();
    }
    
    return result.success ? result.data : {
      success: false,
      message: result.error.message
    };
  }

  // ===== DATA LOADING =====

  /**
   * Load initial data into the store
   */
  async loadInitialData(): Promise<void> {
    this.store.setLoading(true);
    
    try {
      const [dbMaterials, dbProducts, dbFinishedGoods] = await Promise.all([
        this.repository.findAllMaterials(),
        this.repository.findAllActiveProducts(),
        this.repository.findAllFinishedGoods()
      ]);

      // Transform to domain entities
      const materials = this.mapper.toDomainMaterials(dbMaterials);
      const products = this.mapper.toDomainProducts(dbProducts);
      const finishedGoods = this.mapper.toDomainFinishedGoods(dbFinishedGoods);

      // Update store
      this.store.setMaterials(materials);
      this.store.setProducts(products);
      this.store.setFinishedGoods(finishedGoods);
      this.store.setError(null);
      
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.store.setError((error as Error).message);
    } finally {
      this.store.setLoading(false);
    }
  }

  /**
   * Refresh data (after operations)
   */
  async refreshData(): Promise<void> {
    // Only refresh if not already loading
    if (this.store.loading()) return;
    
    await this.loadInitialData();
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.store.setError(null);
  }

  // ===== HELPER METHODS =====

  /**
   * Find material by ID
   */
  findMaterialById(id: string): Material | undefined {
    return this.store.findMaterialById(id);
  }

  /**
   * Find material by color name
   */
  findMaterialByColor(colorName: string): Material | undefined {
    return this.store.findMaterialByColor(colorName);
  }

  /**
   * Find product by ID
   */
  findProductById(id: string): ProductDefinition | undefined {
    return this.store.findProductById(id);
  }

  /**
   * Find finished good by ID
   */
  findFinishedGoodById(id: string): FinishedGood | undefined {
    return this.store.findFinishedGoodById(id);
  }

  /**
   * Find finished goods by product
   */
  findFinishedGoodsByProduct(productId: string): FinishedGood[] {
    return this.store.findFinishedGoodsByProduct(productId);
  }

  // ===== OPTIMISTIC UPDATES =====
  
  /**
   * Optimistic update for better UX (update UI immediately, revert if operation fails)
   */
  async withOptimisticUpdate<T>(
    optimisticUpdate: () => void,
    operation: () => Promise<T>,
    rollback: () => void
  ): Promise<T> {
    // Apply optimistic update
    optimisticUpdate();
    
    try {
      // Execute operation
      const result = await operation();
      return result;
    } catch (error) {
      // Rollback on error
      rollback();
      throw error;
    }
  }
}