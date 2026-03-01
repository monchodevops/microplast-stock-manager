import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../services/inventory.service';
import { ActivityHistoryModalComponent } from './activity-history-modal.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ActivityHistoryModalComponent],
  template: `
    <div class="space-y-6 animate-fade-in">
      <h2 class="text-2xl font-bold text-gray-800">Panel de Control</h2>

      <!-- Alerts Section -->
      @if (inventory.lowStockAlerts().length > 0) {
        <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm">
          <div class="flex items-center mb-2">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-lg leading-6 font-medium text-red-800">Alerta de Stock Bajo</h3>
            </div>
          </div>
          <ul class="list-disc list-inside text-red-700 ml-5 space-y-1">
            @for (alert of inventory.lowStockAlerts(); track alert.id) {
              <li>
                <span class="font-bold">{{ alert.colorName }}:</span> 
                Solo {{ alert.currentStockKg | number:'1.0-2' }}kg restantes 
                (Límite: {{ alert.alertThresholdKg }}kg)
              </li>
            }
          </ul>
        </div>
      } @else {
        <div class="bg-green-50 border-l-4 border-green-500 p-4 rounded shadow-sm flex items-center">
          <svg class="h-5 w-5 text-green-500 mr-3" viewBox="0 0 20 20" fill="currentColor">
             <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <span class="text-green-800 font-medium">Niveles de stock saludables.</span>
        </div>
      }

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-lg shadow border border-gray-100">
          <p class="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Materia Prima</p>
          <p class="mt-2 text-3xl font-bold text-gray-900">{{ inventory.totalRawMaterialStock() | number:'1.0-0' }} <span class="text-sm text-gray-500 font-normal">kg</span></p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow border border-gray-100">
          <p class="text-sm font-medium text-gray-500 uppercase tracking-wider">Unidades Terminadas</p>
          <p class="mt-2 text-3xl font-bold text-blue-600">{{ inventory.totalFinishedUnits() | number:'1.0-0' }} <span class="text-sm text-gray-500 font-normal">u</span></p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow border border-gray-100">
          <p class="text-sm font-medium text-gray-500 uppercase tracking-wider">Tipos de Productos</p>
          <p class="mt-2 text-3xl font-bold text-gray-900">{{ inventory.products().length }}</p>
        </div>
      </div>

      <!-- Recent Logs -->
      <div class="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 class="text-lg font-medium text-gray-900">Actividad Reciente</h3>
          <button
            (click)="openActivityModal()"
            class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <span>Ver más</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
            </svg>
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 table-fixed">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="w-32 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th scope="col" class="w-40 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                <th scope="col" class="w-24 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cambio</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              @for (log of inventory.logs().slice(0, 5); track log.id) {
                <tr class="hover:bg-gray-50">
                  <td class="w-32 px-6 py-4 text-sm text-gray-500">
                    <div class="truncate">{{ log.createdAt | date:'short' }}</div>
                  </td>
                  <td class="w-40 px-6 py-4 text-sm">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                          [class]="getTransactionTypeClasses(log.transactionType)">
                      {{ getTransactionTypeDisplay(log.transactionType) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-900">
                    <div class="break-words leading-tight">{{ log.description }}</div>
                  </td>
                  <td class="w-24 px-6 py-4 text-sm text-right font-medium" 
                      [class]="getAmountChangeClasses(log)">
                    <div class="truncate">{{ formatAmountChange(log) }}</div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (inventory.logs().length === 0) {
          <div class="text-center py-8 text-gray-500">
            No hay actividad registrada
          </div>
        }
      </div>

      <!-- Activity History Modal -->
      <app-activity-history-modal
        [isOpen]="isActivityModalOpen()"
        (closeEvent)="closeActivityModal()"
      ></app-activity-history-modal>
    </div>
  `
})
export class DashboardComponent {
  inventory = inject(InventoryService);
  isActivityModalOpen = signal<boolean>(false);

  constructor() {
    // Force refresh data on component initialization
    this.inventory.loadData();
  }

  /**
   * Opens the activity history modal
   */
  openActivityModal() {
    this.isActivityModalOpen.set(true);
  }

  /**
   * Closes the activity history modal
   */
  closeActivityModal() {
    this.isActivityModalOpen.set(false);
  }

  /**
   * Returns the display name for a transaction type
   */
  getTransactionTypeDisplay(type: string): string {
    switch (type) {
      case 'INCOMING_MATERIAL': return 'Ingreso Materia Prima';
      case 'PRODUCTION_RUN': return 'Producción';
      case 'DISPATCH': return 'Salida Productos';
      case 'AJUSTE_MATERIA_PRIMA': return 'Ajuste Materia Prima';
      case 'AJUSTE_PRODUCTOS': return 'Ajuste Productos';
      case 'PRECIO': return 'Ajuste Precio';
      default: return 'Otro';
    }
  }

  /**
   * Returns the CSS classes for transaction type badge
   */
  getTransactionTypeClasses(type: string): string {
    switch (type) {
      case 'INCOMING_MATERIAL': 
      case 'AJUSTE_MATERIA_PRIMA':
        return 'bg-green-100 text-green-800';
      case 'PRODUCTION_RUN': 
        return 'bg-blue-100 text-blue-800';
      case 'DISPATCH': 
        return 'bg-red-100 text-red-800';
      case 'AJUSTE_PRODUCTOS':
        return 'bg-yellow-100 text-yellow-800';
      case 'PRECIO': 
        return 'bg-purple-100 text-purple-800';
      default: 
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Formats the amount change display
   */
  formatAmountChange(log: any): string {
    // Only show amount changes for transactions that affect raw material stock
    const rawMaterialTransactions = ['INCOMING_MATERIAL', 'AJUSTE_MATERIA_PRIMA', 'PRODUCTION_RUN'];
    
    if (!rawMaterialTransactions.includes(log.transactionType)) {
      return '-';
    }
    
    // For raw material transactions, show kg amount
    const amount = log.amountChange;
    const prefix = amount > 0 ? '+' : '';
    const formattedAmount = Math.abs(amount).toFixed(2);
    return `${prefix}${formattedAmount}kg`;
  }

  /**
   * Returns CSS classes for amount change display
   */
  getAmountChangeClasses(log: any): string {
    // Only apply color classes for transactions that affect raw material stock
    const rawMaterialTransactions = ['INCOMING_MATERIAL', 'AJUSTE_MATERIA_PRIMA', 'PRODUCTION_RUN'];
    
    if (!rawMaterialTransactions.includes(log.transactionType)) {
      return 'text-gray-500';
    }
    
    const amount = log.amountChange;
    return amount > 0 ? 'text-green-600' : 'text-red-600';
  }
}