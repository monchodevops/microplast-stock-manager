
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
    <div class="space-y-8 relative">
      <section>
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-bold text-gray-800">Productos Terminados</h2>
          <!-- Toolbar: bulk button + search -->
          <div class="flex items-center gap-3">
            <button
              (click)="openBulkModal()"
              class="inline-flex items-center gap-2 px-4 py-2 border border-purple-300 rounded-md shadow-sm text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
              </svg>
              Actualización Masiva
            </button>
            <!-- Buscador -->
            <div class="relative w-72">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                </svg>
              </span>
              <input 
                type="text" 
                placeholder="Buscar producto o color..." 
                [ngModel]="searchTerm()"
                (ngModelChange)="searchTerm.set($event)"
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
              >
            </div>
          </div> <!-- end toolbar -->
        </div>
        
        <p class="text-sm text-gray-600 mb-4">
           Las filas atenuadas y con la advertencia en rojo indican que el producto no tiene stock disponible.
        </p>

        <app-data-grid [data]="filteredFinishedGoodsData()" [columns]="columns">
            <ng-template #cellTemplate let-item let-col="col">
                <!-- Template para celdas personalizadas -->
                
                <ng-container *ngIf="col.key === 'quantityUnits'">
                  <div class="flex items-center justify-end" [ngClass]="{'opacity-50': item.quantityUnits === 0}">
                    <span class="text-gray-900 font-medium" [ngClass]="{'text-red-600 font-bold': item.quantityUnits === 0}">
                       {{ item.quantityUnits }}
                    </span>
                    <span *ngIf="item.quantityUnits === 0" class="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Sin Stock
                    </span>
                  </div>
                </ng-container>

                <ng-container *ngIf="col.key === 'unit_price'">
                  <span class="text-gray-900 font-medium tabular-nums" [ngClass]="{'opacity-50': item.quantityUnits === 0}">
                    {{ (item.unit_price ?? 0) | currency:'ARS':'symbol-narrow':'1.0-0' }}
                  </span>
                </ng-container>

                <ng-container *ngIf="col.key === 'actions'">
                    <div class="flex justify-center">
                        <button (click)="openAdjustModal(item)" class="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded-full hover:bg-blue-50" title="Editar Stock">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                        </button>
                    </div>
                </ng-container>

                <!-- Default fallback if not handled above (for productName, colorName) via DataGrid handling-->
                <ng-container *ngIf="col.key !== 'quantityUnits' && col.key !== 'actions' && col.key !== 'unit_price'">
                  <span class="text-gray-900 font-medium" [ngClass]="{'opacity-50': item.quantityUnits === 0}">{{ item[col.key] }}</span>
                </ng-container>
            </ng-template>
        </app-data-grid>
      </section>
    </div>

    <!-- Modal de Ajuste de Stock -->
    <div *ngIf="isAdjustModalOpen()" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <!-- Modal Backdrop -->
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" (click)="closeAdjustModal()"></div>

            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <!-- Modal Panel -->
            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl w-full">
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div class="sm:flex sm:items-start">
                        <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                            <!-- Icon -->
                            <svg class="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                        <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                            <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                Gestión de Producto
                            </h3>
                            <div class="mt-4 space-y-4">
                                <!-- Readonly Info -->
                                <div class="bg-gray-50 p-3 rounded-md border border-gray-200">
                                    <p class="text-sm text-gray-700"><strong>Producto:</strong> {{ selectedGoodForAdjustment()?.productName }}</p>
                                    <p class="text-sm text-gray-700"><strong>Color:</strong> {{ selectedGoodForAdjustment()?.colorName }}</p>
                                    <p class="text-sm text-gray-700 mt-2"><strong>Stock actual: </strong><span class="text-base font-bold">{{ selectedGoodForAdjustment()?.quantityUnits }}</span> unidades</p>
                                </div>

                                <!-- ===================== -->
                                <!-- SECTION A: PRECIO     -->
                                <!-- ===================== -->
                                <div class="border border-blue-200 rounded-lg overflow-hidden">
                                    <div class="bg-blue-50 px-4 py-2 border-b border-blue-200">
                                        <h4 class="text-sm font-semibold text-blue-800 flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd" />
                                            </svg>
                                            Sección A — Actualizar Precio
                                        </h4>
                                    </div>
                                    <div class="px-4 py-3 space-y-3">
                                        <div>
                                            <label for="newPriceValue" class="block text-sm font-medium text-gray-700">Nuevo Precio ($)</label>
                                            <input type="number" id="newPriceValue" [ngModel]="newPriceValue()" (ngModelChange)="newPriceValue.set($event)" min="0" step="1" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                        </div>

                                        <!-- Price success banner -->
                                        <div *ngIf="priceSaveSuccess()" class="rounded-md bg-green-50 p-3">
                                            <div class="flex items-center gap-2">
                                                <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                                                </svg>
                                                <p class="text-sm font-medium text-green-800">Precio guardado correctamente.</p>
                                            </div>
                                        </div>

                                        <!-- Price error banner -->
                                        <div *ngIf="priceError()" class="rounded-md bg-red-50 p-3">
                                            <div class="flex items-center gap-2">
                                                <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                                                </svg>
                                                <p class="text-sm font-medium text-red-800">{{ priceError() }}</p>
                                            </div>
                                        </div>

                                        <button type="button" [disabled]="isSavingPrice() || newPriceValue() < 0" (click)="savePrice()" class="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                            <span *ngIf="!isSavingPrice()">Guardar Precio</span>
                                            <span *ngIf="isSavingPrice()">Guardando...</span>
                                        </button>
                                    </div>
                                </div>

                                <!-- ========================= -->
                                <!-- SECTION B: STOCK AJUSTE  -->
                                <!-- ========================= -->
                                <div class="border border-amber-200 rounded-lg overflow-hidden">
                                    <div class="bg-amber-50 px-4 py-2 border-b border-amber-200">
                                        <h4 class="text-sm font-semibold text-amber-800 flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z" />
                                            </svg>
                                            Sección B — Ajuste de Inventario
                                        </h4>
                                    </div>
                                    <div class="px-4 py-3 space-y-3">
                                        <div>
                                            <label for="newStockValue" class="block text-sm font-medium text-gray-700">Nuevo Stock (Unidades)</label>
                                            <input type="number" id="newStockValue" [ngModel]="newStockValue()" (ngModelChange)="newStockValue.set($event)" min="0" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                        </div>

                                        <div>
                                             <label for="adjustmentReasonSelect" class="block text-sm font-medium text-gray-700">Motivo principal del ajuste</label>
                                             <select id="adjustmentReasonSelect" [ngModel]="adjustmentReasonSelect()" (ngModelChange)="adjustmentReasonSelect.set($event)" class="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                                 <option value="" disabled selected>Seleccione un motivo...</option>
                                                 <option value="Conteo Físico">Conteo Físico</option>
                                                 <option value="Rotura/Merma">Rotura/Merma</option>
                                                 <option value="Salida Comercial/Muestra">Salida Comercial/Muestra</option>
                                                 <option value="Otro">Otro</option>
                                             </select>
                                        </div>

                                        <div>
                                            <label for="adjustmentReasonDetails" class="block text-sm font-medium text-gray-700">Detalles Adicionales (Opcional)</label>
                                            <input type="text" id="adjustmentReasonDetails" [ngModel]="adjustmentReasonDetails()" (ngModelChange)="adjustmentReasonDetails.set($event)" placeholder="Ej. Se encontraron 2 unidades extra en estante" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                        </div>
                                        
                                        <!-- Alert for stock error -->
                                        <div *ngIf="adjustmentError()" class="rounded-md bg-red-50 p-4 mt-2">
                                          <div class="flex">
                                            <div class="flex-shrink-0">
                                              <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                                              </svg>
                                            </div>
                                            <div class="ml-3">
                                              <h3 class="text-sm font-medium text-red-800">
                                                {{ adjustmentError() }}
                                              </h3>
                                            </div>
                                          </div>
                                        </div>

                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
                    <button type="button" [disabled]="!isAdjustFormValid() || isSaving()" (click)="saveAdjustment()" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        <span *ngIf="!isSaving()">Guardar Ajuste</span>
                        <span *ngIf="isSaving()">Guardando...</span>
                    </button>
                    <button type="button" (click)="closeAdjustModal()" [disabled]="isSaving()" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- ================================ -->
    <!-- MODAL: Actualización Masiva      -->
    <!-- ================================ -->
    <div *ngIf="isBulkModalOpen()" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="bulk-modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" (click)="closeBulkModal()"></div>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                <div class="bg-white px-6 pt-5 pb-4">
                    <!-- Header -->
                    <div class="flex items-center gap-3 mb-5">
                        <div class="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-purple-100">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900" id="bulk-modal-title">Actualización Masiva de Precios</h3>
                    </div>

                    <div class="space-y-4">

                        <!-- Scope selector — only shown when a search filter is active -->
                        <div *ngIf="searchTerm().trim()" class="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-2">
                            <p class="text-xs font-semibold text-purple-700 uppercase tracking-wide">¿A qué productos aplicar?</p>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="bulkScope" value="all" [ngModel]="bulkScope()" (ngModelChange)="bulkScope.set($event)" class="text-purple-600 focus:ring-purple-500">
                                <span class="text-sm text-gray-700">Todos los productos <span class="font-semibold">({{ finishedGoodsData().length }})</span></span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="bulkScope" value="filtered" [ngModel]="bulkScope()" (ngModelChange)="bulkScope.set($event)" class="text-purple-600 focus:ring-purple-500">
                                <span class="text-sm text-gray-700">Solo los filtrados: <strong>&quot;{{ searchTerm() }}&quot;</strong> <span class="font-semibold">({{ filteredFinishedGoodsData().length }})</span></span>
                            </label>
                        </div>

                        <!-- Scope summary when no filter is active -->
                        <div *ngIf="!searchTerm().trim()" class="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                            <p class="text-sm text-gray-600">Se aplicará a <span class="font-semibold text-gray-900">todos los {{ finishedGoodsData().length }} productos</span>.</p>
                        </div>

                        <!-- Type + Action -->
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de ajuste</label>
                                <select [ngModel]="bulkUpdateType()" (ngModelChange)="bulkUpdateType.set($event)" class="block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm">
                                    <option value="percentage">Porcentaje (%)</option>
                                    <option value="fixed">Monto Fijo ($)</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Acción</label>
                                <select [ngModel]="bulkAction()" (ngModelChange)="bulkAction.set($event)" class="block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm">
                                    <option value="increase">Aumentar (+)</option>
                                    <option value="decrease">Descontar (-)</option>
                                </select>
                            </div>
                        </div>

                        <!-- Value -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Valor
                                <span *ngIf="bulkUpdateType() === 'percentage'">(%)</span>
                                <span *ngIf="bulkUpdateType() === 'fixed'">($)</span>
                            </label>
                            <input type="number" [ngModel]="bulkValue()" (ngModelChange)="bulkValue.set(+$event)" min="0" step="1" placeholder="0" class="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm">
                        </div>

                        <!-- Live preview -->
                        <div class="bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-sm text-amber-800">
                            <span class="font-semibold">Vista previa:</span>
                            $1.000 &rarr;
                            <span class="font-bold">{{ bulkPreviewExample() | currency:'ARS':'symbol-narrow':'1.0-0' }}</span>
                        </div>

                        <!-- Success banner -->
                        <div *ngIf="bulkUpdateSuccess()" class="rounded-md bg-green-50 border border-green-200 p-3 flex items-center gap-2">
                            <svg class="h-5 w-5 text-green-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                            <p class="text-sm font-medium text-green-800">{{ bulkUpdateSuccess() }}</p>
                        </div>

                        <!-- Error banner -->
                        <div *ngIf="bulkUpdateError()" class="rounded-md bg-red-50 border border-red-200 p-3 flex items-center gap-2">
                            <svg class="h-5 w-5 text-red-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                            </svg>
                            <p class="text-sm font-medium text-red-800">{{ bulkUpdateError() }}</p>
                        </div>

                    </div>
                </div>

                <!-- Footer -->
                <div class="bg-gray-50 px-6 py-3 flex flex-row-reverse gap-3 border-t border-gray-200">
                    <button
                      type="button"
                      [disabled]="isBulkUpdating() || bulkValue() <= 0"
                      (click)="applyBulkUpdate()"
                      class="inline-flex items-center justify-center gap-2 rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg *ngIf="isBulkUpdating()" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        <span *ngIf="!isBulkUpdating()">Aplicar Actualización</span>
                        <span *ngIf="isBulkUpdating()">Aplicando...</span>
                    </button>
                    <button type="button" (click)="closeBulkModal()" [disabled]="isBulkUpdating()" class="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50">
                        Cancelar
                    </button>
                </div>
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
