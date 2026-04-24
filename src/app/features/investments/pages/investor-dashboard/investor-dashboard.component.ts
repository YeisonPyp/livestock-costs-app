// pages/investor-dashboard/investor-dashboard.component.ts

import {
  Component, OnInit, AfterViewInit, OnDestroy,
  ChangeDetectionStrategy, inject,
  ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

import { InvestorDashboardFacade } from '../../facades/investor-dashboard.facade';
import { DecisionCardComponent }   from '../../components/decision-card/decision-card.component';
import { PartialDecisionModalComponent } from '../../components/partial-decision-modal/partial-decision-modal.component';

import { LoaderComponent }        from '../../../../shared/components/feedback/loader/loader.component';
import { AlertComponent }         from '../../../../shared/components/feedback/alert/alert.component';
import { BadgeComponent }         from '../../../../shared/components/ui/badge/badge.component';
import { AmountDisplayComponent } from '../../../../shared/components/data-display/amount-display/amount-display.component';

import type { SaleDecisionList } from '../../models/sale.model';
import { SaleDecisionType } from '../../models/enums';

@Component({
  selector: 'app-investor-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [InvestorDashboardFacade],
  imports: [
    CommonModule,
    LoaderComponent, AlertComponent, BadgeComponent,
    AmountDisplayComponent, DecisionCardComponent, PartialDecisionModalComponent,
  ],
  templateUrl: './investor-dashboard.component.html',
  styleUrl:    './investor-dashboard.component.scss',
})
export class InvestorDashboardComponent
  implements OnInit, AfterViewInit, OnDestroy {

  readonly facade = inject(InvestorDashboardFacade);

  @ViewChild('capitalCanvas')   capitalCanvas!:   ElementRef<HTMLCanvasElement>;
  @ViewChild('portfolioCanvas') portfolioCanvas!: ElementRef<HTMLCanvasElement>;

  private capitalChart?:   Chart;
  private portfolioChart?: Chart;

  ngOnInit(): void { this.facade.load(); }

  ngAfterViewInit(): void {
    // Los charts se construyen una vez que haya datos.
    // La señal se observa desde aquí para no meter Chart.js en el facade.
  }

  ngOnDestroy(): void {
    this.capitalChart?.destroy();
    this.portfolioChart?.destroy();
  }

  // ── Tabs ──────────────────────────────────────────────────────

  setTab(tab: 'resumen' | 'ganado' | 'movimientos' | 'decisiones'): void {
    this.facade.setTab(tab);
    if (tab === 'resumen') {
      setTimeout(() => this.buildCharts(), 80);
    }
  }

  // ── Decisiones ────────────────────────────────────────────────

  onDecide(event: { decision: SaleDecisionList; type: SaleDecisionType }): void {
    this.facade.onDecide(event.decision, event.type);
  }

  onPartialSubmit(result: { reinvestAmount: number; withdrawAmount: number }): void {
    this.facade.onPartialSubmit(result);
  }

  // ── Charts ────────────────────────────────────────────────────

  /** Llamado desde el template cuando los datos estén listos y el tab sea "resumen". */
  buildCharts(): void {
    if (!this.capitalCanvas || !this.portfolioCanvas) return;
    this.buildCapitalChart();
    this.buildPortfolioChart();
  }

  private buildCapitalChart(): void {
    this.capitalChart?.destroy();
    const { labels, values } = this.facade.capitalChartData();
    if (!labels.length) return;

    this.capitalChart = new Chart(this.capitalCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data:            values,
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
              label: (ctx) => `$${Number(ctx.parsed?.y ?? 0).toLocaleString('es-CO')}`,
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

  private buildPortfolioChart(): void {
    this.portfolioChart?.destroy();
    const { labels, values, colors } = this.facade.portfolioChartData();

    this.portfolioChart = new Chart(this.portfolioCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }],
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
}