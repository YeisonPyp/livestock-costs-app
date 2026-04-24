// pages/investment-detail/investment-detail.component.ts

import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject
} from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule } from '@angular/forms';

import { InvestmentFacade }             from '../../../facades/investment.facade';
import { CapitalOperationPanelComponent } from '../../../components/capital-operation-panel/capital-operation-panel.component';
import { CloseInvestmentDialogComponent } from '../../../components/close-investment-dialog/close-investment-dialog.component';

import { PageHeaderComponent }    from '../../../../../shared/components/navigation/page-header/page-header.component';
import { LoaderComponent }        from '../../../../../shared/components/feedback/loader/loader.component';
import { EmptyStateComponent }    from '../../../../../shared/components/feedback/empty-state/empty-state.component';
import { AlertComponent }         from '../../../../../shared/components/feedback/alert/alert.component';
import { BadgeComponent }         from '../../../../../shared/components/ui/badge/badge.component';
import { KpiCardComponent }       from '../../../../../shared/components/data-display/kpi-card/kpi-card.component';
import { AmountDisplayComponent } from '../../../../../shared/components/data-display/amount-display/amount-display.component';
import { ButtonComponent }        from '../../../../../shared/components/ui/button/button.component';
import { ModalComponent }         from '../../../../../shared/components/overlays/modal/modal.component';

import { InvestmentMovementType } from '../../../models/enums';
import type { ContributionPayload, WithdrawalPayload } from '../../../models/investment.model';
import { SafeDatePipe } from "../../../../../shared/pipes/safe-date.pipe";

@Component({
  selector: 'app-investment-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [InvestmentFacade],
  imports: [
    RouterLink, MatTabsModule, FormsModule,
    PageHeaderComponent, LoaderComponent, EmptyStateComponent,
    AlertComponent, BadgeComponent, KpiCardComponent,
    AmountDisplayComponent, ButtonComponent, ModalComponent,
    CapitalOperationPanelComponent, CloseInvestmentDialogComponent,
    SafeDatePipe
],
  templateUrl: './investment-detail.component.html',
  styleUrl:    './investment-detail.component.scss',
})
export class InvestmentDetailComponent implements OnInit, OnDestroy {
  readonly facade = inject(InvestmentFacade);
  private  route  = inject(ActivatedRoute);

  readonly movementTypeOptions = [
    { value: '',                                   label: 'Todos los tipos' },
    { value: InvestmentMovementType.CONTRIBUTION,  label: 'Aporte'          },
    { value: InvestmentMovementType.WITHDRAWAL,    label: 'Retiro'          },
    { value: InvestmentMovementType.SALE_PROFIT,   label: 'Ganancia venta'  },
    { value: InvestmentMovementType.SALE_LOSS,     label: 'Pérdida venta'   },
    { value: InvestmentMovementType.COST_SHARE,    label: 'Costos'          },
    { value: InvestmentMovementType.ADJUSTMENT,    label: 'Ajuste'          },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.facade.loadDetail(id);
  }

  ngOnDestroy(): void {
    this.facade.resetDetail();
  }

  onContribute(payload: ContributionPayload): void {
    this.facade.submitContribute(payload);
  }

  onWithdraw(payload: WithdrawalPayload): void {
    this.facade.submitWithdraw(payload);
  }
}