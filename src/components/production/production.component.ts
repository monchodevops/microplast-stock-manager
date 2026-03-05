import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../services/inventory.service';

@Component({
  selector: 'app-production',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">

      <!-- Page Header -->
      <div>
        <p class="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Producción</p>
        <h1 class="text-xl font-semibold text-slate-900">Registrar Producción</h1>
      </div>

      <div class="max-w-2xl rounded-xl border border-slate-200/60 bg-white p-6">
        <div class="space-y-4">

          <!-- Product Selector -->
          <div>
            <label class="mb-1 block text-xs font-medium text-slate-600">Producto</label>
            <select [(ngModel)]="selectedProductId"
              class="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors">
              <option value="">Seleccionar producto…</option>
              @for (product of inventory.products(); track product.id) {
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
              @for (material of inventory.rawMaterials(); track material.id) {
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

          <!-- Summary Preview -->
          @if (selectedProductId() && quantity() > 0) {
            <div class="rounded-lg border border-slate-200/60 bg-slate-50/60 p-4 text-sm">
              <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Resumen de Consumo</p>
              <div class="flex justify-between text-slate-600">
                <span>Consumo unitario:</span>
                <span>{{ getSelectedProductConsumption() }} kg</span>
              </div>
              <div class="mt-2 flex justify-between border-t border-slate-200 pt-2 font-semibold text-slate-900">
                <span>Total Plástico Requerido:</span>
                <span>{{ (getSelectedProductConsumption() * quantity()) | number:'1.0-2' }} kg</span>
              </div>
            </div>
          }

          <!-- Submit Button -->
          <div class="pt-2">
            <button (click)="submitProduction()"
              [disabled]="!isValid() || isLoading()"
              class="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50">
              @if (isLoading()) {
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
              <svg class="mt-0.5 h-4 w-4 flex-shrink-0" [class.text-emerald-500]="lastSuccess()" [class.text-red-500]="!lastSuccess()" viewBox="0 0 20 20" fill="currentColor">
                @if (lastSuccess()) {
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                } @else {
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                }
              </svg>
              <span class="text-sm" [class.text-emerald-800]="lastSuccess()" [class.text-red-800]="!lastSuccess()">
                {{ feedbackMessage() }}
              </span>
            </div>
          }

        </div>
      </div>
    </div>
  `
})
export class ProductionComponent {
  inventory = inject(InventoryService);

  selectedProductId = signal<string>('');
  selectedColorName = signal<string>('');
  quantity = signal<number>(1);
  isLoading = signal<boolean>(false);
  
  feedbackMessage = signal<string>('');
  lastSuccess = signal<boolean>(false);

  getSelectedProductConsumption(): number {
    const p = this.inventory.products().find(p => p.id === this.selectedProductId());
    return p ? p.consumptionPerUnitKg : 0;
  }

  isValid(): boolean {
    return this.selectedProductId() !== '' && 
           this.selectedColorName() !== '' && 
           this.quantity() > 0;
  }

  async submitProduction() {
    this.feedbackMessage.set('');
    this.isLoading.set(true);
    
    try {
      const result = await this.inventory.runProduction(
        this.selectedProductId(), 
        this.selectedColorName(), 
        this.quantity()
      );

      this.lastSuccess.set(result.success);
      this.feedbackMessage.set(result.message);

      if (result.success) {
        // Reset form on success
        this.quantity.set(1);
        setTimeout(() => this.feedbackMessage.set(''), 3000);
      }
    } finally {
      this.isLoading.set(false);
    }
  }
}