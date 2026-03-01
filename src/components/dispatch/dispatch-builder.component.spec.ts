/**
 * Unit tests for DispatchBuilderComponent
 *
 * Strategy: mock InventoryService and DispatchService, then instantiate
 * the component inside an Angular injection context via
 * TestBed.runInInjectionContext().  This lets us test all Signals and
 * methods without a DOM / template compile step.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { DispatchBuilderComponent } from './dispatch-builder.component';
import { DispatchService } from '../../services/dispatch.service';
import { InventoryService } from '../../services/inventory.service';
import type { CartItem } from '../../services/dispatch.service';

// ─── Shared mock factories ────────────────────────────────────────────────────
function makeInventoryMock() {
  return {
    products: signal([
      { id: 'prod-1', name: 'Maceta Chica', consumptionPerUnitKg: 0.5, category: 'macetas' },
    ]),
    finishedGoods: signal([
      { id: 'fg-1', productDefinitionId: 'prod-1', colorName: 'Rojo',  quantityUnits: 20, unit_price: 500 },
      { id: 'fg-2', productDefinitionId: 'prod-1', colorName: 'Azul',  quantityUnits: 5,  unit_price: 800 },
      { id: 'fg-3', productDefinitionId: 'prod-1', colorName: 'Verde', quantityUnits: 0,  unit_price: 300 }, // out of stock
    ]),
    rawMaterials:     signal([]),
    logs:             signal([]),
    loadData: vi.fn().mockResolvedValue(undefined),
  };
}

function makeDispatchMock() {
  return {
    createDispatchOrder: vi.fn().mockResolvedValue({
      success:  true,
      message:  'Remito REM-20260228-153022 generado exitosamente.',
      orderId:  'order-uuid-123',
    }),
  };
}

// ─── Helper to build a FinishedGoodDisplay-like object ───────────────────────
function makeGood(overrides: Partial<{
  id: string; productDefinitionId: string; productName: string;
  colorName: string; quantityUnits: number; unit_price: number;
}> = {}) {
  return {
    id:                  overrides.id                  ?? 'fg-1',
    productDefinitionId: overrides.productDefinitionId ?? 'prod-1',
    productName:         overrides.productName         ?? 'Maceta Chica',
    colorName:           overrides.colorName           ?? 'Rojo',
    quantityUnits:       overrides.quantityUnits       ?? 20,
    unit_price:          overrides.unit_price          ?? 500,
  };
}

// ─── Suite ────────────────────────────────────────────────────────────────────
describe('DispatchBuilderComponent', () => {
  let component: DispatchBuilderComponent;
  let inventoryMock: ReturnType<typeof makeInventoryMock>;
  let dispatchMock:  ReturnType<typeof makeDispatchMock>;

  beforeEach(() => {
    inventoryMock = makeInventoryMock();
    dispatchMock  = makeDispatchMock();

    TestBed.configureTestingModule({
      providers: [
        { provide: InventoryService, useValue: inventoryMock },
        { provide: DispatchService,  useValue: dispatchMock  },
      ],
    });

    // Instantiate the component inside the injection context so inject() works
    component = TestBed.runInInjectionContext(() => new DispatchBuilderComponent());
  });

  // ── Cart Logic ──────────────────────────────────────────────────────────────

  it('TC-1: totalAmount updates correctly when two items are added to the cart', () => {
    const good1 = makeGood({ id: 'fg-1', unit_price: 500, quantityUnits: 20 });
    const good2 = makeGood({ id: 'fg-2', colorName: 'Azul', unit_price: 800, quantityUnits: 5 });

    component.setQtyInput(good1.id, 10);
    component.addToCart(good1);

    component.setQtyInput(good2.id, 3);
    component.addToCart(good2);

    // 10 * 500 = 5000 ; 3 * 800 = 2400 → total = 7400
    expect(component.totalAmount()).toBe(7400);
    expect(component.cartItems()).toHaveLength(2);
  });

  it('TC-1b: adding the same product twice merges quantities (does not duplicate)', () => {
    const good = makeGood({ unit_price: 500, quantityUnits: 20 });

    component.setQtyInput(good.id, 5);
    component.addToCart(good);

    component.setQtyInput(good.id, 3);
    component.addToCart(good);

    expect(component.cartItems()).toHaveLength(1);
    expect(component.cartItems()[0].quantity).toBe(8);
    expect(component.totalAmount()).toBe(8 * 500);
  });

  // ── Stock Cap Validation ────────────────────────────────────────────────────

  it('TC-2: cannot add a quantity that exceeds available stock – caps to availableStock', () => {
    const good = makeGood({ quantityUnits: 5, unit_price: 500 });

    // Try to add 100, far beyond stock of 5
    component.setQtyInput(good.id, 100);
    component.addToCart(good);

    expect(component.cartItems()[0].quantity).toBe(5); // capped
  });

  it('TC-2b: incrementQty does not exceed availableStock', () => {
    const good = makeGood({ quantityUnits: 3 });
    component.setQtyInput(good.id, 3);
    component.addToCart(good);

    // Already at max (3), increment should be a no-op
    component.incrementQty(good.id);

    expect(component.cartItems()[0].quantity).toBe(3);
  });

  // ── Form Validation ─────────────────────────────────────────────────────────

  it('TC-3: isFormValid is false when cart is empty', () => {
    component.clientReason.set('Cliente A');
    component.deliveryPerson.set('Driver');

    expect(component.isFormValid()).toBe(false);
  });

  it('TC-3b: isFormValid is false when clientReason is blank', () => {
    component.clientReason.set('');
    component.deliveryPerson.set('Driver');
    component.addToCart(makeGood());

    expect(component.isFormValid()).toBe(false);
  });

  it('TC-3c: isFormValid is true when all fields are filled and cart has items', () => {
    component.clientReason.set('Cliente A');
    component.deliveryPerson.set('Driver');
    component.addToCart(makeGood());

    expect(component.isFormValid()).toBe(true);
  });

  // ── Out-of-stock filter ─────────────────────────────────────────────────────

  it('filteredGoods only shows items with quantityUnits > 0', () => {
    // inventoryMock has fg-3 with quantityUnits: 0
    const visible = component.filteredGoods();
    expect(visible.every(g => g.quantityUnits > 0)).toBe(true);
    expect(visible.find(g => g.colorName === 'Verde')).toBeUndefined();
  });

  // ── Search filter ───────────────────────────────────────────────────────────

  it('filteredGoods filters by search term (case-insensitive)', () => {
    component.searchTerm.set('azul');
    const results = component.filteredGoods();
    expect(results).toHaveLength(1);
    expect(results[0].colorName).toBe('Azul');
  });

  // ── Success flow ────────────────────────────────────────────────────────────

  it('TC-4: confirm() clears cart, sets lastGeneratedOrderId, and shows success message', async () => {
    component.clientReason.set('Distribuidora Norte');
    component.deliveryPerson.set('Juan');
    component.addToCart(makeGood());

    expect(component.cartItems()).toHaveLength(1);

    await component.confirm();

    // Cart should be empty after success
    expect(component.cartItems()).toHaveLength(0);

    // lastGeneratedOrderId should hold the returned orderId
    expect(component.lastGeneratedOrderId()).toBe('order-uuid-123');

    // Positive feedback message
    expect(component.lastSuccess()).toBe(true);
    expect(component.feedbackMessage()).toContain('REM-20260228-153022');

    // Form fields should be cleared
    expect(component.clientReason()).toBe('');
    expect(component.deliveryPerson()).toBe('');
  });

  it('TC-4b: confirm() is a no-op when form is invalid', async () => {
    // No items, no form fields → isFormValid() = false
    await component.confirm();

    expect(dispatchMock.createDispatchOrder).not.toHaveBeenCalled();
    expect(component.lastGeneratedOrderId()).toBeNull();
  });

  it('TC-4c: on failure, cart is NOT cleared and error message is shown', async () => {
    dispatchMock.createDispatchOrder.mockResolvedValueOnce({
      success: false,
      message: 'Error de base de datos: row locked',
    });

    component.clientReason.set('Cliente');
    component.deliveryPerson.set('Driver');
    component.addToCart(makeGood());

    await component.confirm();

    // Cart must remain intact
    expect(component.cartItems()).toHaveLength(1);

    // lastGeneratedOrderId must stay null
    expect(component.lastGeneratedOrderId()).toBeNull();

    // Failure flag + message
    expect(component.lastSuccess()).toBe(false);
    expect(component.feedbackMessage()).toContain('row locked');
  });

  // ── Misc ────────────────────────────────────────────────────────────────────

  it('removeFromCart removes the correct item from the cart', () => {
    const good1 = makeGood({ id: 'fg-1' });
    const good2 = makeGood({ id: 'fg-2', colorName: 'Azul' });

    component.addToCart(good1);
    component.addToCart(good2);
    expect(component.cartItems()).toHaveLength(2);

    component.removeFromCart('fg-1');
    expect(component.cartItems()).toHaveLength(1);
    expect(component.cartItems()[0].finishedGoodId).toBe('fg-2');
  });

  it('clearCart empties the cart and resets totalAmount to 0', () => {
    component.addToCart(makeGood());
    expect(component.cartItems()).toHaveLength(1);

    component.clearCart();

    expect(component.cartItems()).toHaveLength(0);
    expect(component.totalAmount()).toBe(0);
  });

  it('getEffectiveStock subtracts in-cart quantity from raw stock', () => {
    const good = makeGood({ quantityUnits: 20 });
    component.setQtyInput(good.id, 7);
    component.addToCart(good);

    // 20 - 7 = 13
    expect(component.getEffectiveStock(good.id, 20)).toBe(13);
  });
});
