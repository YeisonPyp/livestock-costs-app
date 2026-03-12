import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { PageHeaderComponent }    from '../../../../shared/components/page-header/page-header.component';
import { KpiCardComponent }        from '../../../../shared/components/display/kpi-card/kpi-card.component';
import { BadgeComponent }          from '../../../../shared/components/display/badge/badge.component';
import { AmountDisplayComponent }  from '../../../../shared/components/bills/amount-display/amount-display.component';
import { LoaderComponent }         from '../../../../shared/components/loader/loader.component';
import { EmptyStateComponent }     from '../../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent }  from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { DropdownMenuComponent }   from '../../../../shared/components/display/dropdown-menu/dropdown-menu.component';

import { CostService }     from '../../services/cost.service';
import { CategoryService } from '../../services/category.service';
import { Cost, Category, CostTotals, CostFilters } from '../../models/cost.model';
import {
  TableComponent,
  TableColumn,
  TableConfig,
  PaginationParams
} from '../../../../shared/components/table/table.component';

@Component({
  selector: 'app-cost-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    PageHeaderComponent, KpiCardComponent, BadgeComponent, LoaderComponent,
    EmptyStateComponent, DropdownMenuComponent,
    TableComponent
  ],
  templateUrl: './cost-list.component.html',
  styleUrl:    './cost-list.component.scss',
})
export class CostListComponent implements OnInit {
  private costSvc     = inject(CostService);
  private catSvc      = inject(CategoryService);
  private dialog      = inject(MatDialog);
  private snack       = inject(MatSnackBar);

  // ── Data ───────────────────────────────────────────────────────────────────
  costs       = signal<Cost[]>([]);
  categories  = signal<Category[]>([]);
  totals      = signal<CostTotals | null>(null);
  pagination  = signal<any>(null);
  loading     = signal(true);
  loadingKpis = signal(true);

  // ── Filters ────────────────────────────────────────────────────────────────
  search$     = new Subject<string>();
  searchTerm  = '';
  categoryFilter: number | '' = '';
  startDate   = '';
  endDate     = '';
  ordering    = '-date';
  pageSize    = 20;
  currentPage = 1;

  hasActiveFilters = computed(() =>
    !!(this.searchTerm || this.categoryFilter || this.startDate || this.endDate)
  );

  ngOnInit(): void {
    this.loadCategories();
    this.loadTotals();
    this.loadCosts();

    this.search$
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => { this.currentPage = 1; this.loadCosts(); });
  }

  // ── Loaders ────────────────────────────────────────────────────────────────
  private loadCategories(): void {
    this.catSvc.getAll().subscribe({
      next: (r) => { if (r.success) this.categories.set(r.data); },
    });
  }

  private loadTotals(): void {
    this.loadingKpis.set(true);
    const filters: Partial<CostFilters> = {};
    if (this.startDate) filters.date_from = this.startDate;
    if (this.endDate)   filters.date_to   = this.endDate;
    if (this.categoryFilter) filters.category = +this.categoryFilter;

    this.costSvc.getTotals(filters).subscribe({
      next: (r) => { if (r.success) this.totals.set(r.data); this.loadingKpis.set(false); },
      error: () => this.loadingKpis.set(false),
    });
  }

  loadCosts(page = this.currentPage): void {
    this.loading.set(true);
    this.currentPage = page;

    const filters: CostFilters = {
      page,
      page_size: this.pageSize,
      ordering:  this.ordering,
    };
    if (this.searchTerm)     filters.search    = this.searchTerm;
    if (this.categoryFilter) filters.category  = +this.categoryFilter;
    if (this.startDate)      filters.date_from = this.startDate;
    if (this.endDate)        filters.date_to   = this.endDate;

    this.costSvc.getAll(filters).subscribe({
      next: (r) => {
        if (r.success) { this.costs.set(r.data); this.pagination.set(r.pagination ?? null); }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ── Filters ────────────────────────────────────────────────────────────────
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

  // ── Sort ──────────────────────────────────────────────────────────────────
  sortBy(field: string): void {
    this.ordering = this.ordering === field ? `-${field}` : field;
    this.loadCosts();
  }

  sortIcon(field: string): string {
    if (this.ordering === field)  return '↑';
    if (this.ordering === `-${field}`) return '↓';
    return '↕';
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  confirmDelete(cost: Cost): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title:       'Eliminar Costo',
        message:     `¿Eliminar el registro "${cost.description}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        type:        'danger',
      },
    }).afterClosed().subscribe(ok => { if (ok) this.deleteCost(cost.id); });
  }

  private deleteCost(id: string): void {
    this.costSvc.delete(id).subscribe({
      next: () => {
        this.snack.open('Registro eliminado', 'Cerrar', { duration: 3000 });
        this.loadCosts(); this.loadTotals();
      },
      error: (err) => this.snack.open(err?.error?.message || 'Error al eliminar', 'Cerrar', { duration: 3500 }),
    });
  }

  // ── Export ────────────────────────────────────────────────────────────────
  exportExcel(): void { window.open(this.costSvc.exportExcelUrl(this.activeFilters()), '_blank'); }
  exportPdf():   void { window.open(this.costSvc.exportPdfUrl(this.activeFilters()),   '_blank'); }

  private activeFilters(): Partial<CostFilters> {
    const f: Partial<CostFilters> = {};
    if (this.startDate)      f.date_from = this.startDate;
    if (this.endDate)        f.date_to   = this.endDate;
    if (this.categoryFilter) f.category  = +this.categoryFilter;
    return f;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  catName(id: string): string {
    const c = this.categories().find(x => x.id === id);
    return c ? c.name : '—';
  }

  catColor(id: string): string {
    return this.categories().find(x => x.id === id)?.color ?? '#94a3b8';
  }

  formatDate(d: string): string {
    return new Date(d + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  get paginationStart(): number {
    const p = this.pagination();
    return p ? (p.current_page - 1) * this.pageSize + 1 : 0;
  }

  get paginationEnd(): number {
    const p = this.pagination();
    return p ? Math.min(p.current_page * this.pageSize, p.count) : 0;
  }
  tableConfig: TableConfig = {
    searchable: false, // ya tienes buscador arriba
    paginated: true,
    serverPagination: true,
    pageSize: 10,
    striped: true,
    hover: true
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
      key: 'amount',
      label: 'Monto',
      sortable: true,
      type: 'currency',
      align: 'right'
    }
  ];

  onPaginationParamsChange(params: PaginationParams): void {

    this.currentPage = params.page || 1;

    const filters: CostFilters = {
      page: params.page,
      page_size: params.page_size,
    };

    if (params.search) {
      filters.search = params.search;
    }

    if (params.sort_by) {
      filters.ordering =
        params.sort_direction === 'desc'
          ? `-${params.sort_by}`
          : params.sort_by;
    }

    this.loadCosts(filters.page);
  }
}