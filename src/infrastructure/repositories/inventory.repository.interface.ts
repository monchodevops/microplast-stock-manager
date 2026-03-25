import { Material, ProductDefinition, FinishedGood } from '../../domain';
import type { ProductLayer } from '../../domain';

/**
 * Database entity interfaces - these map exactly to database table structure
 */
export interface DbRawMaterial {
  id: string;
  color_name: string;
  current_stock_kg: number;
  alert_threshold_kg: number;
  last_updated?: string;
}

export interface DbProductDefinition {
  id: string;
  name: string;
  consumption_per_unit_kg: number;
  category: string;
  deleted_at?: string;
  /** Null for mono-layer products. Array of {order, consumption_kg} for bi/tri-layer Tanques. */
  layers_config?: Array<{ order: number; consumption_kg: number }> | null;
}

export interface DbFinishedGood {
  id: string;
  product_definition_id: string;
  color_name: string;
  quantity_units: number;
  unit_price?: number;
}

export interface DbTransactionLog {
  id?: string;
  transaction_type: string;
  description: string;
  amount_change: number;
  created_at?: string;
}

/**
 * Repository interface for inventory data access
 * This abstracts database operations and provides a clean API for domain services
 */
export interface IInventoryRepository {
  // Raw Materials
  findAllMaterials(): Promise<DbRawMaterial[]>;
  findMaterialById(id: string): Promise<DbRawMaterial | null>;
  findMaterialByColor(colorName: string): Promise<DbRawMaterial | null>;
  updateMaterialStock(id: string, newStock: number): Promise<void>;
  updateMaterialThreshold(id: string, newThreshold: number): Promise<void>;
  createMaterial(material: Omit<DbRawMaterial, 'id'>): Promise<DbRawMaterial>;

  // Product Definitions
  findAllActiveProducts(): Promise<DbProductDefinition[]>;
  findProductById(id: string): Promise<DbProductDefinition | null>;
  createProduct(product: Omit<DbProductDefinition, 'id'>): Promise<DbProductDefinition>;
  updateProduct(id: string, product: Partial<DbProductDefinition>): Promise<void>;
  softDeleteProduct(id: string): Promise<void>;

  // Finished Goods
  findAllFinishedGoods(): Promise<DbFinishedGood[]>;
  findFinishedGoodById(id: string): Promise<DbFinishedGood | null>;
  findFinishedGoodByProductAndColor(productId: string, colorName: string): Promise<DbFinishedGood | null>;
  createFinishedGood(finishedGood: Omit<DbFinishedGood, 'id'>): Promise<DbFinishedGood>;
  updateFinishedGoodQuantity(id: string, newQuantity: number): Promise<void>;
  updateFinishedGoodPrice(id: string, newPrice: number): Promise<void>;

  // Transaction Logging
  logTransaction(transaction: Omit<DbTransactionLog, 'id' | 'created_at'>): Promise<void>;
}