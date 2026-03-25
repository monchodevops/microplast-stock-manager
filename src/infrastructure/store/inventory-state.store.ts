import { Injectable, signal, computed } from '@angular/core';
import { Material, ProductDefinition, FinishedGood } from '../../domain';

/**
 * State interface for the inventory store
 */
export interface InventoryState {
  materials: Material[];
  products: ProductDefinition[];
  finishedGoods: FinishedGood[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

/**
 * Initial state for the inventory store
 */
const initialState: InventoryState = {
  materials: [],
  products: [],
  finishedGoods: [],
  loading: false,
  error: null,
  lastUpdated: null
};

/**
 * State store for inventory data using Angular signals
 * Single responsibility: Managing UI state and providing computed values
 */
@Injectable({
  providedIn: 'root'
})
export class InventoryStateStore {
  // Private state signal
  private readonly _state = signal<InventoryState>(initialState);

  // Selectors (read-only computed values)
  readonly state = this._state.asReadonly();
  readonly materials = computed(() => this._state().materials);
  readonly products = computed(() => this._state().products);
  readonly finishedGoods = computed(() => this._state().finishedGoods);
  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);
  readonly lastUpdated = computed(() => this._state().lastUpdated);

  // Computed business logic (moved from InventoryService)
  readonly lowStockAlerts = computed(() => {
    return this.materials().filter(material => material.isLowStock());
  });

  readonly totalRawMaterialStock = computed(() => {
    return this.materials().reduce((total, material) => total + material.currentStockKg, 0);
  });

  readonly totalFinishedUnits = computed(() => {
    return this.finishedGoods().reduce((total, good) => total + good.quantityUnits, 0);
  });

  readonly totalInventoryValue = computed(() => {
    return this.finishedGoods().reduce((total, good) => total + good.getTotalValue(), 0);
  });

  readonly availableColors = computed(() => {
    return Array.from(new Set(this.materials().map(m => m.colorName))).sort();
  });

  readonly activeProducts = computed(() => {
    return this.products().filter(product => product.isActive());
  });

  readonly outOfStockProducts = computed(() => {
    return this.finishedGoods().filter(good => !good.isInStock());
  });

  // State mutations (actions)
  setMaterials(materials: Material[]): void {
    this._state.update(state => ({ 
      ...state, 
      materials,
      lastUpdated: new Date()
    }));
  }

  setProducts(products: ProductDefinition[]): void {
    this._state.update(state => ({ 
      ...state, 
      products,
      lastUpdated: new Date()
    }));
  }

  setFinishedGoods(finishedGoods: FinishedGood[]): void {
    this._state.update(state => ({ 
      ...state, 
      finishedGoods,
      lastUpdated: new Date()
    }));
  }

  setLoading(loading: boolean): void {
    this._state.update(state => ({ ...state, loading }));
  }

  setError(error: string | null): void {
    this._state.update(state => ({ ...state, error }));
  }

  setLoadingState(loading: boolean, error: string | null = null): void {
    this._state.update(state => ({ ...state, loading, error }));
  }

  // Optimistic updates for better UX
  updateMaterial(updatedMaterial: Material): void {
    this._state.update(state => ({
      ...state,
      materials: state.materials.map(material =>
        material.id === updatedMaterial.id ? updatedMaterial : material
      ),
      lastUpdated: new Date()
    }));
  }

  updateProduct(updatedProduct: ProductDefinition): void {
    this._state.update(state => ({
      ...state,
      products: state.products.map(product =>
        product.id === updatedProduct.id ? updatedProduct : product
      ),
      lastUpdated: new Date()
    }));
  }

  updateFinishedGood(updatedFinishedGood: FinishedGood): void {
    this._state.update(state => ({
      ...state,
      finishedGoods: state.finishedGoods.map(good =>
        good.id === updatedFinishedGood.id ? updatedFinishedGood : good
      ),
      lastUpdated: new Date()
    }));
  }

  addMaterial(newMaterial: Material): void {
    this._state.update(state => ({
      ...state,
      materials: [...state.materials, newMaterial].sort((a, b) => a.colorName.localeCompare(b.colorName)),
      lastUpdated: new Date()
    }));
  }

  addProduct(newProduct: ProductDefinition): void {
    this._state.update(state => ({
      ...state,
      products: [...state.products, newProduct].sort((a, b) => a.name.localeCompare(b.name)),
      lastUpdated: new Date()
    }));
  }

  addFinishedGood(newFinishedGood: FinishedGood): void {
    this._state.update(state => ({
      ...state,
      finishedGoods: [...state.finishedGoods, newFinishedGood],
      lastUpdated: new Date()
    }));
  }

  // Remove items (for soft deletes we update, for hard deletes we remove)
  removeProduct(productId: string): void {
    this._state.update(state => ({
      ...state,
      products: state.products.filter(product => product.id !== productId),
      lastUpdated: new Date()
    }));
  }

  removeFinishedGood(finishedGoodId: string): void {
    this._state.update(state => ({
      ...state,
      finishedGoods: state.finishedGoods.filter(good => good.id !== finishedGoodId),
      lastUpdated: new Date()
    }));
  }

  // Reset state
  reset(): void {
    this._state.set(initialState);
  }

  // Update entire state (for bulk operations)
  setState(newState: Partial<InventoryState>): void {
    this._state.update(state => ({ 
      ...state, 
      ...newState, 
      lastUpdated: new Date() 
    }));
  }

  // Helper methods for finding items
  findMaterialById(id: string): Material | undefined {
    return this.materials().find(material => material.id === id);
  }

  findMaterialByColor(colorName: string): Material | undefined {
    return this.materials().find(material => 
      material.colorName.toLowerCase() === colorName.toLowerCase()
    );
  }

  findProductById(id: string): ProductDefinition | undefined {
    return this.products().find(product => product.id === id);
  }

  findFinishedGoodById(id: string): FinishedGood | undefined {
    return this.finishedGoods().find(good => good.id === id);
  }

  findFinishedGoodsByProduct(productId: string): FinishedGood[] {
    return this.finishedGoods().filter(good => good.productDefinitionId === productId);
  }
}