/**
 * Transaction types for logging different operations
 */
export enum TransactionType {
  INCOMING_MATERIAL = 'INCOMING_MATERIAL',
  PRODUCTION_RUN = 'PRODUCTION_RUN',
  DISPATCH = 'DISPATCH',
  STOCK_ADJUSTMENT = 'AJUSTE_MATERIA_PRIMA',
  PRODUCT_ADJUSTMENT = 'AJUSTE_PRODUCTOS',
  PRICE_UPDATE = 'PRECIO'
}

/**
 * Value object representing a transaction log entry
 */
export class TransactionLog {
  constructor(
    public readonly type: TransactionType,
    public readonly description: string,
    public readonly amountChange: number,
    public readonly timestamp: Date = new Date()
  ) {
    if (!description.trim()) {
      throw new Error('Transaction description is required');
    }
  }

  /**
   * Check if this transaction represents a material increase
   */
  isIncrease(): boolean {
    return this.amountChange > 0;
  }

  /**
   * Check if this transaction represents a material decrease
   */
  isDecrease(): boolean {
    return this.amountChange < 0;
  }

  /**
   * Check if this transaction is a general adjustment (price, etc.)
   */
  isAdjustment(): boolean {
    return this.amountChange === 0;
  }
}

/**
 * Value object for filtering transaction logs
 */
export class LogFilter {
  constructor(
    public readonly dateFrom?: Date,
    public readonly dateTo?: Date,
    public readonly transactionTypes?: TransactionType[]
  ) {}

  /**
   * Check if a transaction matches this filter
   */
  matches(transaction: TransactionLog): boolean {
    if (this.dateFrom && transaction.timestamp < this.dateFrom) {
      return false;
    }
    
    if (this.dateTo && transaction.timestamp > this.dateTo) {
      return false;
    }
    
    if (this.transactionTypes && this.transactionTypes.length > 0) {
      return this.transactionTypes.includes(transaction.type);
    }
    
    return true;
  }
}