import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DispatchService, FullDispatchOrder } from '../../services/dispatch.service';

@Component({
  selector: 'app-remito-print',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!--
      Full-viewport overlay: covers the sidebar entirely.
      On actual print (@media print) the sidebar is already hidden via "print:hidden".
    -->
    <div class="fixed inset-0 z-50 bg-white overflow-y-auto">

      <!-- ── Loading ─────────────────────────────────────────────────── -->
      @if (isLoading()) {
        <div class="flex flex-col items-center justify-center h-full gap-4 text-gray-500">
          <svg class="animate-spin h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
          <p class="text-sm font-medium">Cargando remito...</p>
        </div>
      }

      <!-- ── Error ────────────────────────────────────────────────────── -->
      @else if (loadError()) {
        <div class="flex flex-col items-center justify-center h-full gap-4 text-red-600">
          <svg class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-lg font-semibold">No se pudo cargar el remito</p>
          <p class="text-sm text-gray-500">{{ loadError() }}</p>
          <button (click)="goBack()"
            class="mt-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors">
            ← Volver
          </button>
        </div>
      }

      <!-- ── Remito Content ───────────────────────────────────────────── -->
      @else if (order()) {
        <div class="max-w-3xl mx-auto py-8 px-6">

          <!-- Action bar (hidden when printing) -->
          <div class="flex items-center justify-between mb-6 print:hidden">
            <button (click)="goBack()"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600
                     bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver
            </button>
            <button (click)="print()"
              class="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white
                     bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir
            </button>
          </div>

          <!-- ── REMITO DOCUMENT ────────────────────────────────────── -->
          <div class="border border-gray-300 rounded-lg overflow-hidden shadow-sm print:border-0 print:shadow-none">

            <!-- Header Band -->
            <div class="bg-slate-800 text-white px-8 py-5 flex items-start justify-between print:bg-slate-800">
              <div>
                <h1 class="text-2xl font-extrabold tracking-widest uppercase">Remito</h1>
                <p class="text-slate-300 text-sm mt-1 font-mono">{{ order()!.header.orderNumber }}</p>
              </div>
              <div class="text-right text-sm text-slate-300">
                <p class="font-semibold text-white text-base">ROTOSYS</p>
                <p>Planta Principal</p>
                <p class="mt-1">{{ order()!.header.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
              </div>
            </div>

            <!-- Client / Delivery info -->
            <div class="grid grid-cols-2 divide-x divide-gray-200 border-b border-gray-200">
              <div class="px-8 py-5">
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Cliente / Motivo</p>
                <p class="text-gray-900 font-semibold text-base">{{ order()!.header.clientReason }}</p>
              </div>
              <div class="px-8 py-5">
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Encargado de Entrega</p>
                <p class="text-gray-900 font-semibold text-base">{{ order()!.header.deliveryPerson }}</p>
              </div>
            </div>

            <!-- Items table -->
            <div class="overflow-x-auto">
              <table class="min-w-full">
                <thead>
                  <tr class="bg-gray-50 border-b border-gray-200">
                    <th class="px-8 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Color</th>
                    <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Cant.</th>
                    <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">P. Unit.</th>
                    <th class="px-8 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Subtotal</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  @for (item of order()!.items; track item.id; let i = $index) {
                    <tr class="hover:bg-gray-50 transition-colors">
                      <td class="px-8 py-3.5 text-sm text-gray-400 tabular-nums">{{ i + 1 }}</td>
                      <td class="px-4 py-3.5 text-sm font-medium text-gray-900">{{ item.productName }}</td>
                      <td class="px-4 py-3.5 text-sm text-gray-500">{{ item.colorName }}</td>
                      <td class="px-4 py-3.5 text-sm text-right tabular-nums text-gray-900">{{ item.quantity }}</td>
                      <td class="px-4 py-3.5 text-sm text-right tabular-nums text-gray-600">
                        {{ item.historicalUnitPrice | currency:'ARS':'symbol':'1.2-2' }}
                      </td>
                      <td class="px-8 py-3.5 text-sm text-right tabular-nums font-semibold text-gray-900">
                        {{ item.subtotal | currency:'ARS':'symbol':'1.2-2' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Totals Footer -->
            <div class="border-t border-gray-200 px-8 py-5 flex justify-end bg-gray-50">
              <div class="w-64">
                <div class="flex justify-between py-1 text-sm text-gray-600">
                  <span>Subtotal artículos</span>
                  <span class="tabular-nums">{{ order()!.header.totalAmount | currency:'ARS':'symbol':'1.2-2' }}</span>
                </div>
                <div class="flex justify-between py-2 border-t border-gray-300 mt-1 text-base font-bold text-gray-900">
                  <span>TOTAL</span>
                  <span class="tabular-nums text-lg">{{ order()!.header.totalAmount | currency:'ARS':'symbol':'1.2-2' }}</span>
                </div>
              </div>
            </div>

            <!-- Signature blocks -->
            <div class="border-t border-gray-200 px-8 py-8 grid grid-cols-3 gap-8">
              @for (label of ['Firma Emisor', 'Firma Receptor', 'Aclaración']; track label) {
                <div class="flex flex-col items-center gap-1">
                  <div class="w-full border-b border-gray-400 pb-1 mb-1 h-10"></div>
                  <p class="text-xs text-gray-500 text-center">{{ label }}</p>
                </div>
              }
            </div>

          </div>
          <!-- ── END REMITO DOCUMENT ─────────────────────────────────── -->

          <!-- Bottom action bar (hidden when printing) -->
          <div class="flex items-center justify-center mt-6 print:hidden">
            <button (click)="print()"
              class="inline-flex items-center gap-2 px-8 py-3 rounded-lg text-sm font-semibold text-white
                     bg-blue-600 hover:bg-blue-700 shadow transition-colors">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir Remito
            </button>
          </div>

        </div>
      }

    </div>
  `,
  styles: [`
    @media print {
      :host { display: block; }
    }
  `]
})
export class RemitoPrintComponent implements OnInit {
  private readonly route          = inject(ActivatedRoute);
  private readonly dispatchSvc    = inject(DispatchService);

  readonly isLoading  = signal(true);
  readonly loadError  = signal<string | null>(null);
  readonly order      = signal<FullDispatchOrder | null>(null);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.loadError.set('ID de remito no especificado en la URL.');
      this.isLoading.set(false);
      return;
    }

    try {
      const result = await this.dispatchSvc.getFullOrderDetails(id);

      if (!result) {
        this.loadError.set(`No se encontró el remito con ID ${id}.`);
      } else {
        this.order.set(result);
      }
    } catch (err: any) {
      this.loadError.set(err.message ?? 'Error desconocido al cargar el remito.');
    } finally {
      this.isLoading.set(false);
    }
  }

  print(): void {
    window.print();
  }

  goBack(): void {
    window.close();
    // If the tab wasn't opened via JS (window.close is blocked), navigate back
    history.back();
  }
}
