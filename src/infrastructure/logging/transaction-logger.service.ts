import { Injectable, inject } from '@angular/core';
import { TransactionType, TransactionLog, ProductionSummary, MaterialAdjustment } from '../../domain';
import { IInventoryRepository } from '../repositories/inventory.repository.interface';
import { InventoryRepository } from '../repositories/inventory.repository';
import { InventoryMapper } from '../mappers/inventory.mapper';

/**
 * Service responsible for logging transactions and audit trail
 * Single responsibility: Transaction logging
 */
@Injectable({
  providedIn: 'root'
})
export class TransactionLogger {
  private readonly repository: IInventoryRepository = inject(InventoryRepository);
  private readonly mapper = inject(InventoryMapper);

  /**
   * Log a production run transaction
   */
  async logProductionRun(production: ProductionSummary): Promise<void> {
    const transaction = new TransactionLog(
      TransactionType.PRODUCTION_RUN,
      production.createDescription(),
      -production.materialConsumption
    );
    
    await this.logTransaction(transaction);
  }

  /**
   * Log a material stock adjustment
   */
  async logMaterialAdjustment(adjustment: MaterialAdjustment): Promise<void> {
    if (!adjustment.isSignificant) {
      return; // Don't log insignificant changes
    }

    const transaction = new TransactionLog(
      TransactionType.STOCK_ADJUSTMENT,
      adjustment.createDescription(),
      adjustment.difference
    );
    
    await this.logTransaction(transaction);
  }

  /**
   * Log incoming material
   */
  async logIncomingMaterial(colorName: string, amount: number, previousStock: number, newStock: number): Promise<void> {
    const transaction = new TransactionLog(
      TransactionType.INCOMING_MATERIAL,
      `Ingreso de materia prima - ${colorName} || ${previousStock} kg --> ${newStock} kg`,
      amount
    );
    
    await this.logTransaction(transaction);
  }

  /**
   * Log price update
   */
  async logPriceUpdate(productName: string, colorName: string, newPrice: number): Promise<void> {
    const transaction = new TransactionLog(
      TransactionType.PRICE_UPDATE,
      `Actualización de precio - ${productName} (${colorName}) a $${newPrice}`,
      0 // Price updates don't change stock amounts
    );
    
    await this.logTransaction(transaction);
  }

  /**
   * Log bulk price updates
   */
  async logBulkPriceUpdate(count: number): Promise<void> {
    const transaction = new TransactionLog(
      TransactionType.PRICE_UPDATE,
      `Actualización masiva de precios - ${count} productos actualizados`,
      0
    );
    
    await this.logTransaction(transaction);
  }

  /**
   * Log product adjustment
   */
  async logProductAdjustment(productName: string, colorName: string, oldQuantity: number, newQuantity: number, reason: string): Promise<void> {
    const difference = newQuantity - oldQuantity;
    const transaction = new TransactionLog(
      TransactionType.PRODUCT_ADJUSTMENT,
      `Ajuste [${productName} - ${colorName}]: ${reason} || ${oldQuantity} u. --> ${newQuantity} u.`,
      difference
    );
    
    await this.logTransaction(transaction);
  }

  /**
   * Log a raw transaction with explicit type, description, and amount.
   * Useful for multi-layer production where a composed description is needed.
   */
  async logRawTransaction(type: string, description: string, amountChange: number): Promise<void> {
    await this.repository.logTransaction({
      transaction_type: type,
      description,
      amount_change: amountChange
    });
  }

  /**
   * Core method to log any transaction
   */
  private async logTransaction(transaction: TransactionLog): Promise<void> {
    const dbTransaction = this.mapper.toDbTransactionLog(transaction);
    await this.repository.logTransaction(dbTransaction);
  }
}