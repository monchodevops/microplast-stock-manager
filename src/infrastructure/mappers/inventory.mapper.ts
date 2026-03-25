import { Injectable } from '@angular/core';
import { Material, ProductDefinition, FinishedGood, TransactionLog, TransactionType } from '../../domain';
import type { ProductLayer } from '../../domain';
import { DbRawMaterial, DbProductDefinition, DbFinishedGood, DbTransactionLog } from '../repositories/inventory.repository.interface';

/**
 * Mapper service to convert between database entities and domain entities
 * This is crucial for maintaining separation between domain and infrastructure layers
 */
@Injectable({
  providedIn: 'root'
})
export class InventoryMapper {
  
  // ===== MATERIALS =====

  toDomainMaterial(dbMaterial: DbRawMaterial): Material {
    return new Material(
      dbMaterial.id,
      dbMaterial.color_name,
      dbMaterial.current_stock_kg,
      dbMaterial.alert_threshold_kg,
      dbMaterial.last_updated ? new Date(dbMaterial.last_updated) : undefined
    );
  }

  toDomainMaterials(dbMaterials: DbRawMaterial[]): Material[] {
    return dbMaterials.map(material => this.toDomainMaterial(material));
  }

  toDbMaterial(material: Material): DbRawMaterial {
    return {
      id: material.id,
      color_name: material.colorName,
      current_stock_kg: material.currentStockKg,
      alert_threshold_kg: material.alertThresholdKg,
      last_updated: material.lastUpdated?.toISOString()
    };
  }

  // ===== PRODUCTS =====

  toDomainProduct(dbProduct: DbProductDefinition): ProductDefinition {
    const layersConfig: ProductLayer[] | null = dbProduct.layers_config
      ? dbProduct.layers_config.map(l => ({ order: l.order, consumptionKg: l.consumption_kg }))
      : null;
    return new ProductDefinition(
      dbProduct.id,
      dbProduct.name,
      dbProduct.consumption_per_unit_kg,
      dbProduct.category,
      dbProduct.deleted_at ? new Date(dbProduct.deleted_at) : undefined,
      layersConfig
    );
  }

  toDomainProducts(dbProducts: DbProductDefinition[]): ProductDefinition[] {
    return dbProducts.map(product => this.toDomainProduct(product));
  }

  toDbProduct(product: ProductDefinition): DbProductDefinition {
    return {
      id: product.id,
      name: product.name,
      consumption_per_unit_kg: product.consumptionPerUnitKg,
      category: product.category,
      deleted_at: product.deletedAt?.toISOString(),
      layers_config: product.layersConfig
        ? product.layersConfig.map(l => ({ order: l.order, consumption_kg: l.consumptionKg }))
        : null
    };
  }

  // ===== FINISHED GOODS =====

  toDomainFinishedGood(dbFinishedGood: DbFinishedGood): FinishedGood {
    return new FinishedGood(
      dbFinishedGood.id,
      dbFinishedGood.product_definition_id,
      dbFinishedGood.color_name,
      dbFinishedGood.quantity_units,
      dbFinishedGood.unit_price || 0
    );
  }

  toDomainFinishedGoods(dbFinishedGoods: DbFinishedGood[]): FinishedGood[] {
    return dbFinishedGoods.map(good => this.toDomainFinishedGood(good));
  }

  toDbFinishedGood(finishedGood: FinishedGood): DbFinishedGood {
    return {
      id: finishedGood.id,
      product_definition_id: finishedGood.productDefinitionId,
      color_name: finishedGood.colorName,
      quantity_units: finishedGood.quantityUnits,
      unit_price: finishedGood.unitPrice
    };
  }

  // ===== TRANSACTIONS =====

  toDomainTransactionLog(dbLog: DbTransactionLog): TransactionLog {
    return new TransactionLog(
      this.parseTransactionType(dbLog.transaction_type),
      dbLog.description,
      dbLog.amount_change,
      dbLog.created_at ? new Date(dbLog.created_at) : new Date()
    );
  }

  toDomainTransactionLogs(dbLogs: DbTransactionLog[]): TransactionLog[] {
    return dbLogs.map(log => this.toDomainTransactionLog(log));
  }

  toDbTransactionLog(transactionLog: TransactionLog): Omit<DbTransactionLog, 'id' | 'created_at'> {
    return {
      transaction_type: transactionLog.type,
      description: transactionLog.description,
      amount_change: transactionLog.amountChange
    };
  }

  private parseTransactionType(type: string): TransactionType {
    // Ensure the string matches one of our enum values
    if (Object.values(TransactionType).includes(type as TransactionType)) {
      return type as TransactionType;
    }
    
    // Fallback for legacy or unknown types
    console.warn(`Unknown transaction type: ${type}, defaulting to STOCK_ADJUSTMENT`);
    return TransactionType.STOCK_ADJUSTMENT;
  }
}