import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../services/inventory.service';

@Component({
  selector: 'app-production-report',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">

      <!-- Page Header -->
      <div class="flex items-start justify-between">
        <div>
          <p class="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400">General</p>
          <h1 class="text-xl font-semibold text-slate-900">Reporte Diario</h1>
          <p class="mt-0.5 text-xs text-slate-400">{{ currentDate | date:'dd/MM/yyyy HH:mm' }}</p>
        </div>
        <button (click)="printReport()" class="print:hidden inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimir y Registrar
        </button>
      </div>

      <!-- Table -->
      <div class="overflow-hidden rounded-xl border border-slate-200/60 bg-white">
        <table class="min-w-full divide-y divide-slate-100">
          <thead>
            <tr class="bg-slate-50/60">
              <th class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Producto</th>
              <th class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">Color</th>
              <th class="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Día</th>
              <th class="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-amber-500 bg-amber-50/40">Novedad / Reciente</th>
              <th class="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">Verificación</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            @for (item of reportData(); track item.productName + item.colorName) {
              <tr class="hover:bg-slate-50/50">
                <td class="px-4 py-3.5 text-sm font-medium text-slate-900">{{ item.productName }}</td>
                <td class="px-4 py-3.5 text-sm text-slate-500">{{ item.colorName }}</td>
                <td class="px-4 py-3.5 text-right text-sm font-bold text-slate-900">{{ item.totalDay }} <span class="font-normal text-slate-400">un.</span></td>
                <td class="px-4 py-3.5 text-right bg-amber-50/30">
                  @if (item.newSinceCutoff > 0) {
                    <span class="inline-flex items-center rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      + {{ item.newSinceCutoff }} un.
                    </span>
                  } @else {
                    <span class="text-slate-300">—</span>
                  }
                </td>
                <td class="px-4 py-3.5 text-center">
                  <div class="mx-auto h-5 w-5 rounded border border-slate-300"></div>
                </td>
              </tr>
            }
            @if (reportData().length === 0) {
              <tr>
                <td colspan="5" class="px-4 py-10 text-center text-sm italic text-slate-400">
                  No hay producción registrada para el día de hoy.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Signature Footer -->
      <div class="mt-8 grid grid-cols-2 gap-10 print:mt-20">
        <div class="border-t border-slate-300 pt-2 text-center text-xs text-slate-500">
          Firma Responsable Producción
        </div>
        <div class="border-t border-slate-300 pt-2 text-center text-xs text-slate-500">
          Firma Recibe Stock (Logística)
        </div>
      </div>

    </div>
  `
})
export class ProductionReportComponent implements OnInit {
  inventory = inject(InventoryService);
  currentDate = new Date();
  reportData = signal<any[]>([]);

  async ngOnInit() {
    await this.loadReport();
  }

  async loadReport() {
    const data = await this.inventory.getProductionReportStatistics();
    this.reportData.set(data);
  }

  async printReport() {
    // 1. Trigger Print Dialog
    window.print();

    // 2. Register Report Generation
    try {
      await this.inventory.registerProductionReport();
    } catch (e) {
      alert('Error registrando el reporte. Verifique conexión.');
    }
  }
}
