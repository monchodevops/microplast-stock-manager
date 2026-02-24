import { Component, Input, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ColumnDef {
    key: string;
    label: string;
    sortable?: boolean;
    align?: 'left' | 'center' | 'right';
    sortValue?: (item: any) => any;
}

@Component({
    selector: 'app-data-grid',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="bg-white shadow overflow-hidden border border-gray-200 rounded-lg">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            @for (col of columns; track col.key) {
               <th (click)="col.sortable ? handleSort(col.key) : null" 
                   [class.cursor-pointer]="col.sortable"
                   [class.hover:bg-gray-100]="col.sortable"
                   class="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider transition-colors group select-none">
                  <div class="flex items-center space-x-1"
                       [ngClass]="{'justify-start': col.align === 'left' || !col.align, 'justify-end': col.align === 'right', 'justify-center': col.align === 'center'}">
                    <span>{{ col.label }}</span>
                    @if (col.sortable) {
                      @if (sortColumn === col.key) {
                        <span>{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                      } @else {
                        <span class="opacity-0 group-hover:opacity-50 text-gray-400">↕</span>
                      }
                    }
                  </div>
               </th>
            }
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
            @for (item of sortedData; track item.id || $index) {
                <tr class="hover:bg-gray-50 transition-colors">
                    @for (col of columns; track col.key) {
                        <td class="px-6 py-4 whitespace-nowrap text-sm"
                            [ngClass]="{'text-left': col.align === 'left' || !col.align, 'text-right': col.align === 'right', 'text-center': col.align === 'center'}">
                            <ng-container *ngTemplateOutlet="cellTemplate || defaultCell; context: { $implicit: item, col: col }"></ng-container>
                        </td>
                    }
                </tr>
            }
            @if (sortedData.length === 0) {
              <tr>
                <td [attr.colspan]="columns.length" class="px-6 py-4 text-center text-gray-500 text-sm italic">
                  No hay datos disponibles.
                </td>
              </tr>
            }
        </tbody>
      </table>
    </div>

    <ng-template #defaultCell let-item let-col="col">
        <span class="text-gray-900 font-medium">{{ item[col.key] }}</span>
    </ng-template>
  `
})
export class DataGridComponent {
    @Input() data: any[] = [];
    @Input() columns: ColumnDef[] = [];

    @ContentChild('cellTemplate') cellTemplate?: TemplateRef<any>;

    sortColumn: string | null = null;
    sortDirection: 'asc' | 'desc' = 'asc';

    handleSort(key: string) {
        if (this.sortColumn === key) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = key;
            this.sortDirection = 'asc';
        }
    }

    get sortedData() {
        if (!this.sortColumn || !this.data) return this.data;

        const colDef = this.columns.find(c => c.key === this.sortColumn);

        return [...this.data].sort((a, b) => {
            let valA = colDef?.sortValue ? colDef.sortValue(a) : a[this.sortColumn!];
            let valB = colDef?.sortValue ? colDef.sortValue(b) : b[this.sortColumn!];

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }
}
