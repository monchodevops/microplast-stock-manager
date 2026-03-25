import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryFacade } from '../../../application';

/**
 * Example of a migrated component using the new architecture
 * 
 * BEFORE: Direct dependency on InventoryService with mixed concerns
 * AFTER: Clean dependency on InventoryFacade with single responsibility
 */
@Component({
  selector: 'app-production-new',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div>
        <p class="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Producción</p>
        <h1 class="text-xl font-semibold text-slate-900">Registrar Producción</h1>
      </div>

      <!-- Loading State -->
      @if (inventoryFacade.loading$()) {
        <div class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-2 text-sm text-slate-500">Cargando datos...</p>
        </div>
      }

      <!-- Error State -->
      @if (inventoryFacade.error$()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-red-800">{{ inventoryFacade.error$() }}</p>
          <button 
            (click)="inventoryFacade.clearError(); loadData()"
            class="mt-2 text-sm text-red-600 hover:text-red-800">
            Reintentar
          </button>
        </div>
      }

      <!-- Production Form -->
      @if (!inventoryFacade.loading$() && !inventoryFacade.error$()) {
        <div class="max-w-2xl rounded-xl border border-slate-200/60 bg-white p-6">
          <div class="space-y-4">

            <!-- Product Selector -->
            <div>
              <label class="mb-1 block text-xs font-medium text-slate-600">Producto</label>
              <select [(ngModel)]="selectedProductId" (ngModelChange)="onProductChange($event)"
                class="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors">
                <option value="">Seleccionar producto…</option>
                @for (product of inventoryFacade.activeProducts$(); track product.id) {
                  <option [value]="product.id">{{ product.name }} ({{ product.consumptionPerUnitKg }}kg/u)</option>
                }
              </select>
            </div>

            <!-- Color Selectors — shown when a product is selected -->
            @if (selectedProduct()) {
              <!-- Capa 1 / único color (always shown) -->
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-600">
                  {{ selectedProduct()!.isMultiLayer ? 'Color Capa 1 (Principal)' : 'Color (Materia Prima)' }}
                </label>
                <select [(ngModel)]="selectedLayerColors[0]"
                  class="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors">
                  <option value="">Seleccionar color…</option>
                  @for (material of inventoryFacade.materials$(); track material.id) {
                    <option [value]="material.colorName">{{ material.colorName }} (Disp: {{ material.currentStockKg }}kg)</option>
                  }
                </select>
              </div>

              <!-- Capa 2 (shown only if layerCount >= 2) -->
              @if (selectedProduct()!.layerCount >= 2) {
                <div>
                  <label class="mb-1 block text-xs font-medium text-slate-600">Color Capa 2</label>
                  <select [(ngModel)]="selectedLayerColors[1]"
                    class="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors">
                    <option value="">Seleccionar color…</option>
                    @for (material of inventoryFacade.materials$(); track material.id) {
                      <option [value]="material.colorName">{{ material.colorName }} (Disp: {{ material.currentStockKg }}kg)</option>
                    }
                  </select>
                </div>
              }

              <!-- Capa 3 (shown only if layerCount >= 3) -->
              @if (selectedProduct()!.layerCount >= 3) {
                <div>
                  <label class="mb-1 block text-xs font-medium text-slate-600">Color Capa 3</label>
                  <select [(ngModel)]="selectedLayerColors[2]"
                    class="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors">
                    <option value="">Seleccionar color…</option>
                    @for (material of inventoryFacade.materials$(); track material.id) {
                      <option [value]="material.colorName">{{ material.colorName }} (Disp: {{ material.currentStockKg }}kg)</option>
                    }
                  </select>
                </div>
              }
            }

            <!-- Quantity Input -->
            <div>
              <label class="mb-1 block text-xs font-medium text-slate-600">Cantidad a Producir (Unidades)</label>
              <input type="number" [(ngModel)]="quantity" min="1"
                class="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors" />
            </div>

            <!-- Production Preview -->
            @if (selectedProduct() && quantity() > 0) {
              <div class="rounded-lg border border-slate-200/60 bg-slate-50/60 p-4 text-sm">
                <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Resumen de Consumo</p>

                @if (selectedProduct()!.isMultiLayer) {
                  <!-- Multi-layer breakdown -->
                  @for (layer of selectedProduct()!.layersConfig!; track layer.order; let i = $index) {
                    <div class="flex justify-between text-slate-600">
                      <span>Capa {{ layer.order }}{{ selectedLayerColors[i] ? ' (' + selectedLayerColors[i] + ')' : '' }}:</span>
                      <span>{{ (layer.consumptionKg * quantity()) | number:'1.0-2' }} kg</span>
                    </div>
                  }
                  <div class="mt-2 flex justify-between border-t border-slate-200 pt-2 font-semibold text-slate-900">
                    <span>Total Plástico Requerido:</span>
                    <span>{{ totalMaterialNeeded() | number:'1.0-2' }} kg</span>
                  </div>
                } @else {
                  <!-- Mono-layer (existing layout) -->
                  <div class="flex justify-between text-slate-600">
                    <span>Consumo unitario:</span>
                    <span>{{ selectedProduct()!.consumptionPerUnitKg }} kg</span>
                  </div>
                  <div class="mt-2 flex justify-between border-t border-slate-200 pt-2 font-semibold text-slate-900">
                    <span>Total Plástico Requerido:</span>
                    <span>{{ totalMaterialNeeded() | number:'1.0-2' }} kg</span>
                  </div>
                }
              </div>
            }

            <!-- Submit Button -->
            <div class="pt-2">
              <button (click)="submitProduction()"
                [disabled]="!isValid() || isSubmitting()"
                class="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50">
                @if (isSubmitting()) {
                  <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Procesando…
                } @else {
                  Registrar Producción
                }
              </button>
            </div>

            <!-- Feedback -->
            @if (feedbackMessage()) {
              <div class="flex items-start gap-3 rounded-xl border p-4"
                [class.border-emerald-200]="lastSuccess()"
                [class.bg-emerald-50]="lastSuccess()"
                [class.border-red-200]="!lastSuccess()"
                [class.bg-red-50]="!lastSuccess()">
                <svg class="mt-0.5 h-4 w-4 flex-shrink-0" 
                  [class.text-emerald-500]="lastSuccess()" 
                  [class.text-red-500]="!lastSuccess()" 
                  viewBox="0 0 20 20" fill="currentColor">
                  @if (lastSuccess()) {
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  } @else {
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  }
                </svg>
                <span class="text-sm" 
                  [class.text-emerald-800]="lastSuccess()" 
                  [class.text-red-800]="!lastSuccess()">
                  {{ feedbackMessage() }}
                </span>
              </div>
            }

          </div>
        </div>
      }
    </div>
  `
})
export class ProductionComponentNew implements OnInit {
  // New architecture: Single dependency on facade
  readonly inventoryFacade = inject(InventoryFacade);

  // Local component state (UI-only concerns)
  selectedProductId = signal<string>('');
  /**
   * Holds the selected color for each layer (index 0 = Capa 1, etc.).
   * A plain array is used (not a signal) so ngModel binding works simply
   * on individual indices; the component re-evaluates isValid via computed.
   */
  selectedLayerColors: string[] = ['', '', ''];
  quantity = signal<number>(1);
  isSubmitting = signal<boolean>(false);

  feedbackMessage = signal<string>('');
  lastSuccess = signal<boolean>(false);

  // Computed values (derived from facade state)
  selectedProduct = computed(() => {
    const productId = this.selectedProductId();
    return productId ? this.inventoryFacade.findProductById(productId) : null;
  });

  totalMaterialNeeded = computed(() => {
    const product = this.selectedProduct();
    return product ? product.calculateMaterialNeeded(this.quantity()) : 0;
  });

  isValid = computed(() => {
    const product = this.selectedProduct();
    if (!product || this.quantity() <= 0) return false;

    const layerCount = product.layerCount;
    // All layer color slots up to layerCount must be filled
    for (let i = 0; i < layerCount; i++) {
      if (!this.selectedLayerColors[i]?.trim()) return false;
    }
    return true;
  });

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    await this.inventoryFacade.loadInitialData();
  }

  /** Reset layer color selections when the product changes. */
  onProductChange(_productId: string) {
    this.selectedLayerColors = ['', '', ''];
  }

  async submitProduction() {
    if (!this.isValid()) return;

    this.feedbackMessage.set('');
    this.isSubmitting.set(true);

    try {
      const product = this.selectedProduct()!;
      const qty = this.quantity();
      let result;

      if (product.isMultiLayer) {
        // Multi-layer: pass only the filled colors
        const layerColors = this.selectedLayerColors.slice(0, product.layerCount);
        result = await this.inventoryFacade.runMultiLayerProduction(
          this.selectedProductId(),
          layerColors,
          qty
        );
      } else {
        // Mono-layer: existing API
        result = await this.inventoryFacade.runProduction(
          this.selectedProductId(),
          this.selectedLayerColors[0],
          qty
        );
      }

      this.lastSuccess.set(result.success);
      this.feedbackMessage.set(result.message);

      if (result.success) {
        // Reset form on success
        this.quantity.set(1);
        this.selectedLayerColors = ['', '', ''];
        setTimeout(() => this.feedbackMessage.set(''), 3000);
      }
    } catch (error) {
      this.lastSuccess.set(false);
      this.feedbackMessage.set('Error inesperado. Por favor, intente nuevamente.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
    <div class="space-y-6">
      <!-- Page Header -->
      <div>
        <p class="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Producción</p>
        <h1 class="text-xl font-semibold text-slate-900">Registrar Producción</h1>
      </div>

      <!-- Loading State -->
      @if (inventoryFacade.loading$()) {
        <div class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-2 text-sm text-slate-500">Cargando datos...</p>
        </div>
      }

      <!-- Error State -->
      @if (inventoryFacade.error$()) {
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-red-800">{{ inventoryFacade.error$() }}</p>
          <button 
            (click)="inventoryFacade.clearError(); loadData()"
            class="mt-2 text-sm text-red-600 hover:text-red-800">
            Reintentar
          </button>
        </div>
      }

      <!-- Production Form -->
      @if (!inventoryFacade.loading$() && !inventoryFacade.error$()) {
        <div class="max-w-2xl rounded-xl border border-slate-200/60 bg-white p-6">
          <div class="space-y-4">

            <!-- Product Selector -->
            <div>
              <label class="mb-1 block text-xs font-medium text-slate-600">Producto</label>
              <select [(ngModel)]="selectedProductId"
                class="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors">
                <option value="">Seleccionar producto…</option>
                @for (product of inventoryFacade.activeProducts$(); track product.id) {
                  <option [value]="product.id">{{ product.name }} ({{ product.consumptionPerUnitKg }}kg/u)</option>
                }
              </select>
            </div>

            <!-- Color Selector -->
            <div>
              <label class="mb-1 block text-xs font-medium text-slate-600">Color (Materia Prima)</label>
              <select [(ngModel)]="selectedColorName"
                class="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors">
                <option value="">Seleccionar color…</option>
                @for (material of inventoryFacade.materials$(); track material.id) {
                  <option [value]="material.colorName">{{ material.colorName }} (Disp: {{ material.currentStockKg }}kg)</option>
                }
              </select>
            </div>

            <!-- Quantity Input -->
            <div>
              <label class="mb-1 block text-xs font-medium text-slate-600">Cantidad a Producir (Unidades)</label>
              <input type="number" [(ngModel)]="quantity" min="1"
                class="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors" />
            </div>

            <!-- Production Preview -->
            @if (selectedProduct() && quantity() > 0) {
              <div class="rounded-lg border border-slate-200/60 bg-slate-50/60 p-4 text-sm">
                <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Resumen de Consumo</p>
                <div class="flex justify-between text-slate-600">
                  <span>Consumo unitario:</span>
                  <span>{{ selectedProduct()!.consumptionPerUnitKg }} kg</span>
                </div>
                <div class="mt-2 flex justify-between border-t border-slate-200 pt-2 font-semibold text-slate-900">
                  <span>Total Plástico Requerido:</span>
                  <span>{{ totalMaterialNeeded() | number:'1.0-2' }} kg</span>
                </div>
              </div>
            }

            <!-- Submit Button -->
            <div class="pt-2">
              <button (click)="submitProduction()"
                [disabled]="!isValid() || isSubmitting()"
                class="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50">
                @if (isSubmitting()) {
                  <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Procesando…
                } @else {
                  Registrar Producción
                }
              </button>
            </div>

            <!-- Feedback -->
            @if (feedbackMessage()) {
              <div class="flex items-start gap-3 rounded-xl border p-4"
                [class.border-emerald-200]="lastSuccess()"
                [class.bg-emerald-50]="lastSuccess()"
                [class.border-red-200]="!lastSuccess()"
                [class.bg-red-50]="!lastSuccess()">
                <svg class="mt-0.5 h-4 w-4 flex-shrink-0" 
                  [class.text-emerald-500]="lastSuccess()" 
                  [class.text-red-500]="!lastSuccess()" 
                  viewBox="0 0 20 20" fill="currentColor">
                  @if (lastSuccess()) {
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  } @else {
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  }
                </svg>
                <span class="text-sm" 
                  [class.text-emerald-800]="lastSuccess()" 
                  [class.text-red-800]="!lastSuccess()">
                  {{ feedbackMessage() }}
                </span>
              </div>
            }

          </div>
        </div>
      }
    </div>
  `
})
export class ProductionComponentNew implements OnInit {
  // New architecture: Single dependency on facade
  readonly inventoryFacade = inject(InventoryFacade);

  // Local component state (UI-only concerns)
  selectedProductId = signal<string>('');
  /**
   * Holds the selected color for each layer (index 0 = Capa 1, etc.).
   * A plain array is used (not a signal) so ngModel binding works simply
   * on individual indices; the component re-evaluates isValid via computed.
   */
  selectedLayerColors: string[] = ['', '', ''];
  quantity = signal<number>(1);
  isSubmitting = signal<boolean>(false);

  feedbackMessage = signal<string>('');
  lastSuccess = signal<boolean>(false);

  // Computed values (derived from facade state)
  selectedProduct = computed(() => {
    const productId = this.selectedProductId();
    return productId ? this.inventoryFacade.findProductById(productId) : null;
  });

  totalMaterialNeeded = computed(() => {
    const product = this.selectedProduct();
    return product ? product.calculateMaterialNeeded(this.quantity()) : 0;
  });

  isValid = computed(() => {
    const product = this.selectedProduct();
    if (!product || this.quantity() <= 0) return false;

    const layerCount = product.layerCount;
    // All layer color slots up to layerCount must be filled
    for (let i = 0; i < layerCount; i++) {
      if (!this.selectedLayerColors[i]?.trim()) return false;
    }
    return true;
  });

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    await this.inventoryFacade.loadInitialData();
  }

  /** Reset layer color selections when the product changes. */
  onProductChange(_productId: string) {
    this.selectedLayerColors = ['', '', ''];
  }

  async submitProduction() {
    if (!this.isValid()) return;

    this.feedbackMessage.set('');
    this.isSubmitting.set(true);

    try {
      const product = this.selectedProduct()!;
      const qty = this.quantity();
      let result;

      if (product.isMultiLayer) {
        // Multi-layer: pass only the filled colors
        const layerColors = this.selectedLayerColors.slice(0, product.layerCount);
        result = await this.inventoryFacade.runMultiLayerProduction(
          this.selectedProductId(),
          layerColors,
          qty
        );
      } else {
        // Mono-layer: existing API
        result = await this.inventoryFacade.runProduction(
          this.selectedProductId(),
          this.selectedLayerColors[0],
          qty
        );
      }

      this.lastSuccess.set(result.success);
      this.feedbackMessage.set(result.message);

      if (result.success) {
        // Reset form on success
        this.quantity.set(1);
        this.selectedLayerColors = ['', '', ''];
        setTimeout(() => this.feedbackMessage.set(''), 3000);
      }
    } catch (error) {
      this.lastSuccess.set(false);
      this.feedbackMessage.set('Error inesperado. Por favor, intente nuevamente.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}