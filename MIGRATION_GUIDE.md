# Migration Guide: From InventoryService to Clean Architecture

## Summary

This migration replaces the monolithic `InventoryService` with a clean architecture implementation following SOLID principles. Each service now has a single responsibility, making the code more maintainable, testable, and scalable.

## Key Changes

### 1. Architecture Overview

**Before:**
```
Components → InventoryService (850+ lines, 6 responsibilities)
```

**After:**
```
Components → InventoryFacade → Commands → Domain Services → Repository → Database
```

### 2. Component Migration

**Before (InventoryService):**
```typescript
export class ProductionComponent {
  inventory = inject(InventoryService);

  async submitProduction() {
    const result = await this.inventory.runProduction(
      this.selectedProductId(), 
      this.selectedColorName(), 
      this.quantity()
    );
    // Handle result...
  }
}
```

**After (InventoryFacade):**
```typescript
export class ProductionComponent {
  readonly inventoryFacade = inject(InventoryFacade);

  async submitProduction() {
    const result = await this.inventoryFacade.runProduction(
      this.selectedProductId(), 
      this.selectedColorName(), 
      this.quantity()
    );
    // Handle result...
  }
}
```

### 3. State Management

**Before:**
```typescript
// Scattered across InventoryService
readonly rawMaterials = signal<RawMaterial[]>([]);
readonly products = signal<ProductDefinition[]>([]);
```

**After:**
```typescript
// Centralized in InventoryStateStore
readonly materials$ = inventoryFacade.materials$;
readonly products$ = inventoryFacade.products$;
```

## Migration Steps

### Step 1: Update Component Imports

Replace:
```typescript
import { InventoryService } from '../../services/inventory.service';
```

With:
```typescript
import { InventoryFacade } from '../../application';
```

### Step 2: Update Component Dependencies

Replace:
```typescript
inventory = inject(InventoryService);
```

With:
```typescript
readonly inventoryFacade = inject(InventoryFacade);
```

### Step 3: Update Data Access

**Before:**
```typescript
// Direct signal access
this.inventory.rawMaterials()
this.inventory.products()
this.inventory.lowStockAlerts()
```

**After:**
```typescript
// Facade signals
this.inventoryFacade.materials$()
this.inventoryFacade.products$()
this.inventoryFacade.lowStockAlerts$()
```

### Step 4: Update Method Calls

All method signatures remain the same, just change the service:

```typescript
// Before
await this.inventory.runProduction(productId, colorName, quantity);
await this.inventory.updateMaterialStock(id, newStock, newThreshold);
await this.inventory.addRawMaterialStock(colorName, amount);

// After  
await this.inventoryFacade.runProduction(productId, colorName, quantity);
await this.inventoryFacade.updateMaterialStock(id, newStock, newThreshold);
await this.inventoryFacade.addIncomingMaterial(colorName, amount);
```

### Step 5: Initialize Data Loading

Add to `ngOnInit`:
```typescript
ngOnInit() {
  this.inventoryFacade.loadInitialData();
}
```

## Benefits of Migration

### 1. Single Responsibility Principle
- **MaterialDomainService**: Only material business logic
- **ProductionDomainService**: Only production business logic  
- **InventoryRepository**: Only data access
- **TransactionLogger**: Only logging
- **InventoryStateStore**: Only state management

### 2. Improved Testing
```typescript
// Before: Hard to test (850+ lines, multiple dependencies)
// After: Easy to test (each service < 200 lines, single concern)

describe('MaterialDomainService', () => {
  it('should validate stock adjustment', () => {
    const result = service.validateStockAdjustment(100, 150);
    expect(result.isValid).toBe(true);
  });
});
```

### 3. Better Error Handling
```typescript
// Before: Try-catch everywhere
// After: Result pattern with explicit error types

const result = await command.execute(request);
if (result.success) {
  // Handle success
} else {
  // Handle specific error type
  if (result.error instanceof ValidationError) {
    // Validation error
  }
}
```

### 4. Clear Dependency Flow
```typescript
// Dependencies are explicit and testable
constructor(
  private readonly repository: IInventoryRepository,
  private readonly materialService: MaterialDomainService,
  private readonly logger: TransactionLogger
) {}
```

## Verification Checklist

- [ ] All components use `InventoryFacade` instead of `InventoryService`
- [ ] Data loading works correctly
- [ ] Production runs work
- [ ] Stock updates work  
- [ ] Price updates work
- [ ] Error handling works
- [ ] Loading states work
- [ ] No direct Supabase imports in components
- [ ] All operations have proper audit logs

## Performance Improvements

1. **Bundle Size**: Better tree-shaking, smaller imports
2. **Memory**: No duplicate state across services
3. **Network**: Optimistic updates, better caching
4. **Runtime**: Computed values are cached automatically

## Rollback Plan

If issues arise, you can temporarily run both systems in parallel:

```typescript
export class TransitionComponent {
  // Old system (fallback)
  private readonly oldInventory = inject(InventoryService);
  
  // New system (primary)
  private readonly newInventory = inject(InventoryFacade);
  
  async submitProduction() {
    try {
      return await this.newInventory.runProduction(...);
    } catch (error) {
      console.warn('Falling back to old system:', error);
      return await this.oldInventory.runProduction(...);
    }
  }
}
```

## Next Steps

1. **Migrate all components** one by one
2. **Add comprehensive tests** for each service  
3. **Remove old InventoryService** once all components are migrated
4. **Add integration tests** for complete workflows
5. **Monitor performance** and error rates after deployment