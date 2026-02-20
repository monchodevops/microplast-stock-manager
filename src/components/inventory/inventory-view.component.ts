import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService, RawMaterial } from '../../services/inventory.service';

@Component({
  selector: 'app-inventory-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8 relative">
      
      <!-- Raw Materials Section -->
      <section>
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-2xl font-bold text-gray-800">Materia Prima (Polímeros)</h2>
          <div class="flex space-x-2">
            <button (click)="openGlobalConfig()" class="flex items-center space-x-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded text-sm transition-colors shadow-sm">
              <span>⚙️</span>
              <span>Configurar Alertas Globales</span>
            </button>
            <button (click)="showAddMaterial = !showAddMaterial" class="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded text-sm transition-colors shadow-sm">
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
              <button (click)="addMaterial()" [disabled]="isAdding" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow-sm disabled:opacity-50 font-medium">
                {{ isAdding ? 'Guardando...' : 'Confirmar Ingreso' }}
              </button>
            </div>
          </div>
        }

        <div class="bg-white shadow overflow-hidden border border-gray-200 rounded-lg">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th (click)="sortData('color')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group select-none">
                  <div class="flex items-center space-x-1">
                    <span>Color</span>
                    @if (sortColumn === 'color') {
                      <span>{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                    } @else {
                      <span class="opacity-0 group-hover:opacity-50 text-gray-400">↕</span>
                    }
                  </div>
                </th>
                <th (click)="sortData('stock')" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group select-none">
                   <div class="flex items-center justify-end space-x-1">
                    <span>Stock Actual</span>
                    @if (sortColumn === 'stock') {
                      <span>{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                    } @else {
                      <span class="opacity-0 group-hover:opacity-50 text-gray-400">↕</span>
                    }
                  </div>
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Alerta (Mín)</th>
                <th (click)="sortData('status')" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group select-none">
                  <div class="flex items-center justify-center space-x-1">
                    <span>Estado</span>
                    @if (sortColumn === 'status') {
                      <span>{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                    } @else {
                      <span class="opacity-0 group-hover:opacity-50 text-gray-400">↕</span>
                    }
                  </div>
                </th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              @for (item of sortedMaterials; track item.id) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ item.colorName }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{{ item.currentStockKg | number:'1.0-2' }} kg</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{{ item.alertThresholdKg | number:'1.0-0' }} kg</td>
                  <td class="px-6 py-4 whitespace-nowrap text-center">
                    @if (item.currentStockKg <= item.alertThresholdKg) {
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 shadow-sm">
                        ⚠️ Bajo Stock
                      </span>
                    } @else {
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 shadow-sm">
                        OK
                      </span>
                    }
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-center">
                    <button (click)="openEdit(item)" class="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50" title="Editar Stock y Alertas">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <!-- Finished Goods Section -->
      <section>
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Productos Terminados</h2>
        <div class="bg-white shadow overflow-hidden border border-gray-200 rounded-lg">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock (Unidades)</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              @for (good of inventory.finishedGoods(); track good.id) {
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ getProductName(good.productDefinitionId) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ good.colorName }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-bold">{{ good.quantityUnits }}</td>
                </tr>
              }
              @if (inventory.finishedGoods().length === 0) {
                <tr>
                  <td colspan="3" class="px-6 py-4 text-center text-gray-500 text-sm italic">No hay productos terminados en stock.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
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
              <button (click)="showGlobalConfigModal = false" class="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded text-sm font-medium transition-colors">
                Cancelar
              </button>
              <button (click)="saveGlobalConfig()" [disabled]="isSavingGlobal" class="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium shadow-sm transition-colors disabled:opacity-50">
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
              <button (click)="showEditModal = false" class="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded text-sm font-medium transition-colors">
                Cancelar
              </button>
              <button (click)="saveEdit()" [disabled]="isSavingEdit" class="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium shadow-sm transition-colors disabled:opacity-50">
                {{ isSavingEdit ? 'Guardando...' : 'Guardar Cambios' }}
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class InventoryViewComponent {
  inventory = inject(InventoryService);

  // Create State
  showAddMaterial = false;
  newMaterialColor = '';
  newMaterialAmount = 0;
  isAdding = false;

  // Global Config State
  showGlobalConfigModal = false;
  globalFormThreshold = 100;
  isSavingGlobal = false;

  // Individual Edit State
  showEditModal = false;
  editingMaterialId: string | null = null;
  editingMaterialName = '';
  editFormStock = 0;
  editFormThreshold = 0;
  isSavingEdit = false;

  getProductName(id: string): string {
    return this.inventory.products().find(p => p.id === id)?.name || 'Desconocido';
  }

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

  // --- Global Config Logic ---
  openGlobalConfig() {
    this.globalFormThreshold = 100; // Default or maybe average?
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

  // --- Individual Edit Logic ---
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

  // --- Sorting Logic ---
  sortColumn: 'color' | 'stock' | 'status' | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';

  sortData(column: 'color' | 'stock' | 'status') {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  get sortedMaterials() {
    const items = [...this.inventory.rawMaterials()];
    if (!this.sortColumn) return items;

    return items.sort((a, b) => {
      let valA: any, valB: any;

      switch (this.sortColumn) {
        case 'color':
          valA = a.colorName.toLowerCase();
          valB = b.colorName.toLowerCase();
          break;
        case 'stock':
          valA = a.currentStockKg;
          valB = b.currentStockKg;
          break;
        case 'status':
          // Status Priority: Low Stock (1) < OK (2)
          const statusA = a.currentStockKg <= a.alertThresholdKg ? 1 : 2;
          const statusB = b.currentStockKg <= b.alertThresholdKg ? 1 : 2;
          valA = statusA;
          valB = statusB;
          break;
      }

      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }
}