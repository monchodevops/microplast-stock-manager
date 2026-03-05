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
    <div class="space-y-6">

      <!-- Page Header -->
      <div>
        <p class="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Despacho</p>
        <h1 class="text-xl font-semibold text-slate-900">Historial de Remitos</h1>
      </div>

      <!-- Filter Toolbar -->
      <div class="rounded-xl border border-slate-200/60 bg-white p-5">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div class="sm:col-span-2">
            <label class="mb-1 block text-xs font-medium text-slate-600">Buscar</label>
            <input type="text" [(ngModel)]="searchTerm" placeholder="Cliente o Nro de Remito…"
              class="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors" />
          </div>
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
        </div>
        <div class="mt-3 flex gap-2">
          <button (click)="applyFilters()" [disabled]="isLoading()"
            class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            @if (isLoading()) {
              <span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            }
            Filtrar
          </button>
          <button (click)="clearFilters()"
            class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            Limpiar
          </button>
        </div>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="flex items-center justify-center gap-3 rounded-xl border border-slate-200/60 bg-white py-12 text-slate-500">
          <span class="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500"></span>
          <span class="text-sm">Cargando órdenes…</span>
        </div>
      } @else {
        <app-data-grid [data]="ordersList()" [columns]="columns">
          <ng-template #cellTemplate let-item let-col="col">
            @switch (col.key) {
              @case ('orderNumber') {
                <span class="font-medium text-slate-900">{{ item.orderNumber }}</span>
              }
              @case ('createdAt') {
                <div>
                  <div class="text-sm text-slate-800">{{ item.createdAt | date:'dd/MM/yyyy' }}</div>
                  <div class="text-xs text-slate-400">{{ item.createdAt | date:'HH:mm:ss' }}</div>
                </div>
              }
              @case ('clientReason') {
                <span class="text-slate-800">{{ item.clientReason }}</span>
              }
              @case ('totalAmount') {
                <span class="font-medium text-slate-900">{{ item.totalAmount | currency:'USD':'symbol':'1.2-2' }}</span>
              }
              @case ('actions') {
                <div class="flex items-center gap-1">
                  <button (click)="showOrderDetails(item)" title="Ver Detalles"
                    class="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button (click)="printOrder(item.id)" title="Imprimir"
                    class="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors cursor-pointer">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                  </button>
                </div>
              }
            }
          </ng-template>
        </app-data-grid>
      }

      <!-- Order Details Modal -->
      @if (showDetailsModal()) {
        <div class="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-16 backdrop-blur-sm" (click)="closeDetailsModal()">
          <div class="w-full max-w-4xl rounded-2xl border border-slate-200/50 bg-white shadow-xl" (click)="$event.stopPropagation()">

            <!-- Modal Header -->
            <div class="flex items-start justify-between border-b border-slate-100 p-6">
              <div>
                <h3 class="text-base font-semibold text-slate-900">Remito {{ selectedOrder()?.orderNumber }}</h3>
                <p class="mt-0.5 text-xs text-slate-500">
                  {{ selectedOrder()?.clientReason }} · Entregó: {{ selectedOrder()?.deliveryPerson }} ·
                  {{ selectedOrder()?.createdAt | date:'dd/MM/yyyy HH:mm' }}
                </p>
              </div>
              <button (click)="closeDetailsModal()"
                class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Content -->
            <div class="p-6">
              @if (isLoadingDetails()) {
                <div class="flex items-center justify-center gap-3 py-8 text-slate-500">
                  <span class="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500"></span>
                  <span class="text-sm">Cargando detalles…</span>
                </div>
              } @else if (orderDetails().length > 0) {
                <div class="overflow-hidden rounded-xl border border-slate-200/60">
                  <table class="min-w-full divide-y divide-slate-100">
                    <thead>
                      <tr class="bg-slate-50/60">
                        <th class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Producto</th>
                        <th class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Color</th>
                        <th class="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Cantidad</th>
                        <th class="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Precio Unit.</th>
                        <th class="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      @for (item of orderDetails(); track item.id) {
                        <tr class="hover:bg-slate-50/50">
                          <td class="px-4 py-3.5 text-sm text-slate-800">{{ item.productName }}</td>
                          <td class="px-4 py-3.5 text-sm text-slate-600">{{ item.colorName }}</td>
                          <td class="px-4 py-3.5 text-right text-sm text-slate-800">{{ item.quantity }}</td>
                          <td class="px-4 py-3.5 text-right text-sm text-slate-600">{{ item.historicalUnitPrice | currency:'USD':'symbol':'1.2-2' }}</td>
                          <td class="px-4 py-3.5 text-right text-sm font-medium text-slate-900">{{ item.subtotal | currency:'USD':'symbol':'1.2-2' }}</td>
                        </tr>
                      }
                    </tbody>
                    <tfoot class="border-t border-slate-200">
                      <tr class="bg-slate-50/60">
                        <td colspan="4" class="px-4 py-3 text-right text-sm font-medium text-slate-700">Total:</td>
                        <td class="px-4 py-3 text-right text-sm font-bold text-slate-900">
                          {{ selectedOrder()?.totalAmount | currency:'USD':'symbol':'1.2-2' }}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              } @else {
                <div class="py-8 text-center text-sm text-slate-400">No se encontraron ítems para este remito.</div>
              }
            </div>

            <!-- Footer -->
            <div class="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button (click)="closeDetailsModal()"
                class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                Cerrar
              </button>
              @if (selectedOrder()) {
                <button (click)="printOrder(selectedOrder()!.id)"
                  class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Imprimir Remito
                </button>
              }
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