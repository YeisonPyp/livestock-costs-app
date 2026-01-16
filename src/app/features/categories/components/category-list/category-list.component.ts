import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/category.interface';
import { TableComponent, TableColumn, TableConfig } from '../../../../shared/components/table/table.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { CategoryFormComponent } from '../category-form/category-form.component';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    CommonModule, 
    TableComponent, 
    ButtonComponent, 
    ModalComponent,
    CategoryFormComponent
  ],
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss']
})
export class CategoryListComponent implements OnInit {
  loading = false;
  isSubmitting = false;
  categories: Category[] = [];
  
  // Modal states
  isCreateModalOpen = false;
  isEditModalOpen = false;
  isViewModalOpen = false;
  isDeleteModalOpen = false;
  
  selectedCategory: Category | null = null;

  // Table configuration
  tableConfig: TableConfig = {
    selectable: false,
    searchable: true,
    paginated: true,
    pageSize: 10,
    striped: true,
    hover: true
  };

  columns: TableColumn[] = [
    { 
      key: 'code', 
      label: 'Código', 
      sortable: true,
      width: '120px'
    },
    { 
      key: 'name', 
      label: 'Nombre', 
      sortable: true 
    },
    { 
      key: 'level', 
      label: 'Nivel', 
      sortable: true,
      type: 'number',
      width: '100px',
      align: 'center'
    },
    { 
      key: 'is_movement', 
      label: 'Permite Movimiento', 
      sortable: false,
      type: 'badge',
      width: '180px',
      align: 'center',
      format: (value: boolean) => value ? 'Sí' : 'No',
      badgeColor: (value: boolean) => value ? 'success' : 'default'
    }
  ];

  constructor(
    private categoryService: CategoryService,
    private notificationService: NotificationService
  ) {}

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
        this.notificationService.error('Error al cargar las categorías');
        this.loading = false;
      }
    });
  }

  // Create
  openCreateModal(): void {
    this.selectedCategory = null;
    this.isCreateModalOpen = true;
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
    this.selectedCategory = null;
  }

  onCreateCategory(categoryData: Partial<Category>): void {
    this.isSubmitting = true;
    this.categoryService.createCategory(categoryData).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success(response.message || 'Categoría creada exitosamente');
          this.loadCategories();
          this.closeCreateModal();
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error creating category', error);
        this.notificationService.error(error?.error?.message || 'Error al crear la categoría');
        this.isSubmitting = false;
      }
    });
  }

  // View
  openViewModal(category: Category): void {
    this.selectedCategory = category;
    this.isViewModalOpen = true;
  }

  closeViewModal(): void {
    this.isViewModalOpen = false;
    this.selectedCategory = null;
  }

  // Edit
  openEditModal(category: Category): void {
    this.selectedCategory = category;
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.selectedCategory = null;
  }

  onUpdateCategory(categoryData: Partial<Category>): void {
    if (!this.selectedCategory?.id) return;

    this.isSubmitting = true;
    this.categoryService.updateCategory(this.selectedCategory.id, categoryData).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success(response.message || 'Categoría actualizada exitosamente');
          this.loadCategories();
          this.closeEditModal();
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error updating category', error);
        this.notificationService.error(error?.error?.message || 'Error al actualizar la categoría');
        this.isSubmitting = false;
      }
    });
  }

  // Delete
  openDeleteModal(category: Category): void {
    this.selectedCategory = category;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.selectedCategory = null;
  }

  onConfirmDelete(): void {
    if (!this.selectedCategory?.id) return;

    this.isSubmitting = true;
    this.categoryService.deleteCategory(this.selectedCategory.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success('Categoría eliminada exitosamente');
          this.loadCategories();
          this.closeDeleteModal();
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error deleting category', error);
        this.notificationService.error(error?.error?.message || 'Error al eliminar la categoría');
        this.isSubmitting = false;
      }
    });
  }

  onRowClick(category: Category): void {
    this.openViewModal(category);
  }

  getParentCategoryName(parentId: number | null): string {
    if (!parentId) return 'Sin categoría padre';
    const parent = this.categories.find(c => c.id === parentId);
    return parent ? `${parent.code} - ${parent.name}` : 'N/A';
  }
}