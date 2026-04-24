// facades/investor-dashboard.facade.ts
//
// Facade del portal del inversionista. Centraliza:
// - Carga del resumen (summary endpoint)
// - KPIs derivados
// - Decisiones pendientes / historial
// - Submit de decisiones (simple + parcial)
// - Datos para gráficos (sin Chart.js — solo data preparada)

import { Injectable, inject, signal, computed } from '@angular/core';
import { finalize } from 'rxjs';

import { InvestorService }     from '../services/investor.service';
import { SaleDecisionService } from '../services/sale-decision.service';
import { NotificationService } from '../../../core/services/notification.service';

import type { InvestorSummary, StatementMovement } from '../models/investor.model';
import type { SaleDecisionList, MakeDecisionPayload } from '../models/sale.model';
import { SaleDecisionType, InvestmentMovementType } from '../models/enums';
import { parseDecimal } from '../../../core/utils/helpers';

export type DashboardTab = 'resumen' | 'ganado' | 'movimientos' | 'decisiones';

export interface DashboardKpis {
  currentCapital:   number;
  totalProfits:     number;
  roi:              number;
  activeHeads:      number;
  cattleValue:      number;
  pendingDecisions: number;
}

// Para gráficos — solo data, sin Chart.js en el facade
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
  private readonly investorSvc   = inject(InvestorService);
  private readonly decisionSvc   = inject(SaleDecisionService);
  private readonly notify        = inject(NotificationService);

  // ── Estado ───────────────────────────────────────────────────

  readonly loading   = signal(true);
  readonly error     = signal('');
  readonly summary   = signal<InvestorSummary | null>(null);
  readonly activeTab = signal<DashboardTab>('resumen');

  readonly decisionSaving   = signal(false);
  readonly partialModalOpen = signal(false);
  readonly pendingDecisionForPartial = signal<SaleDecisionList | null>(null);

  // ── Computed ──────────────────────────────────────────────────

  readonly investor = computed(() => this.summary()?.investor ?? null);

  readonly initials = computed(() => {
    const name = this.investor()?.name ?? '';
    return name.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase();
  });

  readonly kpis = computed<DashboardKpis | null>(() => {
    const s = this.summary();
    if (!s) return null;
    const capital  = parseDecimal(s.investments.totalCapital);
    const profits  = parseDecimal(s.investments.totalProfits);
    return {
      currentCapital:   capital,
      totalProfits:     profits,
      roi:              capital > 0 ? (profits / capital) * 100 : 0,
      activeHeads:      s.cattle.totalHeads,
      cattleValue:      parseDecimal(s.cattle.totalValue),
      pendingDecisions: s.pendingDecisions,
    };
  });

  readonly pendingDecisions = computed<SaleDecisionList[]>(() =>
    (this.summary() as any)?.decisions_list?.filter(
      (d: any) => d.decisionType === SaleDecisionType.PENDING
    ) ?? []
  );

  readonly processedDecisions = computed<SaleDecisionList[]>(() =>
    (this.summary() as any)?.decisions_list?.filter(
      (d: any) => d.decisionType !== SaleDecisionType.PENDING
    ) ?? []
  );

  readonly pendingCount = computed(() => this.pendingDecisions().length);

  // ── Chart data (pura, sin dependencia de Chart.js) ────────────

  readonly capitalChartData = computed<CapitalChartData>(() => {
    const movements = [...((this.summary() as any)?.movements_list ?? [])].reverse();
    return {
      labels: movements.map((m: any) =>
        new Date(m.createdAt ?? m.created_at).toLocaleDateString('es-CO', {
          month: 'short', day: 'numeric',
        })
      ),
      values: movements.map((m: any) => parseDecimal(m.balanceAfter ?? m.balance_after)),
    };
  });

  readonly portfolioChartData = computed<PortfolioChartData>(() => {
    const s = this.summary();
    if (!s) return { labels: [], values: [], colors: [] };
    const pending = this.pendingDecisions()
      .reduce((acc, d) => acc + parseDecimal(d.investorAmount), 0);
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

  // ── Carga ─────────────────────────────────────────────────────

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.investorSvc.getMySummary()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => this.summary.set(res.data),
        error: () => this.error.set('No se pudo cargar tu información. Intenta de nuevo.'),
      });
  }

  // ── Tabs ──────────────────────────────────────────────────────

  setTab(tab: DashboardTab): void { this.activeTab.set(tab); }

  // ── Decisiones ────────────────────────────────────────────────

  onDecide(decision: SaleDecisionList, type: SaleDecisionType): void {
    if (type === SaleDecisionType.PARTIAL) {
      this.pendingDecisionForPartial.set(decision);
      this.partialModalOpen.set(true);
      return;
    }
    this.submitDecision(decision.id, { decisionType: type });
  }

  onPartialSubmit(result: { reinvestAmount: number; withdrawAmount: number }): void {
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

  private submitDecision(id: string, payload: MakeDecisionPayload): void {
    this.decisionSaving.set(true);
    this.decisionSvc.makeDecision(id, payload)
      .pipe(finalize(() => this.decisionSaving.set(false)))
      .subscribe({
        next: () => { this.notify.success('Decisión registrada'); this.load(); },
        error: (err) => this.notify.error(err?.error?.message || 'Error al registrar la decisión'),
      });
  }

  // ── UI helpers ────────────────────────────────────────────────

  formatCOP(value: number | string): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0,
    }).format(typeof value === 'string' ? parseFloat(value) : value);
  }

  movementColor(type: string): 'success' | 'danger' {
    const credits = [
      InvestmentMovementType.CONTRIBUTION,
      InvestmentMovementType.SALE_PROFIT,
      InvestmentMovementType.REINVESTMENT,
      InvestmentMovementType.SALE_REVENUE,
    ];
    return credits.includes(type as InvestmentMovementType) ? 'success' : 'danger';
  }

  movementSign(type: string): '+' | '−' {
    return this.movementColor(type) === 'success' ? '+' : '−';
  }

  deadlineClass(deadline: string | null): 'urgent' | 'warning' | 'ok' | '' {
    if (!deadline) return '';
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000);
    return days <= 0 ? 'urgent' : days <= 3 ? 'warning' : 'ok';
  }

  deadlineLabel(deadline: string | null): string {
    if (!deadline) return 'Sin vencimiento';
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000);
    if (days <= 0)  return 'Vence hoy';
    if (days === 1) return 'Vence mañana';
    return `${days} días restantes`;
  }

  formatWeight(w?: string | null): string {
    if (!w) return '—';
    const n = parseFloat(w);
    return isNaN(n) ? '—' : `${n.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;
  }

  readonly parseDecimal = parseDecimal;
}