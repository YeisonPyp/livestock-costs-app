import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { PageHeaderComponent }   from '../../../../shared/components/page-header/page-header.component';
import { KpiCardComponent }       from '../../../../shared/components/display/kpi-card/kpi-card.component';
import { LoaderComponent }        from '../../../../shared/components/loader/loader.component';
import { EmptyStateComponent }    from '../../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

import { CostService }     from '../../services/cost.service';
import { CategoryService } from '../../services/category.service';
import { Cost, Category, CostTotals, CostFilters } from '../../models/cost.model';
import {
  TableComponent,
  TableColumn,
  TableConfig,
  PaginationParams,
} from '../../../../shared/components/table/table.component';
import { NotificationService } from '../../../../core/services/notification.service';

const PAGE_SIZE = 10; // fuente única de verdad

@Component({
  selector: 'app-cost-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule, LoaderComponent,
    PageHeaderComponent, KpiCardComponent, TableComponent,
  ],
  templateUrl: './cost-list.component.html',
  styleUrl:    './cost-list.component.scss',
})
export class CostListComponent implements OnInit {

  private costSvc  = inject(CostService);
  private catSvc   = inject(CategoryService);
  private dialog   = inject(MatDialog);
  private notSvc   = inject(NotificationService);
  private router   = inject(Router);

  // ── Signals ────────────────────────────────────────────────────────────────
  costs       = signal<Cost[]>([]);
  categories  = signal<Category[]>([]);
  totals      = signal<CostTotals | null>(null);
  pagination  = signal<any>(null);
  loading     = signal(true);
  loadingKpis = signal(true);

  // ── Filters ────────────────────────────────────────────────────────────────
  private search$ = new Subject<string>();
  searchTerm      = '';
  categoryFilter: number | '' = '';
  startDate   = '';
  endDate     = '';
  ordering    = '-date';
  currentPage = 1;

  hasActiveFilters = computed(() =>
    !!(this.searchTerm || this.categoryFilter || this.startDate || this.endDate)
  );

  // ── Table config ───────────────────────────────────────────────────────────
  // pageSize centralizado: una sola constante para el componente y la tabla
  readonly PAGE_SIZE = PAGE_SIZE;

  tableConfig: TableConfig = {
    searchable:       false, // buscador propio arriba
    paginated:        true,
    serverPagination: true,
    pageSize:         PAGE_SIZE,
    striped:          true,
    hover:            true,
  };

  columns: TableColumn[] = [
    { key: 'date',          label: 'Fecha',      sortable: true, type: 'date' },
    { key: 'category_name', label: 'Categoría' },
    { key: 'description',   label: 'Descripción' },
    {
      key:     'amount',
      label:   'Monto',
      sortable: true,
      type:    'currency',
      align:   'right',
    },
    {
      key:    'status',
      label:  'Estado',
      type:   'badge',
      align:  'center',
      badgeColor: (v) => v === 'active' ? 'success' : 'warning',
    },
  ];

  // ── Lifecycle ───────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadCategories();
    this.loadTotals();
    this.loadCosts();

    this.search$
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => { this.currentPage = 1; this.loadCosts(); });
  }

  // ── Loaders ─────────────────────────────────────────────────────────────────
  private loadCategories(): void {
    this.catSvc.getAll().subscribe({
      next: (r) => { if (r.success) this.categories.set(r.data); },
    });
  }

  private loadTotals(): void {
    this.loadingKpis.set(true);
    const filters: Partial<CostFilters> = {};
    if (this.startDate)      filters.date_from = this.startDate;
    if (this.endDate)        filters.date_to   = this.endDate;
    if (this.categoryFilter) filters.category  = +this.categoryFilter;

    this.costSvc.getTotals(filters).subscribe({
      next:  (r) => { if (r.success) this.totals.set(r.data); this.loadingKpis.set(false); },
      error: () => this.loadingKpis.set(false),
    });
  }

  loadCosts(page = this.currentPage): void {
    this.loading.set(true);
    this.currentPage = page;

    const filters: CostFilters = {
      page,
      page_size: PAGE_SIZE,
      ordering:  this.ordering,
    };
    if (this.searchTerm)     filters.search   = this.searchTerm;
    if (this.categoryFilter) filters.category = +this.categoryFilter;
    if (this.startDate)      filters.date_from = this.startDate;
    if (this.endDate)        filters.date_to   = this.endDate;

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
      this.ordering = params.sort_direction === 'desc'
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
    this.router.navigate(['/costs/costs/new', cost.id, 'edit']);
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
          title:       'Eliminar Costo',
          message:     `¿Eliminar el registro "${cost.description}"? Esta acción no se puede deshacer.`,
          confirmText: 'Eliminar',
          type:        'danger',
        },
      })
      .afterClosed()
      .subscribe((ok) => { if (ok) this.deleteCost(cost.id); });
  }

  private deleteCost(id: string): void {
    this.costSvc.delete(id).subscribe({
      next: () => {
        this.notSvc.success('Registro eliminado',);
        this.loadCosts();
        this.loadTotals();
      },
      error: (err) => {
        console.error('Error save costs', err);
        this.notSvc.error(err?.error?.message || 'Error al guardar el costo',);
      }
    });
  }

  // ── Filters ─────────────────────────────────────────────────────────────────
  onSearchChange(val: string): void { this.searchTerm = val; this.search$.next(val); }

  onFilterChange(): void { this.currentPage = 1; this.loadCosts(); this.loadTotals(); }

  clearFilters(): void {
    this.searchTerm     = '';
    this.categoryFilter = '';
    this.startDate      = '';
    this.endDate        = '';
    this.ordering       = '-date';
    this.onFilterChange();
  }

  // ── Export ──────────────────────────────────────────────────────────────────
  exportExcel(): void { window.open(this.costSvc.exportExcelUrl(this.activeFilters()), '_blank'); }
  exportPdf():   void { window.open(this.costSvc.exportPdfUrl(this.activeFilters()),   '_blank'); }

  private activeFilters(): Partial<CostFilters> {
    const f: Partial<CostFilters> = {};
    if (this.startDate)      f.date_from = this.startDate;
    if (this.endDate)        f.date_to   = this.endDate;
    if (this.categoryFilter) f.category  = +this.categoryFilter;
    return f;
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  catName(id: string): string {
    return this.categories().find((x) => x.id === id)?.name ?? '—';
  }

  catColor(id: string): string {
    return this.categories().find((x) => x.id === id)?.color ?? '#94a3b8';
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