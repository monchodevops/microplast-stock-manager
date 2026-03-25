import { Injectable } from '@angular/core';
import { ProductDefinition, FinishedGood } from '../entities';
import { ValidationResult } from '../../shared/utils/result';

/**
 * Domain service containing business logic related to products and finished goods
 * Single responsibility: Product-related business rules and validations
 */
@Injectable({
  providedIn: 'root'
})
export class ProductDomainService {

  /**
   * Validate product definition creation/update
   */
  validateProductDefinition(
    name: string,
    consumptionPerUnitKg: number,
    category: string,
    existingProducts: ProductDefinition[] = [],
    excludeId?: string
  ): ValidationResult {
    
    // Name validation
    if (!name.trim()) {
      return ValidationResult.failure('El nombre del producto es requerido');
    }
    
    if (name.length < 3) {
      return ValidationResult.failure('El nombre debe tener al menos 3 caracteres');
    }
    
    if (name.length > 100) {
      return ValidationResult.failure('El nombre no puede exceder 100 caracteres');
    }

    // Check for duplicate names (case-insensitive)
    const duplicateName = existingProducts.find(p => 
      p.id !== excludeId && 
      p.name.toLowerCase() === name.toLowerCase() &&
      p.isActive()
    );
    
    if (duplicateName) {
      return ValidationResult.failure(`Ya existe un producto con el nombre "${name}"`);
    }

    // Consumption validation
    if (consumptionPerUnitKg <= 0) {
      return ValidationResult.failure('El consumo por unidad debe ser positivo');
    }
    
    if (consumptionPerUnitKg > 1000) {
      return ValidationResult.failure('Consumo por unidad excesivo (máximo 1,000kg/u)');
    }

    // Category validation
    if (!category.trim()) {
      return ValidationResult.failure('La categoría es requerida');
    }

    return ValidationResult.success();
  }

  /**
   * Validate finished good price update
   */
  validatePriceUpdate(newPrice: number): ValidationResult {
    if (newPrice < 0) {
      return ValidationResult.failure('El precio no puede ser negativo');
    }
    
    if (newPrice > 1000000) {
      return ValidationResult.failure('Precio excesivo (máximo $1,000,000)');
    }
    
    return ValidationResult.success();
  }

  /**
   * Validate finished good quantity adjustment
   */
  validateQuantityAdjustment(
    currentQuantity: number, 
    newQuantity: number
  ): ValidationResult {
    if (newQuantity < 0) {
      return ValidationResult.failure('La cantidad no puede ser negativa');
    }
    
    const difference = Math.abs(newQuantity - currentQuantity);
    if (difference > 50000) {
      return ValidationResult.failure('Ajuste muy grande (>50,000 unidades), verificar datos');
    }
    
    return ValidationResult.success();
  }

  /**
   * Calculate total inventory value for finished goods
   */
  calculateTotalInventoryValue(finishedGoods: FinishedGood[]): number {
    return finishedGoods.reduce((total, good) => total + good.getTotalValue(), 0);
  }

  /**
   * Calculate total units across all finished goods
   */
  calculateTotalUnits(finishedGoods: FinishedGood[]): number {
    return finishedGoods.reduce((total, good) => total + good.quantityUnits, 0);
  }

  /**
   * Get finished goods that are out of stock
   */
  getOutOfStockProducts(finishedGoods: FinishedGood[]): FinishedGood[] {
    return finishedGoods.filter(good => !good.isInStock());
  }

  /**
   * Get finished goods grouped by product
   */
  groupFinishedGoodsByProduct(
    finishedGoods: FinishedGood[],
    products: ProductDefinition[]
  ): Map<string, FinishedGoodGroup> {
    const grouped = new Map<string, FinishedGoodGroup>();

    for (const good of finishedGoods) {
      const product = products.find(p => p.id === good.productDefinitionId);
      if (!product) continue;

      if (!grouped.has(product.id)) {
        grouped.set(product.id, {
          product,
          finishedGoods: [],
          totalUnits: 0,
          totalValue: 0
        });
      }

      const group = grouped.get(product.id)!;
      group.finishedGoods.push(good);
      group.totalUnits += good.quantityUnits;
      group.totalValue += good.getTotalValue();
    }

    return grouped;
  }

  /**
   * Calculate product statistics
   */
  calculateProductStatistics(product: ProductDefinition, relatedFinishedGoods: FinishedGood[]): ProductStatistics {
    const totalUnits = relatedFinishedGoods.reduce((sum, good) => sum + good.quantityUnits, 0);
    const totalValue = relatedFinishedGoods.reduce((sum, good) => sum + good.getTotalValue(), 0);
    const colorVariants = new Set(relatedFinishedGoods.map(good => good.colorName)).size;
    const averagePrice = totalUnits > 0 ? totalValue / totalUnits : 0;

    return {
      product,
      totalUnits,
      totalValue,
      colorVariants,
      averagePrice,
      isInStock: totalUnits > 0
    };
  }

  /**
   * Validate bulk price updates
   */
  validateBulkPriceUpdates(updates: PriceUpdate[]): ValidationResult {
    if (updates.length === 0) {
      return ValidationResult.failure('No hay actualizaciones para procesar');
    }

    if (updates.length > 1000) {
      return ValidationResult.failure('Demasiadas actualizaciones en lote (máximo 1,000)');
    }

    for (const update of updates) {
      const priceValidation = this.validatePriceUpdate(update.newPrice);
      if (!priceValidation.isValid) {
        return ValidationResult.failure(`Error en precio para ID ${update.id}: ${priceValidation.error}`);
      }
    }

    return ValidationResult.success();
  }

  /**
   * Business rule: Check if a product can be safely deleted
   */
  canDeleteProduct(
    productId: string,
    finishedGoods: FinishedGood[]
  ): { canDelete: boolean; reason?: string } {
    const relatedFinishedGoods = finishedGoods.filter(good => 
      good.productDefinitionId === productId
    );

    // Check if there are finished goods in stock
    const inStock = relatedFinishedGoods.filter(good => good.isInStock());
    if (inStock.length > 0) {
      return {
        canDelete: false,
        reason: `No se puede eliminar: existen ${inStock.length} productos terminados en stock`
      };
    }

    // Additional business rules could be added here (e.g., check for historical dispatches)
    
    return { canDelete: true };
  }
}

/**
 * Finished goods grouped by product
 */
export interface FinishedGoodGroup {
  product: ProductDefinition;
  finishedGoods: FinishedGood[];
  totalUnits: number;
  totalValue: number;
}

/**
 * Product statistics
 */
export interface ProductStatistics {
  product: ProductDefinition;
  totalUnits: number;
  totalValue: number;
  colorVariants: number;
  averagePrice: number;
  isInStock: boolean;
}

/**
 * Price update request
 */
export interface PriceUpdate {
  id: string;
  newPrice: number;
}