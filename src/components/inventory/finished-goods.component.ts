
import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../services/inventory.service';
import { DataGridComponent, ColumnDef } from '../shared/data-grid.component';

@Component({
  selector: 'app-finished-goods',
  standalone: true,
  imports: [CommonModule, FormsModule, DataGridComponent],
  template: `
    <div class="space-y-6 relative">
      <section>
        <!-- Page Header + Toolbar -->
        <div class="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Inventario</p>
            <h1 class="text-xl font-semibold text-slate-900">Productos Terminados</h1>
          </div>
          <div class="flex items-center gap-2">
            <!-- Search -->
            <div class="relative">
              <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg class="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Buscar producto o color…"
                [ngModel]="searchTerm()"
                (ngModelChange)="searchTerm.set($event)"
                class="block w-64 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
              />
            </div>
            <!-- Bulk Update -->
            <button (click)="openBulkModal()"
              class="inline-flex items-center gap-2 rounded-lg border border-violet-200/60 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 transition-colors">
              <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
              </svg>
              Actualización Masiva
            </button>
          </div>
        </div>
        <p class="mb-4 text-xs text-slate-400">Las filas atenuadas con advertencia en rojo indican stock cero.</p>

        <app-data-grid [data]="filteredFinishedGoodsData()" [columns]="columns">
            <ng-template #cellTemplate let-item let-col="col">
                <!-- Template para celdas personalizadas -->
                
                <ng-container *ngIf="col.key === 'quantityUnits'">
                  <div class="flex items-center justify-end gap-2" [ngClass]="{'opacity-50': item.quantityUnits === 0}">
                    <span class="font-medium" [ngClass]="item.quantityUnits === 0 ? 'text-red-600 font-bold' : 'text-slate-900'">
                      {{ item.quantityUnits }}
                    </span>
                    <span *ngIf="item.quantityUnits === 0"
                      class="inline-flex items-center rounded-full border border-red-200/60 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                      Sin Stock
                    </span>
                  </div>
                </ng-container>

                <ng-container *ngIf="col.key === 'unit_price'">
                  <span class="tabular-nums font-medium text-slate-900" [ngClass]="{'opacity-50': item.quantityUnits === 0}">
                    {{ (item.unit_price ?? 0) | currency:'ARS':'symbol-narrow':'1.0-0' }}
                  </span>
                </ng-container>

                <ng-container *ngIf="col.key === 'actions'">
                  <div class="flex justify-center">
                    <button (click)="openAdjustModal(item)" title="Editar Stock"
                      class="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 hover:border-blue-200 hover:text-blue-600 transition-colors">
                      <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                  </div>
                </ng-container>

                <ng-container *ngIf="col.key !== 'quantityUnits' && col.key !== 'actions' && col.key !== 'unit_price'">
                  <span class="font-medium text-slate-900" [ngClass]="{'opacity-50': item.quantityUnits === 0}">{{ item[col.key] }}</span>
                </ng-container>
            </ng-template>
        </app-data-grid>
      </section>
    </div>

    <!-- Modal de Ajuste de Stock -->
    <div *ngIf="isAdjustModalOpen()" class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16 backdrop-blur-sm" (click)="closeAdjustModal()">
      <div class="w-full max-w-xl rounded-2xl border border-slate-200/50 bg-white shadow-xl" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
          <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-blue-200/60 bg-blue-50">
            <svg class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 class="text-base font-semibold text-slate-900">Gestión de Producto</h3>
          <button (click)="closeAdjustModal()" class="ml-auto text-slate-400 hover:text-slate-600 transition-colors">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div class="space-y-4 p-6">
          <!-- Readonly Info -->
          <div class="rounded-lg border border-slate-200/60 bg-slate-50 px-4 py-3 text-sm text-slate-700 space-y-0.5">
            <p><span class="font-medium">Producto:</span> {{ selectedGoodForAdjustment()?.productName }}</p>
            <p><span class="font-medium">Color:</span> {{ selectedGoodForAdjustment()?.colorName }}</p>
            <p class="mt-1"><span class="font-medium">Stock actual:</span> <strong class="ml-1 text-base text-slate-900">{{ selectedGoodForAdjustment()?.quantityUnits }}</strong> unidades</p>
          </div>

          <!-- Section A: Price -->
          <div class="overflow-hidden rounded-xl border border-blue-200/60">
            <div class="border-b border-blue-200/60 bg-blue-50/60 px-4 py-2.5">
              <h4 class="flex items-center gap-2 text-sm font-semibold text-blue-800">
                <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd" />
                </svg>
                Sección A — Actualizar Precio
              </h4>
            </div>
            <div class="space-y-3 px-4 py-3">
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-600">Nuevo Precio ($)</label>
                <input type="number" [ngModel]="newPriceValue()" (ngModelChange)="newPriceValue.set($event)" min="0" step="1"
                  class="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors" />
              </div>
              <div *ngIf="priceSaveSuccess()" class="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <svg class="h-4 w-4 flex-shrink-0 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <p class="text-sm font-medium text-emerald-800">Precio guardado correctamente.</p>
              </div>
              <div *ngIf="priceError()" class="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
                <svg class="h-4 w-4 flex-shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
                <p class="text-sm font-medium text-red-800">{{ priceError() }}</p>
              </div>
              <button type="button" [disabled]="isSavingPrice() || newPriceValue() < 0" (click)="savePrice()"
                class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50">
                <span *ngIf="isSavingPrice()" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                {{ isSavingPrice() ? 'Guardando…' : 'Guardar Precio' }}
              </button>
            </div>
          </div>

          <!-- Section B: Stock Adjustment -->
          <div class="overflow-hidden rounded-xl border border-amber-200/60">
            <div class="border-b border-amber-200/60 bg-amber-50/60 px-4 py-2.5">
              <h4 class="flex items-center gap-2 text-sm font-semibold text-amber-800">
                <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z" />
                </svg>
                Sección B — Ajuste de Inventario
              </h4>
            </div>
            <div class="space-y-3 px-4 py-3">
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-600">Nuevo Stock (Unidades)</label>
                <input type="number" [ngModel]="newStockValue()" (ngModelChange)="newStockValue.set($event)" min="0"
                  class="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors" />
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-600">Motivo principal del ajuste</label>
                <select [ngModel]="adjustmentReasonSelect()" (ngModelChange)="adjustmentReasonSelect.set($event)"
                  class="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors">
                  <option value="" disabled selected>Seleccione un motivo…</option>
                  <option value="Conteo Físico">Conteo Físico</option>
                  <option value="Rotura/Merma">Rotura/Merma</option>
                  <option value="Salida Comercial/Muestra">Salida Comercial/Muestra</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-600">Detalles Adicionales (Opcional)</label>
                <input type="text" [ngModel]="adjustmentReasonDetails()" (ngModelChange)="adjustmentReasonDetails.set($event)" placeholder="Ej. Se encontraron 2 unidades extra en estante"
                  class="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors" />
              </div>
              <div *ngIf="adjustmentError()" class="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
                <svg class="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
                <p class="text-sm font-medium text-red-800">{{ adjustmentError() }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex flex-row-reverse gap-2 border-t border-slate-100 px-6 py-4">
          <button type="button" [disabled]="!isAdjustFormValid() || isSaving()" (click)="saveAdjustment()"
            class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50">
            <span *ngIf="isSaving()" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            {{ isSaving() ? 'Guardando…' : 'Guardar Ajuste' }}
          </button>
          <button type="button" (click)="closeAdjustModal()" [disabled]="isSaving()"
            class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50">
            Cancelar
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: Actualización Masiva -->
    <div *ngIf="isBulkModalOpen()" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" (click)="closeBulkModal()">
      <div class="w-full max-w-lg rounded-2xl border border-slate-200/50 bg-white shadow-xl" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
          <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-violet-200/60 bg-violet-50">
            <svg class="h-5 w-5 text-violet-600" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
            </svg>
          </div>
          <h3 class="text-base font-semibold text-slate-900">Actualización Masiva de Precios</h3>
          <button (click)="closeBulkModal()" class="ml-auto text-slate-400 hover:text-slate-600 transition-colors">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div class="space-y-4 p-6">
          <!-- Scope selector (only when filter active) -->
          <div *ngIf="searchTerm().trim()" class="rounded-xl border border-violet-200/60 bg-violet-50/60 p-3 space-y-2">
            <p class="text-xs font-semibold uppercase tracking-wide text-violet-700">¿A qué productos aplicar?</p>
            <label class="flex cursor-pointer items-center gap-2">
              <input type="radio" name="bulkScope" value="all" [ngModel]="bulkScope()" (ngModelChange)="bulkScope.set($event)" class="text-violet-600">
              <span class="text-sm text-slate-700">Todos los productos <strong>({{ finishedGoodsData().length }})</strong></span>
            </label>
            <label class="flex cursor-pointer items-center gap-2">
              <input type="radio" name="bulkScope" value="filtered" [ngModel]="bulkScope()" (ngModelChange)="bulkScope.set($event)" class="text-violet-600">
              <span class="text-sm text-slate-700">Solo los filtrados: <strong>&quot;{{ searchTerm() }}&quot;</strong> <strong>({{ filteredFinishedGoodsData().length }})</strong></span>
            </label>
          </div>

          <!-- Scope summary (no filter) -->
          <div *ngIf="!searchTerm().trim()" class="rounded-xl border border-slate-200/60 bg-slate-50 px-4 py-2.5">
            <p class="text-sm text-slate-600">Se aplicará a <strong class="text-slate-900">todos los {{ finishedGoodsData().length }} productos</strong>.</p>
          </div>

          <!-- Type + Action -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-xs font-medium text-slate-600">Tipo de ajuste</label>
              <select [ngModel]="bulkUpdateType()" (ngModelChange)="bulkUpdateType.set($event)"
                class="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-colors">
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Monto Fijo ($)</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-slate-600">Acción</label>
              <select [ngModel]="bulkAction()" (ngModelChange)="bulkAction.set($event)"
                class="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-colors">
                <option value="increase">Aumentar (+)</option>
                <option value="decrease">Descontar (-)</option>
              </select>
            </div>
          </div>

          <!-- Value -->
          <div>
            <label class="mb-1 block text-xs font-medium text-slate-600">
              Valor
              <span *ngIf="bulkUpdateType() === 'percentage'">(%)</span>
              <span *ngIf="bulkUpdateType() === 'fixed'">($)</span>
            </label>
            <input type="number" [ngModel]="bulkValue()" (ngModelChange)="bulkValue.set(+$event)" min="0" step="1" placeholder="0"
              class="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-colors" />
          </div>

          <!-- Live preview -->
          <div class="rounded-xl border border-amber-200/60 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
            <span class="font-semibold">Vista previa:</span>
            $1.000 →
            <strong>{{ bulkPreviewExample() | currency:'ARS':'symbol-narrow':'1.0-0' }}</strong>
          </div>

          <!-- Success banner -->
          <div *ngIf="bulkUpdateSuccess()" class="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <svg class="h-4 w-4 flex-shrink-0 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <p class="text-sm font-medium text-emerald-800">{{ bulkUpdateSuccess() }}</p>
          </div>

          <!-- Error banner -->
          <div *ngIf="bulkUpdateError()" class="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
            <svg class="h-4 w-4 flex-shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <p class="text-sm font-medium text-red-800">{{ bulkUpdateError() }}</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex flex-row-reverse gap-2 border-t border-slate-100 px-6 py-4">
          <button type="button" [disabled]="isBulkUpdating() || bulkValue() <= 0" (click)="applyBulkUpdate()"
            class="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50">
            <span *ngIf="isBulkUpdating()" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            {{ isBulkUpdating() ? 'Aplicando…' : 'Aplicar Actualización' }}
          </button>
          <button type="button" (click)="closeBulkModal()" [disabled]="isBulkUpdating()"
            class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  `
})
export class FinishedGoodsComponent {
  inventory = inject(InventoryService);

  // Búsqueda
  searchTerm = signal('');

  // ── Bulk Pricing Modal ──────────────────────────────────────────────────────
  isBulkModalOpen = signal(false);
  bulkScope = signal<'all' | 'filtered'>('all');
  bulkUpdateType = signal<'percentage' | 'fixed'>('percentage');
  bulkAction = signal<'increase' | 'decrease'>('increase');
  bulkValue = signal<number>(0);
  isBulkUpdating = signal(false);
  bulkUpdateError = signal<string | null>(null);
  bulkUpdateSuccess = signal<string | null>(null);

  // Reactively computes what $1.000 becomes with current settings
  bulkPreviewExample = computed(() => {
    const base = 1000;
    const value = this.bulkValue();
    const type = this.bulkUpdateType();
    const action = this.bulkAction();
    let result: number;
    if (type === 'percentage') {
      result = action === 'increase' ? base * (1 + value / 100) : base * (1 - value / 100);
    } else {
      result = action === 'increase' ? base + value : base - value;
    }
    return Math.round(Math.max(0, result));
  });

  openBulkModal() {
    this.bulkScope.set('all');
    this.bulkUpdateType.set('percentage');
    this.bulkAction.set('increase');
    this.bulkValue.set(0);
    this.bulkUpdateError.set(null);
    this.bulkUpdateSuccess.set(null);
    this.isBulkModalOpen.set(true);
  }

  closeBulkModal() {
    this.isBulkModalOpen.set(false);
  }

  async applyBulkUpdate() {
    const value = this.bulkValue();
    if (value <= 0) return;

    const targetItems = (this.bulkScope() === 'filtered' && this.searchTerm().trim())
      ? this.filteredFinishedGoodsData()
      : this.finishedGoodsData();

    const type = this.bulkUpdateType();
    const action = this.bulkAction();

    const updates = targetItems.map(item => {
      const currentPrice = item.unit_price ?? 0;
      let newPrice: number;
      if (type === 'percentage') {
        newPrice = action === 'increase'
          ? currentPrice * (1 + value / 100)
          : currentPrice * (1 - value / 100);
      } else {
        newPrice = action === 'increase' ? currentPrice + value : currentPrice - value;
      }
      return { id: item.id, new_price: Math.round(Math.max(0, newPrice)) };
    });

    this.isBulkUpdating.set(true);
    this.bulkUpdateError.set(null);
    this.bulkUpdateSuccess.set(null);

    try {
      const result = await this.inventory.bulkUpdatePrices(updates);
      if (result.success) {
        this.bulkUpdateSuccess.set(result.message);
        setTimeout(() => this.closeBulkModal(), 2000);
      } else {
        this.bulkUpdateError.set(result.message);
      }
    } catch (err: any) {
      this.bulkUpdateError.set(err.message || 'Error desconocido.');
    } finally {
      this.isBulkUpdating.set(false);
    }
  }

  // Modal de Edición
  isAdjustModalOpen = signal(false);
  selectedGoodForAdjustment = signal<any>(null);

  // Section A: Price
  newPriceValue = signal<number>(0);
  isSavingPrice = signal(false);
  priceError = signal<string | null>(null);
  priceSaveSuccess = signal(false);

  // Section B: Stock Adjustment
  newStockValue = signal<number | null>(null);
  adjustmentReasonSelect = signal<string>('');
  adjustmentReasonDetails = signal<string>('');
  isSaving = signal(false);
  adjustmentError = signal<string | null>(null);

  // Mapeo inicial
  finishedGoodsData = computed(() => {
    return this.inventory.finishedGoods().map(good => ({
      ...good,
      productName: this.inventory.products().find(p => p.id === good.productDefinitionId)?.name || 'Desconocido'
    }));
  });

  // Filtrado condicional
  filteredFinishedGoodsData = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const data = this.finishedGoodsData();

    if (!term) return data;

    return data.filter(g =>
      g.productName.toLowerCase().includes(term) ||
      g.colorName.toLowerCase().includes(term)
    );
  });

  columns: ColumnDef[] = [
    { key: 'productName', label: 'Producto', sortable: true, align: 'left' },
    { key: 'colorName', label: 'Color', sortable: true, align: 'left' },
    { key: 'unit_price', label: 'Precio Unitario', sortable: true, align: 'right' },
    { key: 'quantityUnits', label: 'Stock (Unidades)', sortable: true, align: 'right' },
    { key: 'actions', label: 'Acciones', sortable: false, align: 'center' }
  ];

  openAdjustModal(item: any) {
    this.selectedGoodForAdjustment.set(item);

    // Section A: default to current price
    this.newPriceValue.set(item.unit_price ?? 0);
    this.priceError.set(null);
    this.priceSaveSuccess.set(false);

    // Section B: default to current stock
    this.newStockValue.set(item.quantityUnits);
    this.adjustmentReasonSelect.set('');
    this.adjustmentReasonDetails.set('');
    this.adjustmentError.set(null);

    this.isAdjustModalOpen.set(true);
  }

  closeAdjustModal() {
    this.isAdjustModalOpen.set(false);
    this.selectedGoodForAdjustment.set(null);
  }

  async savePrice() {
    const price = this.newPriceValue();
    if (price < 0) {
      this.priceError.set('El precio no puede ser negativo.');
      return;
    }

    const good = this.selectedGoodForAdjustment();
    this.isSavingPrice.set(true);
    this.priceError.set(null);
    this.priceSaveSuccess.set(false);

    try {
      const result = await this.inventory.actualizarPrecioProducto(good.id, price);
      if (result.success) {
        this.priceSaveSuccess.set(true);
        // Also refresh the selected item reference so re-opening shows the new price
        const updated = this.inventory.finishedGoods().find(g => g.id === good.id);
        if (updated) {
          const withName = { ...updated, productName: good.productName };
          this.selectedGoodForAdjustment.set(withName);
        }
        setTimeout(() => this.priceSaveSuccess.set(false), 3000);
      } else {
        this.priceError.set(result.message);
      }
    } catch (err: any) {
      this.priceError.set(err.message || 'Error desconocido al actualizar el precio.');
    } finally {
      this.isSavingPrice.set(false);
    }
  }

  isAdjustFormValid(): boolean {
    const newStock = this.newStockValue();
    const reason = this.adjustmentReasonSelect();

    return newStock !== null &&
      newStock >= 0 &&
      Number.isInteger(newStock) &&
      reason !== '';
  }

  async saveAdjustment() {
    if (!this.isAdjustFormValid()) return;

    const good = this.selectedGoodForAdjustment();
    const currentStock = good.quantityUnits;
    const newStock = this.newStockValue()!;

    const baseReason = this.adjustmentReasonSelect();
    const details = this.adjustmentReasonDetails().trim();
    const fullReason = details ? `${baseReason} - ${details}` : baseReason;

    this.isSaving.set(true);
    this.adjustmentError.set(null);

    try {
      const result = await this.inventory.ajustarStockProductoTerminado(
        good.id,
        currentStock,
        newStock,
        fullReason
      );

      if (result.success) {
        this.closeAdjustModal();
      } else {
        this.adjustmentError.set(result.message);
      }
    } catch (err: any) {
      this.adjustmentError.set(err.message || 'Error desconocido al actualizar el stock.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
