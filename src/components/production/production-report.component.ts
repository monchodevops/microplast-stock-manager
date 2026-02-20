import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../services/inventory.service';

@Component({
  selector: 'app-production-report',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 bg-white min-h-screen">
      <!-- Header del Reporte -->
      <div class="flex justify-between items-start mb-8 border-b pb-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Reporte de Producción</h1>
          <p class="text-gray-500 mt-1">Fecha: {{ currentDate | date:'fullDate' }}</p>
        </div>
        <div class="text-right print:hidden">
          <button (click)="printReport()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-md transition-colors flex items-center gap-2">
            <span>🖨️</span> Imprimir y Registrar
          </button>

        </div>
      </div>

      <!-- Tabla de Producción -->
      <div class="overflow-hidden border rounded-lg">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Producto</th>
              <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Color</th>
              <th class="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total Día</th>
              <th class="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider bg-yellow-50">Novedad / Reciente</th>
              <th class="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Verificación</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            @for (item of reportData(); track item.productName + item.colorName) {
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ item.productName }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ item.colorName }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-bold">{{ item.totalDay }} un.</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right bg-yellow-50">
                  @if (item.newSinceCutoff > 0) {
                    <span class="text-green-600 font-bold bg-green-50 px-2 py-1 rounded border border-green-200 fa-fade">
                      + {{ item.newSinceCutoff }} un.
                    </span>
                  } @else {
                    <span class="text-gray-400">-</span>
                  }
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                  <div class="w-6 h-6 border border-gray-300 rounded mx-auto"></div>
                </td>
              </tr>
            }
            @if (reportData().length === 0) {
              <tr>
                <td colspan="5" class="px-6 py-8 text-center text-gray-500 italic">
                  No hay producción registrada para el día de hoy.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Footer para Firmas -->
      <div class="mt-12 grid grid-cols-2 gap-10 print:mt-20">
        <div class="border-t border-gray-400 pt-2 text-center text-sm text-gray-600">
          Firma Responsable Producción
        </div>
        <div class="border-t border-gray-400 pt-2 text-center text-sm text-gray-600">
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
