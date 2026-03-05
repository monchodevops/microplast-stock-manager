import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../services/inventory.service';
import { ActivityHistoryModalComponent } from './activity-history-modal.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ActivityHistoryModalComponent],
  template: `
    <div class="space-y-6">

      <!-- Page Header -->
      <div>
        <p class="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">General</p>
        <h1 class="text-xl font-semibold text-slate-900">Panel de Control</h1>
      </div>

      <!-- Alerts Section -->
      @if (inventory.lowStockAlerts().length > 0) {
        <div class="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-red-800">Alerta de Stock Bajo</p>
            <ul class="mt-1.5 space-y-1">
              @for (alert of inventory.lowStockAlerts(); track alert.id) {
                <li class="text-sm text-red-700">
                  <span class="font-medium">{{ alert.colorName }}:</span>
                  Solo {{ alert.currentStockKg | number:'1.0-2' }}kg restantes
                  <span class="text-red-500">(límite: {{ alert.alertThresholdKg }}kg)</span>
                </li>
              }
            </ul>
          </div>
        </div>
      } @else {
        <div class="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <svg class="h-5 w-5 flex-shrink-0 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <span class="text-sm font-medium text-emerald-800">Niveles de stock saludables.</span>
        </div>
      }

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div class="rounded-xl border border-slate-200/60 bg-white p-5">
          <p class="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Total Materia Prima</p>
          <p class="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {{ inventory.totalRawMaterialStock() | number:'1.0-0' }}
            <span class="text-base font-normal text-slate-400">kg</span>
          </p>
        </div>
        <div class="rounded-xl border border-slate-200/60 bg-white p-5">
          <p class="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Unidades Terminadas</p>
          <p class="mt-2 text-3xl font-bold tracking-tight text-blue-600">
            {{ inventory.totalFinishedUnits() | number:'1.0-0' }}
            <span class="text-base font-normal text-slate-400">u</span>
          </p>
        </div>
        <div class="rounded-xl border border-slate-200/60 bg-white p-5">
          <p class="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Tipos de Productos</p>
          <p class="mt-2 text-3xl font-bold tracking-tight text-slate-900">{{ inventory.products().length }}</p>
        </div>
      </div>

      <!-- Recent Logs -->
      <div class="overflow-hidden rounded-xl border border-slate-200/60 bg-white">
        <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 class="text-sm font-semibold text-slate-800">Actividad Reciente</h3>
          <button
            (click)="openActivityModal()"
            class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
            </svg>
            Ver historial
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-100 table-fixed">
            <thead>
              <tr class="bg-slate-50/60">
                <th scope="col" class="w-32 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Fecha</th>
                <th scope="col" class="w-40 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Tipo</th>
                <th scope="col" class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Descripción</th>
                <th scope="col" class="w-24 px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Cambio</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              @for (log of inventory.logs().slice(0, 5); track log.id) {
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <td class="w-32 px-4 py-3.5 text-sm text-slate-500">
                    <div class="truncate">{{ log.createdAt | date:'short' }}</div>
                  </td>
                  <td class="w-40 px-4 py-3.5 text-sm">
                    <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
                          [class]="getTransactionTypeClasses(log.transactionType)">
                      {{ getTransactionTypeDisplay(log.transactionType) }}
                    </span>
                  </td>
                  <td class="px-4 py-3.5 text-sm text-slate-800">
                    <div class="break-words leading-tight">{{ log.description }}</div>
                  </td>
                  <td class="w-24 px-4 py-3.5 text-right text-sm font-medium"
                      [class]="getAmountChangeClasses(log)">
                    <div class="truncate">{{ formatAmountChange(log) }}</div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (inventory.logs().length === 0) {
          <div class="py-10 text-center text-sm text-slate-400">
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
        return 'border-emerald-200/60 bg-emerald-50 text-emerald-700';
      case 'PRODUCTION_RUN': 
        return 'border-blue-200/60 bg-blue-50 text-blue-700';
      case 'DISPATCH': 
        return 'border-red-200/60 bg-red-50 text-red-700';
      case 'AJUSTE_PRODUCTOS':
        return 'border-amber-200/60 bg-amber-50 text-amber-700';
      case 'PRECIO': 
        return 'border-violet-200/60 bg-violet-50 text-violet-700';
      default: 
        return 'border-slate-200/60 bg-slate-50 text-slate-600';
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