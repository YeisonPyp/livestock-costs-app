import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, forkJoin, catchError, of, switchMap, tap } from 'rxjs';

import { SaleEventService } from '../services/sale-event.service';
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
  GenerateDecisionsPayload,
  SaleSummary,
} from '../models/sale.model';
import { SaleDecisionType } from '../models/enums';
import { formatCurrency, parseDecimal } from '../../../core/utils/helpers';

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface SaleListStats {
  total: number;
  pending: number;
  finalized: number;
  totalNet: number;
  totalHeads: number;
  isLoading: boolean;
}

export interface AnimalSelection {
  id: string;
  tagNumber: string;
  name?: string;
  breedName: string;
  currentWeight: number;
  investorCode?: string;
}

export interface SalePaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

type FilterStatus = '' | 'false' | 'true';

const INITIAL_STATS: SaleListStats = {
  total: 0,
  pending: 0,
  finalized: 0,
  totalNet: 0,
  totalHeads: 0,
  isLoading: true,
};

const PAGE_SIZE = 10;

// ═══════════════════════════════════════════════════════════════════════════
// FACADE
// ═══════════════════════════════════════════════════════════════════════════

@Injectable()
export class SaleFacade {
  private readonly saleEventSvc = inject(SaleEventService);
  private readonly saleDecisionSvc = inject(SaleDecisionService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  // ═══════════════════════════════════════════════════════════════════════
  // LIST STATE
  // ═══════════════════════════════════════════════════════════════════════

  readonly listLoading = signal(true);
  readonly listItems = signal<SaleEventList[]>([]);
  readonly listStats = signal<SaleListStats>(INITIAL_STATS);
  readonly showDrawer = signal(false);

  readonly pagination = signal<SalePaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: PAGE_SIZE,
  });

  readonly filterStatus = signal<FilterStatus>('');
  readonly searchTerm = signal('');

  // ── Derived ───────────────────────────────────────────────────────────

  readonly hasActiveFilters = computed(
    () => this.filterStatus() !== '' || this.searchTerm().trim() !== '',
  );

  readonly showPagination = computed(() => this.pagination().totalPages > 1);
  readonly canGoPrevious = computed(() => this.pagination().currentPage > 1);
  readonly canGoNext = computed(() => {
    const { currentPage, totalPages } = this.pagination();
    return currentPage < totalPages;
  });

  // ── Carga inicial ─────────────────────────────────────────────────────

  loadInitialData(): void {
    this.listLoading.set(true);
    this.listStats.update((s) => ({ ...s, isLoading: true }));

    this.loadSales();
  }

  loadSales(): void {
    this.listLoading.set(true);

    const filters: SaleEventFilters = {
      page: this.pagination().currentPage,
      pageSize: PAGE_SIZE,
    };

    const status = this.filterStatus();
    if (status !== '') {
      filters.isFinalized = status === 'true';
    }

    // const search = this.searchTerm().trim();
    // if (search) {
    //   filters.search = search;
    // }

    this.saleEventSvc
      .list(filters)
      .pipe(finalize(() => this.listLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.listItems.set(res.data);
          this.applyPagination(res.pagination);
          this.computeStats(res.data);
        },
        error: () => {
          this.notify.error('Error al cargar ventas');
          this.listStats.update((s) => ({ ...s, isLoading: false }));
        },
      });
  }

  // ── Filtros ───────────────────────────────────────────────────────────

  applyFilter(status: FilterStatus): void {
    this.filterStatus.set(status);
    this.pagination.update((p) => ({ ...p, currentPage: 1 }));
    this.loadSales();
  }

  applySearch(term: string): void {
    this.searchTerm.set(term);
    this.pagination.update((p) => ({ ...p, currentPage: 1 }));
    this.loadSales();
  }

  clearFilters(): void {
    this.filterStatus.set('');
    this.searchTerm.set('');
    this.pagination.update((p) => ({ ...p, currentPage: 1 }));
    this.loadSales();
  }

  // ── Paginación ────────────────────────────────────────────────────────

  goToPage(page: number): void {
    const { totalPages, currentPage } = this.pagination();
    if (page < 1 || page > totalPages || page === currentPage) return;
    this.pagination.update((p) => ({ ...p, currentPage: page }));
    this.loadSales();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  previousPage(): void {
    if (this.canGoPrevious()) this.goToPage(this.pagination().currentPage - 1);
  }

  nextPage(): void {
    if (this.canGoNext()) this.goToPage(this.pagination().currentPage + 1);
  }

  // ── Drawer de creación ────────────────────────────────────────────────

  openDrawer(): void {
    this.showDrawer.set(true);
  }

  closeDrawer(): void {
    this.showDrawer.set(false);
  }

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

  readonly createSaving = signal(false);
  readonly createError = signal('');
  readonly selectedAnimals = signal<AnimalSelection[]>([]);
  readonly showWeightModal = signal(false);
  readonly pricePerKg = signal(0);
  readonly saleCostsValue = signal(0);

  readonly totalHeads = computed(() => this.selectedAnimals().length);
  readonly totalWeight = computed(() =>
    this.selectedAnimals().reduce((s, a) => s + (a.currentWeight || 0), 0),
  );
  readonly grossAmount = computed(
    () => Math.round(this.totalWeight() * this.pricePerKg() * 100) / 100,
  );
  readonly netAmount = computed(
    () => Math.round((this.grossAmount() - this.saleCostsValue()) * 100) / 100,
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

  clearAnimals(): void {
    this.selectedAnimals.set([]);
  }

  setPricePerKg(v: number): void {
    this.pricePerKg.set(v);
  }

  setSaleCosts(v: number): void {
    this.saleCostsValue.set(v);
  }

// sale.facade.ts — submitCreate

submitCreate(payload: CreateSaleEventPayload, onSuccess: () => void): void {
  // ── Validaciones previas ──────────────────────────────────────────
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

  const evidenceFile = this.evidenceFile();
  const deadline = this.decisionDeadline();

  // ── PASO 1: Crear la venta ────────────────────────────────────────
  this.saleEventSvc.create(payload).pipe(
    // ── PASO 2: Subir evidencia (solo si hay archivo) ─────────────
    switchMap((createRes) => {
      const saleId = createRes.data.id;

      if (evidenceFile) {
        return this.saleEventSvc.uploadEvidence(saleId, evidenceFile).pipe(
          // Si falla la evidencia, no bloqueamos. Notificamos y seguimos.
          catchError((err) => {
            console.warn('Error subiendo evidencia:', err);
            this.notify.warning(
              'La venta se creó pero hubo un error al subir la evidencia. ' +
              'Puede subirla después desde el detalle.'
            );
            // Retornamos el resultado original para continuar
            return of(createRes);
          }),
        );
      }

      // Sin evidencia → seguir con el resultado del create
      return of(createRes);
    }),

    // ── PASO 3: Generar decisiones ──────────────────────────────────
    switchMap((res) => {
      const saleId = res.data.id;

      const generatePayload: GenerateDecisionsPayload = {};
      if (deadline) {
        generatePayload.decisionDeadline = deadline;
      }

      return this.saleEventSvc.generateDecisions(saleId, generatePayload).pipe(
        tap((genRes) => {
          const data = genRes.data;
          this.notify.success(
            `Venta registrada. ${data.decisionsCreated} decisión(es) generada(s).`
          );
        }),
        catchError((err) => {
          console.warn('Error generando decisiones:', err);
          this.notify.warning(
            'La venta se creó exitosamente pero hubo un error al generar las decisiones. ' +
            'Puede generarlas desde el detalle de la venta.'
          );
          return of(null);
        }),
      );
    }),

    finalize(() => this.createSaving.set(false)),
  ).subscribe({
    next: () => {
      this.resetCreateForm();
      onSuccess();
    },
    error: (err) => {
      // Este error solo se alcanza si falla el PASO 1 (crear venta)
      this.createError.set(err?.error?.errors || 'Error al registrar la venta.'
      );
    },
  });
}

  resetCreateForm(): void {
  this.selectedAnimals.set([]);
  this.pricePerKg.set(0);
  this.saleCostsValue.set(0);
  this.createError.set('');
  this.evidenceFile.set(null);
  this.evidenceError.set('');
  this.isDragging.set(false);
  this.decisionDeadline.set(null);
}

  // ═══════════════════════════════════════════════════════════════════════
  // SALE DETAIL STATE
  // ═══════════════════════════════════════════════════════════════════════

  readonly detailLoading = signal(true);
  readonly detailFinalizing = signal(false);
  readonly detail = signal<SaleEventDetail | null>(null);
  readonly decisions = signal<SaleDecisionList[]>([]);

  readonly pendingCount = computed(
    () =>
      this.decisions().filter(
        (d) => d.decisionType === SaleDecisionType.PENDING,
      ).length,
  );

  readonly processedCount = computed(
    () => this.decisions().filter((d) => d.isProcessed).length,
  );

  readonly canFinalize = computed(
    () =>
      !!this.detail() &&
      !this.detail()!.isFinalized &&
      this.pendingCount() === 0,
  );

  loadSaleDetail(id: string): void {
    this.detailLoading.set(true);

    this.saleEventSvc
      .getById(id)
      .pipe(finalize(() => this.detailLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.detail.set(res.data);
          this.decisions.set((res.data.decisions as any) ?? []);
        },
        error: () => {
          this.notify.error('Error al cargar la venta');
          this.router.navigate(['/investments/sales']);
        },
      });
  }

  finalizeSale(id: string): void {
    this.detailFinalizing.set(true);
    this.saleEventSvc
      .process(id)
      .pipe(finalize(() => this.detailFinalizing.set(false)))
      .subscribe({
        next: () => {
          this.notify.success('Venta finalizada exitosamente');
          this.loadSaleDetail(id);
        },
        error: (err) =>
          this.notify.error(err?.error?.error || 'Error al finalizar'),
      });
  }

  resetDetail(): void {
    this.detail.set(null);
    this.decisions.set([]);
  }

    // ═══════════════════════════════════════════════════════════════════════
  // DECISION STATE
  // ═══════════════════════════════════════════════════════════════════════

  readonly decisionLoading = signal(true);
  readonly decisionSaving = signal(false);
  readonly decision = signal<SaleDecisionDetail | null>(null);
  readonly selectedType = signal<SaleDecisionType | null>(null);
  readonly decisionDeadline = signal<string | null>(null);

  readonly isAlreadyDecided = computed(() => {
    const d = this.decision();
    return !!d && d.decisionType !== SaleDecisionType.PENDING;
  });

  // ── ✨ Desglose financiero reactivo desde el backend ────────────────
  readonly investorAmount = computed(() =>
    this.decision() ? parseDecimal(this.decision()!.investorAmount) : 0
  );
  readonly effectiveProfit = computed(() =>
    this.decision() ? parseDecimal(this.decision()!.effectiveProfit) : 0
  );
  readonly tax4x1000 = computed(() =>
    this.decision() ? parseDecimal(this.decision()!.tax4x1000) : 0
  );
  readonly netValueToDecide = computed(() =>
    this.decision() ? parseDecimal(this.decision()!.netValueToDecide) : 0
  );

  loadDecision(id: string): void {
    this.decisionLoading.set(true);
    this.saleDecisionSvc
      .getById(id)
      .pipe(finalize(() => this.decisionLoading.set(false)))
      .subscribe({
        next: (res) => this.decision.set(res.data),
        error: () => this.notify.error('Error al cargar la decisión'),
      });
  }

  selectDecisionType(type: SaleDecisionType): void {
    this.selectedType.set(type);
  }

  cancelDecisionSelection(): void {
    this.selectedType.set(null);
  }

  /**
   * Confirma la decisión del inversionista.
   *
   * ⚠️ Lógica actualizada para PARTIAL:
   *   - withdrawAmount se valida contra netValueToDecide (NO investorAmount)
   *   - Las ganancias se retiran automáticamente por el backend
   *   - Solo se envía withdrawAmount (el backend calcula reinvestAmount)
   */
  confirmDecision(payload: MakeDecisionPayload): void {
    const d = this.decision();
    if (!d) return;

    // ── Validación específica para PARTIAL ──────────────────────────
    if (payload.decisionType === SaleDecisionType.PARTIAL) {
      const net = this.netValueToDecide();
      const withdraw = payload.withdrawAmount ?? 0;

      if (withdraw <= 0) {
        this.notify.warning(
          'El monto a retirar del valor neto debe ser mayor a cero. ' +
          'Use "Reinvertir" si desea reinvertir todo.'
        );
        return;
      }

      if (withdraw > net + 0.01) {
        this.notify.warning(
          `El monto a retirar ($${withdraw.toLocaleString('es-CO')}) ` +
          `excede el valor neto a decidir ($${net.toLocaleString('es-CO')}).`
        );
        return;
      }

      // Solo enviar withdrawAmount; el backend calcula el resto
      payload = {
        decisionType: SaleDecisionType.PARTIAL,
        withdrawAmount: withdraw,
        notes: payload.notes,
      };
    }

    this.decisionSaving.set(true);
    this.saleDecisionSvc
      .makeDecision(d.id, payload)
      .pipe(finalize(() => this.decisionSaving.set(false)))
      .subscribe({
        next: () => {
          this.notify.success('Decisión registrada exitosamente');
          this.router.navigate(['/investments/sales', d.saleEvent]);
        },
        error: (err) =>
          this.notify.error(
            err?.error?.error || err?.error?.message || 'Error al registrar decisión'
          ),
      });
  }

  clearDecisionState(): void {
    this.decision.set(null);
    this.selectedType.set(null);
  }

  resetDecision(decisionId: string, saleId: string): void {
    this.decisionSaving.set(true);

    this.saleDecisionSvc
      .resetDecision(decisionId)
      .pipe(finalize(() => this.decisionSaving.set(false)))
      .subscribe({
        next: () => {
          this.notify.success('Decisión reiniciada correctamente');
          this.loadSaleDetail(saleId);
        },
        error: (err) =>
          this.notify.error(
            err?.error?.error ?? 'Error al reiniciar la decisión'
          ),
      });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // UI HELPERS
  // ═══════════════════════════════════════════════════════════════════════

  readonly formatCurrency = formatCurrency;
  readonly parseDecimal = parseDecimal;

  decisionColor(type: string): 'success' | 'danger' | 'warning' | 'secondary' {
    const map: Record<string, any> = {
      reinvest: 'success',
      withdraw: 'danger',
      partial: 'warning',
      pending: 'secondary',
    };
    return map[type] ?? 'secondary';
  }

  decisionLabel(type: string): string {
    const map: Record<string, string> = {
      reinvest: 'Reinvertir',
      withdraw: 'Retirar',
      partial: 'Distribuir',
      pending: 'Pendiente',
      full_withdrawal: 'Retiro total',
    };
    return map[type] ?? type;
  }

  formatWeight(v: number | string): string {
    return `${v.toLocaleString('es-CO', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} kg`;
  }

  today(): string {
    return new Date().toISOString().split('T')[0];
  }

  // ── Privados ──────────────────────────────────────────────────────────

  private computeStats(items: SaleEventList[]): void {
    this.listStats.set({
      total: items.length,
      pending: items.filter((s) => !s.isFinalized).length,
      finalized: items.filter((s) => s.isFinalized).length,
      totalNet: items.reduce((s, x) => s + parseDecimal(x.netAmount), 0),
      totalHeads: items.reduce((s, x) => s + x.totalHeads, 0),
      isLoading: false,
    });
  }

  private applyPagination(pagination?: any): void {
    if (!pagination) return;
    this.pagination.update((p) => ({
      ...p,
      totalPages: pagination.total_pages ?? 1,
      totalItems: pagination.count ?? 0,
    }));
  }

  // ── Evidence state (en SALE CREATE STATE) ─────────────────────────────────

  readonly evidenceFile = signal<File | null>(null);
  readonly evidenceError = signal('');
  readonly isDragging = signal(false);

  // Constantes de validación
  readonly ALLOWED_TYPES = ['application/pdf'];
  readonly MAX_FILE_MB = 10;
  private get MAX_FILE_BYTES() {
    return this.MAX_FILE_MB * 1024 * 1024;
  }

  // Computed
  readonly evidenceInfo = computed(() => {
    const file = this.evidenceFile();
    if (!file) return null;
    return {
      name: file.name,
      size: this.formatFileSize(file.size),
      type: file.type,
    };
  });

  processEvidenceFile(file: File): void {
    this.evidenceError.set('');

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      this.evidenceError.set('Solo se permiten archivos PDF.');
      return;
    }

    if (file.size > this.MAX_FILE_BYTES) {
      this.evidenceError.set(
        `El archivo excede el tamaño máximo de ${this.MAX_FILE_MB}MB.`,
      );
      return;
    }

    this.evidenceFile.set(file);
  }

  clearEvidence(): void {
    this.evidenceFile.set(null);
    this.evidenceError.set('');
    this.isDragging.set(false);
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }


  // sale.facade.ts

  // ── State del reporte ──────────────────────────────────────────
  readonly summaryLoading = signal(false);
  readonly summaryReport  = signal<SaleSummary | null>(null);
  readonly showSummaryReport = signal(false);

  // ── Cargar reporte de resumen ─────────────────────────────────

  loadSaleSummary(id: string): void {
    this.summaryLoading.set(true);
    this.summaryReport.set(null);
    this.showSummaryReport.set(true);

    this.saleEventSvc
      .getSummary(id)
      .pipe(finalize(() => this.summaryLoading.set(false)))
      .subscribe({
        next: (res) => this.summaryReport.set(res.data),
        error: () => {
          this.notify.error('Error al cargar el resumen de la venta');
          this.showSummaryReport.set(false);
        },
      });
  }

  closeSummaryReport(): void {
    this.showSummaryReport.set(false);
    this.summaryReport.set(null);
}
}
