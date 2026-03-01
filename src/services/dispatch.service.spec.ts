/**
 * Unit tests for DispatchService
 *
 * Strategy: Mock the Supabase client at module level using vi.mock() so
 * no network calls are made.  Each Supabase table exposes the specific
 * chain the service uses; individual tests can override with
 * mockImplementationOnce() to simulate failure paths.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DispatchService, CartItem } from './dispatch.service';

// ─── Hoisted mock references (created before module evaluation) ──────────────
const mockSingleFn  = vi.hoisted(() => vi.fn());
const mockInsertFn  = vi.hoisted(() => vi.fn());
const mockItemsFn   = vi.hoisted(() => vi.fn());
const mockUpdateFn  = vi.hoisted(() => vi.fn());
const mockEqFn      = vi.hoisted(() => vi.fn());
const mockLogsFn    = vi.hoisted(() => vi.fn());
const mockFromFn    = vi.hoisted(() => vi.fn());

// ─── Module mock ─────────────────────────────────────────────────────────────
vi.mock('./supabase.client', () => ({
  supabase: { from: mockFromFn },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────
function setupHappyPath() {
  // dispatch_orders: insert → select → single → { data: { id }, error: null }
  mockSingleFn.mockResolvedValue({ data: { id: 'new-order-uuid' }, error: null });
  mockInsertFn.mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingleFn }) });

  // dispatch_order_items: insert → Promise<{ error: null }>
  mockItemsFn.mockResolvedValue({ error: null });

  // finished_goods_stock: update → eq → Promise<{ error: null }>
  mockEqFn.mockResolvedValue({ error: null });
  mockUpdateFn.mockReturnValue({ eq: mockEqFn });

  // production_logs: insert → Promise
  mockLogsFn.mockResolvedValue({ data: null, error: null });

  mockFromFn.mockImplementation((table: string) => {
    switch (table) {
      case 'dispatch_orders':       return { insert: mockInsertFn };
      case 'dispatch_order_items':  return { insert: mockItemsFn };
      case 'finished_goods_stock':  return { update: mockUpdateFn };
      case 'production_logs':       return { insert: mockLogsFn };
      default:                      return {};
    }
  });
}

const SAMPLE_CART: CartItem[] = [
  {
    finishedGoodId: 'good-1',
    productName:    'Maceta Chica',
    colorName:      'Rojo',
    quantity:       10,
    unit_price:     500,
    availableStock: 50,
  },
  {
    finishedGoodId: 'good-2',
    productName:    'Tacho 20L',
    colorName:      'Azul',
    quantity:       5,
    unit_price:     1200,
    availableStock: 20,
  },
];

// ─── Test suite ───────────────────────────────────────────────────────────────
describe('DispatchService', () => {
  let service: DispatchService;

  beforeEach(() => {
    vi.clearAllMocks();
    setupHappyPath();

    TestBed.configureTestingModule({});
    service = TestBed.inject(DispatchService);
  });

  // ── TC-1: Empty cart ────────────────────────────────────────────────────────
  it('returns failure immediately when cart is empty', async () => {
    const result = await service.createDispatchOrder(
      { clientReason: 'Test', deliveryPerson: 'Driver' },
      []
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain('vacío');
    expect(mockFromFn).not.toHaveBeenCalled();
  });

  // ── TC-2: Success path ──────────────────────────────────────────────────────
  it('creates the header, items, decrements stock, and returns orderId on success', async () => {
    const result = await service.createDispatchOrder(
      { clientReason: 'Distribuidora Norte', deliveryPerson: 'Juan' },
      SAMPLE_CART
    );

    // Return value
    expect(result.success).toBe(true);
    expect(result.orderId).toBe('new-order-uuid');
    expect(result.message).toContain('REM-');

    // Step 1 – header insert called
    expect(mockFromFn).toHaveBeenCalledWith('dispatch_orders');
    const headerPayload = mockInsertFn.mock.calls[0][0];
    expect(headerPayload.client_reason).toBe('Distribuidora Norte');
    expect(headerPayload.delivery_person).toBe('Juan');
    // total = 10*500 + 5*1200 = 5000 + 6000 = 11000
    expect(headerPayload.total_amount).toBe(11000);

    // Step 2 – items insert called with correct rows
    expect(mockFromFn).toHaveBeenCalledWith('dispatch_order_items');
    const itemsPayload: any[] = mockItemsFn.mock.calls[0][0];
    expect(itemsPayload).toHaveLength(2);
    expect(itemsPayload[0].dispatch_order_id).toBe('new-order-uuid');
    expect(itemsPayload[0].historical_unit_price).toBe(500);
    expect(itemsPayload[0].subtotal).toBe(5000);

    // Step 3 – stock decrements called once per cart item
    expect(mockFromFn).toHaveBeenCalledWith('finished_goods_stock');
    const stockUpdateCalls = mockUpdateFn.mock.calls;
    expect(stockUpdateCalls).toHaveLength(2);
    // First item: 50 - 10 = 40
    expect(stockUpdateCalls[0][0]).toEqual({ quantity_units: 40 });
    // Second item: 20 - 5 = 15
    expect(stockUpdateCalls[1][0]).toEqual({ quantity_units: 15 });

    // Step 4 – audit log written
    expect(mockFromFn).toHaveBeenCalledWith('production_logs');
    const logPayload = mockLogsFn.mock.calls[0][0];
    expect(logPayload.transaction_type).toBe('DISPATCH');
  });

  // ── TC-3: Failure path – header insert fails ────────────────────────────────
  it('returns failure and does NOT insert items when header insert errors', async () => {
    // Override only the header insert to return an error
    mockSingleFn.mockResolvedValueOnce({
      data: null,
      error: { message: 'unique constraint violated' },
    });

    const result = await service.createDispatchOrder(
      { clientReason: 'Test', deliveryPerson: 'Driver' },
      SAMPLE_CART
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain('unique constraint violated');

    // Items, stock update, log should NOT have been called
    expect(mockItemsFn).not.toHaveBeenCalled();
    expect(mockUpdateFn).not.toHaveBeenCalled();
    expect(mockLogsFn).not.toHaveBeenCalled();
  });

  // ── TC-4: Failure path – stock update fails ─────────────────────────────────
  it('returns failure when stock decrement errors on any item', async () => {
    mockEqFn.mockResolvedValueOnce({ error: { message: 'row locked' } });

    const result = await service.createDispatchOrder(
      { clientReason: 'Test', deliveryPerson: 'Driver' },
      SAMPLE_CART
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain('row locked');
  });

  // ── TC-5: getRecentOrders returns empty array on error ──────────────────────
  it('getRecentOrders returns [] when supabase errors', async () => {
    mockFromFn.mockImplementationOnce(() => ({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'network error' } }),
        }),
      }),
    }));

    const orders = await service.getRecentOrders();
    expect(orders).toEqual([]);
  });
});
