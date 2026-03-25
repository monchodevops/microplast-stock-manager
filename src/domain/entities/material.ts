/**
 * Domain entity representing a raw material in the inventory
 * Contains business logic related to materials
 */
export class Material {
  constructor(
    public readonly id: string,
    public readonly colorName: string,
    public readonly currentStockKg: number,
    public readonly alertThresholdKg: number,
    public readonly lastUpdated?: Date
  ) {
    if (currentStockKg < 0) {
      throw new Error('Stock cannot be negative');
    }
    if (alertThresholdKg < 0) {
      throw new Error('Alert threshold cannot be negative');
    }
  }

  /**
   * Business rule: Material is considered low stock if current stock is at or below threshold
   * Exception: Both values being 0 is considered "not configured" rather than low stock
   */
  isLowStock(): boolean {
    return this.currentStockKg <= this.alertThresholdKg &&
           !(this.currentStockKg === 0 && this.alertThresholdKg === 0);
  }

  /**
   * Check if there's enough stock for a given consumption
   */
  hasEnoughStock(requiredKg: number): boolean {
    return this.currentStockKg >= requiredKg;
  }

  /**
   * Calculate what the stock would be after consumption
   */
  calculateStockAfterConsumption(consumptionKg: number): number {
    return this.currentStockKg - consumptionKg;
  }

  /**
   * Create a new Material instance with updated stock
   */
  withUpdatedStock(newStock: number): Material {
    return new Material(
      this.id,
      this.colorName,
      newStock,
      this.alertThresholdKg,
      new Date()
    );
  }

  /**
   * Create a new Material instance with updated threshold
   */
  withUpdatedThreshold(newThreshold: number): Material {
    return new Material(
      this.id,
      this.colorName,
      this.currentStockKg,
      newThreshold,
      this.lastUpdated
    );
  }
}