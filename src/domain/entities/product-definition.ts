/**
 * Represents a single layer in a multi-layer product (e.g. bi-layer or tri-layer tank).
 */
export interface ProductLayer {
  order: number;        // 1-based index
  consumptionKg: number; // kg of this material per produced unit
}

/**
 * Domain entity representing a product definition (recipe)
 */
export class ProductDefinition {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly consumptionPerUnitKg: number,
    public readonly category: string,
    public readonly deletedAt?: Date,
    public readonly layersConfig?: ProductLayer[] | null
  ) {
    if (consumptionPerUnitKg <= 0) {
      throw new Error('Consumption per unit must be positive');
    }
    if (!name.trim()) {
      throw new Error('Product name cannot be empty');
    }
  }

  /** Number of layers (1 for mono-layer products). */
  get layerCount(): number {
    return this.layersConfig?.length ?? 1;
  }

  /** True when this product has more than one material layer. */
  get isMultiLayer(): boolean {
    return this.layerCount > 1;
  }

  /**
   * Calculate material needed for a specific layer index (0-based).
   * Falls back to the full consumptionPerUnitKg for mono-layer products.
   */
  calculateMaterialNeededForLayer(units: number, layerIndex: number): number {
    if (units <= 0) throw new Error('Units must be positive');
    if (this.layersConfig && this.layersConfig[layerIndex]) {
      return units * this.layersConfig[layerIndex].consumptionKg;
    }
    return units * this.consumptionPerUnitKg;
  }

  /**
   * Check if this product definition is active (not deleted)
   */
  isActive(): boolean {
    return !this.deletedAt;
  }

  /**
   * Calculate material needed for a given production quantity
   */
  calculateMaterialNeeded(units: number): number {
    if (units <= 0) {
      throw new Error('Units must be positive');
    }
    return units * this.consumptionPerUnitKg;
  }

  /**
   * Calculate maximum units that can be produced with available material
   */
  calculateMaxUnitsFromStock(availableKg: number): number {
    return Math.floor(availableKg / this.consumptionPerUnitKg);
  }

  /**
   * Mark product as deleted (soft delete)
   */
  markAsDeleted(): ProductDefinition {
    return new ProductDefinition(
      this.id,
      this.name,
      this.consumptionPerUnitKg,
      this.category,
      new Date(),
      this.layersConfig
    );
  }

  /**
   * Update product properties
   */
  update(name: string, consumptionPerUnitKg: number, category: string, layersConfig?: ProductLayer[] | null): ProductDefinition {
    return new ProductDefinition(
      this.id,
      name,
      consumptionPerUnitKg,
      category,
      this.deletedAt,
      layersConfig ?? this.layersConfig
    );
  }
}