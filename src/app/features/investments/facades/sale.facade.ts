// facades/sale.facade.ts
//
// Facade que centraliza TODO el estado y lógica del sub-módulo de ventas.
// Cubre: lista de ventas, detalle, decisiones y creación de venta.

import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import { SaleEventService }    from '../services/sale-event.service';
import { SaleDecisionService } from '../services/sale-decision.service';
import { NotificationService } from '../../../core/services/notification.service';

import type {
  SaleEventList,
  SaleEventDetail,
  SaleDecisionList,
  SaleDecisionDetail,
  CreateSaleEventPayload,
  SaleEventFilters,
  MakeDecisionPayload,
  GenerateDecisionsResult,
  FinalizeResult,
} from '../models/sale.model';
import { SaleDecisionType } from '../models/enums';
import { formatCurrency, parseDecimal } from '../../../core/utils/helpers';

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface SaleListStats {
  total:      number;
  pending:    number;
  totalNet:   number;
  totalHeads: number;
}

export interface AnimalSelection {
  id:             string;
  tagNumber:      string;
  name?:          string;
  breedName:      string;
  currentWeight:  number;
  investorCode?:  string;
}

// ═══════════════════════════════════════════════════════════════════════════
// FACADE
// ═══════════════════════════════════════════════════════════════════════════

@Injectable()
export class SaleFacade {

  private readonly saleEventSvc    = inject(SaleEventService);
  private readonly saleDecisionSvc = inject(SaleDecisionService);
  private readonly router          = inject(Router);
  private readonly notify          = inject(NotificationService);

  // ═══════════════════════════════════════════════════════════════════════
  // LIST STATE
  // ═══════════════════════════════════════════════════════════════════════

  readonly listLoading  = signal(true);
  readonly listItems    = signal<SaleEventList[]>([]);
  readonly currentPage  = signal(1);
  readonly totalPages   = signal(1);
  readonly filterStatus = signal<'' | 'false' | 'true'>('');
  readonly showDrawer   = signal(false);

  readonly listStats = computed<SaleListStats>(() => {
    const items = this.listItems();
    return {
      total:      items.length,
      pending:    items.filter(s => !s.isFinalized).length,
      totalNet:   items.reduce((s, x) => s + parseDecimal(x.netAmount), 0),
      totalHeads: items.reduce((s, x) => s + x.totalHeads, 0),
    };
  });

  // ── Carga ─────────────────────────────────────────────────────────────

  loadSales(): void {
    this.listLoading.set(true);
    const filters: SaleEventFilters = { page: this.currentPage() };
    if (this.filterStatus() !== '') {
      filters.isFinalized = this.filterStatus() === 'true';
    }

    this.saleEventSvc.list(filters)
      .pipe(finalize(() => this.listLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.listItems.set(res.data);
          this.totalPages.set(res.pagination?.total_pages ?? 1);
        },
        error: () => this.notify.error('Error al cargar ventas'),
      });
  }

  applyFilter(status: '' | 'false' | 'true'): void {
    this.filterStatus.set(status);
    this.currentPage.set(1);
    this.loadSales();
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadSales();
  }

  // ── Drawer de creación ────────────────────────────────────────────────

  openDrawer(): void  { this.showDrawer.set(true); }
  closeDrawer(): void { this.showDrawer.set(false); }

  onSaleSaved(): void {
    this.closeDrawer();
    this.loadSales();
  }

  navigateToDetail(id: string): void {
    this.router.navigate(['/investments/sales', id]);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SALE CREATE STATE
  // ═══════════════════════════════════════════════════════════════════════

  readonly createSaving         = signal(false);
  readonly createError          = signal('');
  readonly selectedAnimals      = signal<AnimalSelection[]>([]);
  readonly showWeightModal      = signal(false);
  readonly pricePerKg           = signal(0);
  readonly saleCostsValue       = signal(0);

  readonly totalHeads  = computed(() => this.selectedAnimals().length);
  readonly totalWeight = computed(() =>
    this.selectedAnimals().reduce((s, a) => s + (a.currentWeight || 0), 0)
  );
  readonly grossAmount = computed(() =>
    Math.round(this.totalWeight() * this.pricePerKg() * 100) / 100
  );
  readonly netAmount = computed(() =>
    Math.round((this.grossAmount() - this.saleCostsValue()) * 100) / 100
  );
  readonly hasAnimals = computed(() => this.selectedAnimals().length > 0);

  setAnimals(animals: AnimalSelection[]): void {
    this.selectedAnimals.set(animals);
    this.createError.set('');
  }

  removeAnimal(index: number): void {
    const list = [...this.selectedAnimals()];
    list.splice(index, 1);
    this.selectedAnimals.set(list);
  }

  clearAnimals(): void { this.selectedAnimals.set([]); }

  setPricePerKg(v: number): void    { this.pricePerKg.set(v); }
  setSaleCosts(v: number): void     { this.saleCostsValue.set(v); }

  submitCreate(payload: CreateSaleEventPayload, onSuccess: () => void): void {
    if (!this.hasAnimals()) {
      this.createError.set('Debes seleccionar al menos un animal.');
      return;
    }
    if (this.netAmount() <= 0) {
      this.createError.set('El monto neto debe ser mayor a cero.');
      return;
    }

    this.createSaving.set(true);
    this.createError.set('');

    this.saleEventSvc.create(payload)
      .pipe(finalize(() => this.createSaving.set(false)))
      .subscribe({
        next: () => {
          this.notify.success('Venta registrada exitosamente');
          this.resetCreateForm();
          onSuccess();
        },
        error: (err) => {
          this.createError.set(err?.error?.message || 'Error al registrar la venta.');
        },
      });
  }

  resetCreateForm(): void {
    this.selectedAnimals.set([]);
    this.pricePerKg.set(0);
    this.saleCostsValue.set(0);
    this.createError.set('');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SALE DETAIL STATE
  // ═══════════════════════════════════════════════════════════════════════

  readonly detailLoading  = signal(true);
  readonly detailFinalizing = signal(false);
  readonly detail         = signal<SaleEventDetail | null>(null);
  readonly decisions      = signal<SaleDecisionList[]>([]);

  readonly pendingCount   = computed(() =>
    this.decisions().filter(d => d.decisionType === SaleDecisionType.PENDING).length
  );
  readonly processedCount = computed(() =>
    this.decisions().filter(d => d.isProcessed).length
  );
  readonly canFinalize    = computed(() =>
    !!this.detail() && !this.detail()!.isFinalized && this.pendingCount() === 0
  );

  loadSaleDetail(id: string): void {
    this.detailLoading.set(true);
    forkJoin({
      sale:      this.saleEventSvc.getById(id),
      decisions: this.saleEventSvc.getById(id), // placeholder — se usa decisions endpoint
    }).pipe(finalize(() => this.detailLoading.set(false)))
      .subscribe(); // ver nota abajo

    // Carga real — getById + decisions en paralelo
    this.saleEventSvc.getById(id)
      .pipe(finalize(() => this.detailLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.detail.set(res.data);
          // Las decisions vienen incluidas en el detail
          this.decisions.set(res.data.decisions as any ?? []);
        },
        error: () => {
          this.notify.error('Error al cargar la venta');
          this.router.navigate(['/investments/sales']);
        },
      });
  }

  finalizeSale(id: string): void {
    this.detailFinalizing.set(true);
    this.saleEventSvc.process(id)
      .pipe(finalize(() => this.detailFinalizing.set(false)))
      .subscribe({
        next: () => {
          this.notify.success('Venta finalizada exitosamente');
          this.loadSaleDetail(id);
        },
        error: (err) => this.notify.error(err?.error?.error || 'Error al finalizar'),
      });
  }

  resetDetail(): void {
    this.detail.set(null);
    this.decisions.set([]);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DECISION STATE
  // ═══════════════════════════════════════════════════════════════════════

  readonly decisionLoading  = signal(true);
  readonly decisionSaving   = signal(false);
  readonly decision         = signal<SaleDecisionDetail | null>(null);
  readonly selectedType     = signal<SaleDecisionType | null>(null);

  readonly isAlreadyDecided = computed(() => {
    const d = this.decision();
    return !!d && d.decisionType !== SaleDecisionType.PENDING;
  });

  loadDecision(id: string): void {
    this.decisionLoading.set(true);
    this.saleDecisionSvc.getById(id)
      .pipe(finalize(() => this.decisionLoading.set(false)))
      .subscribe({
        next:  (res) => this.decision.set(res.data),
        error: () => this.notify.error('Error al cargar la decisión'),
      });
  }

  selectDecisionType(type: SaleDecisionType): void {
    this.selectedType.set(type);
  }

  cancelDecisionSelection(): void { this.selectedType.set(null); }

  confirmDecision(payload: MakeDecisionPayload): void {
    const id = this.decision()?.id;
    if (!id) return;

    if (payload.decisionType === SaleDecisionType.PARTIAL) {
      const total = parseDecimal(this.decision()!.investorAmount);
      const sum   = (payload.reinvestAmount ?? 0) + (payload.withdrawAmount ?? 0);
      if (Math.abs(sum - total) > 0.01) {
        this.notify.warning('La suma de reinversión y retiro debe igualar el monto total');
        return;
      }
    }

    this.decisionSaving.set(true);
    this.saleDecisionSvc.makeDecision(id, payload)
      .pipe(finalize(() => this.decisionSaving.set(false)))
      .subscribe({
        next: () => {
          this.notify.success('Decisión registrada exitosamente');
          this.router.navigate(['/investments/sales', this.decision()!.saleEventId]);
        },
        error: (err) => this.notify.error(err?.error?.error || 'Error al registrar decisión'),
      });
  }

  resetDecision(): void { this.decision.set(null); this.selectedType.set(null); }

  // ── UI helpers comunes ────────────────────────────────────────────────

  readonly formatCurrency = formatCurrency;
  readonly parseDecimal   = parseDecimal;

  decisionColor(type: string): 'success' | 'danger' | 'warning' | 'secondary' {
    const map: Record<string, any> = {
      reinvest: 'success', withdraw: 'danger',
      partial: 'warning', pending: 'secondary',
    };
    return map[type] ?? 'secondary';
  }

  decisionLabel(type: string): string {
    const map: Record<string, string> = {
      reinvest: 'Reinvertir', withdraw: 'Retirar',
      partial: 'Distribuir', pending: 'Pendiente',
      full_withdrawal: 'Retiro total',
    };
    return map[type] ?? type;
  }

  formatWeight(v: number): string {
    return `${v.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;
  }

  today(): string { return new Date().toISOString().split('T')[0]; }
}