import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../services/supabase.client';
import { DatabaseError } from '../../shared/utils/errors';
import { 
  IInventoryRepository, 
  DbRawMaterial, 
  DbProductDefinition, 
  DbFinishedGood, 
  DbTransactionLog 
} from './inventory.repository.interface';

/**
 * Supabase implementation of the inventory repository
 * Centralizes all database access logic in one place
 */
@Injectable({
  providedIn: 'root'
})
export class InventoryRepository implements IInventoryRepository {
  private readonly client: SupabaseClient;

  constructor() {
    this.client = supabase;
  }

  // ===== RAW MATERIALS =====

  async findAllMaterials(): Promise<DbRawMaterial[]> {
    const { data, error } = await this.client
      .from('raw_materials')
      .select('*')
      .order('color_name');
    
    if (error) throw new DatabaseError(`Failed to fetch materials: ${error.message}`, error);
    return data || [];
  }

  async findMaterialById(id: string): Promise<DbRawMaterial | null> {
    const { data, error } = await this.client
      .from('raw_materials')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw new DatabaseError(`Failed to fetch material: ${error.message}`, error);
    return data;
  }

  async findMaterialByColor(colorName: string): Promise<DbRawMaterial | null> {
    const { data, error } = await this.client
      .from('raw_materials')
      .select('*')
      .eq('color_name', colorName)
      .maybeSingle();
    
    if (error) throw new DatabaseError(`Failed to fetch material by color: ${error.message}`, error);
    return data;
  }

  async updateMaterialStock(id: string, newStock: number): Promise<void> {
    const { error } = await this.client
      .from('raw_materials')
      .update({ 
        current_stock_kg: newStock,
        last_updated: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw new DatabaseError(`Failed to update material stock: ${error.message}`, error);
  }

  async updateMaterialThreshold(id: string, newThreshold: number): Promise<void> {
    const { error } = await this.client
      .from('raw_materials')
      .update({ alert_threshold_kg: newThreshold })
      .eq('id', id);
    
    if (error) throw new DatabaseError(`Failed to update material threshold: ${error.message}`, error);
  }

  async createMaterial(material: Omit<DbRawMaterial, 'id'>): Promise<DbRawMaterial> {
    const { data, error } = await this.client
      .from('raw_materials')
      .insert(material)
      .select()
      .single();
    
    if (error) throw new DatabaseError(`Failed to create material: ${error.message}`, error);
    return data;
  }

  // ===== PRODUCT DEFINITIONS =====

  async findAllActiveProducts(): Promise<DbProductDefinition[]> {
    const { data, error } = await this.client
      .from('product_definitions')
      .select('*')
      .is('deleted_at', null)
      .order('name');
    
    if (error) throw new DatabaseError(`Failed to fetch products: ${error.message}`, error);
    return data || [];
  }

  async findProductById(id: string): Promise<DbProductDefinition | null> {
    const { data, error } = await this.client
      .from('product_definitions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw new DatabaseError(`Failed to fetch product: ${error.message}`, error);
    return data;
  }

  async createProduct(product: Omit<DbProductDefinition, 'id'>): Promise<DbProductDefinition> {
    const { data, error } = await this.client
      .from('product_definitions')
      .insert(product)
      .select()
      .single();
    
    if (error) throw new DatabaseError(`Failed to create product: ${error.message}`, error);
    return data;
  }

  async updateProduct(id: string, product: Partial<DbProductDefinition>): Promise<void> {
    const { error } = await this.client
      .from('product_definitions')
      .update(product)
      .eq('id', id);
    
    if (error) throw new DatabaseError(`Failed to update product: ${error.message}`, error);
  }

  async softDeleteProduct(id: string): Promise<void> {
    const { error } = await this.client
      .from('product_definitions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw new DatabaseError(`Failed to soft delete product: ${error.message}`, error);
  }

  // ===== FINISHED GOODS =====

  async findAllFinishedGoods(): Promise<DbFinishedGood[]> {
    const { data, error } = await this.client
      .from('finished_goods_stock')
      .select(`
        *,
        product_definitions!inner(deleted_at)
      `)
      .is('product_definitions.deleted_at', null);
    
    if (error) throw new DatabaseError(`Failed to fetch finished goods: ${error.message}`, error);
    return data || [];
  }

  async findFinishedGoodById(id: string): Promise<DbFinishedGood | null> {
    const { data, error } = await this.client
      .from('finished_goods_stock')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw new DatabaseError(`Failed to fetch finished good: ${error.message}`, error);
    return data;
  }

  async findFinishedGoodByProductAndColor(productId: string, colorName: string): Promise<DbFinishedGood | null> {
    const { data, error } = await this.client
      .from('finished_goods_stock')
      .select('*')
      .eq('product_definition_id', productId)
      .eq('color_name', colorName)
      .maybeSingle();
    
    if (error) throw new DatabaseError(`Failed to fetch finished good: ${error.message}`, error);
    return data;
  }

  async createFinishedGood(finishedGood: Omit<DbFinishedGood, 'id'>): Promise<DbFinishedGood> {
    const { data, error } = await this.client
      .from('finished_goods_stock')
      .insert(finishedGood)
      .select()
      .single();
    
    if (error) throw new DatabaseError(`Failed to create finished good: ${error.message}`, error);
    return data;
  }

  async updateFinishedGoodQuantity(id: string, newQuantity: number): Promise<void> {
    const { error } = await this.client
      .from('finished_goods_stock')
      .update({ quantity_units: newQuantity })
      .eq('id', id);
    
    if (error) throw new DatabaseError(`Failed to update finished good quantity: ${error.message}`, error);
  }

  async updateFinishedGoodPrice(id: string, newPrice: number): Promise<void> {
    const { error } = await this.client
      .from('finished_goods_stock')
      .update({ unit_price: newPrice })
      .eq('id', id);
    
    if (error) throw new DatabaseError(`Failed to update finished good price: ${error.message}`, error);
  }

  // ===== TRANSACTION LOGGING =====

  async logTransaction(transaction: Omit<DbTransactionLog, 'id' | 'created_at'>): Promise<void> {
    const { error } = await this.client
      .from('production_logs')
      .insert({
        transaction_type: transaction.transaction_type,
        description: transaction.description,
        amount_change: transaction.amount_change
      });
    
    if (error) throw new DatabaseError(`Failed to log transaction: ${error.message}`, error);
  }
}