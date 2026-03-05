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
    <div class="space-y-6 relative">

      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <p class="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Inventario</p>
          <h1 class="text-xl font-semibold text-slate-900">Materia Prima</h1>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="openGlobalConfig()"
            class="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Alertas Globales
          </button>
          <button (click)="showAddMaterial = !showAddMaterial"
            class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors cursor-pointer">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="showAddMaterial ? 'M6 18L18 6M6 6l12 12' : 'M12 4v16m8-8H4'" />
            </svg>
            {{ showAddMaterial ? 'Cancelar' : 'Agregar Stock' }}
          </button>
        </div>
      </div>

      <!-- Add Material Form -->
      @if (showAddMaterial) {
        <div class="rounded-xl border border-slate-200/60 bg-white p-5">
          <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Ingresar Nueva Materia Prima</p>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <!-- Color Selection -->
            <div class="flex gap-2">
              @if (!isNewColorMode) {
                <select [(ngModel)]="newMaterialColor"
                  class="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors">
                  <option value="" disabled>Seleccionar color</option>
                  @for (color of availableColors(); track color) {
                    <option [value]="color">{{ color }}</option>
                  }
                </select>
                <button (click)="toggleNewColorMode()" title="Nuevo color"
                  class="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
                </button>
              } @else {
                <input type="text" [(ngModel)]="newMaterialColor" (input)="onColorInput($event)" placeholder="Nombre del nuevo color"
                  class="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors" />
                <button (click)="toggleNewColorMode()" title="Cancelar"
                  class="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-400 hover:bg-slate-50 transition-colors cursor-pointer">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              }
            </div>

            @if (availableColors().length === 0 && !isNewColorMode) {
              <div class="col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                No hay colores registrados. Presione "+" para crear el primero.
              </div>
            } @else {
              <input type="number" [(ngModel)]="newMaterialAmount" placeholder="Cantidad (kg)"
                class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors" />
              <button (click)="addMaterial()" [disabled]="isAdding || !isFormValid()"
                class="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                @if (isAdding) {
                  <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Guardando…
                } @else {
                  Confirmar Ingreso
                }
              </button>
            }
          </div>
        </div>
      }

      <app-data-grid [data]="inventory.rawMaterials()" [columns]="columns" [rowClass]="getRowClass">
        <ng-template #cellTemplate let-item let-col="col">
          @switch (col.key) {
            @case ('currentStockKg') {
              <span class="font-medium text-slate-800">{{ item.currentStockKg | number:'1.0-2' }} <span class="text-slate-400 font-normal">kg</span></span>
            }
            @case ('alertThresholdKg') {
              <span class="text-slate-500">{{ item.alertThresholdKg | number:'1.0-0' }} kg</span>
            }
            @case ('status') {
              @if (item.currentStockKg === 0 && item.alertThresholdKg === 0) {
                <span class="inline-flex items-center gap-1 rounded-full border border-slate-200/60 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                  Dado de baja
                </span>
              } @else if (item.currentStockKg <= item.alertThresholdKg && item.alertThresholdKg > 0) {
                <span class="inline-flex items-center gap-1 rounded-full border border-red-200/60 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                  ⚠ Bajo Stock
                </span>
              } @else {
                <span class="inline-flex items-center gap-1 rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                  OK
                </span>
              }
            }
            @case ('actions') {
              <button (click)="openEdit(item)" title="Editar"
                class="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            }
            @default {
              <span class="font-medium text-slate-800">{{ item[col.key] }}</span>
            }
          }
        </ng-template>
      </app-data-grid>

      <!-- Global Alert Config Modal -->
      @if (showGlobalConfigModal) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div class="w-full max-w-md rounded-2xl border border-slate-200/50 bg-white p-6 shadow-xl">
            <h3 class="mb-1 text-base font-semibold text-slate-900">Configuración Global de Alertas</h3>
            <p class="mb-5 text-sm text-slate-500">
              Establece el límite de kilos para activar la alerta de "Bajo Stock" en <strong>todas</strong> las materias primas.
            </p>
            <div class="mb-5">
              <label class="mb-1 block text-xs font-medium text-slate-600">Alerta Global (kg)</label>
              <input type="number" [(ngModel)]="globalFormThreshold"
                class="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors" />
            </div>
            <div class="flex justify-end gap-2">
              <button (click)="showGlobalConfigModal = false"
                class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
                Cancelar
              </button>
              <button (click)="saveGlobalConfig()" [disabled]="isSavingGlobal"
                class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer">
                @if (isSavingGlobal) {
                  <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Aplicando…
                } @else {
                  Aplicar a Todos
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Individual Edit Modal -->
      @if (showEditModal) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div class="w-full max-w-md rounded-2xl border border-slate-200/50 bg-white p-6 shadow-xl">
            <h3 class="mb-1 text-base font-semibold text-slate-900">Editar Materia Prima</h3>
            <p class="mb-5 text-sm font-semibold text-slate-600">{{ editingMaterialName }}</p>
            <div class="mb-5 space-y-4">
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-600">
                  Stock Real (kg) <span class="text-slate-400 font-normal">— corrección manual</span>
                </label>
                <input type="number" [(ngModel)]="editFormStock"
                  class="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors" />
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-600">Alerta Mínima (kg)</label>
                <input type="number" [(ngModel)]="editFormThreshold"
                  class="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors" />
              </div>
            </div>
            <div class="flex justify-end gap-2">
              <button (click)="showEditModal = false"
                class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
                Cancelar
              </button>
              <button (click)="saveEdit()" [disabled]="isSavingEdit"
                class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer">
                @if (isSavingEdit) {
                  <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Guardando…
                } @else {
                  Guardar Cambios
                }
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
        { key: 'status', label: 'Estado', sortable: true, align: 'center', sortValue: (item: RawMaterial) => { if (item.currentStockKg === 0 && item.alertThresholdKg === 0) return 3; return (item.currentStockKg <= item.alertThresholdKg && item.alertThresholdKg > 0) ? 1 : 2; } },
        { key: 'actions', label: 'Acciones', align: 'center' }
    ];

    // State
    showAddMaterial = false;
    newMaterialColor = '';
    newMaterialAmount = 0;
    isAdding = false;
    isNewColorMode = false;

    // Computed for available colors
    availableColors = this.inventory.getAllAvailableColors;

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

    toggleNewColorMode() {
        this.isNewColorMode = !this.isNewColorMode;
        this.newMaterialColor = ''; // Reset color selection when toggling
    }

    onColorInput(event: any) {
        // Only allow alphanumeric characters and spaces
        const value = event.target.value;
        const sanitized = value.replace(/[^a-zA-Z0-9\s]/g, '');
        if (value !== sanitized) {
            event.target.value = sanitized;
            this.newMaterialColor = sanitized;
        }
    }

    isFormValid(): boolean {
        const hasValidColor = this.newMaterialColor.trim() !== '';
        const hasValidAmount = this.newMaterialAmount > 0;
        return hasValidColor && hasValidAmount;
    }

    async addMaterial() {
        if (this.isFormValid()) {
            this.isAdding = true;
            try {
                await this.inventory.addRawMaterialStock(this.newMaterialColor.trim(), this.newMaterialAmount);
                this.resetForm();
            } catch (error) {
                console.error('Error agregando material:', error);
                alert('Error al agregar material. Verifique la consola para más detalles.');
            } finally {
                this.isAdding = false;
            }
        }
    }

    private resetForm() {
        this.newMaterialColor = '';
        this.newMaterialAmount = 0;
        this.isNewColorMode = false;
        this.showAddMaterial = false;
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

    isDeactivated(item: RawMaterial): boolean {
        return item.currentStockKg === 0 && item.alertThresholdKg === 0;
    }

    getRowClass = (item: RawMaterial): string => {
        return this.isDeactivated(item) ? 'opacity-40 grayscale' : '';
    };

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
