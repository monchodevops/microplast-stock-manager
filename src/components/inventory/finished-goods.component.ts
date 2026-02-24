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
                <ng-container *ngIf="col.key !== 'quantityUnits' && col.key !== 'actions'">
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
            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
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
                                Ajustar Stock de Producto
                            </h3>
                            <div class="mt-4 space-y-4">
                                <!-- Readonly Info -->
                                <div class="bg-gray-50 p-3 rounded-md border border-gray-200">
                                    <p class="text-sm text-gray-700"><strong>Producto:</strong> {{ selectedGoodForAdjustment()?.productName }}</p>
                                    <p class="text-sm text-gray-700"><strong>Color:</strong> {{ selectedGoodForAdjustment()?.colorName }}</p>
                                    <p class="text-sm text-gray-700 mt-2"><strong>Stock Actual:</strong> <span class="text-lg font-semibold">{{ selectedGoodForAdjustment()?.quantityUnits }}</span> unidades</p>
                                </div>

                                <!-- Inputs -->
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
                                
                                <!-- Alert for error -->
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
  `
})
export class FinishedGoodsComponent {
  inventory = inject(InventoryService);

  // Búsqueda
  searchTerm = signal('');

  // Modal de Edición
  isAdjustModalOpen = signal(false);
  selectedGoodForAdjustment = signal<any>(null);
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
    { key: 'quantityUnits', label: 'Stock (Unidades)', sortable: true, align: 'right' },
    { key: 'actions', label: 'Acciones', sortable: false, align: 'center' }
  ];

  openAdjustModal(item: any) {
    this.selectedGoodForAdjustment.set(item);
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
