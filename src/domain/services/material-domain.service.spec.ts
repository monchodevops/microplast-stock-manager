import { TestBed } from '@angular/core/testing';
import { MaterialDomainService } from '../../domain/services/material-domain.service';
import { Material } from '../../domain/entities/material';

/**
 * Example test showing how the new architecture improves testability
 */
describe('MaterialDomainService', () => {
  let service: MaterialDomainService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MaterialDomainService);
  });

  describe('validateStockAdjustment', () => {
    it('should reject negative stock', () => {
      const result = service.validateStockAdjustment(100, -50);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Stock no puede ser negativo');
    });

    it('should reject excessive adjustments', () => {
      const result = service.validateStockAdjustment(100, 15000);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('demasiado grande');
    });

    it('should accept valid adjustments', () => {
      const result = service.validateStockAdjustment(100, 150);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('calculateLowStockAlerts', () => {
    it('should identify materials with low stock', () => {
      const materials = [
        new Material('1', 'Red', 50, 100), // Low stock
        new Material('2', 'Blue', 200, 100), // Normal stock
        new Material('3', 'Green', 0, 0), // Not configured - should not alert
      ];

      const alerts = service.calculateLowStockAlerts(materials);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].colorName).toBe('Red');
    });
  });

  describe('createMaterialAdjustment', () => {
    it('should create valid adjustment', () => {
      const material = new Material('1', 'Red', 100, 50);
      
      const adjustment = service.createMaterialAdjustment(
        material, 
        150, 
        50, 
        'Test adjustment'
      );

      expect(adjustment.materialName).toBe('Red');
      expect(adjustment.oldStock).toBe(100);
      expect(adjustment.newStock).toBe(150);
      expect(adjustment.difference).toBe(50);
    });

    it('should throw on invalid adjustment', () => {
      const material = new Material('1', 'Red', 100, 50);
      
      expect(() => {
        service.createMaterialAdjustment(material, -50, 50);
      }).toThrow('Stock no puede ser negativo');
    });
  });
});