// facades/investor.facade.ts
//
// Facade que centraliza TODO el estado y la lógica de negocio
// del sub-módulo investor. Las pages solo inyectan este facade
// y no tienen ninguna lógica propia.

import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, finalize } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { InvestorService }        from '../services/investor.service';
import { InvestmentService }      from '../services/investment.service';
import { CattleOwnershipService } from '../services/cattle-ownership.service';
import { SaleDecisionService }    from '../services/sale-decision.service';
import { ContractService }        from '../services/contract.service';
import { NotificationService }    from '../../../core/services/notification.service';

import type {
  InvestorList,
  InvestorDetail,
  InvestorSummary,
  InvestorFilters,
  CreateInvestorPayload,
  UpdateInvestorPayload,
  DeactivateInvestorPayload,
} from '../models/investor.model';
import type { InvestmentList }  from '../models/investment.model';
import type { CattleOwnership } from '../models/cattle-ownership.model';
import type { SaleDecisionList } from '../models/sale.model';
import type { ContractList, CreateContractPayload } from '../models/contract.model';

// ── Tipos de estado ────────────────────────────────────────────────

export interface InvestorListFilters {
  search:      string;
  showInactive: boolean;
  page:        number;
  pageSize:    number;
}

export interface InvestorListState {
  items:      InvestorList[];
  loading:    boolean;
  totalPages: number;
  filters:    InvestorListFilters;
}

export interface InvestorDetailState {
  investor:    InvestorDetail | null;
  summary:     InvestorSummary | null;
  investments: InvestmentList[];
  cattle:      CattleOwnership[];
  decisions:   SaleDecisionList[];
  contracts:   ContractList[];
  loading:     boolean;
  actionLoading: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// FACADE
// ═══════════════════════════════════════════════════════════════════

@Injectable()          // providedIn: 'root' intencional — se provee a nivel de ruta
export class InvestorFacade {

  // ── Dependencias ─────────────────────────────────────────────────

  private readonly investorSvc = inject(InvestorService);
  private readonly investmentSvc = inject(InvestmentService);
  private readonly cattleSvc   = inject(CattleOwnershipService);
  private readonly decisionSvc = inject(SaleDecisionService);
  private readonly contractSvc = inject(ContractService);
  private readonly router      = inject(Router);
  private readonly notify      = inject(NotificationService);

  // ═══════════════════════════════════════════════════════════
  // SECCIÓN LIST
  // ═══════════════════════════════════════════════════════════

  // ── Estado ────────────────────────────────────────────────

  readonly listLoading    = signal(false);
  readonly listItems      = signal<InvestorList[]>([]);
  readonly listTotalPages = signal(1);

  readonly listFilters = signal<InvestorListFilters>({
    search:      '',
    showInactive: false,
    page:        1,
    pageSize:    12,
  });

  // ── Derived ───────────────────────────────────────────────

  readonly listStats = computed(() => {
    const items = this.listItems();
    return {
      total:    items.length,
      active:   items.filter(i => i.isActive).length,
      totalCapital: items.reduce((s, i) => s + Number(i.totalCapital ?? 0), 0),
    };
  });

  // ── Acciones ──────────────────────────────────────────────

  loadInvestors(): void {
    const { search, showInactive, page, pageSize } = this.listFilters();
    this.listLoading.set(true);

    this.investorSvc.list({
      search:   search || undefined,
      isActive: showInactive ? undefined : true,
      page,
      pageSize,
    }).pipe(finalize(() => this.listLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.listItems.set(res.data);
          this.listTotalPages.set(res.pagination?.total_pages ?? 1);
        },
        error: () => this.notify.error('Error al cargar inversionistas'),
      });
  }

  updateListFilter(patch: Partial<InvestorListFilters>): void {
    this.listFilters.update(f => ({ ...f, ...patch, page: patch.page ?? 1 }));
    this.loadInvestors();
  }

  goToPage(page: number): void {
    this.updateListFilter({ page });
  }

  navigateToDetail(id: string): void {
    this.router.navigate(['/investments/investors', id]);
  }

  navigateToCreate(): void {
    this.router.navigate(['/investors/new']);
  }

  // ═══════════════════════════════════════════════════════════
  // SECCIÓN DETAIL
  // ═══════════════════════════════════════════════════════════

  // ── Estado ────────────────────────────────────────────────

  readonly detailLoading      = signal(true);
  readonly detailActionLoading = signal(false);
  readonly detail              = signal<InvestorDetail | null>(null);
  readonly summary             = signal<InvestorSummary | null>(null);
  readonly detailInvestments   = signal<InvestmentList[]>([]);
  readonly detailCattle        = signal<CattleOwnership[]>([]);
  readonly detailDecisions     = signal<SaleDecisionList[]>([]);
  readonly detailContracts     = signal<ContractList[]>([]);

  // ── Derived ───────────────────────────────────────────────

  readonly hasPendingDecisions = computed(() =>
    (this.summary()?.pendingDecisions ?? 0) > 0
  );

  readonly canDeactivate = computed(() =>
    this.detail()?.isActive === true
  );

  readonly decisionBadgeColor = (type: string) => {
    const map: Record<string, 'success' | 'danger' | 'warning' | 'secondary'> = {
      reinvest: 'success',
      withdraw: 'danger',
      partial:  'warning',
      pending:  'secondary',
    };
    return map[type] ?? 'secondary';
  };

  // ── Carga ─────────────────────────────────────────────────

  loadDetail(id: string): void {
    this.detailLoading.set(true);

    forkJoin({
      investor:    this.investorSvc.getById(id),
      summary:     this.investorSvc.getSummary(id),
      investments: this.investmentSvc.list({ investor: id }),
      cattle:      this.cattleSvc.getByInvestor(id),
      decisions:   this.decisionSvc.list({ investor: id }),
      contracts:   this.investorSvc.getContracts(id),
    }).pipe(finalize(() => this.detailLoading.set(false)))
      .subscribe({
        next: (results) => {
          this.detail.set(results.investor.data);
          this.summary.set(results.summary.data);
          this.detailInvestments.set(results.investments.data);
          this.detailCattle.set(results.cattle.data);
          this.detailDecisions.set(results.decisions.data);
          this.detailContracts.set(results.contracts.data);
        },
        error: () => {
          this.notify.error('Error al cargar el inversionista');
          this.router.navigate(['/investments/investors']);
        },
      });
  }

  refreshDetail(): void {
    const id = this.detail()?.id;
    if (id) this.loadDetail(id);
  }

  // ── Acciones ──────────────────────────────────────────────

  deactivate(id: string, payload: DeactivateInvestorPayload = {}): void {
    this.detailActionLoading.set(true);
    this.investorSvc.deactivate(id, payload)
      .pipe(finalize(() => this.detailActionLoading.set(false)))
      .subscribe({
        next: (res) => {
          if (res.data.deactivated) {
            this.notify.success('Inversionista desactivado');
            this.refreshDetail();
          } else if (res.data.requiresForce) {
            this.notify.warning('Existen dependencias. Usa forzar para continuar.');
          }
        },
        error: () => this.notify.error('Error al desactivar'),
      });
  }

  reactivate(id: string): void {
    this.detailActionLoading.set(true);
    this.investorSvc.reactivate(id)
      .pipe(finalize(() => this.detailActionLoading.set(false)))
      .subscribe({
        next: () => { this.notify.success('Inversionista reactivado'); this.refreshDetail(); },
        error: () => this.notify.error('Error al reactivar'),
      });
  }

  createContract(investorId: string, payload: CreateContractPayload): void {
    this.detailActionLoading.set(true);
    this.contractSvc.create(payload)
      .pipe(finalize(() => this.detailActionLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.notify.success('Contrato creado');
          this.router.navigate(['/investments/contracts', res.data.id]);
        },
        error: () => this.notify.error('Error al crear contrato'),
      });
  }

  // ── Navegación ────────────────────────────────────────────

  goToContracts(investorId: string): void {
    this.router.navigate(['/investments/contracts'], {
      queryParams: { investor: investorId },
    });
  }

  goToEdit(investorId: string): void {
    this.router.navigate(['/investments/investors', investorId, 'edit']);
  }

  // ═══════════════════════════════════════════════════════════
  // SECCIÓN FORM
  // ═══════════════════════════════════════════════════════════

  readonly formLoading = signal(false);
  readonly formSaving  = signal(false);

  loadInvestorForEdit(id: string, patchFn: (data: InvestorDetail) => void): void {
    this.formLoading.set(true);
    this.investorSvc.getById(id)
      .pipe(finalize(() => this.formLoading.set(false)))
      .subscribe({
        next: (res) => patchFn(res.data),
        error: () => {
          this.notify.error('Error al cargar el inversionista');
          this.router.navigate(['/investments/investors']);
        },
      });
  }

  createInvestor(payload: CreateInvestorPayload): void {
    this.formSaving.set(true);
    this.investorSvc.create(payload)
      .pipe(finalize(() => this.formSaving.set(false)))
      .subscribe({
        next: (res) => {
          this.notify.success('Inversionista creado');
          this.router.navigate(['/investments/investors', res.data.id]);
        },
        error: (err) => this.notify.error(err?.error?.message ?? 'Error al guardar'),
      });
  }

  updateInvestor(id: string, payload: UpdateInvestorPayload): void {
    this.formSaving.set(true);
    this.investorSvc.update(id, payload)
      .pipe(finalize(() => this.formSaving.set(false)))
      .subscribe({
        next: () => {
          this.notify.success('Inversionista actualizado');
          this.router.navigate(['/investments/investors', id]);
        },
        error: (err) => this.notify.error(err?.error?.message ?? 'Error al guardar'),
      });
  }

  // ── Utilidades ────────────────────────────────────────────

  /** Resetea el estado de detalle al abandonar la página. */
  resetDetail(): void {
    this.detail.set(null);
    this.summary.set(null);
    this.detailInvestments.set([]);
    this.detailCattle.set([]);
    this.detailDecisions.set([]);
    this.detailContracts.set([]);
  }
}