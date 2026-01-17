import { Component, OnInit, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CostService } from '../../services/cost.service';
import { CategoryService } from '../../../categories/services/category.service';
import { Cost } from '../../models/cost.interface';
import { Category } from '../../../categories/models/category.interface';
import { TableComponent, TableColumn, TableConfig } from '../../../../shared/components/table/table.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { CostFormComponent } from '../cost-form/cost-form.component';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-cost-list',
  standalone: true,
  imports: [
    CommonModule,
    TableComponent,
    ButtonComponent,
    ModalComponent,
    CostFormComponent
  ],
  templateUrl: './cost-list.component.html',
  styleUrls: ['./cost-list.component.scss']
})
export class CostListComponent implements OnInit, AfterViewInit {
  loading = false;
  isSubmitting = false;
  costs: Cost[] = [];
  categories: Category[] = [];
  pagination: any = null;

  // Modal states
  isCreateModalOpen = false;
  isEditModalOpen = false;
  isViewModalOpen = false;
  isDeleteModalOpen = false;

  selectedCost: Cost | null = null;

  // Table configuration
  tableConfig: TableConfig = {
    selectable: false,
    searchable: true,
    paginated: false, // Usamos paginación del backend
    striped: true,
    hover: true
  };

  columns: TableColumn[] = [
    {
      key: 'date_incurred',
      label: 'Fecha',
      sortable: true,
      type: 'date',
      width: '120px'
    },
    {
      key: 'category_name',
      label: 'Categoría',
      sortable: false,
      width: '200px'
    },
    {
      key: 'description',
      label: 'Descripción',
      sortable: false
    },
    {
      key: 'amount',
      label: 'Monto',
      sortable: true,
      type: 'currency',
      width: '150px',
      align: 'right'
    }
  ];

  constructor(
    private costService: CostService,
    private categoryService: CategoryService,
    private notificationService: NotificationService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.loadCosts();
    this.loadCategories();
  }

  ngAfterViewInit(): void {
    // Event delegation para los botones de acción
    this.elementRef.nativeElement.addEventListener('click', (event: Event) => {
      const target = event.target as HTMLElement;
      const button = target.closest('.action-btn') as HTMLButtonElement;

      if (button) {
        event.stopPropagation();
        const row = button.closest('tr');
        if (row) {
          const rowIndex = Array.from(row.parentElement!.children).indexOf(row);
          const cost = this.costs[rowIndex];

          if (button.classList.contains('view-btn')) {
            this.openViewModal(cost);
          } else if (button.classList.contains('edit-btn')) {
            this.openEditModal(cost);
          } else if (button.classList.contains('delete-btn')) {
            this.openDeleteModal(cost);
          }
        }
      }
    });
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
        this.notificationService.error('Error al cargar los costos');
        this.loading = false;
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (response) => {
        if (response.success) {
          this.categories = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading categories', error);
      }
    });
  }

  // Create
  openCreateModal(): void {
    this.selectedCost = null;
    this.isCreateModalOpen = true;
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
    this.selectedCost = null;
  }

  onCreateCost(costData: Partial<Cost>): void {
    this.isSubmitting = true;
    this.costService.createCost(costData).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success(response.message || 'Costo registrado exitosamente');
          this.loadCosts();
          this.closeCreateModal();
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error creating cost', error);
        this.notificationService.error(error?.error?.message || 'Error al registrar el costo');
        this.isSubmitting = false;
      }
    });
  }

  // View
  openViewModal(cost: Cost): void {
    this.selectedCost = cost;
    this.isViewModalOpen = true;
  }

  closeViewModal(): void {
    this.isViewModalOpen = false;
    this.selectedCost = null;
  }

  // Edit
  openEditModal(cost: Cost): void {
    this.selectedCost = cost;
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.selectedCost = null;
  }

  onUpdateCost(costData: Partial<Cost>): void {
    if (!this.selectedCost?.id) return;

    this.isSubmitting = true;
    this.costService.updateCost(this.selectedCost.id, costData).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success(response.message || 'Costo actualizado exitosamente');
          this.loadCosts(this.pagination?.current_page || 1);
          this.closeEditModal();
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error updating cost', error);
        this.notificationService.error(error?.error?.message || 'Error al actualizar el costo');
        this.isSubmitting = false;
      }
    });
  }

  // Delete
  openDeleteModal(cost: Cost): void {
    this.selectedCost = cost;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.selectedCost = null;
  }

  onConfirmDelete(): void {
    if (!this.selectedCost?.id) return;

    this.isSubmitting = true;
    this.costService.deleteCost(this.selectedCost.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success('Costo eliminado exitosamente');
          this.loadCosts(this.pagination?.current_page || 1);
          this.closeDeleteModal();
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error deleting cost', error);
        this.notificationService.error(error?.error?.message || 'Error al eliminar el costo');
        this.isSubmitting = false;
      }
    });
  }

  onRowClick(cost: Cost): void {
    this.openViewModal(cost);
  }

  onPageChange(page: number): void {
    this.loadCosts(page);
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? `${category.code} - ${category.name}` : 'N/A';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  }
}