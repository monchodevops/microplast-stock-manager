import { Component, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService, RawMaterial } from '../../services/inventory.service';
import { DataGridComponent, ColumnDef } from '../shared/data-grid.component';

@Component({
    selector: 'app-raw-materials',
    standalone: true,
    imports: [CommonModule, FormsModule, DataGridComponent, DecimalPipe],
    template: `
    <div class="space-y-8 relative">
      <section>
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-bold text-gray-800">Materia Prima (Polímeros)</h2>
          <div class="flex space-x-2">
            <button (click)="openGlobalConfig()" class="flex items-center space-x-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded text-sm transition-colors shadow-sm cursor-pointer">
              <span>⚙️</span>
              <span>Configurar Alertas Globales</span>
            </button>
            <button (click)="showAddMaterial = !showAddMaterial" class="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded text-sm transition-colors shadow-sm cursor-pointer">
              {{ showAddMaterial ? 'Cancelar' : 'Agregar Stock' }}
            </button>
          </div>
        </div>

        @if (showAddMaterial) {
          <div class="bg-gray-50 p-4 mb-4 rounded border border-gray-200 animate-fade-in shadow-inner">
            <h3 class="font-medium text-gray-900 mb-3">Ingresar Nueva Materia Prima</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="text" [(ngModel)]="newMaterialColor" placeholder="Color (ej. Azul)" class="p-2 border border-gray-600 rounded bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <input type="number" [(ngModel)]="newMaterialAmount" placeholder="Cantidad (kg)" class="p-2 border border-gray-600 rounded bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <button (click)="addMaterial()" [disabled]="isAdding" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow-sm disabled:opacity-50 font-medium cursor-pointer">
                {{ isAdding ? 'Guardando...' : 'Confirmar Ingreso' }}
              </button>
            </div>
          </div>
        }

        <app-data-grid [data]="inventory.rawMaterials()" [columns]="columns">
          <ng-template #cellTemplate let-item let-col="col">
            @switch (col.key) {
              @case ('currentStockKg') {
                <span class="text-gray-700">{{ item.currentStockKg | number:'1.0-2' }} kg</span>
              }
              @case ('alertThresholdKg') {
                <span class="text-gray-500">{{ item.alertThresholdKg | number:'1.0-0' }} kg</span>
              }
              @case ('status') {
                @if (item.currentStockKg <= item.alertThresholdKg) {
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 shadow-sm">
                    ⚠️ Bajo Stock
                  </span>
                } @else {
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 shadow-sm">
                    OK
                  </span>
                }
              }
              @case ('actions') {
                <button (click)="openEdit(item)" class="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50 cursor-pointer" title="Editar Stock y Alertas">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              }
              @default {
                <span class="text-gray-900 font-medium">{{ item[col.key] }}</span>
              }
            }
          </ng-template>
        </app-data-grid>
      </section>

      <!-- Global Alert Config Modal -->
      @if (showGlobalConfigModal) {
        <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center backdrop-blur-sm">
          <div class="relative bg-white rounded-lg shadow-xl p-8 max-w-md w-full border border-gray-200 animate-fade-in">
            <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Configuración Global de Alertas</h3>
            <p class="text-sm text-gray-500 mb-4">
              Establece el límite de kilos para activar la alerta de "Bajo Stock" en <strong>todas</strong> las materias primas.
            </p>
            <div class="mb-6">
              <label class="block text-sm font-bold text-gray-700 mb-2">Alerta Global (kg)</label>
              <input type="number" [(ngModel)]="globalFormThreshold" class="w-full p-2 border border-gray-600 rounded bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            </div>
            <div class="flex justify-end space-x-3">
              <button (click)="showGlobalConfigModal = false" class="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded text-sm font-medium transition-colors cursor-pointer">
                Cancelar
              </button>
              <button (click)="saveGlobalConfig()" [disabled]="isSavingGlobal" class="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium shadow-sm transition-colors disabled:opacity-50 cursor-pointer">
                {{ isSavingGlobal ? 'Aplicando...' : 'Aplicar a Todos' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Individual Edit Modal -->
      @if (showEditModal) {
        <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center backdrop-blur-sm">
          <div class="relative bg-white rounded-lg shadow-xl p-8 max-w-md w-full border border-gray-200 animate-fade-in">
            <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Editar Materia Prima</h3>
            <p class="text-sm text-gray-500 mb-6 font-semibold">{{ editingMaterialName }}</p>
            
            <div class="space-y-4 mb-6">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Stock Real (kg) <span class="text-xs font-normal text-gray-500">- Corrección Manual</span></label>
                <input type="number" [(ngModel)]="editFormStock" class="w-full p-2 border border-gray-600 rounded bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1">Alerta Mínima (kg)</label>
                <input type="number" [(ngModel)]="editFormThreshold" class="w-full p-2 border border-gray-600 rounded bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              </div>
            </div>

            <div class="flex justify-end space-x-3">
              <button (click)="showEditModal = false" class="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded text-sm font-medium transition-colors cursor-pointer">
                Cancelar
              </button>
              <button (click)="saveEdit()" [disabled]="isSavingEdit" class="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium shadow-sm transition-colors disabled:opacity-50 cursor-pointer">
                {{ isSavingEdit ? 'Guardando...' : 'Guardar Cambios' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class RawMaterialsComponent {
    inventory = inject(InventoryService);

    columns: ColumnDef[] = [
        { key: 'colorName', label: 'Color', sortable: true, align: 'left' },
        { key: 'currentStockKg', label: 'Stock Actual', sortable: true, align: 'right' },
        { key: 'alertThresholdKg', label: 'Alerta (Mín)', sortable: true, align: 'right' },
        { key: 'status', label: 'Estado', sortable: true, align: 'center', sortValue: (item: RawMaterial) => item.currentStockKg <= item.alertThresholdKg ? 1 : 2 },
        { key: 'actions', label: 'Acciones', align: 'center' }
    ];

    // State
    showAddMaterial = false;
    newMaterialColor = '';
    newMaterialAmount = 0;
    isAdding = false;

    // Global Config
    showGlobalConfigModal = false;
    globalFormThreshold = 100;
    isSavingGlobal = false;

    // Edit State
    showEditModal = false;
    editingMaterialId: string | null = null;
    editingMaterialName = '';
    editFormStock = 0;
    editFormThreshold = 0;
    isSavingEdit = false;

    async addMaterial() {
        if (this.newMaterialColor && this.newMaterialAmount > 0) {
            this.isAdding = true;
            await this.inventory.addRawMaterialStock(this.newMaterialColor, this.newMaterialAmount);
            this.newMaterialColor = '';
            this.newMaterialAmount = 0;
            this.showAddMaterial = false;
            this.isAdding = false;
        }
    }

    openGlobalConfig() {
        this.globalFormThreshold = 100;
        this.showGlobalConfigModal = true;
    }

    async saveGlobalConfig() {
        this.isSavingGlobal = true;
        try {
            await this.inventory.updateGlobalAlertThreshold(this.globalFormThreshold);
            this.showGlobalConfigModal = false;
        } catch (e) {
            alert('Error al actualizar alertas globales');
        } finally {
            this.isSavingGlobal = false;
        }
    }

    openEdit(material: RawMaterial) {
        this.editingMaterialId = material.id;
        this.editingMaterialName = material.colorName;
        this.editFormStock = material.currentStockKg;
        this.editFormThreshold = material.alertThresholdKg;
        this.showEditModal = true;
    }

    async saveEdit() {
        if (!this.editingMaterialId) return;

        this.isSavingEdit = true;
        try {
            await this.inventory.updateRawMaterial(
                this.editingMaterialId,
                this.editFormStock,
                this.editFormThreshold
            );
            this.showEditModal = false;
        } catch (e) {
            alert('Error al guardar cambios');
        } finally {
            this.isSavingEdit = false;
        }
    }
}
