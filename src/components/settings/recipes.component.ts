import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService, ProductDefinition } from '../../services/inventory.service';

@Component({
  selector: 'app-recipes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 relative">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-gray-800">Recetas (Definiciones de Producto)</h2>
        <button (click)="isEditing = true; clearForm()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors">
          Nueva Receta
        </button>
      </div>

      <!-- Editor Form -->
      @if (isEditing) {
        <div class="bg-white p-6 rounded-lg shadow border border-blue-200 animate-fade-in">
          <h3 class="font-medium text-lg text-gray-900 mb-4">{{ editingId ? 'Editar' : 'Crear' }} Producto</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm text-gray-700 mb-1">Nombre</label>
              <input [(ngModel)]="formName" class="w-full p-2 border border-gray-600 rounded bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Ej. Tanque 500L">
            </div>
            <div>
              <label class="block text-sm text-gray-700 mb-1">Categoría</label>
              <input [(ngModel)]="formCategory" class="w-full p-2 border border-gray-600 rounded bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Ej. Tanques">
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm text-gray-700 mb-1">Consumo de Plástico (kg por unidad)</label>
              <input type="number" [(ngModel)]="formConsumption" class="w-full p-2 border border-gray-600 rounded bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="0.0">
            </div>
          </div>
          <div class="flex justify-end space-x-3">
            <button (click)="isEditing = false" class="text-gray-600 hover:bg-gray-100 px-4 py-2 rounded">Cancelar</button>
            <button (click)="saveProduct()" [disabled]="isSaving" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow-sm disabled:opacity-50">
              {{ isSaving ? 'Guardando...' : 'Guardar Receta' }}
            </button>
          </div>
        </div>
      }

      <!-- List -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        @for (product of inventory.products(); track product.id) {
          <div class="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-md transition-shadow relative group">
            <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
              <button (click)="editProduct(product)" class="text-blue-600 hover:text-blue-800 text-sm font-medium p-1 bg-white bg-opacity-80 rounded hover:bg-gray-100">Editar</button>
              <button (click)="askDelete(product)" class="text-red-600 hover:text-red-800 text-sm font-medium p-1 bg-white bg-opacity-80 rounded hover:bg-gray-100">Borrar</button>
            </div>
            <div class="flex items-center space-x-3 mb-4">
              <div class="bg-blue-100 p-2 rounded-lg text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-900">{{ product.name }}</h3>
                <span class="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600">{{ product.category }}</span>
              </div>
            </div>
            <div class="text-sm text-gray-600">
              <p>Consumo por unidad:</p>
              <p class="text-2xl font-bold text-gray-900">{{ product.consumptionPerUnitKg | number:'1.0-2' }} <span class="text-sm font-normal text-gray-500">kg</span></p>
            </div>
          </div>
        }
      </div>

      <!-- Delete Confirmation Modal -->
      @if (showDeleteConfirm) {
        <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center backdrop-blur-sm">
          <div class="relative bg-white rounded-lg shadow-xl p-8 max-w-sm w-full border border-gray-200 animate-fade-in text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 class="text-lg leading-6 font-medium text-gray-900 mb-2">Eliminar Producto</h3>
            <p class="text-sm text-gray-500 mb-4">
              ¿Está seguro de querer eliminar este producto?
            </p>
            <p class="font-bold text-gray-800 mb-6">{{ deleteTargetName }}</p>
            
            <div class="flex justify-center space-x-3">
              <button (click)="showDeleteConfirm = false" class="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded text-sm font-medium transition-colors">
                Cancelar
              </button>
              <button (click)="confirmDelete()" [disabled]="isDeleting" class="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded text-sm font-medium shadow-sm transition-colors disabled:opacity-50">
                {{ isDeleting ? 'Eliminando...' : 'Eliminar' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class RecipesComponent {
  inventory = inject(InventoryService);

  // Edit State
  isEditing = false;
  isSaving = false;
  editingId: string | null = null;
  formName = '';
  formCategory = '';
  formConsumption = 0;

  // Delete State
  showDeleteConfirm = false;
  isDeleting = false;
  deleteTargetId: string | null = null;
  deleteTargetName = '';

  clearForm() {
    this.editingId = null;
    this.formName = '';
    this.formCategory = '';
    this.formConsumption = 0;
  }

  editProduct(p: ProductDefinition) {
    this.editingId = p.id;
    this.formName = p.name;
    this.formCategory = p.category;
    this.formConsumption = p.consumptionPerUnitKg;
    this.isEditing = true;
  }

  async saveProduct() {
    if (!this.formName || this.formConsumption <= 0) return;

    this.isSaving = true;
    try {
      await this.inventory.updateProductDefinition({
        id: this.editingId || crypto.randomUUID(),
        name: this.formName,
        category: this.formCategory,
        consumptionPerUnitKg: this.formConsumption
      });
      this.isEditing = false;
    } finally {
      this.isSaving = false;
    }
  }

  askDelete(product: ProductDefinition) {
    this.deleteTargetId = product.id;
    this.deleteTargetName = product.name;
    this.showDeleteConfirm = true;
  }

  async confirmDelete() {
    if (!this.deleteTargetId) return;

    this.isDeleting = true;
    try {
      await this.inventory.deleteProduct(this.deleteTargetId);
      this.showDeleteConfirm = false;
      this.deleteTargetId = null;
    } finally {
      this.isDeleting = false;
    }
  }
}