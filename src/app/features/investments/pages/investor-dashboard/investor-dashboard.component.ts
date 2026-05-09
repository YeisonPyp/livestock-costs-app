// pages/investor-dashboard/investor-dashboard.component.ts
//
// MEJORAS PRINCIPALES:
// 1. Los charts se construyen automáticamente al cargar los datos,
//    sin esperar que el usuario navegue a otra tab y vuelva.
// 2. Se usa effect() para reaccionar a cambios de datos y reconstruir
//    los charts cuando el summary cambia.
// 3. Se usan los tipos correctos del facade (SaleDecisionSummary en vez de SaleDecisionList).
// 4. La tab "Ganado" muestra cattleList del summary correctamente.

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
  untracked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

import { InvestorDashboardFacade, DashboardTab } from '../../facades/investor-dashboard.facade';
import { DecisionCardComponent }                 from '../../components/decision-card/decision-card.component';
import { PartialDecisionModalComponent }         from '../../components/partial-decision-modal/partial-decision-modal.component';
import { LoaderComponent }                       from '../../../../shared/components/feedback/loader/loader.component';
import { AlertComponent }                        from '../../../../shared/components/feedback/alert/alert.component';
import { BadgeComponent }                        from '../../../../shared/components/ui/badge/badge.component';
import { AmountDisplayComponent }               from '../../../../shared/components/data-display/amount-display/amount-display.component';
import { NavbarComponent }                       from '../../../../shared/components/navigation/navbar/navbar.component';

import type { SaleDecisionSummary } from '../../models/sale.model';
import { SaleDecisionType }         from '../../models/enums';

@Component({
  selector:         'app-investor-dashboard',
  standalone:       true,
  changeDetection:  ChangeDetectionStrategy.OnPush,
  providers:        [InvestorDashboardFacade],
  imports: [
    CommonModule,
    LoaderComponent,
    AlertComponent,
    BadgeComponent,
    DecisionCardComponent,
    PartialDecisionModalComponent,
    NavbarComponent,
  ],
  templateUrl: './investor-dashboard.component.html',
  styleUrl:    './investor-dashboard.component.scss',
})
export class InvestorDashboardComponent
  implements OnInit, AfterViewInit, OnDestroy {

  readonly facade = inject(InvestorDashboardFacade);
  private  readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('capitalCanvas')   capitalCanvas!:   ElementRef<HTMLCanvasElement>;
  @ViewChild('portfolioCanvas') portfolioCanvas!: ElementRef<HTMLCanvasElement>;

  private capitalChart?:   Chart;
  private portfolioChart?: Chart;

  // Indica si el DOM del canvas ya está disponible
  private viewReady = false;

  constructor() {
    /**
     * Efecto reactivo: se dispara cada vez que summary() cambia.
     * Si estamos en la tab "resumen" y el DOM está listo, reconstruye los charts.
     * Esto garantiza que al cargar la página los charts aparezcan
     * sin intervención manual del usuario.
     */
    effect(() => {
      const summary = this.facade.summary();
      const tab     = this.facade.activeTab();

      // Leemos las señales para que el efecto sea reactivo a ellas.
      // Usamos untracked() para los valores que solo necesitamos leer
      // pero no queremos que disparen el efecto de nuevo.
      if (!summary || tab !== 'resumen') return;

      // Pequeño tick para que el CD haya actualizado el DOM
      untracked(() => {
        requestAnimationFrame(() => {
          if (this.viewReady) {
            this.buildCharts();
            this.cdr.markForCheck();
          }
        });
      });
    });
  }

  // ── Lifecycle ─────────────────────────────────────────────────

  ngOnInit(): void {
    this.facade.load();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;

    // Si los datos ya cargaron antes de que AfterViewInit se ejecutara
    // (raro pero posible), construimos los charts inmediatamente.
    if (this.facade.summary() && this.facade.activeTab() === 'resumen') {
      requestAnimationFrame(() => this.buildCharts());
    }
  }

  ngOnDestroy(): void {
    this.capitalChart?.destroy();
    this.portfolioChart?.destroy();
  }

  // ── Tabs ──────────────────────────────────────────────────────

  setTab(tab: DashboardTab): void {
    this.facade.setTab(tab);
    if (tab === 'resumen' && this.viewReady) {
      // Esperamos un frame para que Angular renderice los canvas
      requestAnimationFrame(() => this.buildCharts());
    }
  }

  // ── Decisiones ────────────────────────────────────────────────

  onDecide(event: { decision: SaleDecisionSummary; type: SaleDecisionType }): void {
    this.facade.onDecide(event.decision, event.type);
  }

  onPartialSubmit(result: { reinvestAmount: number; withdrawAmount: number }): void {
    this.facade.onPartialSubmit(result);
  }

  // ── Charts ────────────────────────────────────────────────────

  buildCharts(): void {
    if (!this.capitalCanvas?.nativeElement || !this.portfolioCanvas?.nativeElement) return;
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
    if (!values.some(v => v > 0)) return;

    this.portfolioChart = new Chart(this.portfolioCanvas.nativeElement, {
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
              label: ctx => `$${(+ctx.parsed).toLocaleString('es-CO')}`,
            },
          },
        },
      },
    });
  }
}