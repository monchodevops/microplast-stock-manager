import { Injectable } from '@angular/core';
import { Material } from '../entities/material';
import { ProductDefinition } from '../entities/product-definition';
import { ProductionRequest, ProductionRequestWithProduct, ProductionSummary, MultiLayerProductionRequestWithProduct } from '../value-objects/production';
import { ValidationResult } from '../../shared/utils/result';
import { InsufficientStockError } from '../../shared/utils/errors';

/**
 * Domain service containing business logic related to production
 * Single responsibility: Production-related business rules and calculations
 */
@Injectable({
  providedIn: 'root'
})
export class ProductionDomainService {

  /**
   * Validate a production request against available materials
   */
  validateProductionRequest(
    request: ProductionRequestWithProduct, 
    material: Material
  ): ValidationResult {
    
    // Check if material exists
    if (!material) {
      return ValidationResult.failure(`Color ${request.colorName} no disponible en materia prima`);
    }

    // Check if product is active
    if (!request.product.isActive()) {
      return ValidationResult.failure('El producto ha sido eliminado y no puede producirse');
    }

    // Calculate material needed
    const materialNeeded = request.calculateMaterialNeeded();

    // Check stock sufficiency
    if (!material.hasEnoughStock(materialNeeded)) {
      return ValidationResult.failure(
        `Stock insuficiente. Necesario: ${materialNeeded.toFixed(2)}kg, Disponible: ${material.currentStockKg.toFixed(2)}kg`
      );
    }

    // Business rule: Don't allow production that would leave negative stock
    const remainingStock = material.calculateStockAfterConsumption(materialNeeded);
    if (remainingStock < 0) {
      return ValidationResult.failure('La producción resultaría en stock negativo');
    }

    // Business rule: Warn if production would leave very low stock
    if (remainingStock < material.alertThresholdKg && material.alertThresholdKg > 0) {
      // This is a warning, not an error - could be upgraded to include warning levels
      console.warn(`Production will leave stock below alert threshold: ${remainingStock}kg < ${material.alertThresholdKg}kg`);
    }

    return ValidationResult.success();
  }

  /**
   * Validate production quantity
   */
  validateProductionQuantity(quantity: number): ValidationResult {
    if (quantity <= 0) {
      return ValidationResult.failure('La cantidad debe ser positiva');
    }

    if (!Number.isInteger(quantity)) {
      return ValidationResult.failure('La cantidad debe ser un número entero');
    }

    // Business rule: Maximum production batch size
    if (quantity > 10000) {
      return ValidationResult.failure('Cantidad excede el máximo permitido por lote (10,000 unidades)');
    }

    return ValidationResult.success();
  }

  /**
   * Calculate material needed for production
   */
  calculateMaterialNeeded(product: ProductDefinition, quantity: number): number {
    return product.calculateMaterialNeeded(quantity);
  }

  /**
   * Calculate maximum units that can be produced with available stock
   */
  calculateMaxProducibleUnits(product: ProductDefinition, availableStock: number): number {
    return product.calculateMaxUnitsFromStock(availableStock);
  }

  /**
   * Create a production summary for logging and display
   */
  createProductionSummary(request: ProductionRequestWithProduct): ProductionSummary {
    const materialConsumption = request.calculateMaterialNeeded();
    
    return new ProductionSummary(
      request.product.name,
      request.colorName,
      request.quantity,
      materialConsumption
    );
  }

  /**
   * Validate a multi-layer production request against available materials.
   * Each layer is validated independently against its selected raw-material color.
   */
  validateMultiLayerProductionRequest(
    request: MultiLayerProductionRequestWithProduct,
    materialsByColor: Map<string, Material>
  ): ValidationResult {
    if (!request.product.isActive()) {
      return ValidationResult.failure('El producto ha sido eliminado y no puede producirse');
    }

    const layersConfig = request.product.layersConfig;
    if (!layersConfig || layersConfig.length === 0) {
      return ValidationResult.failure('El producto no tiene capas configuradas');
    }

    for (let i = 0; i < layersConfig.length; i++) {
      const color = request.layerColors[i];
      if (!color?.trim()) {
        return ValidationResult.failure(`Debe seleccionar un color para la Capa ${i + 1}`);
      }

      const material = materialsByColor.get(color);
      if (!material) {
        return ValidationResult.failure(`Color "${color}" no disponible en materia prima (Capa ${i + 1})`);
      }
    }

    // Aggregate total consumption per color (same color can appear in multiple layers)
    const totalNeededByColor = new Map<string, number>();
    for (let i = 0; i < layersConfig.length; i++) {
      const color = request.layerColors[i];
      const needed = request.calculateMaterialNeededForLayer(i);
      totalNeededByColor.set(color, (totalNeededByColor.get(color) ?? 0) + needed);
    }

    // Validate combined stock for each unique color
    for (const [color, totalNeeded] of totalNeededByColor) {
      const material = materialsByColor.get(color)!;
      if (!material.hasEnoughStock(totalNeeded)) {
        return ValidationResult.failure(
          `Stock insuficiente para "${color}". Necesario: ${totalNeeded.toFixed(2)}kg, Disponible: ${material.currentStockKg.toFixed(2)}kg`
        );
      }
    }

    return ValidationResult.success();
  }

  /**
   * Validate that a product can be produced (exists and is active)
   */
  validateProductExists(products: ProductDefinition[], productId: string): ValidationResult {
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      return ValidationResult.failure('Producto no encontrado');
    }

    if (!product.isActive()) {
      return ValidationResult.failure('El producto está inactivo y no puede producirse');
    }

    return ValidationResult.success();
  }

  /**
   * Find available materials that can be used for production
   */
  getAvailableMaterialsForProduction(
    materials: Material[], 
    product: ProductDefinition,
    minimumUnits: number = 1
  ): Material[] {
    const minimumStockNeeded = product.calculateMaterialNeeded(minimumUnits);
    
    return materials.filter(material => 
      material.hasEnoughStock(minimumStockNeeded)
    );
  }

  /**
   * Calculate production efficiency metrics
   */
  calculateProductionEfficiency(
    targetQuantity: number,
    actualQuantity: number,
    plannedMaterial: number,
    actualMaterial: number
  ): ProductionEfficiency {
    const quantityEfficiency = actualQuantity / targetQuantity;
    const materialEfficiency = plannedMaterial / actualMaterial;
    const overallEfficiency = (quantityEfficiency + materialEfficiency) / 2;

    return {
      quantityEfficiency,
      materialEfficiency,
      overallEfficiency,
      isEfficient: overallEfficiency >= 0.95 // 95% efficiency threshold
    };
  }

  /**
   * Business rule: Determine if production should be recommended based on stock levels
   */
  isProductionRecommended(
    material: Material,
    product: ProductDefinition,
    requestedQuantity: number
  ): RecommendationResult {
    const materialNeeded = product.calculateMaterialNeeded(requestedQuantity);
    const remainingAfterProduction = material.calculateStockAfterConsumption(materialNeeded);

    if (remainingAfterProduction < 0) {
      return {
        recommended: false,
        reason: 'Stock insuficiente'
      };
    }

    if (remainingAfterProduction < material.alertThresholdKg) {
      return {
        recommended: true,
        reason: 'Precaución: Stock quedará por debajo del umbral de alerta',
        warning: true
      };
    }

    return {
      recommended: true,
      reason: 'Producción factible'
    };
  }
}

/**
 * Production efficiency metrics
 */
export interface ProductionEfficiency {
  quantityEfficiency: number;
  materialEfficiency: number;
  overallEfficiency: number;
  isEfficient: boolean;
}

/**
 * Production recommendation result
 */
export interface RecommendationResult {
  recommended: boolean;
  reason: string;
  warning?: boolean;
}