import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { BadgeComponent } from '../../../../shared/components/display/badge/badge.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

import { CategoryService } from '../../services/category.service';
import { CategoryTree, Category } from '../../models/cost.model';
import {
  TableComponent,
  TableColumn,
  TableConfig,
  PaginationParams,
} from '../../../../shared/components/table/table.component';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { CategoryFormComponent } from '../category-form/category-form.component';
import { NotificationService } from '../../../../core/services/notification.service';

interface CategoryListState {
  categories: Category[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    TableComponent,
    ButtonComponent,
    PageHeaderComponent,
    LoaderComponent,
    EmptyStateComponent,
    BadgeComponent,
    ModalComponent,
    CategoryFormComponent,
  ],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.scss',
})
export class CategoryListComponent implements OnInit {
  private svc = inject(CategoryService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private notificationService = inject(NotificationService);

  tree = signal<CategoryTree[]>([]);
  flatList = signal<Category[]>([]);
  loading = signal(false);
  viewMode = signal<'tree' | 'list'>('tree');
  searchTerm = '';
  expandedIds = new Set<string>();
  categories: Category[] = [];
  isSubmitting = false;
  selectedCategory: Category | null = null;
  selectedParentId: string | null = null;

  isCreateModalOpen = false;
  isEditModalOpen = false;
  isViewModalOpen = false;

  state = signal<CategoryListState>({
    categories: [],
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 10,
  });

  ngOnInit(): void {
    this.loadTree();
    this.loadList();
  }

  private loadTree(): void {
    this.svc.getTree().subscribe({
      next: (r) => {
        if (r.success) {
          this.tree.set(r.data);
          // Auto-expand level-0 nodes
          r.data.forEach((n) => this.expandedIds.add(n.id));
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  reload(): void {
    this.loading.set(true);
    this.loadTree();
    this.loadList();
  }

  toggle(id: string): void {
    if (this.expandedIds.has(id)) this.expandedIds.delete(id);
    else this.expandedIds.add(id);
  }

  isExpanded(id: string): boolean {
    return this.expandedIds.has(id);
  }

  expandAll(): void {
    this.flatList().forEach((c) => this.expandedIds.add(c.id));
  }

  collapseAll(): void {
    this.expandedIds.clear();
  }

  get filteredList(): Category[] {
    if (!this.searchTerm.trim()) return this.flatList();
    const q = this.searchTerm.toLowerCase();
    return this.flatList().filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q),
    );
  }

  confirmDelete(cat: Category): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Eliminar Categoría',
          message: `¿Eliminar la categoría "${cat.name}" (${cat.code})? Esta acción no se puede deshacer.`,
          confirmText: 'Eliminar',
          type: 'danger',
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) this.deleteCategory(cat.id);
      });
  }

  private deleteCategory(id: string): void {
    this.svc.delete(id).subscribe({
      next: () => {
        this.snackBar.open('Categoría eliminada', 'Cerrar', { duration: 3000 });
        this.reload();
      },
      error: (err) => {
        this.snackBar.open(
          err?.error?.message || 'No se puede eliminar',
          'Cerrar',
          { duration: 4000 },
        );
      },
    });
  }

  levelLabel(level: number): string {
    return ['Raíz', 'Grupo', 'Subgrupo', 'Detalle'][level] ?? `Nivel ${level}`;
  }

  levelColor(level: number): 'blue' | 'purple' | 'yellow' | 'secondary' {
    return (
      (['blue', 'purple', 'yellow', 'secondary'] as const)[level] ?? 'secondary'
    );
  }

  tableConfig: TableConfig = {
    searchable: false, // Desactivamos búsqueda local, la manejamos vía servidor
    paginated: true,
    pageSize: 10,
    serverPagination: true,
    striped: true,
    hover: true,
    bordered: false,
    compact: false,
  };

  columns: TableColumn[] = [
    {
      key: 'code',
      label: 'Código',
      sortable: true,
      width: '120px',
    },
    {
      key: 'name',
      label: 'Nombre',
      sortable: true,
    },
    {
      key: 'level',
      label: 'Nivel',
      type: 'badge',
      sortable: true,
      badgeColor: () => 'success',
      format: (value) => this.levelLabel(value),
    },
    {
      key: 'parent_name',
      label: 'Categoría Padre',
      sortable: false,
      format: (v) => v || '—',
    },
    {
      key: 'is_movement',
      label: '¿Registra costos?',
      align: 'center',
      sortable: false,
      format: (v) => (v ? '✓' : '—'),
    },
    {
      key: 'is_active',
      label: 'Estado',
      type: 'badge',
      sortable: true,
      badgeColor: (v) => (v ? 'success' : 'default'),
      format: (v) => (v ? 'Activa' : 'Inactiva'),
    },
  ];

  /**
   * Cargar lista desde el servidor con paginación y filtros
   */
  private loadList(params?: PaginationParams): void {
    this.loading.set(true);

    const queryParams: any = {
      page: params?.page || this.state().currentPage,
      page_size: params?.page_size || this.state().pageSize,
    };

    if (params?.search) {
      queryParams.search = params.search;
    }

    if (params?.sort_by) {
      queryParams.sort_by = params.sort_by;
      queryParams.sort_direction = params.sort_direction;
    }

    this.svc.getAll(queryParams).subscribe({
      next: (response) => {
        if (response.success) {
          const newState = this.state();
          newState.categories = response.data || [];
          newState.totalItems = response.pagination?.count || 0;
          newState.totalPages = response.pagination?.total_pages || 1;
          newState.currentPage = response.pagination?.current_page || 1;
          this.state.set({ ...newState });
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.snackBar.open('Error al cargar categorías', 'Cerrar', {
          duration: 4000,
        });
        this.loading.set(false);
      },
    });
  }

  /**
   * Manejo de cambios en paginación/ordenamiento desde TableComponent
   */
  onPaginationParamsChange(params: PaginationParams): void {
    this.loadList(params);
  }

  /**
   * Manejo de click en fila para navegar a editar
   */
  onRowClick(row: Category): void {
    // Navegar a la página de edición
    // this.router.navigate([row.id, 'edit']);
    console.log('Row clicked:', row);
  }

  /**
   * Manejo de cambio de página (opcional, ya manejado por onPaginationParamsChange)
   */
  onPageChange(page: number): void {
    console.log('Page changed to:', page);
  }

  // Create
  openCreateModal(parentId?: string): void {
    this.selectedParentId = parentId ?? null;

    this.isCreateModalOpen = true;
  }

  closeCreateModal(): void {
    this.isCreateModalOpen = false;
    this.selectedParentId = null;
  }

  onCreateCategory(categoryData: Partial<Category>): void {
    this.isSubmitting = true;
    this.svc.create(categoryData).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success(
            response.message || 'Categoría creada exitosamente',
          );
          this.reload();
          this.closeCreateModal();
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error creating category', error);
        this.notificationService.error(
          error?.error?.message || 'Error al crear la categoría',
        );
        this.isSubmitting = false;
      },
    });
  }

  openEditModal(category: Category): void {

  this.svc.getById(category.id).subscribe({
    next: (r) => {

      if (r.success) {
        this.selectedCategory = r.data;
        this.isEditModalOpen = true;
      }

    }
  });

}

  closeEditModal(): void {
    this.isEditModalOpen = false;

    this.selectedCategory = null;
  }

  onUpdateCategory(categoryData: Partial<Category>): void {
    if (!this.selectedCategory) return;

    this.isSubmitting = true;

    this.svc.update(this.selectedCategory.id, categoryData).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success(
            response.message || 'Categoría actualizada',
          );

          this.reload();
          this.closeEditModal();
        }

        this.isSubmitting = false;
      },

      error: (error) => {
        console.error(error);

        this.notificationService.error(
          error?.error?.message || 'Error al actualizar',
        );

        this.isSubmitting = false;
      },
    });
  }
}
