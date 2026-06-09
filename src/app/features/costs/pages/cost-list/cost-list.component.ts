import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { CostService } from '../../services/cost.service';
import { CategoryService } from '../../services/category.service';
import {
  Cost,
  Category,
  CostTotals,
  CostFilters,
  CostDetail,
} from '../../models/cost.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { SafeDatePipe } from '../../../../shared/pipes/safe-date.pipe';
import { LoaderComponent } from '../../../../shared/components/feedback/loader/loader.component';
import { ModalComponent } from '../../../../shared/components/overlays/modal/modal.component';
import { PageHeaderComponent } from '../../../../shared/components/navigation/page-header/page-header.component';
import { KpiCardComponent } from '../../../../shared/components/data-display/kpi-card/kpi-card.component';
import { TableComponent } from '../../../../shared/components/data-display/table/table.component';
import { TableColumn, TableConfig, PaginationParams } from '../../../../shared/components/data-display/table/table.types';
import { ConfirmDialogComponent } from '../../../../shared/components/feedback/confirm-dialog/confirm-dialog.component';
import { ExportReportModalComponent } from '../../../../shared/components/overlays/export-report-modal/export-report-modal.component';
import {
  ExportReportPayload,
  ExportReportConfig,
} from '../../../../shared/components/overlays/export-report-modal/export-report-modal.types';

const PAGE_SIZE = 10;

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
    ExportReportModalComponent,
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

  // ══════════════════════════════════════════════════════════════════════════
  // SIGNALS DE DATOS
  // ══════════════════════════════════════════════════════════════════════════
  costs = signal<Cost[]>([]);
  categories = signal<Category[]>([]);
  totals = signal<CostTotals | null>(null);
  pagination = signal<any>(null);
  loading = signal(true);
  loadingKpis = signal(true);

  // ══════════════════════════════════════════════════════════════════════════
  // SIGNALS DE FILTROS  ← ¡AQUÍ ESTÁ EL CAMBIO CLAVE!
  // Antes eran propiedades planas → computed() no las detectaba
  // Ahora son signals → computed() se recalcula automáticamente
  // ══════════════════════════════════════════════════════════════════════════
  searchTerm = signal('');
  categoryFilter = signal('');
  startDate = signal('');
  endDate = signal('');
  ordering = signal('-date');
  currentPage = signal(1);

  // ── Debounce de búsqueda ────────────────────────────────────────────────
  private search$ = new Subject<string>();

  // ── Modal de detalle ────────────────────────────────────────────────────
  isViewModalOpen = signal(false);
  selectedCost = signal<CostDetail | null>(null);

  // ══════════════════════════════════════════════════════════════════════════
  // COMPUTED: ahora SÍ se recalcula cuando cambian los signals
  // ══════════════════════════════════════════════════════════════════════════

  /** Indica si hay algún filtro activo (para mostrar botón "Limpiar") */
  hasActiveFilters = computed(
    () =>
      !!(
        this.searchTerm() ||
        this.categoryFilter() ||
        this.startDate() ||
        this.endDate()
      ),
  );

  /** Filtros activos para enviar al backend */
  activeFilters = computed<Partial<CostFilters>>(() => {
    const filters: Partial<CostFilters> = {};

    const search = this.searchTerm();
    const category = this.categoryFilter();
    const start = this.startDate();
    const end = this.endDate();

    if (search) filters.search = search;
    if (category) filters.category = category;
    if (start) filters.start_date = start;
    if (end) filters.end_date = end;

    return filters;
  });

  // ══════════════════════════════════════════════════════════════════════════
  // TABLE CONFIG
  // ══════════════════════════════════════════════════════════════════════════
  readonly PAGE_SIZE = PAGE_SIZE;

  tableConfig: TableConfig = {
    searchable: false,
    paginated: true,
    serverPagination: true,
    pageSize: PAGE_SIZE,
    striped: true,
    hover: true,
  };

  columns: TableColumn[] = [
    { key: 'date', label: 'Fecha', sortable: true, type: 'date' },
    { key: 'category_name', label: 'Categoría' },
    { key: 'description', label: 'Descripción' },
    { key: 'signed_amount', label: 'Valor', type: 'currency', align: 'right' },
  ];

  // ══════════════════════════════════════════════════════════════════════════
  // EXPORT CONFIG
  // ══════════════════════════════════════════════════════════════════════════
  showExport = signal(false);

  readonly exportConfig: ExportReportConfig = {
    title: 'Exportar Reporte de Costos',
    subtitle: 'Seleccione el rango de fechas o exporte toda la información.',
    showExcel: true,
    showPdf: true,
    allDataLabel: 'Traer toda la información',
  };

  // ══════════════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ══════════════════════════════════════════════════════════════════════════
  ngOnInit(): void {
    this.loadCategories();
    this.loadTotals();
    this.loadCosts();

    this.search$
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((term) => {
        this.searchTerm.set(term);
        this.currentPage.set(1);
        this.loadCosts();
        this.loadTotals();
      });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LOADERS
  // ══════════════════════════════════════════════════════════════════════════
  private loadCategories(): void {
    this.catSvc.getMovable({has_entries: true,})
    .subscribe({
      next: (r) => {
        if (r.success) {
          this.categories.set(r.data);
        }
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

  loadCosts(): void {
    this.loading.set(true);

    const filters: CostFilters = {
      ...this.activeFilters(),
      page: this.currentPage(),
      page_size: PAGE_SIZE,
      ordering: this.ordering(),
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

  // ══════════════════════════════════════════════════════════════════════════
  // FILTER EVENTS  ← adaptados para signals
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Búsqueda con debounce:
   * El input dispara search$.next() → el debounce espera 350ms
   * → actualiza searchTerm signal → carga datos
   */
  onSearchChange(value: string): void {
    this.search$.next(value);
  }

  /**
   * Cambio de categoría o fechas (sin debounce, efecto inmediato)
   */
  onCategoryChange(value: string): void {
    this.categoryFilter.set(value);
    this.currentPage.set(1);
    this.loadCosts();
    this.loadTotals();
  }

  onStartDateChange(value: string): void {
    this.startDate.set(value);
    this.currentPage.set(1);
    this.loadCosts();
    this.loadTotals();
  }

  onEndDateChange(value: string): void {
    this.endDate.set(value);
    this.currentPage.set(1);
    this.loadCosts();
    this.loadTotals();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.categoryFilter.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.ordering.set('-date');
    this.currentPage.set(1);
    this.loadCosts();
    this.loadTotals();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TABLE EVENTS
  // ══════════════════════════════════════════════════════════════════════════
  onPaginationParamsChange(params: PaginationParams): void {
    this.currentPage.set(params.page ?? 1);

    if (params.sort_by) {
      this.ordering.set(
        params.sort_direction === 'desc'
          ? `-${params.sort_by}`
          : params.sort_by,
      );
    }

    if (params.search !== undefined) {
      this.searchTerm.set(params.search);
    }

    this.loadCosts();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ROW ACTIONS
  // ══════════════════════════════════════════════════════════════════════════
  editCost(cost: Cost): void {
    this.router.navigate(['/costs/costs/', cost.id, 'edit']);
  }

  viewCost(cost: Cost): void {
    this.router.navigate(['/costs', cost.id]);
  }

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
        console.error('Error eliminando costo', err);
        this.notSvc.error(err?.error?.message || 'Error al eliminar el costo');
      },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW MODAL
  // ══════════════════════════════════════════════════════════════════════════
  openViewModal(cost: Cost): void {
    this.isViewModalOpen.set(true);
    this.selectedCost.set(null);

    this.costSvc.getById(cost.id).subscribe({
      next: (r) => {
        if (r.success) this.selectedCost.set(r.data);
      },
    });
  }

  closeViewModal(): void {
    this.isViewModalOpen.set(false);
    this.selectedCost.set(null);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // EXPORT
  // ══════════════════════════════════════════════════════════════════════════
  onExport(payload: ExportReportPayload): void {
    const filters = this.buildExportFilters(payload);

    const request$ =
      payload.format === 'excel'
        ? this.costSvc.exportExcel(filters)
        : this.costSvc.exportPdf(filters);

    const fileName =
      payload.format === 'excel' ? 'reporte_costos.xlsx' : 'reporte_costos.pdf';

    const mimeType =
      payload.format === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf';

    request$.subscribe({
      next: (blob) => this.downloadFile(blob, fileName, mimeType),
      error: (err) => {
        console.error('Error exportando reporte', err);
        this.notSvc.error('Error al exportar el reporte');
      },
    });
  }

  private buildExportFilters(
    payload: ExportReportPayload,
  ): Partial<CostFilters> {
    // Filtros base de la pantalla (search, category)
    const filters: Partial<CostFilters> = {};

    const search = this.searchTerm();
    const category = this.categoryFilter();

    if (search) filters.search = search;
    if (category) filters.category = category;

    // Fechas del modal tienen prioridad
    if (!payload.allData) {
      filters.start_date = payload.startDate!;
      filters.end_date = payload.endDate!;
    }

    return filters;
  }

  private downloadFile(blob: Blob, fileName: string, mimeType: string): void {
    const file = new Blob([blob], { type: mimeType });
    const url = window.URL.createObjectURL(file);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════════════════════
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
