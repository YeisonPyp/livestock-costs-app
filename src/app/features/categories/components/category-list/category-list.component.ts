import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/category.interface';
import { TableComponent, TableColumn } from '../../../../shared/components/table/table.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, TableComponent, ButtonComponent],
  template: `
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-gray-800">Categorías de Costos</h2>
        <app-button variant="primary" (clicked)="onCreateCategory()">
          + Nueva Categoría
        </app-button>
      </div>

      <div class="bg-white rounded-lg shadow">
        <app-table
          [columns]="columns"
          [data]="categories"
          [loading]="loading"
          (rowClick)="onRowClick($event)"
        ></app-table>
      </div>
    </div>
  `
})
export class CategoryListComponent implements OnInit {
  loading = false;
  categories: Category[] = [];
  columns: TableColumn[] = [
    { key: 'code', label: 'Código', sortable: true },
    { key: 'name', label: 'Nombre', sortable: true },
    { key: 'level', label: 'Nivel', sortable: true },
    { key: 'is_movement', label: 'Permite Movimiento', sortable: false }
  ];

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.categoryService.getCategories().subscribe({
      next: (response) => {
        if (response.success) {
          this.categories = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading categories', error);
        this.loading = false;
      }
    });
  }

  onCreateCategory(): void {
    console.log('Create category clicked');
    // Implementar lógica de creación
  }

  onRowClick(category: Category): void {
    console.log('Category clicked', category);
    // Implementar navegación a detalle
  }
}
