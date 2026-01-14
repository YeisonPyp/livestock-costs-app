import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            @for (column of columns; track column.key) {
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                (click)="column.sortable && onSort(column.key)"
              >
                {{ column.label }}
                @if (column.sortable) {
                  <span class="ml-1">↕</span>
                }
              </th>
            }
            @if (hasActions) {
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            }
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          @if (loading) {
            <tr>
              <td [attr.colspan]="columns.length + (hasActions ? 1 : 0)" class="px-6 py-4 text-center">
                <span class="text-gray-500">Cargando...</span>
              </td>
            </tr>
          } @else if (data.length === 0) {
            <tr>
              <td [attr.colspan]="columns.length + (hasActions ? 1 : 0)" class="px-6 py-4 text-center">
                <span class="text-gray-500">No hay datos disponibles</span>
              </td>
            </tr>
          } @else {
            @for (row of data; track row.id || $index) {
              <tr class="hover:bg-gray-50 cursor-pointer" (click)="onRowClick(row)">
                @for (column of columns; track column.key) {
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ row[column.key] }}
                  </td>
                }
                @if (hasActions) {
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <ng-content select="[actions]"></ng-content>
                  </td>
                }
              </tr>
            }
          }
        </tbody>
      </table>
    </div>
  `
})
export class TableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() loading = false;
  @Input() hasActions = false;
  @Output() rowClick = new EventEmitter<any>();
  @Output() sort = new EventEmitter<string>();

  onRowClick(row: any): void {
    this.rowClick.emit(row);
  }

  onSort(key: string): void {
    this.sort.emit(key);
  }
}
