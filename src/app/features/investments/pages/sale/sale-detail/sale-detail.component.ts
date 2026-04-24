// pages/sale-detail/sale-detail.component.ts

import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { SaleFacade } from '../../../facades/sale.facade';
import { PageHeaderComponent }    from '../../../../../shared/components/navigation/page-header/page-header.component';
import { LoaderComponent }        from '../../../../../shared/components/feedback/loader/loader.component';
import { BadgeComponent }         from '../../../../../shared/components/ui/badge/badge.component';
import { AlertComponent }         from '../../../../../shared/components/feedback/alert/alert.component';
import { AmountDisplayComponent } from '../../../../../shared/components/data-display/amount-display/amount-display.component';
import { EmptyStateComponent }    from '../../../../../shared/components/feedback/empty-state/empty-state.component';
import { KpiCardComponent }       from '../../../../../shared/components/data-display/kpi-card/kpi-card.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/feedback/confirm-dialog/confirm-dialog.component';
import { SafeDatePipe } from "../../../../../shared/pipes/safe-date.pipe";

@Component({
  selector: 'app-sale-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SaleFacade],
  imports: [
    RouterLink,
    PageHeaderComponent, LoaderComponent, BadgeComponent,
    AlertComponent, AmountDisplayComponent, EmptyStateComponent, KpiCardComponent,
    SafeDatePipe
],
  templateUrl: './sale-detail.component.html',
  styleUrl:    './sale-detail.component.scss',
})
export class SaleDetailComponent implements OnInit, OnDestroy {
  readonly facade = inject(SaleFacade);
  private  route  = inject(ActivatedRoute);
  private  dialog = inject(MatDialog);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.facade.loadSaleDetail(id);
  }

  ngOnDestroy(): void { this.facade.resetDetail(); }

  openFinalizeConfirm(): void {
    const sale = this.facade.detail();
    if (!sale) return;

    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title:       'Finalizar Venta',
        message:     '¿Confirmas finalizar esta venta? Se procesarán todas las decisiones. Esta acción no se puede deshacer.',
        confirmText: 'Finalizar',
        type:        'primary',
      },
    }).afterClosed().subscribe(ok => {
      if (ok) this.facade.finalizeSale(sale.id);
    });
  }
}