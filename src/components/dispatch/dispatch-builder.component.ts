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
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Generar Remito</h2>
          <p class="text-sm text-gray-500 mt-1">
            Construí el pedido seleccionando productos del panel derecho.
            Solo se muestran artículos con stock disponible.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <!-- Print last remito button – only shown after a successful submission -->
          @if (lastGeneratedOrderId()) {
            <button
              (click)="printLastOrder()"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white
                     bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2
                     focus:ring-indigo-500 shadow-sm transition-all">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir Último Remito
            </button>
          }

          <!-- Cart item count badge -->
          @if (cartItems().length > 0) {
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {{ cartItems().length }} {{ cartItems().length === 1 ? 'artículo' : 'artículos' }} en el carrito
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
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h3 class="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <svg class="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Datos del Remito
            </h3>
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Cliente / Motivo <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Distribuidora Norte, Entrega interna..."
                  [ngModel]="clientReason()"
                  (ngModelChange)="clientReason.set($event)"
                  class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Encargado de Entrega <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Juan Pérez, Camión propio..."
                  [ngModel]="deliveryPerson()"
                  (ngModelChange)="deliveryPerson.set($event)"
                  class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>
            </div>
          </div>

          <!-- Cart Table -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div class="px-5 py-3 border-b border-gray-100 bg-gray-50">
              <h3 class="text-base font-semibold text-gray-700 flex items-center gap-2">
                <svg class="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Carrito del Pedido
              </h3>
            </div>

            @if (cartItems().length === 0) {
              <!-- Empty state -->
              <div class="flex flex-col items-center justify-center py-14 text-gray-400">
                <svg class="h-12 w-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p class="text-sm font-medium">El carrito está vacío</p>
                <p class="text-xs mt-1">Agregá productos desde el panel derecho</p>
              </div>
            } @else {
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-auto">Producto</th>
                      <th class="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Cant.</th>
                      <th class="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-28">P.Unit.</th>
                      <th class="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Subtotal</th>
                      <th class="px-4 py-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-100">
                    @for (item of cartItems(); track item.finishedGoodId) {
                      <tr class="hover:bg-gray-50 group">
                        <td class="px-4 py-2.5">
                          <p class="text-sm font-medium text-gray-900 leading-tight">{{ item.productName }}</p>
                          <p class="text-xs text-gray-500">{{ item.colorName }}</p>
                        </td>
                        <td class="px-4 py-2.5 text-right">
                          <div class="flex items-center justify-end gap-1.5">
                            <button
                              (click)="decrementQty(item.finishedGoodId)"
                              [disabled]="item.quantity <= 1"
                              class="w-5 h-5 flex items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs leading-none">−</button>
                            <span class="w-8 text-center text-sm font-medium text-gray-900">{{ item.quantity }}</span>
                            <button
                              (click)="incrementQty(item.finishedGoodId)"
                              [disabled]="item.quantity >= item.availableStock"
                              class="w-5 h-5 flex items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs leading-none">+</button>
                          </div>
                        </td>
                        <td class="px-4 py-2.5 text-right text-sm text-gray-600">
                          {{ item.unit_price | currency:'ARS':'symbol':'1.2-2' }}
                        </td>
                        <td class="px-4 py-2.5 text-right text-sm font-semibold text-gray-800">
                          {{ (item.quantity * item.unit_price) | currency:'ARS':'symbol':'1.2-2' }}
                        </td>
                        <td class="px-4 py-2.5 text-center">
                          <button
                            (click)="removeFromCart(item.finishedGoodId)"
                            title="Quitar del carrito"
                            class="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Cart Summary Footer -->
              <div class="px-5 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <button
                  (click)="clearCart()"
                  class="text-xs text-gray-400 hover:text-red-500 transition-colors">
                  Limpiar carrito
                </button>
                <div class="text-right">
                  <p class="text-xs text-gray-500 uppercase font-medium tracking-wide">Total del Pedido</p>
                  <p class="text-2xl font-bold text-gray-900 tabular-nums">
                    {{ totalAmount() | currency:'ARS':'symbol':'1.2-2' }}
                  </p>
                </div>
              </div>
            }
          </div>

          <!-- Submit Button -->
          <div>
            <button
              (click)="confirm()"
              [disabled]="!isFormValid() || isLoading()"
              class="w-full py-3 px-6 rounded-lg text-sm font-semibold text-white shadow-sm transition-all
                     bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                     disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none">
              @if (isLoading()) {
                <span class="flex items-center justify-center gap-2">
                  <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Procesando...
                </span>
              } @else {
                <span class="flex items-center justify-center gap-2">
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Confirmar y Generar Remito
                </span>
              }
            </button>
            @if (!isFormValid() && cartItems().length > 0) {
              <p class="text-xs text-amber-600 mt-1.5 text-center">
                Completá los datos del remito (Cliente y Encargado) para continuar.
              </p>
            }
          </div>

          <!-- Feedback Message -->
          @if (feedbackMessage()) {
            <div
              class="rounded-lg p-4 text-sm font-medium border"
              [class.bg-green-50]="lastSuccess()"
              [class.text-green-800]="lastSuccess()"
              [class.border-green-200]="lastSuccess()"
              [class.bg-red-50]="!lastSuccess()"
              [class.text-red-800]="!lastSuccess()"
              [class.border-red-200]="!lastSuccess()">
              <div class="flex items-start gap-2">
                @if (lastSuccess()) {
                  <svg class="h-5 w-5 flex-shrink-0 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                } @else {
                  <svg class="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col max-h-[calc(100vh-8rem)] overflow-hidden">

            <!-- Panel Header + Search -->
            <div class="px-5 py-4 border-b border-gray-100 bg-gray-50 space-y-3">
              <h3 class="text-base font-semibold text-gray-700 flex items-center gap-2">
                <svg class="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Seleccionar Productos
                <span class="ml-auto text-xs font-normal text-gray-400">
                  {{ filteredGoods().length }} con stock disponible
                </span>
              </h3>
              <!-- Search -->
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" fill="currentColor"/>
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Buscar por producto o color..."
                  [ngModel]="searchTerm()"
                  (ngModelChange)="searchTerm.set($event)"
                  class="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition"
                />
              </div>
            </div>

            <!-- Product List (scrollable) -->
            <div class="overflow-y-auto flex-1">
              @if (filteredGoods().length === 0) {
                <div class="flex flex-col items-center justify-center py-14 text-gray-400">
                  <svg class="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p class="text-sm">No hay productos con stock disponible</p>
                  @if (searchTerm()) {
                    <p class="text-xs mt-1">Intentá con otro término de búsqueda</p>
                  }
                </div>
              } @else {
                <ul class="divide-y divide-gray-100">
                  @for (good of filteredGoods(); track good.id) {
                    <li class="px-5 py-3 hover:bg-purple-50 transition-colors" [class.bg-blue-50]="isInCart(good.id)">
                      <div class="flex items-center gap-3">

                        <!-- Product info -->
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-semibold text-gray-900 truncate">{{ good.productName }}</p>
                          <div class="flex items-center gap-2 mt-0.5">
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              {{ good.colorName }}
                            </span>
                            <span class="text-xs text-gray-500">
                              Stock: <span class="font-semibold text-green-700">{{ getEffectiveStock(good.id, good.quantityUnits) }}</span> u
                            </span>
                            <span class="text-xs text-gray-400">|</span>
                            <span class="text-xs text-gray-500">
                              Precio: <span class="font-medium">{{ good.unit_price | currency:'ARS':'symbol':'1.2-2' }}</span>
                            </span>
                          </div>
                        </div>

                        <!-- Add control -->
                        <div class="flex items-center gap-2 flex-shrink-0">
                          <input
                            type="number"
                            min="1"
                            [max]="getEffectiveStock(good.id, good.quantityUnits)"
                            [ngModel]="getQtyInput(good.id)"
                            (ngModelChange)="setQtyInput(good.id, $event)"
                            [disabled]="getEffectiveStock(good.id, good.quantityUnits) <= 0"
                            class="w-16 rounded-md border border-gray-300 text-center text-sm py-1.5 px-1 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:bg-gray-100 disabled:text-gray-400"
                          />
                          <button
                            (click)="addToCart(good)"
                            [disabled]="getEffectiveStock(good.id, good.quantityUnits) <= 0 || getQtyInput(good.id) < 1"
                            class="px-3 py-1.5 rounded-md text-xs font-semibold text-white transition-colors
                                   bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-500
                                   disabled:bg-gray-300 disabled:cursor-not-allowed">
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
