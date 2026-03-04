import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataGridComponent } from '../shared/data-grid.component';
import { DispatchService, DispatchOrder, DispatchOrderItemDetail, DispatchFilters } from '../../services/dispatch.service';

@Component({
  selector: 'app-dispatch-history',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, DataGridComponent],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Historial de Remitos</h1>
        <p class="text-gray-600">Consulta y gestiona el historial de órdenes de despacho</p>
      </div>

      <!-- Filter Toolbar -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Search Bar -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <input
              type="text"
              [(ngModel)]="searchTerm"
              placeholder="Buscar por Cliente o Nro de Remito..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <!-- Start Date -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="date"
              [(ngModel)]="startDateStr"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <!-- End Date -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="date"
              [(ngModel)]="endDateStr"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="mt-4 flex gap-3">
          <button
            (click)="applyFilters()"
            [disabled]="isLoading()"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            @if (isLoading()) {
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            }
            Filtrar
          </button>

          <button
            (click)="clearFilters()"
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Limpiar
          </button>
        </div>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div class="flex justify-center items-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span class="ml-3 text-gray-600">Cargando órdenes...</span>
          </div>
        </div>
      } @else {
        <!-- Data Grid -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <app-data-grid
            [data]="ordersList()"
            [columns]="columns"
          >
            <ng-template #cellTemplate let-item let-col="col">
              @switch (col.key) {
                @case ('orderNumber') {
                  <span class="font-medium text-gray-900">{{ item.orderNumber }}</span>
                }
                @case ('createdAt') {
                  <div>
                    <div class="text-sm text-gray-900">{{ item.createdAt | date:'dd/MM/yyyy' }}</div>
                    <div class="text-xs text-gray-500">{{ item.createdAt | date:'HH:mm:ss' }}</div>
                  </div>
                }
                @case ('clientReason') {
                  <span class="text-gray-900">{{ item.clientReason }}</span>
                }
                @case ('totalAmount') {
                  <span class="font-medium text-gray-900">{{ item.totalAmount | currency:'USD':'symbol':'1.2-2' }}</span>
                }
                @case ('actions') {
                  <div class="flex gap-2">
                    <button
                      (click)="showOrderDetails(item)"
                      class="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded hover:bg-blue-50 cursor-pointer"
                      title="Ver Detalles"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      (click)="printOrder(item.id)"
                      class="text-gray-400 hover:text-green-600 transition-colors p-1 rounded hover:bg-green-50 cursor-pointer"
                      title="Imprimir"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                    </button>
                  </div>
                }
              }
            </ng-template>
          </app-data-grid>
        </div>
      }

      <!-- Order Details Modal -->
      @if (showDetailsModal()) {
        <div class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <!-- Backdrop -->
            <div
              (click)="closeDetailsModal()"
              class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            ></div>

            <!-- Modal -->
            <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
              <div>
                <!-- Modal Header -->
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <h3 class="text-lg font-medium text-gray-900">
                      Detalles del Remito {{ selectedOrder()?.orderNumber }}
                    </h3>
                    <p class="text-sm text-gray-500">
                      Cliente: {{ selectedOrder()?.clientReason }} | 
                      Entregó: {{ selectedOrder()?.deliveryPerson }} |
                      Fecha: {{ selectedOrder()?.createdAt | date:'dd/MM/yyyy HH:mm:ss' }}
                    </p>
                  </div>
                  <button
                    (click)="closeDetailsModal()"
                    class="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <span class="sr-only">Cerrar</span>
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <!-- Loading state for order details -->
                @if (isLoadingDetails()) {
                  <div class="py-8">
                    <div class="flex justify-center items-center">
                      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span class="ml-3 text-gray-600">Cargando detalles...</span>
                    </div>
                  </div>
                } @else if (orderDetails().length > 0) {
                  <!-- Order Items Table -->
                  <div class="overflow-hidden">
                    <table class="min-w-full divide-y divide-gray-200">
                      <thead class="bg-gray-50">
                        <tr>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Producto
                          </th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Color
                          </th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cantidad
                          </th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Precio Unit.
                          </th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody class="bg-white divide-y divide-gray-200">
                        @for (item of orderDetails(); track item.id) {
                          <tr>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {{ item.productName }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {{ item.colorName }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {{ item.quantity }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {{ item.historicalUnitPrice | currency:'USD':'symbol':'1.2-2' }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {{ item.subtotal | currency:'USD':'symbol':'1.2-2' }}
                            </td>
                          </tr>
                        }
                      </tbody>
                      <tfoot class="bg-gray-50">
                        <tr>
                          <td colspan="4" class="px-6 py-3 text-right text-sm font-medium text-gray-900">
                            Total:
                          </td>
                          <td class="px-6 py-3 text-sm font-bold text-gray-900">
                            {{ selectedOrder()?.totalAmount | currency:'USD':'symbol':'1.2-2' }}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                } @else {
                  <div class="text-center py-8">
                    <p class="text-gray-500">No se encontraron ítems para este remito.</p>
                  </div>
                }

                <!-- Modal Actions -->
                <div class="mt-6 flex justify-end gap-3">
                  <button
                    (click)="closeDetailsModal()"
                    class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Cerrar
                  </button>
                  @if (selectedOrder()) {
                    <button
                      (click)="printOrder(selectedOrder()!.id)"
                      class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Imprimir Remito
                    </button>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class DispatchHistoryComponent implements OnInit {
  private readonly dispatchService = inject(DispatchService);

  // State signals
  ordersList = signal<DispatchOrder[]>([]);
  isLoading = signal(false);
  showDetailsModal = signal(false);
  isLoadingDetails = signal(false);
  selectedOrder = signal<DispatchOrder | null>(null);
  orderDetails = signal<DispatchOrderItemDetail[]>([]);

  // Filter signals
  searchTerm = signal('');
  startDateStr = signal('');
  endDateStr = signal('');

  // Data grid configuration
  columns = [
    { key: 'orderNumber', label: 'Nro Remito', sortable: true },
    { key: 'createdAt', label: 'Fecha y Hora', sortable: true, sortValue: (item: any) => new Date(item.createdAt) },
    { key: 'clientReason', label: 'Cliente / Motivo', sortable: true },
    { key: 'totalAmount', label: 'Total', sortable: true },
    { key: 'actions', label: 'Acciones', sortable: false }
  ];

  ngOnInit() {
    this.initializeDefaultDates();
    this.loadOrders();
  }

  /**
   * Initialize default date range to current month
   */
  private initializeDefaultDates() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    this.startDateStr.set(this.formatDateForInput(firstDayOfMonth));
    this.endDateStr.set(this.formatDateForInput(now));
  }

  /**
   * Format date for HTML date input (yyyy-mm-dd)
   */
  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Parse date string from input to Date object (local time, not UTC)
   */
  private parseDateFromInput(dateStr: string): Date | undefined {
    if (!dateStr) return undefined;
    return new Date(dateStr + 'T00:00:00');
  }

  /**
   * Apply current filters and reload orders
   */
  async applyFilters() {
    await this.loadOrders();
  }

  /**
   * Clear all filters and reload with defaults
   */
  async clearFilters() {
    this.searchTerm.set('');
    this.initializeDefaultDates();
    await this.loadOrders();
  }

  /**
   * Load orders based on current filter state
   */
  private async loadOrders() {
    this.isLoading.set(true);
    try {
      const filters: DispatchFilters = {
        startDate: this.parseDateFromInput(this.startDateStr()),
        endDate: this.parseDateFromInput(this.endDateStr()),
        searchTerm: this.searchTerm().trim() || undefined
      };

      console.log('Loading orders with filters:', filters);
      const orders = await this.dispatchService.getDispatchOrdersList(filters);
      console.log('Received orders:', orders);
      this.ordersList.set(orders);
      console.log('Orders list signal updated:', this.ordersList());
    } catch (error) {
      console.error('Error loading dispatch orders:', error);
      this.ordersList.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Show order details modal
   */
  async showOrderDetails(order: DispatchOrder) {
    this.selectedOrder.set(order);
    this.showDetailsModal.set(true);
    this.isLoadingDetails.set(true);
    this.orderDetails.set([]);

    try {
      const fullOrder = await this.dispatchService.getFullOrderDetails(order.id);
      if (fullOrder) {
        this.orderDetails.set(fullOrder.items);
      }
    } catch (error) {
      console.error('Error loading order details:', error);
    } finally {
      this.isLoadingDetails.set(false);
    }
  }

  /**
   * Close order details modal
   */
  closeDetailsModal() {
    this.showDetailsModal.set(false);
    this.selectedOrder.set(null);
    this.orderDetails.set([]);
  }

  /**
   * Open print view in new tab
   */
  printOrder(orderId: string) {
    window.open(`/remito/imprimir/${orderId}`, '_blank');
  }
}