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
      <h2 class="text-2xl font-bold text-gray-800">Registrar Producción</h2>

      <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200 max-w-2xl">
        <div class="space-y-4">
          <!-- Product Selector -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Producto</label>
            <select [(ngModel)]="selectedProductId" class="mt-1 block w-full rounded-md bg-white border-gray-600 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border">
              <option value="">Seleccionar Producto...</option>
              @for (product of inventory.products(); track product.id) {
                <option [value]="product.id">{{ product.name }} ({{ product.consumptionPerUnitKg }}kg/u)</option>
              }
            </select>
          </div>

          <!-- Color Selector -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Color (Materia Prima)</label>
            <select [(ngModel)]="selectedColorName" class="mt-1 block w-full rounded-md bg-white border-gray-600 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border">
              <option value="">Seleccionar Color...</option>
              @for (material of inventory.rawMaterials(); track material.id) {
                <option [value]="material.colorName">{{ material.colorName }} (Disp: {{ material.currentStockKg }}kg)</option>
              }
            </select>
          </div>

          <!-- Quantity Input -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Cantidad a Producir (Unidades)</label>
            <input type="number" [(ngModel)]="quantity" min="1" class="mt-1 block w-full rounded-md bg-white border-gray-600 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border">
          </div>
          
          <!-- Summary/Preview -->
          @if (selectedProductId() && quantity() > 0) {
            <div class="bg-gray-50 p-4 rounded text-sm text-gray-700 border border-gray-200">
              <p><strong>Resumen de Consumo:</strong></p>
              <div class="flex justify-between mt-1">
                <span>Consumo unitario:</span>
                <span>{{ getSelectedProductConsumption() }} kg</span>
              </div>
              <div class="flex justify-between mt-1 font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total Plástico Requerido:</span>
                <span>{{ (getSelectedProductConsumption() * quantity()) | number:'1.0-2' }} kg</span>
              </div>
            </div>
          }

          <!-- Actions -->
          <div class="pt-4">
            <button (click)="submitProduction()" 
                    [disabled]="!isValid() || isLoading()"
                    class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
              @if (isLoading()) {
                Procesando...
              } @else {
                Registrar Producción
              }
            </button>
          </div>

          <!-- Feedback Messages -->
          @if (feedbackMessage()) {
            <div class="mt-4 p-4 rounded-md" [class.bg-red-50]="!lastSuccess()" [class.text-red-700]="!lastSuccess()" [class.bg-green-50]="lastSuccess()" [class.text-green-700]="lastSuccess()">
              {{ feedbackMessage() }}
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