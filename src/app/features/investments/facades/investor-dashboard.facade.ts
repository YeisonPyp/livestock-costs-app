// facades/investor-dashboard.facade.ts
import { Injectable, inject, signal, computed } from '@angular/core';
import { finalize } from 'rxjs';

import { InvestorService }     from '../services/investor.service';
import { SaleDecisionService } from '../services/sale-decision.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ExportService, ExportConfig } from '../../../core/services/export.service';

import type { InvestorSummary } from '../models/investor.model';
import type {
  SaleDecisionList,
  SaleDecisionSummary,
  MakeDecisionPayload,
} from '../models/sale.model';
import type { CattleOwnershipSummary } from '../models/cattle-ownership.model';
import type { InvestmentMovement }     from '../models/investment.model';
import { SaleDecisionType, InvestmentMovementType } from '../models/enums';
import { parseDecimal } from '../../../core/utils/helpers';
import type { ExportEvent } from '../../../shared/components/data-display/table/table.types';

export type DashboardTab = 'resumen' | 'ganado' | 'movimientos' | 'decisiones';

export interface DashboardKpis {
  currentCapital:   number;
  totalProfits:     number;
  roi:              number;
  activeHeads:      number;
  cattleValue:      number;
  pendingDecisions: number;
  totalContributions: number;
  totalWithdrawals:   number;
}

export interface CapitalChartData {
  labels: string[];
  values: number[];
}

export interface PortfolioChartData {
  labels: string[];
  values: number[];
  colors: string[];
}

@Injectable()
export class InvestorDashboardFacade {
  private readonly investorSvc  = inject(InvestorService);
  private readonly decisionSvc  = inject(SaleDecisionService);
  private readonly notify       = inject(NotificationService);
  private readonly exportSvc    = inject(ExportService);

  // ── Estado ───────────────────────────────────────────────────
  readonly loading   = signal(true);
  readonly error     = signal('');
  readonly summary   = signal<InvestorSummary | null>(null);
  readonly activeTab = signal<DashboardTab>('resumen');

  readonly decisionSaving            = signal(false);
  readonly partialModalOpen          = signal(false);
  readonly pendingDecisionForPartial = signal<SaleDecisionList | null>(null);

  // ── Computed — Investor ───────────────────────────────────────
  readonly investor = computed(() => this.summary()?.investor ?? null);

  readonly initials = computed(() => {
    const name = this.investor()?.name ?? '';
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0] ?? '')
      .join('')
      .toUpperCase();
  });

  // ── Computed — KPIs ───────────────────────────────────────────
  readonly kpis = computed<DashboardKpis | null>(() => {
    const s = this.summary();
    if (!s) return null;
    const capital = parseDecimal(s.investments.totalCapital);
    const profits = parseDecimal(s.investments.totalProfits);
    return {
      currentCapital:     capital,
      totalProfits:       profits,
      roi:                capital > 0 ? (profits / capital) * 100 : 0,
      activeHeads:        s.cattle.totalHeads,
      cattleValue:        parseDecimal(s.cattle.totalValue),
      pendingDecisions:   s.pendingDecisions,
      totalContributions: parseDecimal(s.investments.totalContributions),
      totalWithdrawals:   parseDecimal(s.investments.totalWithdrawals),
    };
  });

  // ── Computed — Listas ─────────────────────────────────────────
  readonly pendingDecisions = computed<SaleDecisionSummary[]>(() =>
    (this.summary()?.decisiondList ?? []).filter((d) => d.isPending)
  );

  readonly processedDecisions = computed<SaleDecisionSummary[]>(() =>
    (this.summary()?.decisiondList ?? []).filter((d) => !d.isPending)
  );

  readonly pendingCount = computed(() => this.pendingDecisions().length);

  readonly movements = computed<InvestmentMovement[]>(
    () => this.summary()?.movementsList ?? []
  );

  readonly recentMovements = computed<InvestmentMovement[]>(
    () => this.movements().slice(0, 5)
  );

  readonly cattleList = computed<CattleOwnershipSummary[]>(
    () => this.summary()?.cattleList ?? []
  );

  // ── Computed — Chart data ─────────────────────────────────────
  readonly capitalChartData = computed<CapitalChartData>(() => {
    const movements = [...this.movements()].reverse();
    return {
      labels: movements.map((m) =>
        new Date(m.createdAt).toLocaleDateString('es-CO', {
          month: 'short',
          day:   'numeric',
        })
      ),
      values: movements.map((m) => parseDecimal(m.balanceAfter)),
    };
  });

  readonly portfolioChartData = computed<PortfolioChartData>(() => {
    const s = this.summary();
    if (!s) return { labels: [], values: [], colors: [] };

    const pending = this.pendingDecisions().reduce(
      (acc, d) => acc + parseDecimal(d.investorAmount),
      0
    );

    return {
      labels: ['Ganado activo', 'Capital líquido', 'En decisión'],
      values: [
        parseDecimal(s.cattle.totalValue),
        parseDecimal(s.investments.totalCapital),
        pending,
      ],
      colors: ['#1D9E75', '#185FA5', '#BA7517'],
    };
  });

  // ── Computed — Resumen para tarjetas ──────────────────────────
  readonly investmentSummaryCards = computed(() => {
    const k = this.kpis();
    if (!k) return [];
    return [
      {
        label: 'Capital Actual',
        value: this.formatCOP(k.currentCapital),
        color: 'blue' as const,
        icon:  'dollar',
      },
      {
        label: 'Ganancias Totales',
        value: this.formatCOP(k.totalProfits),
        color: 'green' as const,
        icon:  'trending-up',
        sub:   `ROI: ${k.roi.toFixed(1)}%`,
      },
      {
        label: 'Aportes Totales',
        value: this.formatCOP(k.totalContributions),
        color: 'blue' as const,
        icon:  'plus',
      },
      {
        label: 'Retiros Totales',
        value: this.formatCOP(k.totalWithdrawals),
        color: 'red' as const,
        icon:  'minus',
      },
    ];
  });

  // ── Carga ─────────────────────────────────────────────────────
  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.investorSvc
      .getMySummary()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next:  (res) => this.summary.set(res.data),
        error: ()    => this.error.set('No se pudo cargar tu información. Intenta de nuevo.'),
      });
  }

  reload(): void {
    this.load();
  }

  // ── Tabs ──────────────────────────────────────────────────────
  setTab(tab: DashboardTab): void {
    this.activeTab.set(tab);
  }

  // ── Decisiones ────────────────────────────────────────────────
  onDecide(decision: SaleDecisionSummary, type: SaleDecisionType): void {
    if (type === SaleDecisionType.PARTIAL) {
      this.pendingDecisionForPartial.set(
        decision as unknown as SaleDecisionList
      );
      this.partialModalOpen.set(true);
      return;
    }
    this.submitDecision(decision.id, { decisionType: type });
  }

  onPartialSubmit(result: {
    reinvestAmount: number;
    withdrawAmount: number;
  }): void {
    const d = this.pendingDecisionForPartial();
    if (!d) return;
    this.partialModalOpen.set(false);
    this.pendingDecisionForPartial.set(null);
    this.submitDecision(d.id, {
      decisionType:   SaleDecisionType.PARTIAL,
      reinvestAmount: result.reinvestAmount,
      withdrawAmount: result.withdrawAmount,
    });
  }

  closePartialModal(): void {
    this.partialModalOpen.set(false);
    this.pendingDecisionForPartial.set(null);
  }

  private submitDecision(
    id: string,
    payload: MakeDecisionPayload
  ): void {
    this.decisionSaving.set(true);
    this.decisionSvc
      .makeDecision(id, payload)
      .pipe(finalize(() => this.decisionSaving.set(false)))
      .subscribe({
        next: () => {
          this.notify.success('Decisión registrada correctamente');
          this.load();
        },
        error: (err) =>
          this.notify.error(
            err?.error?.message || 'Error al registrar la decisión'
          ),
      });
  }

  // ── Exportación ───────────────────────────────────────────────

  private buildBaseExportConfig(title: string, fileName: string): Partial<ExportConfig> {
    const inv = this.investor();
    return {
      fileName,
      title,
      subtitle: inv ? `Inversionista: ${inv.name} (${inv.code})` : undefined,
      companyName: 'Ganadería Veracruz Y.P',
    };
  }

  exportMovements(event: ExportEvent): void {
    const config = this.buildBaseExportConfig(
      'Movimientos de Inversión',
      event.fileName ?? 'movimientos-inversion'
    );

    if (event.filters?.search) {
      config.filters = { Búsqueda: event.filters.search };
    }

    this.exportSvc.export(event.format, event.columns, event.data, config);
    this.notify.success(`${event.format === 'excel' ? 'Excel' : 'PDF'} descargado`);
  }

  exportCattle(event: ExportEvent): void {
    const config = this.buildBaseExportConfig(
      'Ganado del Inversionista',
      event.fileName ?? 'ganado-inversionista'
    );
    this.exportSvc.export(event.format, event.columns, event.data, config);
    this.notify.success(`${event.format === 'excel' ? 'Excel' : 'PDF'} descargado`);
  }

  exportDecisions(event: ExportEvent): void {
    const config = this.buildBaseExportConfig(
      'Historial de Decisiones',
      event.fileName ?? 'decisiones-inversionista'
    );
    this.exportSvc.export(event.format, event.columns, event.data, config);
    this.notify.success(`${event.format === 'excel' ? 'Excel' : 'PDF'} descargado`);
  }

  // ── UI helpers ────────────────────────────────────────────────

  formatCOP(value: number | string): string {
    return new Intl.NumberFormat('es-CO', {
      style:                 'currency',
      currency:              'COP',
      maximumFractionDigits: 0,
    }).format(typeof value === 'string' ? parseFloat(value) : value);
  }

  movementColor(type: string): 'success' | 'danger' {
    const credits: string[] = [
      InvestmentMovementType.CONTRIBUTION,
      InvestmentMovementType.SALE_PROFIT,
      InvestmentMovementType.REINVESTMENT,
      InvestmentMovementType.SALE_REVENUE,
    ];
    return credits.includes(type) ? 'success' : 'danger';
  }

  movementSign(type: string): '+' | '−' {
    return this.movementColor(type) === 'success' ? '+' : '−';
  }

  deadlineClass(
    deadline: string | null
  ): 'urgent' | 'warning' | 'ok' | '' {
    if (!deadline) return '';
    const days = Math.ceil(
      (new Date(deadline).getTime() - Date.now()) / 86_400_000
    );
    return days <= 0 ? 'urgent' : days <= 3 ? 'warning' : 'ok';
  }

  deadlineLabel(deadline: string | null): string {
    if (!deadline) return 'Sin vencimiento';
    const days = Math.ceil(
      (new Date(deadline).getTime() - Date.now()) / 86_400_000
    );
    if (days <= 0) return 'Vence hoy';
    if (days === 1) return 'Vence mañana';
    return `${days} días restantes`;
  }

  formatWeight(w?: string | null): string {
    if (!w) return '—';
    const n = parseFloat(w);
    return isNaN(n)
      ? '—'
      : `${n.toLocaleString('es-CO', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })} kg`;
  }

  readonly parseDecimal = parseDecimal;
}