/**
 * Domain entity representing finished goods in inventory
 */
export class FinishedGood {
  constructor(
    public readonly id: string,
    public readonly productDefinitionId: string,
    public readonly colorName: string,
    public readonly quantityUnits: number,
    public readonly unitPrice: number = 0
  ) {
    if (quantityUnits < 0) {
      throw new Error('Quantity cannot be negative');
    }
    if (unitPrice < 0) {
      throw new Error('Unit price cannot be negative');
    }
  }

  /**
   * Check if this finished good is in stock
   */
  isInStock(): boolean {
    return this.quantityUnits > 0;
  }

  /**
   * Check if there's enough quantity for a given dispatch
   */
  hasEnoughQuantity(requiredUnits: number): boolean {
    return this.quantityUnits >= requiredUnits;
  }

  /**
   * Calculate total value based on quantity and unit price
   */
  getTotalValue(): number {
    return this.quantityUnits * this.unitPrice;
  }

  /**
   * Create a new FinishedGood with updated quantity
   */
  withUpdatedQuantity(newQuantity: number): FinishedGood {
    return new FinishedGood(
      this.id,
      this.productDefinitionId,
      this.colorName,
      newQuantity,
      this.unitPrice
    );
  }

  /**
   * Create a new FinishedGood with updated price
   */
  withUpdatedPrice(newPrice: number): FinishedGood {
    return new FinishedGood(
      this.id,
      this.productDefinitionId,
      this.colorName,
      this.quantityUnits,
      newPrice
    );
  }

  /**
   * Add units to current quantity (production)
   */
  addQuantity(additionalUnits: number): FinishedGood {
    return this.withUpdatedQuantity(this.quantityUnits + additionalUnits);
  }

  /**
   * Remove units from current quantity (dispatch)
   */
  removeQuantity(unitsToRemove: number): FinishedGood {
    const newQuantity = this.quantityUnits - unitsToRemove;
    if (newQuantity < 0) {
      throw new Error('Cannot remove more units than available');
    }
    return this.withUpdatedQuantity(newQuantity);
  }
}