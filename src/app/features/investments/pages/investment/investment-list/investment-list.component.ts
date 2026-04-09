import { 
  Component, 
  OnInit, 
  OnDestroy,
  computed, 
  inject, 
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { 
  Subject, 
  debounceTime, 
  distinctUntilChanged, 
  takeUntil,
  finalize,
  forkJoin,
  catchError,
  of,
} from 'rxjs';

// ═══════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { LoaderComponent } from '../../../../../shared/components/loader/loader.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { KpiCardComponent } from '../../../../../shared/components/display/kpi-card/kpi-card.component';
import { BadgeComponent } from '../../../../../shared/components/display/badge/badge.component';
import { AmountDisplayComponent } from '../../../../../shared/components/bills/amount-display/amount-display.component';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';

// ═══════════════════════════════════════════════════════════════════════════
// MODULE IMPORTS
// ═══════════════════════════════════════════════════════════════════════════
import { 
  InvestmentService,
  InvestmentSearchParams,
} from '../../../services';

import { InvestmentFormComponent } from '../investment-form/investment-form.component';

import { 
  Investment,
  CreateInvestmentPayload,
  GlobalSummary,
  InvestmentStatus,
  INVESTMENT_STATUS,
  INVESTMENT_STATUS_OPTIONS,
  getInvestmentStatusConfig,
  formatPercentage,
} from '../../../models/investment.model';
import { formatCurrency, parseDecimal, formatDate } from '../../../../../core/utils/helpers';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS LOCALES
// ═══════════════════════════════════════════════════════════════════════════

interface FilterState {
  status: InvestmentStatus | '';
  search: string;
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

interface StatsState {
  total: number;
  active: number;
  closed: number;
  totalCapital: number;
  totalProfits: number;
  totalCosts: number;
  netProfit: number;
  avgRoi: number | null;
  isLoading: boolean;
}

// Valor inicial para estadísticas
const INITIAL_STATS: StatsState = {
  total: 0,
  active: 0,
  closed: 0,
  totalCapital: 0,
  totalProfits: 0,
  totalCosts: 0,
  netProfit: 0,
  avgRoi: null,
  isLoading: true,
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════════════

@Component({
  selector: 'app-investment-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    PageHeaderComponent,
    LoaderComponent,
    EmptyStateComponent,
    KpiCardComponent,
    BadgeComponent,
    AmountDisplayComponent,
    ModalComponent,
    InvestmentFormComponent,
    ButtonComponent,
  ],
  templateUrl: './investment-list.component.html',
  styleUrl: './investment-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvestmentListComponent implements OnInit, OnDestroy {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // INYECCIONES
  // ═══════════════════════════════════════════════════════════════════════════
  
  private readonly investmentService = inject(InvestmentService);
  private readonly snackBar = inject(MatSnackBar);

  // ═══════════════════════════════════════════════════════════════════════════
  // SIGNALS DE ESTADO
  // ═══════════════════════════════════════════════════════════════════════════
  
  /** Lista de inversiones */
  readonly investments = signal<Investment[]>([]);
  
  /** Estados de carga */
  readonly isLoading = signal(true);
  readonly isLoadingStats = signal(true);
  readonly isSubmitting = signal(false);
  readonly hasError = signal(false);

  /** Estadísticas globales (desde el backend) */
  readonly stats = signal<StatsState>(INITIAL_STATS);

  /** Estado de paginación */
  readonly pagination = signal<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 10,
  });

  /** Estado de filtros */
  readonly filters = signal<FilterState>({
    status: '',
    search: '',
  });

  /** Modal de creación */
  readonly isCreateModalOpen = signal(false);
  readonly preselectedInvestorId = signal<string | null>(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // SUBJECTS PARA CLEANUP Y DEBOUNCE
  // ═══════════════════════════════════════════════════════════════════════════
  
  private readonly destroy$ = new Subject<void>();
  private readonly filterChange$ = new Subject<void>();

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTANTES PARA TEMPLATE
  // ═══════════════════════════════════════════════════════════════════════════
  
  /** Opciones de filtro por estado */
  readonly statusOptions = [
    { value: '', label: 'Todos los estados' },
    ...INVESTMENT_STATUS_OPTIONS.map(opt => ({
      value: opt.value,
      label: opt.label,
    })),
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED SIGNALS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /** Indica si hay filtros activos */
  readonly hasActiveFilters = computed(() => {
    const { status, search } = this.filters();
    return status !== '' || search.trim() !== '';
  });

  /** Mensaje para estado vacío según contexto */
  readonly emptyMessage = computed(() => {
    if (this.hasActiveFilters()) {
      return 'No se encontraron inversiones con los filtros aplicados.';
    }
    return 'Aún no hay inversiones registradas. ¡Crea la primera!';
  });

  /** ROI promedio formateado */
  readonly formattedAvgRoi = computed(() => {
    const roi = this.stats().avgRoi;
    if (roi === null) return 'N/A';
    return formatPercentage(roi);
  });

  /** Indica si hay más de una página */
  readonly showPagination = computed(() => this.pagination().totalPages > 1);

  /** Indica si se puede ir a la página anterior */
  readonly canGoPrevious = computed(() => this.pagination().currentPage > 1);

  /** Indica si se puede ir a la página siguiente */
  readonly canGoNext = computed(() => {
    const { currentPage, totalPages } = this.pagination();
    return currentPage < totalPages;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // LIFECYCLE HOOKS
  // ═══════════════════════════════════════════════════════════════════════════

  ngOnInit(): void {
    this.setupFilterListener();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SETUP
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Configura el listener para cambios en filtros con debounce.
   */
  private setupFilterListener(): void {
    this.filterChange$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.pagination.update(p => ({ ...p, currentPage: 1 }));
        this.loadInvestments();
      });
  }

  /**
   * Carga inicial de datos (estadísticas + listado en paralelo).
   */
  private loadInitialData(): void {
    this.isLoading.set(true);
    this.isLoadingStats.set(true);

    forkJoin({
      stats: this.investmentService.getGlobalSummary().pipe(
        catchError(err => {
          console.error('Error loading global summary:', err);
          return of({ success: false, data: null });
        })
      ),
      investments: this.investmentService.getAll({
        page: 1,
        page_size: this.pagination().pageSize,
      }).pipe(
        catchError(err => {
          console.error('Error loading investments:', err);
          return of({ success: false, data: [], pagination: null });
        })
      ),
    })
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.isLoading.set(false);
        this.isLoadingStats.set(false);
      }),
    )
    .subscribe({
      next: ({ stats, investments }) => {
        // Actualizar estadísticas
        if (stats.success && stats.data) {
          this.updateStats(stats.data);
        }

        // Actualizar inversiones
        if (investments.success) {
          this.investments.set(investments.data ?? []);
          this.updatePagination(investments.pagination);
        } else {
          this.hasError.set(true);
        }
      },
      error: (err) => {
        console.error('Error in initial load:', err);
        this.hasError.set(true);
        this.showError('Error al cargar los datos iniciales');
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Carga las inversiones aplicando filtros y paginación.
   */
  loadInvestments(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    const { currentPage, pageSize } = this.pagination();
    const { status, search } = this.filters();

    // Construir parámetros de búsqueda
    const params: InvestmentSearchParams = {
      page: currentPage,
      page_size: pageSize,
    };

    if (status) {
      params.status = status;
    }

    if (search.trim()) {
      params.search = search.trim();
    }

    this.investmentService
      .getAll(params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.investments.set(res.data ?? []);
            this.updatePagination(res.pagination);
          } else {
            this.hasError.set(true);
          }
        },
        error: (err) => {
          console.error('Error loading investments:', err);
          this.hasError.set(true);
          this.showError('Error al cargar las inversiones');
        },
      });
  }

  /**
   * Recarga estadísticas globales (forzando refresh del caché).
   */
  refreshStats(): void {
    this.stats.update(s => ({ ...s, isLoading: true }));

    this.investmentService
      .getGlobalSummary(true) // Force refresh
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.updateStats(res.data);
          } else {
            this.stats.update(s => ({ ...s, isLoading: false }));
          }
        },
        error: (err) => {
          console.error('Error refreshing stats:', err);
          this.stats.update(s => ({ ...s, isLoading: false }));
        },
      });
  }

  /**
   * Recarga todo (estadísticas + listado).
   */
  refreshAll(): void {
    this.loadInvestments();
    this.refreshStats();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UPDATE HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Actualiza el estado de estadísticas desde la respuesta del API.
   */
  private updateStats(data: GlobalSummary): void {
    const totalCapital = this.parseDecimal(data.total_current_capital);
    const totalProfits = this.parseDecimal(data.total_profits);
    const totalCosts = this.parseDecimal(data.total_costs);

    this.stats.set({
      total: data.active_count + data.closed_count,
      active: data.active_count,
      closed: data.closed_count,
      totalCapital,
      totalProfits,
      totalCosts,
      netProfit: totalProfits - totalCosts,
      avgRoi: data.avg_roi ? this.parseDecimal(data.avg_roi) : null,
      isLoading: false,
    });
  }

  /**
   * Actualiza el estado de paginación desde la respuesta del API.
   */
  private updatePagination(pagination?: any): void {
    if (!pagination) return;

    this.pagination.update(p => ({
      ...p,
      totalPages: pagination.total_pages ?? 1,
      totalItems: pagination.total ?? pagination.count ?? 0,
    }));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FILTROS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Maneja cambio en filtro de estado.
   */
  onStatusChange(status: string): void {
    this.filters.update(f => ({ 
      ...f, 
      status: status as InvestmentStatus | '' 
    }));
    this.filterChange$.next();
  }

  /**
   * Maneja cambio en búsqueda.
   */
  onSearchChange(search: string): void {
    this.filters.update(f => ({ ...f, search }));
    this.filterChange$.next();
  }

  /**
   * Limpia todos los filtros.
   */
  clearFilters(): void {
    this.filters.set({ status: '', search: '' });
    this.filterChange$.next();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGINACIÓN
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Navega a una página específica.
   */
  goToPage(page: number): void {
    const { totalPages, currentPage } = this.pagination();
    
    // Validar límites
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }

    this.pagination.update(p => ({ ...p, currentPage: page }));
    this.loadInvestments();

    // Scroll suave al inicio
    this.scrollToTop();
  }

  /**
   * Página anterior.
   */
  previousPage(): void {
    if (this.canGoPrevious()) {
      this.goToPage(this.pagination().currentPage - 1);
    }
  }

  /**
   * Página siguiente.
   */
  nextPage(): void {
    if (this.canGoNext()) {
      this.goToPage(this.pagination().currentPage + 1);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MODAL DE CREACIÓN
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Abre el modal de creación.
   * @param investorId - ID del inversionista preseleccionado (opcional)
   */
  openCreateModal(investorId?: string): void {
    this.preselectedInvestorId.set(investorId ?? null);
    this.isCreateModalOpen.set(true);
  }

  /**
   * Cierra el modal de creación.
   */
  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
    this.preselectedInvestorId.set(null);
  }

  /**
   * Maneja el envío del formulario de creación.
   */
  onCreateSubmit(payload: CreateInvestmentPayload): void {
    this.isSubmitting.set(true);

    this.investmentService
      .create(payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.showSuccess('Inversión creada exitosamente');
            this.closeCreateModal();
            this.refreshAll();
          } else {
            this.showError(res.message ?? 'Error al crear la inversión');
          }
        },
        error: (err) => {
          const message = this.extractErrorMessage(err);
          this.showError(message);
        },
      });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS PARA TEMPLATE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Obtiene el color del badge según el estado.
   */
  getStatusColor(status: string): 'success' | 'secondary' | 'warning' {
    const config = getInvestmentStatusConfig(status as InvestmentStatus);
    
    switch (config?.color) {
      case 'success':
      case 'warning':
      default:
        return 'secondary';
    }
  }

  /**
   * Obtiene el label traducido del estado.
   */
  getStatusLabel(status: string): string {
    const config = getInvestmentStatusConfig(status as InvestmentStatus);
    return config?.label ?? status;
  }

  /**
   * Obtiene la clase CSS para el ROI.
   */
  getRoiClass(roi: number | string): string {
    const value = this.parseDecimal(roi);
    
    if (value > 0) return 'text-success';
    if (value < 0) return 'text-danger';
    return 'text-muted';
  }

  /**
   * Formatea el ROI con signo.
   */
  formatRoi(roi: number | string): string {
    const value = this.parseDecimal(roi);
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  }

  /**
   * Formatea un valores.
   */
  formatCurrency = formatCurrency;
  parseDecimal = parseDecimal;
  formatDate = formatDate;



  /**
   * Track function para *ngFor.
   */
  trackById(_index: number, item: Investment): string {
    return item.id;
  }

  /**
   * Parsea un decimal string/number a number.
   */
  parseFloat(value: number | string): number {
    return this.parseDecimal(value);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTODOS PRIVADOS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Extrae mensaje de error de una respuesta.
   */
  private extractErrorMessage(err: any): string {
    if (err?.error?.message) return err.error.message;
    if (err?.error?.detail) return err.error.detail;
    if (err?.message) return err.message;
    return 'Error al procesar la solicitud';
  }

  /**
   * Scroll suave al inicio de la página.
   */
  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Muestra notificación de éxito.
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['snackbar-success'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  /**
   * Muestra notificación de error.
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['snackbar-error'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}