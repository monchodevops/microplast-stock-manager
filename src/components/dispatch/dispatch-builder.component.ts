import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../services/inventory.service';
import { DispatchService, CartItem } from '../../services/dispatch.service';

/** A finished good enriched with its product name for display purposes. */
interface FinishedGoodDisplay {
  id: string;
  productDefinitionId: string;
  productName: string;
  colorName: string;
  quantityUnits: number;
  unit_price: number;
}

@Component({
  selector: 'app-dispatch-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4">

      <!-- ── PAGE HEADER ─────────────────────────────────────────────── -->
      <div class="flex items-start justify-between">
        <div>
          <p class="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Despacho</p>
          <h1 class="text-xl font-semibold text-slate-900">Generar Remito</h1>
          <p class="mt-0.5 text-xs text-slate-400">Construí el pedido seleccionando productos del panel derecho.</p>
        </div>
        <div class="flex items-center gap-2">
          @if (lastGeneratedOrderId()) {
            <button (click)="printLastOrder()"
              class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir Último Remito
            </button>
          }
          @if (cartItems().length > 0) {
            <span class="inline-flex items-center gap-1.5 rounded-full border border-blue-200/60 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {{ cartItems().length }} {{ cartItems().length === 1 ? 'artículo' : 'artículos' }}
            </span>
          }
        </div>
      </div>

      <!-- ── TWO-PANEL LAYOUT ─────────────────────────────────────────── -->
      <div class="flex gap-6 items-start">

        <!-- ═══════════════════════════════════════════════════════════════
             LEFT PANEL: ORDER FORM + CART
        ════════════════════════════════════════════════════════════════ -->
        <div class="w-1/2 flex flex-col gap-4">

          <!-- Order Header Form -->
          <div class="rounded-xl border border-slate-200/60 bg-white p-5">
            <div class="mb-4 flex items-center gap-2">
              <svg class="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Datos del Remito</p>
            </div>
            <div class="space-y-3">
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-600">
                  Cliente / Motivo <span class="text-red-500">*</span>
                </label>
                <input type="text" placeholder="Ej: Distribuidora Norte, Entrega interna…"
                  [ngModel]="clientReason()" (ngModelChange)="clientReason.set($event)"
                  class="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors" />
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-600">
                  Encargado de Entrega <span class="text-red-500">*</span>
                </label>
                <input type="text" placeholder="Ej: Juan Pérez, Camión propio…"
                  [ngModel]="deliveryPerson()" (ngModelChange)="deliveryPerson.set($event)"
                  class="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors" />
              </div>
            </div>
          </div>

          <!-- Cart Table -->
          <div class="overflow-hidden rounded-xl border border-slate-200/60 bg-white">
            <div class="flex items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-3">
              <svg class="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Carrito del Pedido</p>
            </div>

            @if (cartItems().length === 0) {
              <div class="flex flex-col items-center justify-center py-14 text-slate-400">
                <svg class="mb-3 h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.25">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p class="text-sm font-medium">El carrito está vacío</p>
                <p class="mt-1 text-xs">Agregá productos desde el panel derecho</p>
              </div>
            } @else {
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-slate-100">
                  <thead class="bg-slate-50/60">
                    <tr>
                      <th class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Producto</th>
                      <th class="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400 w-24">Cant.</th>
                      <th class="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400 w-28">P.Unit.</th>
                      <th class="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400 w-28">Subtotal</th>
                      <th class="px-4 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 bg-white">
                    @for (item of cartItems(); track item.finishedGoodId) {
                      <tr class="group hover:bg-slate-50/50">
                        <td class="px-4 py-3">
                          <p class="text-sm font-medium text-slate-900 leading-tight">{{ item.productName }}</p>
                          <p class="text-xs text-slate-400">{{ item.colorName }}</p>
                        </td>
                        <td class="px-4 py-3 text-right">
                          <div class="flex items-center justify-end gap-1">
                            <button (click)="decrementQty(item.finishedGoodId)" [disabled]="item.quantity <= 1"
                              class="flex h-5 w-5 items-center justify-center rounded border border-slate-200 text-xs text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 transition-colors">−</button>
                            <span class="w-8 text-center text-sm font-medium text-slate-900 tabular-nums">{{ item.quantity }}</span>
                            <button (click)="incrementQty(item.finishedGoodId)" [disabled]="item.quantity >= item.availableStock"
                              class="flex h-5 w-5 items-center justify-center rounded border border-slate-200 text-xs text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 transition-colors">+</button>
                          </div>
                        </td>
                        <td class="px-4 py-3 text-right text-sm tabular-nums text-slate-500">
                          {{ item.unit_price | currency:'ARS':'symbol':'1.2-2' }}
                        </td>
                        <td class="px-4 py-3 text-right text-sm font-semibold tabular-nums text-slate-800">
                          {{ (item.quantity * item.unit_price) | currency:'ARS':'symbol':'1.2-2' }}
                        </td>
                        <td class="px-4 py-3 text-center">
                          <button (click)="removeFromCart(item.finishedGoodId)" title="Quitar del carrito"
                            class="text-slate-300 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100">
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Cart Footer -->
              <div class="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3">
                <button (click)="clearCart()" class="text-xs text-slate-400 hover:text-red-500 transition-colors">
                  Limpiar carrito
                </button>
                <div class="text-right">
                  <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total del Pedido</p>
                  <p class="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                    {{ totalAmount() | currency:'ARS':'symbol':'1.2-2' }}
                  </p>
                </div>
              </div>
            }
          </div>

          <!-- Submit Button -->
          <div>
            <button (click)="confirm()" [disabled]="!isFormValid() || isLoading()"
              class="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 px-6 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">
              @if (isLoading()) {
                <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Procesando…
              } @else {
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Confirmar y Generar Remito
              }
            </button>
            @if (!isFormValid() && cartItems().length > 0) {
              <p class="mt-1.5 text-center text-xs text-amber-600">
                Completá los datos del remito para continuar.
              </p>
            }
          </div>

          <!-- Feedback Message -->
          @if (feedbackMessage()) {
            <div class="rounded-xl border p-4 text-sm font-medium"
              [class.border-emerald-200]="lastSuccess()"
              [class.bg-emerald-50]="lastSuccess()"
              [class.text-emerald-800]="lastSuccess()"
              [class.border-red-200]="!lastSuccess()"
              [class.bg-red-50]="!lastSuccess()"
              [class.text-red-800]="!lastSuccess()">
              <div class="flex items-start gap-2">
                @if (lastSuccess()) {
                  <svg class="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                } @else {
                  <svg class="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                <span>{{ feedbackMessage() }}</span>
              </div>
            </div>
          }

        </div>

        <!-- ═══════════════════════════════════════════════════════════════
             RIGHT PANEL: PRODUCT SELECTOR
        ════════════════════════════════════════════════════════════════ -->
        <div class="w-1/2 flex flex-col gap-3 sticky top-4">
          <div class="flex flex-col max-h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-slate-200/60 bg-white">

            <!-- Panel Header + Search -->
            <div class="space-y-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4">
              <div class="flex items-center gap-2">
                <svg class="h-4 w-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Seleccionar Productos</p>
                <span class="ml-auto text-xs text-slate-400">{{ filteredGoods().length }} con stock</span>
              </div>
              <div class="relative">
                <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" fill="currentColor"/>
                  </svg>
                </span>
                <input type="text" placeholder="Buscar por producto o color…"
                  [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)"
                  class="block w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-colors" />
              </div>
            </div>

            <!-- Product List (scrollable) -->
            <div class="flex-1 overflow-y-auto">
              @if (filteredGoods().length === 0) {
                <div class="flex flex-col items-center justify-center py-14 text-slate-400">
                  <svg class="mb-2 h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.25">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p class="text-sm">No hay productos con stock disponible</p>
                  @if (searchTerm()) {
                    <p class="mt-1 text-xs">Intentá con otro término de búsqueda</p>
                  }
                </div>
              } @else {
                <ul class="divide-y divide-slate-100">
                  @for (good of filteredGoods(); track good.id) {
                    <li class="px-5 py-3 transition-colors hover:bg-violet-50/50" [ngClass]="{'bg-blue-50': isInCart(good.id)}">
                      <div class="flex items-center gap-3">
                        <div class="min-w-0 flex-1">
                          <p class="truncate text-sm font-semibold text-slate-900">{{ good.productName }}</p>
                          <div class="mt-0.5 flex flex-wrap items-center gap-2">
                            <span class="inline-flex items-center rounded-full border border-slate-200/60 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                              {{ good.colorName }}
                            </span>
                            <span class="text-xs text-slate-500">
                              Stock: <strong class="text-emerald-700">{{ getEffectiveStock(good.id, good.quantityUnits) }}</strong> u
                            </span>
                            <span class="text-xs text-slate-400">·</span>
                            <span class="text-xs text-slate-500">
                              {{ good.unit_price | currency:'ARS':'symbol':'1.2-2' }}
                            </span>
                          </div>
                        </div>
                        <div class="flex flex-shrink-0 items-center gap-2">
                          <input type="number" min="1" [max]="getEffectiveStock(good.id, good.quantityUnits)"
                            [ngModel]="getQtyInput(good.id)" (ngModelChange)="setQtyInput(good.id, $event)"
                            [disabled]="getEffectiveStock(good.id, good.quantityUnits) <= 0"
                            class="w-14 rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2 text-center text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:bg-slate-100 disabled:text-slate-400 transition-colors" />
                          <button (click)="addToCart(good)"
                            [disabled]="getEffectiveStock(good.id, good.quantityUnits) <= 0 || getQtyInput(good.id) < 1"
                            class="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 transition-colors disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">
                            @if (isInCart(good.id)) {
                              + Sumar
                            } @else {
                              Agregar
                            }
                          </button>
                        </div>
                      </div>
                    </li>
                  }
                </ul>
              }
            </div>

          </div>
        </div>

      </div>
    </div>
  `
})
export class DispatchBuilderComponent {
  private readonly inventory = inject(InventoryService);
  private readonly dispatchSvc = inject(DispatchService);

  // ── Form fields ──────────────────────────────────────────────────────────
  readonly clientReason   = signal('');
  readonly deliveryPerson = signal('');

  // ── Product selector state ────────────────────────────────────────────────
  readonly searchTerm = signal('');

  /**
   * Per-row quantity inputs in the right panel.
   * Key = finishedGoodId, Value = desired quantity to add.
   */
  private readonly qtyInputs = signal<Record<string, number>>({});

  // ── Cart state ────────────────────────────────────────────────────────────
  readonly cartItems = signal<CartItem[]>([]);

  // ── Async state ───────────────────────────────────────────────────────────
  readonly isLoading              = signal(false);
  readonly feedbackMessage        = signal('');
  /** ID of the last successfully created order; drives the print button. */
  readonly lastGeneratedOrderId   = signal<string | null>(null);
  readonly lastSuccess     = signal(false);

  // ── Derived / Computed ────────────────────────────────────────────────────

  /**
   * Finished goods enriched with product name, filtered to qty > 0 only.
   */
  private readonly availableGoods = computed<FinishedGoodDisplay[]>(() => {
    const products      = this.inventory.products();
    const finishedGoods = this.inventory.finishedGoods();

    return finishedGoods
      .filter(g => g.quantityUnits > 0)
      .map(g => {
        const product = products.find(p => p.id === g.productDefinitionId);
        return {
          id:                  g.id,
          productDefinitionId: g.productDefinitionId,
          productName:         product?.name ?? 'Producto desconocido',
          colorName:           g.colorName,
          quantityUnits:       g.quantityUnits,
          unit_price:          g.unit_price ?? 0
        };
      })
      .sort((a, b) => a.productName.localeCompare(b.productName));
  });

  /** `availableGoods` filtered by the search term. */
  readonly filteredGoods = computed<FinishedGoodDisplay[]>(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return this.availableGoods();
    return this.availableGoods().filter(g =>
      g.productName.toLowerCase().includes(term) ||
      g.colorName.toLowerCase().includes(term)
    );
  });

  /** Grand total of the current cart. */
  readonly totalAmount = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  );

  /** Whether the form can be submitted. */
  readonly isFormValid = computed(() =>
    this.clientReason().trim().length > 0 &&
    this.deliveryPerson().trim().length > 0 &&
    this.cartItems().length > 0
  );

  // ── Cart helpers ──────────────────────────────────────────────────────────

  /** Returns current stock minus already-carted quantity for a good. */
  getEffectiveStock(goodId: string, rawStock: number): number {
    const inCart = this.cartItems().find(c => c.finishedGoodId === goodId);
    return inCart ? rawStock - inCart.quantity : rawStock;
  }

  isInCart(goodId: string): boolean {
    return this.cartItems().some(c => c.finishedGoodId === goodId);
  }

  getQtyInput(goodId: string): number {
    return this.qtyInputs()[goodId] ?? 1;
  }

  setQtyInput(goodId: string, val: number | string): void {
    const parsed = Math.max(1, parseInt(String(val), 10) || 1);
    this.qtyInputs.update(m => ({ ...m, [goodId]: parsed }));
  }

  // ── Cart mutations ────────────────────────────────────────────────────────

  addToCart(good: FinishedGoodDisplay): void {
    const qty = this.getQtyInput(good.id);
    if (qty < 1) return;

    const existing = this.cartItems().find(c => c.finishedGoodId === good.id);

    if (existing) {
      // Increment, but cap at available stock
      const newQty = Math.min(existing.quantity + qty, good.quantityUnits);
      this.cartItems.update(items =>
        items.map(c => c.finishedGoodId === good.id ? { ...c, quantity: newQty } : c)
      );
    } else {
      const newItem: CartItem = {
        finishedGoodId: good.id,
        productName:    good.productName,
        colorName:      good.colorName,
        quantity:       Math.min(qty, good.quantityUnits),
        unit_price:     good.unit_price,
        availableStock: good.quantityUnits
      };
      this.cartItems.update(items => [...items, newItem]);
    }

    // Reset the qty input for this product back to 1
    this.setQtyInput(good.id, 1);
    this.clearFeedback();
  }

  removeFromCart(finishedGoodId: string): void {
    this.cartItems.update(items => items.filter(c => c.finishedGoodId !== finishedGoodId));
    this.clearFeedback();
  }

  incrementQty(finishedGoodId: string): void {
    this.cartItems.update(items =>
      items.map(c => {
        if (c.finishedGoodId !== finishedGoodId) return c;
        const newQty = Math.min(c.quantity + 1, c.availableStock);
        return { ...c, quantity: newQty };
      })
    );
  }

  decrementQty(finishedGoodId: string): void {
    this.cartItems.update(items =>
      items.map(c => {
        if (c.finishedGoodId !== finishedGoodId) return c;
        return { ...c, quantity: Math.max(1, c.quantity - 1) };
      })
    );
  }

  clearCart(): void {
    this.cartItems.set([]);
    this.qtyInputs.set({});
    this.clearFeedback();
  }

  private clearFeedback(): void {
    this.feedbackMessage.set('');
  }

  // ── Submission ────────────────────────────────────────────────────────────

  async confirm(): Promise<void> {
    if (!this.isFormValid() || this.isLoading()) return;

    this.isLoading.set(true);
    this.feedbackMessage.set('');

    const result = await this.dispatchSvc.createDispatchOrder(
      {
        clientReason:   this.clientReason().trim(),
        deliveryPerson: this.deliveryPerson().trim()
      },
      this.cartItems()
    );

    // Refresh the inventory signals so the right panel reflects updated stock
    await this.inventory.loadData();

    this.isLoading.set(false);
    this.lastSuccess.set(result.success);
    this.feedbackMessage.set(result.message);

    if (result.success) {
      // Store the new order id so the print button becomes available
      this.lastGeneratedOrderId.set(result.orderId ?? null);
      // Clear cart and form so the user can immediately start a new order
      this.cartItems.set([]);
      this.qtyInputs.set({});
      this.clientReason.set('');
      this.deliveryPerson.set('');
    }
  }

  /** Opens the printable remito view for the last generated order in a new tab. */
  printLastOrder(): void {
    const id = this.lastGeneratedOrderId();
    if (!id) return;
    window.open('/remito/imprimir/' + id, '_blank');
  }
}
