import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../services/inventory.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
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
        <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 class="text-lg font-medium text-gray-900">Actividad Reciente</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cambio</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              @for (log of inventory.logs().slice(0, 5); track log.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ log.createdAt | date:'short' }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                          [class.bg-green-100]="log.transactionType === 'INCOMING_MATERIAL'"
                          [class.text-green-800]="log.transactionType === 'INCOMING_MATERIAL'"
                          [class.bg-blue-100]="log.transactionType === 'PRODUCTION_RUN'"
                          [class.text-blue-800]="log.transactionType === 'PRODUCTION_RUN'">
                      {{ log.transactionType === 'INCOMING_MATERIAL' ? 'Ingreso' : 'Producción' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ log.description }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium" 
                      [class.text-green-600]="log.amountChange > 0" 
                      [class.text-red-600]="log.amountChange < 0">
                    {{ log.amountChange > 0 ? '+' : '' }}{{ log.amountChange | number:'1.0-2' }}kg
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent {
  inventory = inject(InventoryService);
}