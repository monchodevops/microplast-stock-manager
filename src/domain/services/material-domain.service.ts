import { Injectable } from '@angular/core';
import { Material } from '../entities/material';
import { MaterialAdjustment } from '../value-objects/production';
import { ValidationResult } from '../../shared/utils/result';

/**
 * Domain service containing business logic related to materials
 * Single responsibility: Material-related business rules and calculations
 */
@Injectable({
  providedIn: 'root'
})
export class MaterialDomainService {

  /**
   * Validate a stock adjustment request
   */
  validateStockAdjustment(current: number, requested: number): ValidationResult {
    if (requested < 0) {
      return ValidationResult.failure('Stock no puede ser negativo');
    }
    
    if (Math.abs(requested - current) > 10000) {
      return ValidationResult.failure('Ajuste demasiado grande (>10,000kg), requiere aprobación supervisor');
    }
    
    const percentageChange = Math.abs((requested - current) / Math.max(current, 1)) * 100;
    if (percentageChange > 200) {
      return ValidationResult.failure('Cambio mayor al 200% del stock actual, verificar datos');
    }
    
    return ValidationResult.success();
  }

  /**
   * Calculate which materials are in low stock state
   */
  calculateLowStockAlerts(materials: Material[]): Material[] {
    return materials.filter(material => material.isLowStock());
  }

  /**
   * Calculate total stock across all materials
   */
  calculateTotalStock(materials: Material[]): number {
    return materials.reduce((total, material) => total + material.currentStockKg, 0);
  }

  /**
   * Create a material adjustment object with business validation
   */
  createMaterialAdjustment(
    material: Material, 
    newStock: number, 
    newThreshold: number,
    reason?: string
  ): MaterialAdjustment {
    // Business rule: Validate the adjustment before creating it
    const stockValidation = this.validateStockAdjustment(material.currentStockKg, newStock);
    if (!stockValidation.isValid) {
      throw new Error(stockValidation.error);
    }

    const thresholdValidation = this.validateThresholdAdjustment(newThreshold);
    if (!thresholdValidation.isValid) {
      throw new Error(thresholdValidation.error);
    }

    return new MaterialAdjustment(
      material.id,
      material.colorName,
      material.currentStockKg,
      newStock,
      reason
    );
  }

  /**
   * Validate threshold adjustment
   */
  validateThresholdAdjustment(threshold: number): ValidationResult {
    if (threshold < 0) {
      return ValidationResult.failure('Umbral de alerta no puede ser negativo');
    }
    
    if (threshold > 50000) {
      return ValidationResult.failure('Umbral de alerta muy alto, verificar valor');
    }
    
    return ValidationResult.success();
  }

  /**
   * Validate incoming material addition
   */
  validateIncomingMaterial(amount: number): ValidationResult {
    if (amount <= 0) {
      return ValidationResult.failure('Cantidad debe ser positiva');
    }
    
    if (amount > 5000) {
      return ValidationResult.failure('Ingreso mayor a 5,000kg, verificar cantidad');
    }
    
    return ValidationResult.success();
  }

  /**
   * Get all unique color names from materials
   */
  getAvailableColors(materials: Material[]): string[] {
    return Array.from(new Set(materials.map(m => m.colorName))).sort();
  }

  /**
   * Find material by color name (case-insensitive)
   */
  findMaterialByColor(materials: Material[], colorName: string): Material | undefined {
    return materials.find(m => 
      m.colorName.toLowerCase() === colorName.toLowerCase()
    );
  }

  /**
   * Check if a color name already exists (case-insensitive)
   */
  doesColorExist(materials: Material[], colorName: string): boolean {
    return this.findMaterialByColor(materials, colorName) !== undefined;
  }

  /**
   * Validate new material creation
   */
  validateNewMaterial(materials: Material[], colorName: string, initialStock: number): ValidationResult {
    if (!colorName.trim()) {
      return ValidationResult.failure('Nombre del color es requerido');
    }
    
    if (this.doesColorExist(materials, colorName)) {
      return ValidationResult.failure(`El color "${colorName}" ya existe`);
    }
    
    const stockValidation = this.validateIncomingMaterial(initialStock);
    if (!stockValidation.isValid) {
      return stockValidation;
    }
    
    return ValidationResult.success();
  }

  /**
   * Create default alert threshold based on business rules
   */
  calculateDefaultAlertThreshold(initialStock: number): number {
    // Business rule: Default threshold is 10% of initial stock, minimum 50kg
    const calculated = Math.max(initialStock * 0.1, 50);
    
    // Cap at reasonable maximum
    return Math.min(calculated, 500);
  }
}