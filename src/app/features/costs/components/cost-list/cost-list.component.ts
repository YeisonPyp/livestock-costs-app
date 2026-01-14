import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CostService } from '../../services/cost.service';
import { Cost } from '../../models/cost.interface';
import { TableComponent, TableColumn } from '../../../../shared/components/table/table.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-cost-list',
  standalone: true,
  imports: [CommonModule, TableComponent, ButtonComponent],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-gray-800">Registro de Costos</h2>
        <app-button variant="primary" (clicked)="onCreateCost()">
          + Nuevo Costo
        </app-button>
      </div>

      <div class="bg-white rounded-lg shadow">
        <app-table
          [columns]="columns"
          [data]="costs"
          [loading]="loading"
          (rowClick)="onRowClick($event)"
        ></app-table>
      </div>

      @if (pagination) {
        <div class="flex justify-between items-center bg-white rounded-lg shadow p-4">
          <div class="text-sm text-gray-600">
            Mostrando {{ costs.length }} de {{ pagination.count }} registros
          </div>
          <div class="flex space-x-2">
            <button
              [disabled]="!pagination.previous"
              class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              (click)="onPageChange(pagination.current_page - 1)"
            >
              Anterior
            </button>
            <span class="px-4 py-2">
              Página {{ pagination.current_page }} de {{ pagination.total_pages }}
            </span>
            <button
              [disabled]="!pagination.next"
              class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              (click)="onPageChange(pagination.current_page + 1)"
            >
              Siguiente
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class CostListComponent implements OnInit {
  loading = false;
  costs: Cost[] = [];
  pagination: any = null;
  columns: TableColumn[] = [
    { key: 'date_incurred', label: 'Fecha', sortable: true },
    { key: 'category_name', label: 'Categoría', sortable: false },
    { key: 'description', label: 'Descripción', sortable: false },
    { key: 'amount', label: 'Monto', sortable: true }
  ];

  constructor(private costService: CostService) {}

  ngOnInit(): void {
    this.loadCosts();
  }

  loadCosts(page: number = 1): void {
    this.loading = true;
    this.costService.getCosts({ page }).subscribe({
      next: (response) => {
        if (response.success) {
          this.costs = response.data;
          this.pagination = response.pagination;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading costs', error);
        this.loading = false;
      }
    });
  }

  onCreateCost(): void {
    console.log('Create cost clicked');
    // Implementar lógica de creación
  }

  onRowClick(cost: Cost): void {
    console.log('Cost clicked', cost);
    // Implementar navegación a detalle
  }

  onPageChange(page: number): void {
    this.loadCosts(page);
  }
}
