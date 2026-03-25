import { ProductDefinition, ProductLayer } from '../entities/product-definition';

/**
 * Value object representing a production request
 */
export class ProductionRequest {
  constructor(
    public readonly productId: string,
    public readonly colorName: string,
    public readonly quantity: number
  ) {
    if (!productId.trim()) {
      throw new Error('Product ID is required');
    }
    if (!colorName.trim()) {
      throw new Error('Color name is required');
    }
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }
  }

  /**
   * Create a production request with product definition
   */
  withProduct(product: ProductDefinition): ProductionRequestWithProduct {
    return new ProductionRequestWithProduct(
      this.productId,
      this.colorName,
      this.quantity,
      product
    );
  }
}

/**
 * Production request enriched with product definition
 */
export class ProductionRequestWithProduct extends ProductionRequest {
  constructor(
    productId: string,
    colorName: string,
    quantity: number,
    public readonly product: ProductDefinition
  ) {
    super(productId, colorName, quantity);
  }

  /**
   * Calculate total material needed for this production
   */
  calculateMaterialNeeded(): number {
    return this.product.calculateMaterialNeeded(this.quantity);
  }
}

/**
 * Production request for multi-layer products (e.g. bi/tri-layer tanks).
 * layerColors[i] is the raw material color that feeds layer i+1.
 */
export class MultiLayerProductionRequest extends ProductionRequest {
  public readonly layerColors: string[];

  constructor(
    productId: string,
    layerColors: string[],
    quantity: number
  ) {
    if (!layerColors.length) {
      throw new Error('At least one layer color is required');
    }
    // colorName (the primary / finished-good color) is always layer 1
    super(productId, layerColors[0], quantity);
    this.layerColors = layerColors;
  }

  /** Enrich the request with its product definition. */
  withProduct(product: ProductDefinition): MultiLayerProductionRequestWithProduct {
    return new MultiLayerProductionRequestWithProduct(
      this.productId,
      this.layerColors,
      this.quantity,
      product
    );
  }
}

/**
 * Multi-layer production request enriched with product definition.
 */
export class MultiLayerProductionRequestWithProduct extends MultiLayerProductionRequest {
  constructor(
    productId: string,
    layerColors: string[],
    quantity: number,
    public readonly product: ProductDefinition
  ) {
    super(productId, layerColors, quantity);
  }

  /** Material needed for a specific layer (0-based index). */
  calculateMaterialNeededForLayer(layerIndex: number): number {
    return this.product.calculateMaterialNeededForLayer(this.quantity, layerIndex);
  }

  /** Total material across all layers — satisfies the ProductionRequestWithProduct interface. */
  calculateMaterialNeeded(): number {
    return this.product.calculateMaterialNeeded(this.quantity);
  }

  /** Total material across all layers. */
  calculateTotalMaterialNeeded(): number {
    return this.product.calculateMaterialNeeded(this.quantity);
  }
}

/**
 * Value object representing a production summary
 */
export class ProductionSummary {
  constructor(
    public readonly productName: string,
    public readonly colorName: string,
    public readonly quantity: number,
    public readonly materialConsumption: number
  ) {}

  /**
   * Create a description for logging
   */
  createDescription(): string {
    return `Producción: ${this.quantity}u de ${this.productName} (${this.colorName})`;
  }
}

/**
 * Value object representing stock adjustment details
 */
export class MaterialAdjustment {
  constructor(
    public readonly materialId: string,
    public readonly materialName: string,
    public readonly oldStock: number,
    public readonly newStock: number,
    public readonly reason?: string
  ) {}

  get difference(): number {
    return this.newStock - this.oldStock;
  }

  get isIncrease(): boolean {
    return this.difference > 0;
  }

  get isSignificant(): boolean {
    return Math.abs(this.difference) > 0.01;
  }

  createDescription(): string {
    return `Ajuste manual - ${this.materialName}: ${this.oldStock}kg → ${this.newStock}kg${this.reason ? ` (${this.reason})` : ''}`;
  }
}