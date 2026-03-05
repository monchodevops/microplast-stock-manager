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

      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <p class="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Producción</p>
          <h1 class="text-xl font-semibold text-slate-900">Recetas / Configuración</h1>
        </div>
        <button (click)="isEditing = true; clearForm()"
          class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
          Nueva Receta
        </button>
      </div>

      <!-- Success Message -->
      @if (showSuccessMessage()) {
        <div class="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <svg class="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <span class="flex-1 text-sm text-emerald-800">{{ successMessage() }}</span>
          <button (click)="showSuccessMessage.set(false)" class="text-emerald-400 hover:text-emerald-600 transition-colors">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      }

      <!-- Editor Form -->
      @if (isEditing) {
        <div class="rounded-xl border border-blue-200/60 bg-white p-6">
          <p class="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">{{ editingId ? 'Editar' : 'Crear' }} Producto</p>
          <div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-xs font-medium text-slate-600">Nombre</label>
              <input [(ngModel)]="formName" placeholder="Ej. Tanque 500L"
                class="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors" />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-slate-600">Categoría</label>
              <input [(ngModel)]="formCategory" placeholder="Ej. Tanques"
                class="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors" />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1 block text-xs font-medium text-slate-600">Consumo de Plástico (kg por unidad)</label>
              <input type="number" [(ngModel)]="formConsumption" placeholder="0.0"
                class="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors" />
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <button (click)="isEditing = false"
              class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
              Cancelar
            </button>
            <button (click)="saveProduct()" [disabled]="isSaving"
              class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
              @if (isSaving) {
                <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Guardando…
              } @else {
                Guardar Receta
              }
            </button>
          </div>
        </div>
      }

      <!-- Product Card Grid -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        @for (product of inventory.products(); track product.id) {
          <div class="group relative rounded-xl border border-slate-200/60 bg-white p-5 transition-shadow hover:shadow-sm">
            <!-- Hover Actions -->
            <div class="absolute right-4 top-4 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
              <button (click)="editProduct(product)"
                class="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors">
                Editar
              </button>
              <button (click)="askDelete(product)"
                class="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
                Borrar
              </button>
            </div>
            <!-- Card Content -->
            <div class="mb-4 flex items-center gap-3">
              <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-blue-200/60 bg-blue-50 text-blue-600">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div class="min-w-0">
                <h3 class="truncate text-sm font-semibold text-slate-900">{{ product.name }}</h3>
                <span class="inline-flex items-center rounded-full border border-slate-200/60 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {{ product.category }}
                </span>
              </div>
            </div>
            <div class="border-t border-slate-100 pt-3">
              <p class="text-[11px] font-medium uppercase tracking-wider text-slate-400">Consumo por unidad</p>
              <p class="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
                {{ product.consumptionPerUnitKg | number:'1.0-2' }}
                <span class="text-sm font-normal text-slate-400">kg</span>
              </p>
            </div>
          </div>
        }
      </div>

      <!-- Delete Confirmation Modal -->
      @if (showDeleteConfirm) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div class="w-full max-w-sm rounded-2xl border border-slate-200/50 bg-white p-6 shadow-xl text-center">
            <div class="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-red-200/60 bg-red-50">
              <svg class="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 class="mb-1 text-base font-semibold text-slate-900">Eliminar Producto</h3>
            <p class="mb-1 text-sm text-slate-500">¿Está seguro de querer eliminar este producto?</p>
            <p class="mb-5 text-sm font-semibold text-slate-800">{{ deleteTargetName }}</p>
            <div class="flex justify-center gap-2">
              <button (click)="showDeleteConfirm = false"
                class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button (click)="confirmDelete()" [disabled]="isDeleting"
                class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                @if (isDeleting) {
                  <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Eliminando…
                } @else {
                  Eliminar
                }
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
  
  // Success message
  showSuccessMessage = signal(false);
  successMessage = signal('');

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
    const isNewProduct = !this.editingId;
    const productId = this.editingId || crypto.randomUUID();
    
    try {
      // Guardar la receta
      await this.inventory.updateProductDefinition({
        id: productId,
        name: this.formName,
        category: this.formCategory,
        consumptionPerUnitKg: this.formConsumption
      });

      // Si es un producto nuevo, crear automáticamente productos terminados
      if (isNewProduct) {
        const result = await this.inventory.createFinishedGoodsForNewRecipe(productId);
        this.successMessage.set(result.message);
        this.showSuccessMessage.set(true);
        
        // Auto-ocultar mensaje después de 5 segundos
        setTimeout(() => {
          this.showSuccessMessage.set(false);
        }, 5000);
      }
      
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