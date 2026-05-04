// facades/contract.facade.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { finalize, tap } from 'rxjs';

import { ContractService }   from '../services/contract.service';
import { InvestorService }   from '../services/investor.service';
import { NotificationService } from '../../../core/services/notification.service';

import type {
  ContractList,
  ContractDetail,
  ContractFilters,
  CreateContractPayload,
  ActivateContractPayload,
  TerminateContractPayload,
  RenewContractPayload,
} from '../models/contract.model';
import type { InvestorList } from '../models/investor.model';
import { ContractStatus } from '../models/enums';

export type ContractViewMode = 'all' | 'active' | 'expiring' | 'expired';

// ═══════════════════════════════════════════════════════════════════
// FACADE
// ═══════════════════════════════════════════════════════════════════

@Injectable()
export class ContractFacade {

  private readonly contractSvc = inject(ContractService);
  private readonly investorSvc = inject(InvestorService);
  private readonly router      = inject(Router);
  private readonly notify      = inject(NotificationService);

  // ═══════════════════════════════════════════════════════════
  // LIST STATE
  // ═══════════════════════════════════════════════════════════

  readonly listLoading  = signal(false);
  readonly listItems    = signal<ContractList[]>([]);
  readonly investors    = signal<InvestorList[]>([]);
  readonly viewMode     = signal<ContractViewMode>('all');
  readonly investorFilter = signal<string | null>(null);

  readonly listFilters  = signal<ContractFilters>({});

  // ── Derived ───────────────────────────────────────────────

  readonly listStats = computed(() => {
    const items = this.listItems();
    return {
      total:    items.length,
      active:   items.filter(c => c.status === ContractStatus.ACTIVE).length,
      expiring: items.filter(c => c.expiresSoon).length,
      expired:  items.filter(c => c.status === ContractStatus.EXPIRED).length,
    };
  });

  readonly pageTitle = computed(() => {
    const investorId = this.investorFilter();
    if (investorId) {
      const inv = this.investors().find(i => i.id === investorId);
      return inv ? `Contratos de ${inv.fullName}` : 'Contratos';
    }
    return 'Contratos de Inversionistas';
  });

  // ── Carga ─────────────────────────────────────────────────

  loadInvestors(): void {
    this.investorSvc.list({ isActive: true })
      .subscribe({ next: (res) => this.investors.set(res.data) });
  }

  loadContracts(): void {
    this.listLoading.set(true);
    const mode    = this.viewMode();
    const filters = this.listFilters();

    const request$ =
      mode === 'active'   ? this.contractSvc.getActive() :
      mode === 'expiring' ? this.contractSvc.getExpiring(30) :
      mode === 'expired'  ? this.contractSvc.getExpired() :
      this.contractSvc.list(filters);

    request$
      .pipe(finalize(() => this.listLoading.set(false)))
      .subscribe({
        next:  (res) => this.listItems.set(res.data),
        error: () => this.notify.error('Error al cargar contratos'),
      });
  }

  // ── Acciones de list ──────────────────────────────────────

  setViewMode(mode: ContractViewMode): void {
    this.viewMode.set(mode);
    this.listFilters.set({});
    this.loadContracts();
  }

  applyFilters(filters: ContractFilters): void {
    this.viewMode.set('all');
    this.listFilters.set(filters);
    this.loadContracts();
  }

  clearFilters(router: Router, route: ActivatedRoute): void {
    this.listFilters.set({});
    this.investorFilter.set(null);
    this.viewMode.set('all');
    this.loadContracts();
    router.navigate([], { relativeTo: route, queryParams: {} });
  }

  initInvestorFilter(investorId: string): void {
    this.investorFilter.set(investorId);
    this.listFilters.update(f => ({ ...f, investorId }));
  }

  downloadContract(contract: ContractList): void {
    this.contractSvc.download(contract.id).subscribe({
      next: (blob) => this.triggerDownload(blob, `${contract.contractNumber}.pdf`),
      error: () => this.notify.error('Error al descargar el contrato'),
    });
  }

  navigateToCreate(investorId?: string | null): void {
    const extras = investorId ? { queryParams: { investor: investorId } } : undefined;
    this.router.navigate(['/investments/contracts/new'], extras);
  }

  navigateToDetail(id: string): void {
    this.router.navigate(['/investments/contracts', id]);
  }

  // ═══════════════════════════════════════════════════════════
  // DETAIL STATE
  // ═══════════════════════════════════════════════════════════

  readonly detailLoading       = signal(true);
  readonly detailActionLoading = signal(false);
  readonly detail              = signal<ContractDetail | null>(null);

  // ── Derived ───────────────────────────────────────────────

  readonly canActivate = computed(() => {
    const s = this.detail()?.status;
    return s === ContractStatus.DRAFT;
  });

  readonly canTerminate = computed(() =>
    this.detail()?.status === ContractStatus.ACTIVE
  );

  readonly canRenew = computed(() => {
    const s = this.detail()?.status;
    return s === ContractStatus.ACTIVE || s === ContractStatus.EXPIRED;
  });

  // ── Carga ─────────────────────────────────────────────────

  loadContractDetail(id: string): void {
    this.detailLoading.set(true);
    this.contractSvc.getById(id)
      .pipe(finalize(() => this.detailLoading.set(false)))
      .subscribe({
        next:  (res) => this.detail.set(res.data),
        error: () => {
          this.notify.error('Error al cargar el contrato');
          this.router.navigate(['/investments/contracts']);
        },
      });
  }

  // ── Acciones ──────────────────────────────────────────────

  createContract(payload: CreateContractPayload) {
    this.detailActionLoading.set(true);

    return this.contractSvc.create(payload).pipe(
      finalize(() => this.detailActionLoading.set(false)),
      tap({
        next: () => {
          this.notify.success('Contrato creado');
        },
        error: (err) => {
          this.notify.error(err.error?.message ?? 'Error al crear contrato');
        },
      })
    );
  }


  activateContract(id: string, payload: ActivateContractPayload = {}): void {
    this.detailActionLoading.set(true);
    this.contractSvc.activate(id, payload)
      .pipe(finalize(() => this.detailActionLoading.set(false)))
      .subscribe({
        next:  (res) => { this.detail.set(res.data); this.notify.success('Contrato activado'); },
        error: () => this.notify.error('Error al activar el contrato'),
      });
  }

  terminateContract(id: string, payload: TerminateContractPayload): void {
    this.detailActionLoading.set(true);
    this.contractSvc.terminate(id, payload)
      .pipe(finalize(() => this.detailActionLoading.set(false)))
      .subscribe({
        next:  () => { this.notify.success('Contrato terminado'); this.loadContractDetail(id); },
        error: () => this.notify.error('Error al terminar el contrato'),
      });
  }

  renewContract(id: string, payload: RenewContractPayload): void {
    this.detailActionLoading.set(true);
    this.contractSvc.renew(id, payload)
      .pipe(finalize(() => this.detailActionLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.notify.success('Contrato renovado');
          this.router.navigate(['/investments/contracts', res.data.id]);
        },
        error: () => this.notify.error('Error al renovar el contrato'),
      });
  }

  downloadCurrentContract(): void {
    const c = this.detail();
    if (!c) return;
    this.contractSvc.download(c.id).subscribe({
      next:  (blob) => this.triggerDownload(blob, `${c.contractNumber}.pdf`),
      error: () => this.notify.error('Error al descargar'),
    });
  }

  goToInvestor(investorId: string): void {
    this.router.navigate(['/investments/investors', investorId]);
  }

  // ── Reset ─────────────────────────────────────────────────

  resetDetail(): void {
    this.detail.set(null);
  }

  // ── Helpers ───────────────────────────────────────────────

  private triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href    = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}