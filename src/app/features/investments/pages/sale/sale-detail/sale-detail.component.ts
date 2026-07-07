// pages/sale-detail/sale-detail.component.ts

import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { SaleFacade } from '../../../facades/sale.facade';

import { PageHeaderComponent }    from '../../../../../shared/components/navigation/page-header/page-header.component';
import { LoaderComponent }        from '../../../../../shared/components/feedback/loader/loader.component';
import { EmptyStateComponent }    from '../../../../../shared/components/feedback/empty-state/empty-state.component';
import { AlertComponent }         from '../../../../../shared/components/feedback/alert/alert.component';
import { BadgeComponent }         from '../../../../../shared/components/ui/badge/badge.component';
import { KpiCardComponent }       from '../../../../../shared/components/data-display/kpi-card/kpi-card.component';
import { AmountDisplayComponent } from '../../../../../shared/components/data-display/amount-display/amount-display.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/feedback/confirm-dialog/confirm-dialog.component';

import { SafeDatePipe } from '../../../../../shared/pipes/safe-date.pipe';

import type { SaleDecisionList } from '../../../models/sale.model';
import { SaleSummaryReportComponent } from '../../../components/sale-summary-report/sale-summary-report.component';

@Component({
  selector:        'app-sale-detail',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers:       [SaleFacade],
  imports: [
    RouterLink,
    PageHeaderComponent,
    LoaderComponent,
    EmptyStateComponent,
    AlertComponent,
    BadgeComponent,
    KpiCardComponent,
    AmountDisplayComponent,
    SafeDatePipe,
    SaleSummaryReportComponent,
  ],
  templateUrl: './sale-detail.component.html',
  styleUrl:    './sale-detail.component.scss',
})
export class SaleDetailComponent implements OnInit, OnDestroy {
  readonly facade = inject(SaleFacade);
  private  route  = inject(ActivatedRoute);
  private  dialog = inject(MatDialog);

  // ═══════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════════

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.facade.loadSaleDetail(id);
  }

  ngOnDestroy(): void {
    this.facade.resetDetail();
  }

  // ═══════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Abre el modal de confirmación para finalizar la venta.
   * Solo disponible si no está finalizada y no hay decisiones pendientes.
   */
  openFinalizeConfirm(): void {
    const sale = this.facade.detail();
    if (!sale) return;

    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title:       'Finalizar venta',
          message:     '¿Confirmas la finalización de esta venta? Se procesarán todas las decisiones y no podrá reiniciarse.',
          confirmText: 'Finalizar',
          type:        'primary',
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) this.facade.finalizeSale(sale.id);
      });
  }

  /**
   * Confirma y reinicia una decisión ya tomada al estado PENDING.
   * Solo disponible mientras la venta no esté finalizada.
   */
  confirmResetDecision(d: SaleDecisionList): void {
    const sale = this.facade.detail();
    if (!sale) return;

    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title:       'Reiniciar decisión',
          message:     `¿Reiniciar la decisión de ${d.investorName}?
                        La decisión volverá al estado pendiente y el inversionista podrá elegir nuevamente.`,
          confirmText: 'Reiniciar',
          type:        'warning',
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) this.facade.resetDecision(d.id, sale.id);
      });
  }

    // ═══════════════════════════════════════════════════════════════
  // ✅ REPORTE
  // ═══════════════════════════════════════════════════════════════

  openReport(): void {
    const sale = this.facade.detail();
    if (!sale) return;
    this.facade.loadSaleSummary(sale.id);
  }

  closeReport(): void {
    this.facade.closeSummaryReport();
  }
}