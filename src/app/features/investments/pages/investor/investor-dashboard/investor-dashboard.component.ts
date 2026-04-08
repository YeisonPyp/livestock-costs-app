import {
  Component, OnInit, AfterViewInit,
  inject, signal, computed,
  ViewChild, ElementRef, OnDestroy
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import Chart from 'chart.js/auto';

import { InvestmentService } from '../../../services/investment.service';
import { SaleDecision, InvestorSummary } from '../../../models/investment.model';
import { LoaderComponent } from '../../../../../shared/components/loader/loader.component';
import { BadgeComponent } from '../../../../../shared/components/display/badge/badge.component';
import { AlertComponent } from '../../../../../shared/components/display/alert/alert.component';
import { AmountDisplayComponent } from '../../../../../shared/components/bills/amount-display/amount-display.component';
import { DecisionCardComponent } from './components/decision-card/decision-card.component';
import { PartialDecisionModalComponent } from './components/partial-decision-modal/partial-decision-modal.component';


type Tab = 'resumen' | 'ganado' | 'movimientos' | 'decisiones';

@Component({
  selector: 'app-investor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DecimalPipe,
    LoaderComponent,
    BadgeComponent,
    AlertComponent,
    AmountDisplayComponent,
    DecisionCardComponent,
    PartialDecisionModalComponent
  ],
  templateUrl: './investor-dashboard.component.html',
  styleUrl:    './investor-dashboard.component.scss',
})
export class InvestorDashboardComponent
  implements OnInit, AfterViewInit, OnDestroy {

  private svc     = inject(InvestmentService);
  private snack   = inject(MatSnackBar);
  private dialog  = inject(MatDialog);

  @ViewChild('capitalCanvas') capitalCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('portfolioCanvas') portfolioCanvas!: ElementRef<HTMLCanvasElement>;

  // ── State ─────────────────────────────────────────────────────────────────
  loading   = signal(true);
  error     = signal('');
  activeTab = signal<Tab>('resumen');
  summary   = signal<InvestorSummary | null>(null);

  private capitalChart?:   Chart;
  private portfolioChart?: Chart;

  // ── Computed ──────────────────────────────────────────────────────────────
  investor = computed(() => this.summary()?.investor ?? null);

  kpis = computed(() => {
    const s = this.summary();
    if (!s) return null;
    return {
      currentCapital:    s.investments.total_capital,
      totalProfits:      s.investments.total_profits,
      roi:               s.investments.total_capital > 0
        ? ((s.investments.total_profits / s.investments.total_capital) * 100)
        : 0,
      activeHeads:       s.cattle.total_heads,
      cattleValue:       s.cattle.total_value,
      pendingDecisions:  s.pending_decisions,
    };
  });

  pendingDecisions = computed(() =>
    this.summary()?.decisions_list?.filter(
      d => d.decision_type === 'pending'
    ) ?? []
  );

  processedDecisions = computed(() =>
    this.summary()?.decisions_list?.filter(
      d => d.decision_type !== 'pending'
    ) ?? []
  );

  formatWeight(w?: string | null): string {
    if (!w) return '—';
    const n = parseFloat(w);
    return isNaN(n) ? '—' : `${n.toLocaleString('es-CO', { 
      minimumFractionDigits: 1, 
      maximumFractionDigits: 1 
    })} kg`;
  }

  cattle = computed(() => this.summary()?.cattle_list ?? []);

  movements = computed(() => this.summary()?.movements_list ?? []);

  pendingCount = computed(() => this.pendingDecisions().length);

  initials = computed(() => {
    const name = this.investor()?.name ?? '';
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.load();
  }

  ngAfterViewInit(): void {
    // Los charts se inicializan después de cargar los datos
  }

  ngOnDestroy(): void {
    this.capitalChart?.destroy();
    this.portfolioChart?.destroy();
  }

  // ── Data ──────────────────────────────────────────────────────────────────
  load(): void {
    this.loading.set(true);
    this.error.set('');

    this.svc.getMyInvestorSummary().subscribe({
      next: (res) => {
        if (res.success) {
          this.summary.set(res.data);
          setTimeout(() => this.initCharts(), 100);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar tu información. Intenta de nuevo.');
        this.loading.set(false);
      },
    });
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────
  setTab(tab: Tab): void {
    this.activeTab.set(tab);
    if (tab === 'resumen') {
      setTimeout(() => this.initCharts(), 50);
    }
  }

  // ── Decisiones ────────────────────────────────────────────────────────────
  onDecide(event: { decision: SaleDecision; type: 'reinvest' | 'withdraw' | 'partial' }): void {
    if (event.type === 'partial') {
      this.openPartialModal(event.decision);
      return;
    }
    this.submitDecision(event.decision.id, event.type, null, null);
  }

  private openPartialModal(decision: SaleDecision): void {
    this.dialog
      .open(PartialDecisionModalComponent, {
        width: '420px',
        data: { totalAmount: decision.investor_amount },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.submitDecision(
            decision.id,
            'partial',
            result.reinvest_amount,
            result.withdraw_amount,
          );
        }
      });
  }

  private submitDecision(
    decisionId: string,
    type: string,
    reinvestAmount: number | null,
    withdrawAmount: number | null,
  ): void {
    const payload: any = { decision_type: type };
    if (type === 'partial') {
      payload.reinvest_amount = reinvestAmount;
      payload.withdraw_amount = withdrawAmount;
    }

    this.svc.makeDecision(decisionId, payload).subscribe({
      next: () => {
        this.snack.open('Decisión registrada exitosamente', 'Cerrar', {
          duration: 3000,
        });
        this.load();
      },
      error: (err) => {
        this.snack.open(
          err?.error?.message || 'Error al registrar la decisión',
          'Cerrar',
          { duration: 4000 }
        );
      },
    });
  }

  // ── Charts ────────────────────────────────────────────────────────────────
  private initCharts(): void {
    const s = this.summary();
    if (!s) return;
    this.buildCapitalChart(s);
    this.buildPortfolioChart(s);
  }

  private buildCapitalChart(s: InvestorSummary): void {
    if (!this.capitalCanvas) return;
    this.capitalChart?.destroy();

    const movements = [...(s.movements_list ?? [])].reverse();
    const labels    = movements.map(m =>
      new Date(m.created_at).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })
    );
    const data = movements.map(m => +m.balance_after);

    this.capitalChart = new Chart(this.capitalCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data,
          borderColor:     '#185FA5',
          backgroundColor: 'rgba(24,95,165,0.08)',
          borderWidth:     1.5,
          fill:            true,
          tension:         0.35,
          pointRadius:     0,
          pointHoverRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              // label: ctx => `$${(+ctx.parsed.y).toLocaleString('es-CO')}`,
              label: (ctx: any) =>`$${Number(ctx.parsed?.y ?? 0).toLocaleString('es-CO')}`,
            },
          },
        },
        scales: {
          x: { ticks: { font: { size: 11 } } },
          y: {
            ticks: {
              font: { size: 11 },
              callback: v => `$${(+v / 1_000_000).toFixed(1)}M`,
            },
          },
        },
      },
    });
  }

  private buildPortfolioChart(s: InvestorSummary): void {
    if (!this.portfolioCanvas) return;
    this.portfolioChart?.destroy();

    const liquidCapital  = s.investments.total_capital;
    const cattleValue    = s.cattle.total_value;
    const pendingCapital = this.pendingDecisions()
      .reduce((acc, d) => acc + +d.investor_amount, 0);

    this.portfolioChart = new Chart(this.portfolioCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Ganado activo', 'Capital líquido', 'En decisión'],
        datasets: [{
          data: [cattleValue, liquidCapital, pendingCapital],
          backgroundColor: ['#1D9E75', '#185FA5', '#BA7517'],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { size: 12 }, padding: 12, boxWidth: 10 },
          },
          tooltip: {
            callbacks: {
              label: ctx => `$${(+ctx.parsed).toLocaleString('es-CO')}`,
            },
          },
        },
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  formatCOP(value: number | string): string {
    return new Intl.NumberFormat('es-CO', {
      style:    'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(typeof value === 'string' ? parseFloat(value) : value);
  }

  movementColor(type: string): 'success' | 'danger' | 'info' | 'warning' {
    const credits = ['contribution', 'sale_profit', 'reinvestment', 'dividend'];
    return credits.includes(type) ? 'success' : 'danger';
  }

  movementSign(type: string): '+' | '−' {
    const credits = ['contribution', 'sale_profit', 'reinvestment', 'dividend'];
    return credits.includes(type) ? '+' : '−';
  }

  deadlineColor(deadline: string | null): string {
    if (!deadline) return '';
    const days = Math.ceil(
      (new Date(deadline).getTime() - Date.now()) / 86_400_000
    );
    if (days <= 0)  return 'text-danger';
    if (days <= 3)  return 'text-warning';
    return 'text-success';
  }

  deadlineLabel(deadline: string | null): string {
    if (!deadline) return 'Sin vencimiento';
    const days = Math.ceil(
      (new Date(deadline).getTime() - Date.now()) / 86_400_000
    );
    if (days <= 0)  return 'Vence hoy';
    if (days === 1) return 'Vence mañana';
    return `${days} días restantes`;
  }
}