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
    <!-- Modal Backdrop -->
    @if (isOpen) {
      <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" (click)="closeModal()">
        <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white" (click)="$event.stopPropagation()">
          
          <!-- Modal Header -->
          <div class="flex justify-between items-center pb-3 border-b border-gray-200">
            <h3 class="text-xl font-semibold text-gray-900 pl-2">Historial de Actividad Completo</h3>
            <button 
              type="button" 
              (click)="closeModal()"
              class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
              </svg>
            </button>
          </div>

          <!-- Filter Section -->
          <div class="pt-4 pb-4 border-b border-gray-200">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              <!-- Date From -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                <input
                  type="date"
                  [(ngModel)]="startDateStr"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <!-- Date To -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                <input
                  type="date"
                  [(ngModel)]="endDateStr"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <!-- Transaction Type Filter -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Tipos de Transacción</label>
                <div class="grid grid-cols-2 gap-2">
                  @for (type of availableTypes; track type.value) {
                    <label class="inline-flex items-center">
                      <input
                        type="checkbox"
                        [value]="type.value"
                        [checked]="selectedTypes.includes(type.value)"
                        (change)="onTypeChange(type.value, $event)"
                        class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span class="ml-2 text-sm"
                            [class]="getTransactionTypeClasses(type.value)">
                        {{ getTransactionTypeDisplay(type.value) }}
                      </span>
                    </label>
                  }
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="mt-4 flex gap-3">
              <button
                (click)="applyFilters()"
                [disabled]="isLoading()"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                @if (isLoading()) {
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                }
                Filtrar
              </button>

              <button
                (click)="clearFilters()"
                class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm"
              >
                Limpiar
              </button>
            </div>
          </div>

          <!-- Content Area -->
          <div class="pt-4 max-h-96 overflow-y-auto">
            @if (isLoading()) {
              <div class="flex justify-center items-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span class="ml-3 text-gray-600">Cargando actividad...</span>
              </div>
            } @else {
              <!-- Data Grid -->
              <app-data-grid
                [data]="logsResult()?.logs || []"
                [columns]="columns"
              >
                <ng-template #cellTemplate let-log let-col="col">
                  @switch (col.key) {
                    @case ('createdAt') {
                      <div class="text-sm text-gray-500 truncate">
                        <div>{{ log.createdAt | date:'dd/MM/yyyy' }}</div>
                        <div class="text-xs">{{ log.createdAt | date:'HH:mm:ss' }}</div>
                      </div>
                    }
                    @case ('transactionType') {
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                            [class]="getTransactionTypeClasses(log.transactionType)">
                        {{ getTransactionTypeDisplay(log.transactionType) }}
                      </span>
                    }
                    @case ('description') {
                      <div class="text-sm text-gray-900 break-words leading-tight">{{ log.description }}</div>
                    }
                    @case ('amountChange') {
                      <div class="text-sm font-medium text-right truncate"
                            [class]="getAmountChangeClasses(log)">
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
            <div class="pt-4 border-t border-gray-200">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <span class="text-sm text-gray-700">
                    Mostrando {{ getStartRecord() }}-{{ getEndRecord() }} de {{ logsResult()!.totalCount }} registros
                  </span>
                </div>
                
                <div class="flex items-center gap-2">
                  <button
                    (click)="goToFirstPage()"
                    [disabled]="!logsResult()!.hasPreviousPage"
                    title="Primera página"
                    class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
                    </svg>
                  </button>
                  
                  <button
                    (click)="goToPreviousPage()"
                    [disabled]="!logsResult()!.hasPreviousPage"
                    title="Página anterior"
                    class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                    </svg>
                  </button>
                  
                  <span class="px-3 py-2 text-sm text-gray-700 bg-gray-50 border border-gray-300 rounded">
                    {{ logsResult()!.currentPage }} / {{ logsResult()!.totalPages }}
                  </span>
                  
                  <button
                    (click)="goToNextPage()"
                    [disabled]="!logsResult()!.hasNextPage"
                    title="Página siguiente"
                    class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                  
                  <button
                    (click)="goToLastPage()"
                    [disabled]="!logsResult()!.hasNextPage"
                    title="Última página"
                    class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          }

          @if (logsResult() && logsResult()!.totalCount === 0 && !isLoading()) {
            <div class="text-center py-8">
              <p class="text-gray-500">No se encontraron registros que coincidan con los filtros.</p>
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
        filters.dateFrom = new Date(this.startDateStr);
      }
      
      if (this.endDateStr) {
        filters.dateTo = new Date(this.endDateStr);
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