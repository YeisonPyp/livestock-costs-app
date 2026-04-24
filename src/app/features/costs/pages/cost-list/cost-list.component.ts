import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { CostService } from '../../services/cost.service';
import { CategoryService } from '../../services/category.service';
import {
  Cost,
  Category,
  CostTotals,
  CostFilters,
  CostDetail,
  CategoryType,
} from '../../models/cost.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { SafeDatePipe } from '../../../../shared/pipes/safe-date.pipe';
import { LoaderComponent } from '../../../../shared/components/feedback/loader/loader.component';
import { ModalComponent } from '../../../../shared/components/overlays/modal/modal.component';
import { PageHeaderComponent } from '../../../../shared/components/navigation/page-header/page-header.component';
import { KpiCardComponent } from '../../../../shared/components/data-display/kpi-card/kpi-card.component';
import { PaginationParams, TableColumn, TableComponent, TableConfig } from '../../../../shared/components/data-display/table/table.component';
import { ConfirmDialogComponent } from '../../../../shared/components/feedback/confirm-dialog/confirm-dialog.component';

const PAGE_SIZE = 10; // fuente única de verdad

@Component({
  selector: 'app-cost-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    LoaderComponent,
    ModalComponent,
    PageHeaderComponent,
    KpiCardComponent,
    TableComponent,
    SafeDatePipe,
  ],
  templateUrl: './cost-list.component.html',
  styleUrl: './cost-list.component.scss',
})
export class CostListComponent implements OnInit {
  private costSvc = inject(CostService);
  private catSvc = inject(CategoryService);
  private dialog = inject(MatDialog);
  private notSvc = inject(NotificationService);
  private router = inject(Router);

  // ── Signals ────────────────────────────────────────────────────────────────
  costs = signal<Cost[]>([]);
  categories = signal<Category[]>([]);
  totals = signal<CostTotals | null>(null);
  pagination = signal<any>(null);
  loading = signal(true);
  loadingKpis = signal(true);

  // ── Filters ────────────────────────────────────────────────────────────────
  private search$ = new Subject<string>();
  searchTerm = '';
  categoryFilter: string | '' = '';
  startDate = '';
  endDate = '';
  ordering = '-date';
  currentPage = 1;
  isViewModalOpen = false;
  selectedCost: CostDetail | null = null;

  hasActiveFilters = computed(
    () =>
      !!(
        this.searchTerm ||
        this.categoryFilter ||
        this.startDate ||
        this.endDate
      ),
  );

  // ── Table config ───────────────────────────────────────────────────────────
  // pageSize centralizado: una sola constante para el componente y la tabla
  readonly PAGE_SIZE = PAGE_SIZE;

  tableConfig: TableConfig = {
    searchable: false, // buscador propio arriba
    paginated: true,
    serverPagination: true,
    pageSize: PAGE_SIZE,
    striped: true,
    hover: true,
  };

  columns: TableColumn[] = [
    {
      key: 'date',
      label: 'Fecha',
      sortable: true,
      type: 'date'
    },
    {
      key: 'category_name',
      label: 'Categoría'
    },
    {
      key: 'description',
      label: 'Descripción'
    },
    {
      key: 'signed_amount',
      label: 'Valor',
      type: 'currency',
      align: 'right'
    }
  ];

  // ── Lifecycle ───────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadCategories();
    this.loadTotals();
    this.loadCosts();

    this.search$
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage = 1;
        this.loadCosts();
      });
  }

  // ── Loaders ─────────────────────────────────────────────────────────────────
  private loadCategories(): void {
    this.catSvc.getAll().subscribe({
      next: (r) => {
        if (r.success) this.categories.set(r.data);
      },
    });
  }

  private loadTotals(): void {
    this.loadingKpis.set(true);

    this.costSvc.getTotals(this.activeFilters()).subscribe({
      next: (r) => {
        if (r.success) this.totals.set(r.data);
        this.loadingKpis.set(false);
      },
      error: () => this.loadingKpis.set(false),
    });
  }

  loadCosts(page = this.currentPage): void {
  this.loading.set(true);
  this.currentPage = page;

  const filters: CostFilters = {
    ...this.activeFilters(),
    page,
    page_size: PAGE_SIZE,
    ordering: this.ordering,
  };

  this.costSvc.getAll(filters).subscribe({
    next: (r) => {
      if (r.success) {
        this.costs.set(r.data);
        this.pagination.set(r.pagination ?? null);
      }
      this.loading.set(false);
    },
    error: () => this.loading.set(false),
  });
}

  // ── Table events ────────────────────────────────────────────────────────────

  /**
   * Llamado por la tabla cuando cambia página, orden o búsqueda.
   * Se mapea al formato de filtros del servicio.
   */
  onPaginationParamsChange(params: PaginationParams): void {
    this.currentPage = params.page ?? 1;

    if (params.sort_by) {
      this.ordering =
        params.sort_direction === 'desc'
          ? `-${params.sort_by}`
          : params.sort_by;
    }

    if (params.search !== undefined) {
      this.searchTerm = params.search;
    }

    this.loadCosts(this.currentPage);
  }

  // ── Acciones de fila ────────────────────────────────────────────────────────

  /** Navegar a la pantalla de edición del costo */
  editCost(cost: Cost): void {
    this.router.navigate(['/costs/costs/', cost.id, 'edit']);
  }

  /** Ver detalle (opcional) */
  viewCost(cost: Cost): void {
    this.router.navigate(['/costs', cost.id]);
  }

  /** Confirmar y eliminar */
  confirmDelete(cost: Cost): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Eliminar Costo',
          message: `¿Deseas eliminar el registro "${cost.description} con valor $ ${cost.amount}"? Esta acción no se puede deshacer.`,
          confirmText: 'Eliminar',
          type: 'danger',
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) this.deleteCost(cost.id);
      });
  }

  private deleteCost(id: string): void {
    this.costSvc.delete(id).subscribe({
      next: () => {
        this.notSvc.success('Registro eliminado');
        this.loadCosts();
        this.loadTotals();
      },
      error: (err) => {
        console.error('Error save costs', err);
        this.notSvc.error(err?.error?.message || 'Error al guardar el costo');
      },
    });
  }

  openViewModal(cost: Cost): void {
    this.isViewModalOpen = true;
    this.selectedCost = null;

    this.costSvc.getById(cost.id).subscribe({
      next: (r) => {
        if (r.success) {
          this.selectedCost = r.data;
        }
      },
    });
  }

  closeViewModal(): void {
    this.isViewModalOpen = false;
    this.selectedCost = null;
  }

  // ── Filters ─────────────────────────────────────────────────────────────────
  onSearchChange(val: string): void {
    this.searchTerm = val;
    this.search$.next(val);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadCosts();
    this.loadTotals();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.categoryFilter = '';
    this.startDate = '';
    this.endDate = '';
    this.ordering = '-date';
    this.onFilterChange();
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    window.URL.revokeObjectURL(url);
  }
  // ── Export ──────────────────────────────────────────────────────────────────
  exportExcel(): void {
    this.costSvc.exportExcel(this.activeFilters()).subscribe((blob) => {
      const file = new Blob([blob]);
      const url = window.URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reporte_costos.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  exportPdf(): void {
    this.costSvc.exportPdf(this.activeFilters()).subscribe((blob) => {
      const file = new Blob([blob], { type: 'application/pdf' });

      const url = window.URL.createObjectURL(file);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'reporte_costos.pdf';
      a.click();

      window.URL.revokeObjectURL(url);
    });
  }
  
  activeFilters = computed<Partial<CostFilters>>(() => {
    const filters: Partial<CostFilters> = {};

    if (this.searchTerm) filters.search = this.searchTerm;
    if (this.categoryFilter) filters.category = this.categoryFilter;
    if (this.startDate) filters.start_date = this.startDate;
    if (this.endDate) filters.end_date = this.endDate;

    return filters;
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────
  catName(id: string): string {
    return this.categories().find((x) => x.id === id)?.name ?? '—';
  }

  get paginationStart(): number {
    const p = this.pagination();
    return p ? (p.current_page - 1) * PAGE_SIZE + 1 : 0;
  }

  get paginationEnd(): number {
    const p = this.pagination();
    return p ? Math.min(p.current_page * PAGE_SIZE, p.count) : 0;
  }
}
