// pages/investor-dashboard/investor-dashboard.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  effect,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

import {
  InvestorDashboardFacade,
  DashboardTab,
} from '../../facades/investor-dashboard.facade';
import { DecisionCardComponent }         from '../../components/decision-card/decision-card.component';
import { PartialDecisionModalComponent } from '../../components/partial-decision-modal/partial-decision-modal.component';
import { LoaderComponent }     from '../../../../shared/components/feedback/loader/loader.component';
import { AlertComponent }      from '../../../../shared/components/feedback/alert/alert.component';
import { BadgeComponent }      from '../../../../shared/components/ui/badge/badge.component';
import { KpiCardComponent }    from '../../../../shared/components/data-display/kpi-card/kpi-card.component';
import { TableComponent }      from '../../../../shared/components/data-display/table/table.component';
import { TableColumn, ExportEvent } from '../../../../shared/components/data-display/table/table.types';

import type { SaleDecisionSummary } from '../../models/sale.model';
import { SaleDecisionType }         from '../../models/enums';
import { InvestorNavbarComponent } from '../../components/investor-navbar/investor-navbar.component';

@Component({
  selector:        'app-investor-dashboard',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers:       [InvestorDashboardFacade],
  imports: [
    CommonModule,
    LoaderComponent,
    AlertComponent,
    BadgeComponent,
    KpiCardComponent,
    TableComponent,
    DecisionCardComponent,
    PartialDecisionModalComponent,
    InvestorNavbarComponent,
  ],
  templateUrl: './investor-dashboard.component.html',
  styleUrl:    './investor-dashboard.component.scss',
})
export class InvestorDashboardComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  readonly facade    = inject(InvestorDashboardFacade);
  private  readonly cdr = inject(ChangeDetectorRef);

  private capitalCanvas?:   ElementRef<HTMLCanvasElement>;
  private portfolioCanvas?: ElementRef<HTMLCanvasElement>;

  @ViewChild('capitalCanvas')
  set capitalCanvasRef(ref: ElementRef<HTMLCanvasElement> | undefined) {
    this.capitalCanvas = ref;
    if (ref) {
      queueMicrotask(() => this.buildCharts());
    }
  }

  @ViewChild('portfolioCanvas')
  set portfolioCanvasRef(ref: ElementRef<HTMLCanvasElement> | undefined) {
    this.portfolioCanvas = ref;
    if (ref) {
      queueMicrotask(() => this.buildCharts());
    }
  }

  private capitalChart?:   Chart;
  private portfolioChart?: Chart;

  // ══════════════════════════════════════════════════════════════
  // COLUMNAS
  // ══════════════════════════════════════════════════════════════

  movementColumns: TableColumn[] = [
    { key: 'createdAt', label: 'Fecha', type: 'date', width: '110px', sortable: true },
    {
      key: 'movementTypeDisplay',
      label: 'Tipo',
      type: 'badge',
      width: '140px',
      format: (v) => v ?? '—',
      badgeColor: (_v, row) => (row?.isCredit ? 'success' : 'danger'),
    },
    { key: 'description', label: 'Descripción', format: (v) => v || '—' },
    {
      key: 'amount',
      label: 'Valor del movimiento',
      type: 'currency',
      align: 'right',
      width: '150px',
      cellClass: (_v, row) => (row?.isCredit ? 'cell-income' : 'cell-expense'),
    },
    { key: 'balanceAfter', label: 'Saldo', type: 'currency', align: 'right', width: '150px' },
  ];

  cattleColumns: TableColumn[] = [
    { key: 'tagNumber', label: 'Arete', width: '100px', cellClass: 'cell-tag' },
    {
      key: 'name',
      label: 'Nombre / Raza',
      format: (_v, row) => {
        const name = row?.name || '—';
        const breed = row?.breedName ? ` · ${row.breedName}` : '';
        return `${name}${breed}`;
      },
    },
    { key: 'category', label: 'Categoría', format: (v) => v ?? '—' },
    { key: 'lotCode', label: 'Lote', format: (v) => v || '—' },
    {
      key: 'currentWeight',
      label: 'Peso actual',
      align: 'right',
      width: '110px',
      format: (v) => this.facade.formatWeight(v),
    },
    {
      key: 'weightGain',
      label: 'Ganancia',
      align: 'right',
      width: '110px',
      format: (v) => {
        if (!v) return '—';
        const n = parseFloat(String(v));
        return isNaN(n) ? '—' : `+${n.toFixed(1)} kg`;
      },
      cellClass: (_v, row) => {
        const n = parseFloat(String(row?.weightGain ?? '0'));
        return n > 0 ? 'cell-income' : '';
      },
    },
    { key: 'currentValue',  label: 'Valor actual',  type: 'currency', align: 'right', width: '140px' },
    { key: 'purchasePrice', label: 'Precio compra', type: 'currency', align: 'right', width: '140px' },
    {
      key: 'status',
      label: 'Estado',
      type: 'badge',
      align: 'center',
      width: '100px',
      format: (v) => v ?? '—',
      badgeColor: (v) => (v === 'active' ? 'success' : 'secondary'),
    },
  ];

  decisionHistoryColumns: TableColumn[] = [
    { key: 'decisionDate', label: 'Fecha', type: 'date', width: '110px', sortable: true },
    {
      key: 'decisionTypeDisplay',
      label: 'Decisión',
      type: 'badge',
      width: '130px',
      format: (v) => v ?? '—',
      badgeColor: (_v, row) => {
        const t = row?.decisionType;
        if (t === 'reinvest') return 'success';
        if (t === 'withdraw') return 'danger';
        return 'warning';
      },
    },
    { key: 'investorAmount', label: 'Valor total', type: 'currency', align: 'right', width: '140px' },
    {
      key: 'reinvestAmount',
      label: 'Reinvertido',
      type: 'currency',
      align: 'right',
      width: '140px',
      cellClass: 'cell-income',
      format: (v) => {
        const n = parseFloat(String(v ?? 0));
        return n > 0 ? (undefined as any) : '—';
      },
    },
    {
      key: 'withdrawAmount',
      label: 'Retirado',
      type: 'currency',
      align: 'right',
      width: '140px',
      format: (v) => {
        const n = parseFloat(String(v ?? 0));
        return n > 0 ? (undefined as any) : '—';
      },
    },
  ];

  // ══════════════════════════════════════════════════════════════
  // Chart effect
  // ══════════════════════════════════════════════════════════════

  constructor() {
    effect(() => {
      const capital   = this.facade.capitalChartData();
      const portfolio = this.facade.portfolioChartData();
      const tab       = this.facade.activeTab();

      if (tab !== 'resumen') return;
      if (!capital.labels.length && !portfolio.values.length) return;

      queueMicrotask(() => {
        this.buildCharts();
        this.cdr.markForCheck();
      });
    });
  }

  // ══════════════════════════════════════════════════════════════
  // Lifecycle
  // ══════════════════════════════════════════════════════════════

  ngOnInit(): void {
    this.facade.load();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.capitalChart?.destroy();
    this.portfolioChart?.destroy();
  }

  // ══════════════════════════════════════════════════════════════
  // Tabs
  // ══════════════════════════════════════════════════════════════

  setTab(tab: DashboardTab): void {
    this.facade.setTab(tab);
    if (tab === 'resumen') {
      queueMicrotask(() => this.buildCharts());
    }
  }

  // ══════════════════════════════════════════════════════════════
  // Decisiones
  // ══════════════════════════════════════════════════════════════

  onDecide(event: {
    decision: SaleDecisionSummary;
    type: SaleDecisionType;
  }): void {
    this.facade.onDecide(event.decision, event.type);
  }

  onPartialSubmit(result: {
    reinvestAmount: number;
    withdrawAmount: number;
  }): void {
    this.facade.onPartialSubmit(result);
  }

  // ══════════════════════════════════════════════════════════════
  // Export
  // ══════════════════════════════════════════════════════════════

  onExportMovements(event: ExportEvent):  void { this.facade.exportMovements(event); }
  onExportCattle(event: ExportEvent):     void { this.facade.exportCattle(event); }
  onExportDecisions(event: ExportEvent):  void { this.facade.exportDecisions(event); }

  // ══════════════════════════════════════════════════════════════
  // Charts
  // ══════════════════════════════════════════════════════════════

  private buildCharts(): void {
    const capitalEl   = this.capitalCanvas?.nativeElement;
    const portfolioEl = this.portfolioCanvas?.nativeElement;

    // ✅ Guard clause: si alguno no existe, salir
    if (!capitalEl || !portfolioEl) return;

    // ✅ Pasamos los elementos como parámetros — ya garantizados no-null
    this.buildCapitalChart(capitalEl);
    this.buildPortfolioChart(portfolioEl);
  }

  private buildCapitalChart(canvas: HTMLCanvasElement): void {
    const { labels, values } = this.facade.capitalChartData();

    // Destruir siempre el anterior
    this.capitalChart?.destroy();
    this.capitalChart = undefined;

    if (!labels.length) return;

    this.capitalChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data:             values,
          borderColor:      '#185FA5',
          backgroundColor:  'rgba(24,95,165,0.08)',
          borderWidth:      1.5,
          fill:             true,
          tension:          0.35,
          pointRadius:      0,
          pointHoverRadius: 4,
        }],
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        plugins: {
          legend:  { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                `$${Number(ctx.parsed?.y ?? 0).toLocaleString('es-CO')}`,
            },
          },
        },
        scales: {
          x: { ticks: { font: { size: 11 } } },
          y: {
            ticks: {
              font:     { size: 11 },
              callback: (v) => `$${(+v / 1_000_000).toFixed(1)}M`,
            },
          },
        },
      },
    });
  }

  private buildPortfolioChart(canvas: HTMLCanvasElement): void {
    const { labels, values, colors } = this.facade.portfolioChartData();

    this.portfolioChart?.destroy();
    this.portfolioChart = undefined;

    if (!values.some((v) => v > 0)) return;

    this.portfolioChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data:            values,
          backgroundColor: colors,
          borderWidth:     0,
        }],
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        cutout:              '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels:   { font: { size: 12 }, padding: 12, boxWidth: 10 },
          },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                `$${(+ctx.parsed).toLocaleString('es-CO')}`,
            },
          },
        },
      },
    });
  }
}