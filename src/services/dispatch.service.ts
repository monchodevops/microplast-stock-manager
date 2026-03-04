import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';

// ─── Domain Interfaces ──────────────────────────────────────────────────────

/**
 * Represents a single line in the shopping cart / remito builder.
 * `availableStock` is the stock at the time the item was added – used both
 * for UI validation and to compute the updated stock on submission.
 */
export interface CartItem {
  finishedGoodId: string;
  productName: string;
  colorName: string;
  quantity: number;
  unit_price: number;
  availableStock: number; // current stock at the moment of adding to cart
}

/** Header of a saved dispatch order (from DB). */
export interface DispatchOrder {
  id: string;
  orderNumber: string;
  clientReason: string;
  deliveryPerson: string;
  totalAmount: number;
  createdAt: Date;
}

/** Detail line of a saved dispatch order (from DB). */
export interface DispatchOrderItem {
  id: string;
  dispatchOrderId: string;
  finishedGoodId: string;
  quantity: number;
  historicalUnitPrice: number;
  subtotal: number;
}

/** Detail line enriched with product/color names for display. */
export interface DispatchOrderItemDetail extends DispatchOrderItem {
  productName: string;
  colorName: string;
}

/** Full printable order combining header + enriched detail lines. */
export interface FullDispatchOrder {
  header: DispatchOrder;
  items: DispatchOrderItemDetail[];
}

/** Input for creating a new dispatch order. */
export interface CreateDispatchOrderInput {
  clientReason: string;
  deliveryPerson: string;
}

/** Filters for dispatch orders history search. */
export interface DispatchFilters {
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
}

// ─── Service ────────────────────────────────────────────────────────────────

@Injectable({
  providedIn: 'root'
})
export class DispatchService {

  /**
   * Creates a full dispatch order atomically (as much as the JS client allows):
   *
   * 1. Insert header row in `dispatch_orders`                      → get new id
   * 2. Insert all detail rows in `dispatch_order_items`
   * 3. Decrement `quantity_units` in `finished_goods_stock` for each item
   * 4. Insert a single audit log in `production_logs`
   *
   * If any step fails the error is re-thrown so the caller can handle it.
   * NOTE: For full DB-level atomicity consider wrapping steps 1-4 in a
   *       Supabase/Postgres RPC function (stored procedure).
   */
  async createDispatchOrder(
    orderData: CreateDispatchOrderInput,
    cartItems: CartItem[]
  ): Promise<{ success: boolean; message: string; orderId?: string }> {
    if (!cartItems.length) {
      return { success: false, message: 'El carrito está vacío.' };
    }

    try {
      // ── STEP 1: Build header ────────────────────────────────────────────
      const totalAmount = cartItems.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0
      );

      const _now = new Date();
      const _p = (n: number, len = 2) => String(n).padStart(len, '0');
      const orderNumber = `REM-${_now.getFullYear()}${_p(_now.getMonth() + 1)}${_p(_now.getDate())}-${_p(_now.getHours())}${_p(_now.getMinutes())}${_p(_now.getSeconds())}`;

      const { data: orderRow, error: orderError } = await supabase
        .from('dispatch_orders')
        .insert({
          order_number:    orderNumber,
          client_reason:   orderData.clientReason,
          delivery_person: orderData.deliveryPerson,
          total_amount:    totalAmount
        })
        .select('id')
        .single();

      if (orderError) throw new Error(`Error al crear el remito: ${orderError.message}`);

      const orderId: string = orderRow.id;

      // ── STEP 2: Insert detail lines ─────────────────────────────────────
      const itemRows = cartItems.map(item => ({
        dispatch_order_id:     orderId,
        finished_good_id:      item.finishedGoodId,
        quantity:              item.quantity,
        historical_unit_price: item.unit_price,
        subtotal:              item.quantity * item.unit_price
      }));

      const { error: itemsError } = await supabase
        .from('dispatch_order_items')
        .insert(itemRows);

      if (itemsError) throw new Error(`Error al guardar los ítems del remito: ${itemsError.message}`);

      // ── STEP 3: Decrement finished-goods stock ──────────────────────────
      // We process sequentially (not Promise.all) to avoid race conditions
      // on the same row in case the same product appears twice (shouldn't
      // happen by design, but defensive coding).
      for (const item of cartItems) {
        const newQty = item.availableStock - item.quantity;

        const { error: stockError } = await supabase
          .from('finished_goods_stock')
          .update({ quantity_units: newQty })
          .eq('id', item.finishedGoodId);

        if (stockError) {
          throw new Error(
            `Error al descontar stock de "${item.productName} (${item.colorName})": ${stockError.message}`
          );
        }
      }

      // ── STEP 4: Audit log ───────────────────────────────────────────────
      const itemsSummary = cartItems
        .map(i => `${i.quantity}u ${i.productName}(${i.colorName})`)
        .join(', ');

      await supabase.from('production_logs').insert({
        transaction_type: 'DISPATCH',
        description:      `Remito ${orderNumber} – Cliente: ${orderData.clientReason} – Entregó: ${orderData.deliveryPerson} – [${itemsSummary}]`,
        amount_change:    -cartItems.reduce((s, i) => s + i.quantity, 0)
      });

      return { success: true, message: `Remito ${orderNumber} generado exitosamente.`, orderId };

    } catch (err: any) {
      console.error('[DispatchService] createDispatchOrder error:', err);
      return { success: false, message: err.message || 'Error desconocido al generar el remito.' };
    }
  }

  /**
   * Fetches the last N dispatch orders (header only) for a history/listing view.
   */
  async getRecentOrders(limit = 50): Promise<DispatchOrder[]> {
    const { data, error } = await supabase
      .from('dispatch_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[DispatchService] getRecentOrders error:', error);
      return [];
    }

    return (data ?? []).map((d: any) => ({
      id:             d.id,
      orderNumber:    d.order_number,
      clientReason:   d.client_reason,
      deliveryPerson: d.delivery_person,
      totalAmount:    d.total_amount,
      createdAt:      new Date(d.created_at)
    }));
  }

  /**
   * Fetches dispatch orders with filtering capabilities for the history view.
   * Supports date range filtering, text search, and pagination.
   */
  async getDispatchOrdersList(filters?: DispatchFilters): Promise<DispatchOrder[]> {
    let query = supabase
      .from('dispatch_orders')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply date range filters
    if (filters?.startDate) {
      // Start of day for startDate
      const startOfDay = new Date(filters.startDate);
      startOfDay.setHours(0, 0, 0, 0);
      query = query.gte('created_at', startOfDay.toISOString());
    }
    if (filters?.endDate) {
      // End of day for endDate
      const endOfDay = new Date(filters.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      query = query.lte('created_at', endOfDay.toISOString());
    }

    // Apply text search filter
    if (filters?.searchTerm && filters.searchTerm.trim()) {
      const searchTerm = filters.searchTerm.trim();
      query = query.or(`client_reason.ilike.%${searchTerm}%,order_number.ilike.%${searchTerm}%`);
    }

    // Default limit to 100 records unless date filters are applied
    if (!filters?.startDate && !filters?.endDate) {
      query = query.limit(100);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[DispatchService] getDispatchOrdersList error:', error);
      return [];
    }

    return (data ?? []).map((d: any) => ({
      id:             d.id,
      orderNumber:    d.order_number,
      clientReason:   d.client_reason,
      deliveryPerson: d.delivery_person,
      totalAmount:    d.total_amount,
      createdAt:      new Date(d.created_at)
    }));
  }

  /**
   * Fetches the detail lines for a specific dispatch order.
   */
  async getOrderItems(orderId: string): Promise<DispatchOrderItem[]> {
    const { data, error } = await supabase
      .from('dispatch_order_items')
      .select('*')
      .eq('dispatch_order_id', orderId);

    if (error) {
      console.error('[DispatchService] getOrderItems error:', error);
      return [];
    }

    return (data ?? []).map((d: any) => ({
      id:                   d.id,
      dispatchOrderId:      d.dispatch_order_id,
      finishedGoodId:       d.finished_good_id,
      quantity:             d.quantity,
      historicalUnitPrice:  d.historical_unit_price,
      subtotal:             d.subtotal
    }));
  }

  /**
   * Fetches a single dispatch order header by id.
   */
  async getOrderById(orderId: string): Promise<DispatchOrder | null> {
    const { data, error } = await supabase
      .from('dispatch_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !data) {
      console.error('[DispatchService] getOrderById error:', error);
      return null;
    }

    return {
      id:             data.id,
      orderNumber:    data.order_number,
      clientReason:   data.client_reason,
      deliveryPerson: data.delivery_person,
      totalAmount:    data.total_amount,
      createdAt:      new Date(data.created_at)
    };
  }

  /**
   * Returns the header + all enriched detail lines for a single order.
   * Joins dispatch_order_items → finished_goods_stock → product_definitions
   * to resolve product name and color name for the print view.
   */
  async getFullOrderDetails(orderId: string): Promise<FullDispatchOrder | null> {
    const [header, itemsRes] = await Promise.all([
      this.getOrderById(orderId),
      supabase
        .from('dispatch_order_items')
        .select(`
          *,
          finished_goods_stock (
            color_name,
            product_definition_id,
            product_definitions ( name )
          )
        `)
        .eq('dispatch_order_id', orderId)
    ]);

    if (!header) return null;

    if (itemsRes.error) {
      console.error('[DispatchService] getFullOrderDetails items error:', itemsRes.error);
      return null;
    }

    const items: DispatchOrderItemDetail[] = (itemsRes.data ?? []).map((d: any) => ({
      id:                   d.id,
      dispatchOrderId:      d.dispatch_order_id,
      finishedGoodId:       d.finished_good_id,
      quantity:             d.quantity,
      historicalUnitPrice:  d.historical_unit_price,
      subtotal:             d.subtotal,
      colorName:            d.finished_goods_stock?.color_name ?? '—',
      productName:          d.finished_goods_stock?.product_definitions?.name ?? '—'
    }));

    return { header, items };
  }
}
