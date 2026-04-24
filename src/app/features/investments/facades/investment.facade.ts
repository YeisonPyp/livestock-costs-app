// facades/investment.facade.ts
//
// Facade que centraliza TODO el estado y lógica de negocio
// del sub-módulo investment. Pages y componentes solo inyectan
// este facade; nunca llaman servicios directamente.

import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, finalize, catchError, of, Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { InvestmentService }      from '../services/investment.service';
import { InvestorService }        from '../services/investor.service';
import { CattleOwnershipService } from '../services/cattle-ownership.service';
import { NotificationService }    from '../../../core/services/notification.service';

import type {
  InvestmentList,
  InvestmentDetail,
  InvestmentMovement,
  InvestmentDashboard,
  GlobalInvestmentSummary,
  ClosureStatus,
  InvestmentFilters,
  MovementFilters,
  CreateInvestmentPayload,
  ContributionPayload,
  WithdrawalPayload,
} from '../models/investment.model';
import type { CattleOwnership } from '../models/cattle-ownership.model';
import type { InvestorList }    from '../models/investor.model';
import { InvestmentStatus }     from '../models/enums';
import { formatCurrency, parseDecimal } from '../../../core/utils/helpers';

// ── Tipos locales ──────────────────────────────────────────────────────────

export interface ListFilters {
  status:   InvestmentStatus | '';
  search:   string;
  page:     number;
  pageSize: number;
}

export interface PaginationState {
  currentPage: number;
  totalPages:  number;
  totalItems:  number;
  pageSize:    number;
}

export interface StatsState {
  total:        number;
  active:       number;
  closed:       number;
  totalCapital: number;
  netProfit:    number;
  isLoading:    boolean;
}

export type OperationPanelType = 'contribute' | 'withdraw' | null;

const INITIAL_STATS: StatsState = {
  total: 0, active: 0, closed: 0,
  totalCapital: 0, netProfit: 0, isLoading: true,
};

// ═══════════════════════════════════════════════════════════════════════════
// FACADE
// ═══════════════════════════════════════════════════════════════════════════

@Injectable()
export class InvestmentFacade {

  private readonly investmentSvc = inject(InvestmentService);
  private readonly investorSvc   = inject(InvestorService);
  private readonly cattleSvc     = inject(CattleOwnershipService);
  private readonly router        = inject(Router);
  private readonly notify        = inject(NotificationService);

  // ═══════════════════════════════════════════════════════════════
  // LIST STATE
  // ═══════════════════════════════════════════════════════════════

  readonly listLoading  = signal(true);
  readonly listError    = signal(false);
  readonly listItems    = signal<InvestmentList[]>([]);
  readonly listStats    = signal<StatsState>(INITIAL_STATS);
  readonly isSubmitting = signal(false);
  readonly isModalOpen  = signal(false);

  readonly pagination = signal<PaginationState>({
    currentPage: 1, totalPages: 1, totalItems: 0, pageSize: 10,
  });

  readonly listFilters = signal<ListFilters>({
    status: '', search: '', page: 1, pageSize: 10,
  });

  // ── Derived ───────────────────────────────────────────────────

  readonly hasActiveFilters = computed(() => {
    const { status, search } = this.listFilters();
    return status !== '' || search.trim() !== '';
  });

  readonly emptyMessage = computed(() =>
    this.hasActiveFilters()
      ? 'No se encontraron inversiones con los filtros aplicados.'
      : 'Aún no hay inversiones registradas. ¡Crea la primera!'
  );

  readonly showPagination = computed(() => this.pagination().totalPages > 1);
  readonly canGoPrevious  = computed(() => this.pagination().currentPage > 1);
  readonly canGoNext      = computed(() => {
    const { currentPage, totalPages } = this.pagination();
    return currentPage < totalPages;
  });

  // ── Carga inicial ─────────────────────────────────────────────

  loadInitialData(): void {
    this.listLoading.set(true);
    this.listError.set(false);

    forkJoin({
      stats:       this.investmentSvc.getGlobalSummary().pipe(catchError(() => of(null))),
      investments: this.investmentSvc.list({ page: 1, pageSize: this.listFilters().pageSize })
                       .pipe(catchError(() => of(null))),
    }).pipe(finalize(() => this.listLoading.set(false)))
      .subscribe(({ stats, investments }) => {
        if (stats?.data)       this.applyStats(stats.data);
        if (investments?.data) {
          this.listItems.set(investments.data);
          this.applyPagination(investments.pagination);
        } else {
          this.listError.set(true);
        }
      });
  }

  loadInvestments(): void {
    this.listLoading.set(true);
    this.listError.set(false);

    const { status, search, page, pageSize } = this.listFilters();
    const filters: InvestmentFilters = { page, pageSize };
    if (status) filters.status = status;
    if (search.trim()) filters.search = search.trim();

    this.investmentSvc.list(filters)
      .pipe(finalize(() => this.listLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.listItems.set(res.data);
          this.applyPagination(res.pagination);
        },
        error: () => { this.listError.set(true); this.notify.error('Error al cargar las inversiones'); },
      });
  }

  refreshStats(): void {
    this.listStats.update(s => ({ ...s, isLoading: true }));
    this.investmentSvc.getGlobalSummary()
      .subscribe({ next: (res) => this.applyStats(res.data), error: () => this.listStats.update(s => ({ ...s, isLoading: false })) });
  }

  // ── Filtros ───────────────────────────────────────────────────

  updateFilter(patch: Partial<ListFilters>): void {
    this.listFilters.update(f => ({ ...f, ...patch, page: patch.page ?? 1 }));
    this.loadInvestments();
  }

  clearFilters(): void {
    this.listFilters.update(f => ({ ...f, status: '', search: '', page: 1 }));
    this.loadInvestments();
  }

  // ── Paginación ────────────────────────────────────────────────

  goToPage(page: number): void {
    const { totalPages, currentPage } = this.pagination();
    if (page < 1 || page > totalPages || page === currentPage) return;
    this.listFilters.update(f => ({ ...f, page }));
    this.loadInvestments();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  previousPage(): void { if (this.canGoPrevious()) this.goToPage(this.pagination().currentPage - 1); }
  nextPage():     void { if (this.canGoNext())      this.goToPage(this.pagination().currentPage + 1); }

  // ── Modal de creación ─────────────────────────────────────────

  openCreateModal(): void  { this.isModalOpen.set(true);  }
  closeCreateModal(): void { this.isModalOpen.set(false); }

  createInvestment(payload: CreateInvestmentPayload): void {
    this.isSubmitting.set(true);
    this.investmentSvc.create(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (res) => {
          this.notify.success('Inversión creada exitosamente');
          this.closeCreateModal();
          this.loadInvestments();
          this.refreshStats();
          this.router.navigate(['/investments/investments', res.data.id]);
        },
        error: (err) => this.notify.error(this.extractError(err)),
      });
  }

  // ── Navegación ────────────────────────────────────────────────

  navigateToDetail(id: string): void {
    this.router.navigate(['/investments/investments', id]);
  }

  // ═══════════════════════════════════════════════════════════════
  // DETAIL STATE
  // ═══════════════════════════════════════════════════════════════

  readonly detailLoading         = signal(true);
  readonly detailError           = signal(false);
  readonly detailErrorMessage    = signal('');
  readonly detail                = signal<InvestmentDetail | null>(null);
  readonly dashboard             = signal<InvestmentDashboard | null>(null);
  readonly movements             = signal<InvestmentMovement[]>([]);
  readonly cattle                = signal<CattleOwnership[]>([]);
  readonly closureStatus         = signal<ClosureStatus | null>(null);
  readonly movementsLoading      = signal(false);
  readonly cattleLoading         = signal(false);
  readonly operationLoading      = signal(false);
  readonly closingLoading        = signal(false);
  readonly activePanel           = signal<OperationPanelType>(null);
  readonly isCloseModalOpen      = signal(false);

  readonly movementFilters = signal<MovementFilters>({});

  // ── Derived ───────────────────────────────────────────────────

  readonly isActive = computed(() => this.detail()?.status === InvestmentStatus.ACTIVE);

  readonly canContribute = computed(() => this.isActive());

  readonly canWithdraw = computed(() => {
    const inv = this.detail();
    return inv?.status === InvestmentStatus.ACTIVE && parseDecimal(inv.currentCapital) > 0;
  });

  readonly canClose = computed(() => this.closureStatus()?.canClose ?? false);

  readonly availableForWithdraw = computed(() =>
    parseDecimal(this.detail()?.currentCapital ?? '0')
  );

  readonly activeCattle = computed(() =>
    this.cattle().filter(c => c.status === 'active')
  );

  readonly soldCattle = computed(() =>
    this.cattle().filter(c => c.status === 'sold')
  );

  readonly panelTitle = computed(() => {
    const t = this.activePanel();
    return t === 'contribute' ? 'Registrar Aporte' : t === 'withdraw' ? 'Procesar Retiro' : '';
  });

  // ── Carga ─────────────────────────────────────────────────────

  loadDetail(id: string): void {
    this.detailLoading.set(true);
    this.detailError.set(false);

    forkJoin({
      investment: this.investmentSvc.getById(id).pipe(catchError(() => of(null))),
      dashboard:  this.investmentSvc.getDashboard(id).pipe(catchError(() => of(null))),
    }).pipe(finalize(() => this.detailLoading.set(false)))
      .subscribe(({ investment, dashboard }) => {
        if (!investment?.data) {
          this.detailError.set(true);
          this.detailErrorMessage.set('No se encontró la inversión');
          return;
        }
        this.detail.set(investment.data);
        if (dashboard?.data) this.dashboard.set(dashboard.data);

        // Cargar datos secundarios en paralelo
        this.loadMovements();
        this.loadCattle();
        this.loadClosureStatus();
      });
  }

  loadMovements(): void {
    const id = this.detail()?.id;
    if (!id) return;
    this.movementsLoading.set(true);
    this.investmentSvc.getMovements(id, this.movementFilters())
      .pipe(finalize(() => this.movementsLoading.set(false)))
      .subscribe({
        next: (res) => this.movements.set(res.data),
        error: () => this.notify.error('Error al cargar los movimientos'),
      });
  }

  loadCattle(): void {
    const id = this.detail()?.id;
    if (!id) return;
    this.cattleLoading.set(true);
    this.cattleSvc.getByInvestment(id)
      .pipe(finalize(() => this.cattleLoading.set(false)))
      .subscribe({ next: (res) => this.cattle.set(res.data) });
  }

  loadClosureStatus(): void {
    const id = this.detail()?.id;
    if (!id) return;
    this.investmentSvc.getClosureStatus(id)
      .subscribe({ next: (res) => this.closureStatus.set(res.data) });
  }

  refreshDetail(): void {
    const id = this.detail()?.id;
    if (id) this.loadDetail(id);
  }

  // ── Filtros de movimientos ────────────────────────────────────

  applyMovementFilter(patch: Partial<MovementFilters>): void {
    this.movementFilters.update(f => ({ ...f, ...patch }));
    this.loadMovements();
  }

  clearMovementFilters(): void {
    this.movementFilters.set({});
    this.loadMovements();
  }

  // ── Panel aporte/retiro ───────────────────────────────────────

  openPanel(type: OperationPanelType): void {
    if (type === 'contribute' && !this.canContribute()) {
      this.notify.warning('No se pueden realizar aportes a esta inversión'); return;
    }
    if (type === 'withdraw' && !this.canWithdraw()) {
      this.notify.warning('No hay saldo disponible para retirar'); return;
    }
    this.activePanel.set(type);
  }

  closePanel(): void { this.activePanel.set(null); }

  submitContribute(payload: ContributionPayload): void {
    const id = this.detail()?.id;
    if (!id) return;
    this.operationLoading.set(true);
    this.investmentSvc.contribute(id, payload)
      .pipe(finalize(() => this.operationLoading.set(false)))
      .subscribe({
        next: () => { this.notify.success('Aporte registrado'); this.closePanel(); this.refreshDetail(); },
        error: (err) => this.notify.error(this.extractError(err)),
      });
  }

  submitWithdraw(payload: WithdrawalPayload): void {
    const id = this.detail()?.id;
    if (!id) return;
    this.operationLoading.set(true);
    this.investmentSvc.withdraw(id, payload)
      .pipe(finalize(() => this.operationLoading.set(false)))
      .subscribe({
        next: () => { this.notify.success('Retiro procesado'); this.closePanel(); this.refreshDetail(); },
        error: (err) => this.notify.error(this.extractError(err)),
      });
  }

  // ── Cierre ────────────────────────────────────────────────────

  openCloseModal(): void {
    if (!this.canClose()) { this.notify.warning('Esta inversión no puede cerrarse aún'); return; }
    this.isCloseModalOpen.set(true);
  }

  closeCloseModal(): void { this.isCloseModalOpen.set(false); }

  confirmClose(): void {
    const id = this.detail()?.id;
    if (!id) return;
    this.closingLoading.set(true);
    this.investmentSvc.close(id)
      .pipe(finalize(() => this.closingLoading.set(false)))
      .subscribe({
        next: () => { this.notify.success('Inversión cerrada'); this.closeCloseModal(); this.refreshDetail(); },
        error: (err) => this.notify.error(this.extractError(err)),
      });
  }

  // ── Navegación ────────────────────────────────────────────────

  goBackToList(): void { this.router.navigate(['/investments/investments']); }

  goToInvestor(investorId: string): void {
    this.router.navigate(['/investments/investors', investorId]);
  }

  // ── Reset ─────────────────────────────────────────────────────

  resetDetail(): void {
    this.detail.set(null); this.dashboard.set(null);
    this.movements.set([]); this.cattle.set([]);
    this.closureStatus.set(null); this.activePanel.set(null);
  }

  // ═══════════════════════════════════════════════════════════════
  // FORM STATE  (para el formulario de creación)
  // ═══════════════════════════════════════════════════════════════

  readonly formInvestors        = signal<InvestorList[]>([]);
  readonly formInvestorsLoading = signal(false);
  readonly formInvestorsError   = signal<string | null>(null);
  readonly hasActiveInvestment  = signal(false);
  readonly checkingActive       = signal(false);

  loadActiveInvestors(): void {
    this.formInvestorsLoading.set(true);
    this.formInvestorsError.set(null);
    this.investorSvc.list({ isActive: true })
      .pipe(finalize(() => this.formInvestorsLoading.set(false)))
      .subscribe({
        next: (res) => this.formInvestors.set(res.data),
        error: () => this.formInvestorsError.set('Error al cargar los inversionistas'),
      });
  }

  checkActiveInvestment(investorId: string): void {
    if (!investorId) { this.hasActiveInvestment.set(false); return; }
    this.checkingActive.set(true);
    this.investmentSvc.list({ investor: investorId })
      .pipe(finalize(() => this.checkingActive.set(false)))
      .subscribe({
        next: (res) => {
          this.hasActiveInvestment.set(
            res.data.some(inv => inv.status === InvestmentStatus.ACTIVE)
          );
        },
        error: () => this.hasActiveInvestment.set(false),
      });
  }

  // ── UI helpers (usados en templates) ─────────────────────────

  formatCurrency = formatCurrency;
  parseDecimal   = parseDecimal;

  formatRoi(roi: number | string): string {
    const v = parseDecimal(roi);
    return `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;
  }

  getRoiClass(roi: number | string): 'text-success' | 'text-danger' | 'text-muted' {
    const v = parseDecimal(roi);
    return v > 0 ? 'text-success' : v < 0 ? 'text-danger' : 'text-muted';
  }

  getStatusColor(status: string): 'success' | 'warning' | 'secondary' {
    if (status === InvestmentStatus.ACTIVE) return 'success';
    if (status === InvestmentStatus.SUSPENDED) return 'warning';
    return 'secondary';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Activa', closed: 'Cerrada', suspended: 'Suspendida',
    };
    return labels[status] ?? status;
  }

  // ── Helpers privados ──────────────────────────────────────────

  private applyStats(data: GlobalInvestmentSummary): void {
    this.listStats.set({
      total:        (data.totalActiveInvestments ?? 0),
      active:       data.totalActiveInvestments,
      closed:       0,
      totalCapital: parseDecimal(data.totalCapital),
      netProfit:    parseDecimal(data.totalProfit),
      isLoading:    false,
    });
  }

  private applyPagination(pagination?: any): void {
    if (!pagination) return;
    this.pagination.update(p => ({
      ...p,
      totalPages: pagination.total_pages ?? 1,
      totalItems: pagination.count ?? 0,
    }));
  }

  private extractError(err: any): string {
    return err?.error?.message ?? err?.error?.detail ?? err?.message ?? 'Error al procesar la solicitud';
  }
}