import { Component, signal, computed, inject, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataGridComponent } from '../shared/data-grid.component';
import { InventoryService, LogFilter, PaginatedLogsResult, ProductionLog } from '../../services/inventory.service';

@Component({
  selector: 'app-activity-history-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DataGridComponent],
  template: `
    @if (isOpen) {
      <!-- Modal Backdrop -->
      <div class="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-16 backdrop-blur-sm" (click)="closeModal()">
        <div class="w-full max-w-5xl rounded-2xl border border-slate-200/50 bg-white shadow-xl" (click)="$event.stopPropagation()">

          <!-- Modal Header -->
          <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h3 class="text-base font-semibold text-slate-900">Historial de Actividad</h3>
              <p class="text-xs text-slate-400 mt-0.5">Registro completo de movimientos</p>
            </div>
            <button
              type="button"
              (click)="closeModal()"
              class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Filter Section -->
          <div class="border-b border-slate-100 px-6 py-4">
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-600">Desde</label>
                <input type="date" [(ngModel)]="startDateStr"
                  class="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors" />
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-600">Hasta</label>
                <input type="date" [(ngModel)]="endDateStr"
                  class="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors" />
              </div>
              <div class="sm:col-span-2">
                <label class="mb-1 block text-xs font-medium text-slate-600">Tipos de Transacción</label>
                <div class="grid grid-cols-2 gap-1.5">
                  @for (type of availableTypes; track type.value) {
                    <label class="inline-flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" [value]="type.value" [checked]="selectedTypes.includes(type.value)"
                        (change)="onTypeChange(type.value, $event)"
                        class="rounded border-slate-300 text-blue-600 focus:ring-blue-500/30" />
                      <span class="text-xs text-slate-700">{{ getTransactionTypeDisplay(type.value) }}</span>
                    </label>
                  }
                </div>
              </div>
            </div>
            <div class="mt-3 flex gap-2">
              <button (click)="applyFilters()" [disabled]="isLoading()"
                class="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                @if (isLoading()) {
                  <span class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                }
                Filtrar
              </button>
              <button (click)="clearFilters()"
                class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                Limpiar
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="max-h-96 overflow-y-auto px-6 py-4">
            @if (isLoading()) {
              <div class="flex items-center justify-center py-10 gap-3 text-slate-500">
                <span class="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500"></span>
                <span class="text-sm">Cargando actividad...</span>
              </div>
            } @else {
              <app-data-grid [data]="logsResult()?.logs || []" [columns]="columns">
                <ng-template #cellTemplate let-log let-col="col">
                  @switch (col.key) {
                    @case ('createdAt') {
                      <div class="text-sm text-slate-500">
                        <div>{{ log.createdAt | date:'dd/MM/yyyy' }}</div>
                        <div class="text-xs text-slate-400">{{ log.createdAt | date:'HH:mm:ss' }}</div>
                      </div>
                    }
                    @case ('transactionType') {
                      <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
                            [class]="getTransactionTypeClasses(log.transactionType)">
                        {{ getTransactionTypeDisplay(log.transactionType) }}
                      </span>
                    }
                    @case ('description') {
                      <div class="text-sm text-slate-800 break-words leading-tight">{{ log.description }}</div>
                    }
                    @case ('amountChange') {
                      <div class="text-sm font-medium text-right truncate" [class]="getAmountChangeClasses(log)">
                        {{ formatAmountChange(log) }}
                      </div>
                    }
                  }
                </ng-template>
              </app-data-grid>
            }
          </div>

          <!-- Pagination -->
          @if (logsResult() && logsResult()!.totalCount > 0 && !isLoading()) {
            <div class="flex items-center justify-between border-t border-slate-100 px-6 py-3">
              <span class="text-xs text-slate-500">
                Mostrando {{ getStartRecord() }}–{{ getEndRecord() }} de {{ logsResult()!.totalCount }} registros
              </span>
              <div class="flex items-center gap-1">
                <button (click)="goToFirstPage()" [disabled]="!logsResult()!.hasPreviousPage"
                  class="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/></svg>
                </button>
                <button (click)="goToPreviousPage()" [disabled]="!logsResult()!.hasPreviousPage"
                  class="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <span class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
                  {{ logsResult()!.currentPage }} / {{ logsResult()!.totalPages }}
                </span>
                <button (click)="goToNextPage()" [disabled]="!logsResult()!.hasNextPage"
                  class="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </button>
                <button (click)="goToLastPage()" [disabled]="!logsResult()!.hasNextPage"
                  class="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
          }

          @if (logsResult() && logsResult()!.totalCount === 0 && !isLoading()) {
            <div class="border-t border-slate-100 py-10 text-center text-sm text-slate-400">
              No se encontraron registros con los filtros aplicados.
            </div>
          }

        </div>
      </div>
    }
  `
})
export class ActivityHistoryModalComponent implements OnChanges {
  @Input() isOpen: boolean = false;
  @Output() closeEvent = new EventEmitter<void>();

  private inventoryService = inject(InventoryService);

  // Signals
  readonly isLoading = signal<boolean>(false);
  readonly logsResult = signal<PaginatedLogsResult | null>(null);
  readonly currentPage = signal<number>(1);
  
  // Form fields
  startDateStr: string = '';
  endDateStr: string = '';
  selectedTypes: string[] = [];

  // Available transaction types
  readonly availableTypes = [
    { value: 'INCOMING_MATERIAL', label: 'Ingreso Materia Prima' },
    { value: 'PRODUCTION_RUN', label: 'Producción' },
    { value: 'DISPATCH', label: 'Salida Productos' },
    { value: 'AJUSTE_MATERIA_PRIMA', label: 'Ajuste Materia Prima' },
    { value: 'AJUSTE_PRODUCTOS', label: 'Ajuste Productos' },
    { value: 'PRECIO', label: 'Ajuste Precio' }
  ];

  // Grid columns
  readonly columns = [
    { key: 'createdAt', label: 'Fecha', sortable: true, width: 'w-32' },
    { key: 'transactionType', label: 'Tipo', sortable: false, width: 'w-40' },
    { key: 'description', label: 'Descripción', sortable: false, width: '' },
    { key: 'amountChange', label: 'Cambio', sortable: true, width: 'w-24' }
  ];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen && !changes['isOpen'].previousValue) {
      this.loadInitialData();
    }
  }

  async loadInitialData() {
    this.isLoading.set(true);
    try {
      const result = await this.inventoryService.getFilteredLogs({}, 1, 25);
      this.logsResult.set(result);
      this.currentPage.set(1);
    } catch (error) {
      console.error('Error loading initial activity data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async applyFilters() {
    this.isLoading.set(true);
    this.currentPage.set(1);
    
    try {
      const filters: LogFilter = {};
      
      if (this.startDateStr) {
        filters.dateFrom = new Date(this.startDateStr + 'T00:00:00');
      }
      
      if (this.endDateStr) {
        filters.dateTo = new Date(this.endDateStr + 'T00:00:00');
      }
      
      if (this.selectedTypes.length > 0) {
        filters.transactionTypes = this.selectedTypes;
      }

      const result = await this.inventoryService.getFilteredLogs(filters, 1, 25);
      this.logsResult.set(result);
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  clearFilters() {
    this.startDateStr = '';
    this.endDateStr = '';
    this.selectedTypes = [];
    this.loadInitialData();
  }

  onTypeChange(type: string, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.selectedTypes.push(type);
    } else {
      this.selectedTypes = this.selectedTypes.filter(t => t !== type);
    }
  }

  closeModal() {
    this.closeEvent.emit();
  }

  // Navigation methods
  async goToPreviousPage() {
    const result = this.logsResult();
    if (result && result.hasPreviousPage) {
      await this.loadPage(result.currentPage - 1);
    }
  }

  async goToNextPage() {
    const result = this.logsResult();
    if (result && result.hasNextPage) {
      await this.loadPage(result.currentPage + 1);
    }
  }

  async goToFirstPage() {
    await this.loadPage(1);
  }

  async goToLastPage() {
    const result = this.logsResult();
    if (result) {
      await this.loadPage(result.totalPages);
    }
  }

  private async loadPage(page: number) {
    this.isLoading.set(true);
    try {
      const filters: LogFilter = {};
      
      if (this.startDateStr) {
        filters.dateFrom = new Date(this.startDateStr);
      }
      
      if (this.endDateStr) {
        filters.dateTo = new Date(this.endDateStr);
      }
      
      if (this.selectedTypes.length > 0) {
        filters.transactionTypes = this.selectedTypes;
      }

      const result = await this.inventoryService.getFilteredLogs(filters, page, 25);
      this.logsResult.set(result);
      this.currentPage.set(page);
    } catch (error) {
      console.error('Error loading page:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Helper methods (reuse from dashboard)
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

  formatAmountChange(log: ProductionLog): string {
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

  getAmountChangeClasses(log: ProductionLog): string {
    // Only apply color classes for transactions that affect raw material stock
    const rawMaterialTransactions = ['INCOMING_MATERIAL', 'AJUSTE_MATERIA_PRIMA', 'PRODUCTION_RUN'];
    
    if (!rawMaterialTransactions.includes(log.transactionType)) {
      return 'text-gray-500';
    }
    
    const amount = log.amountChange;
    return amount > 0 ? 'text-green-600' : 'text-red-600';
  }

  // Pagination helpers
  getStartRecord(): number {
    const result = this.logsResult();
    if (!result || result.logs.length === 0) return 0;
    return (result.currentPage - 1) * 25 + 1;
  }

  getEndRecord(): number {
    const result = this.logsResult();
    if (!result || result.logs.length === 0) return 0;
    return (result.currentPage - 1) * 25 + result.logs.length;
  }
}