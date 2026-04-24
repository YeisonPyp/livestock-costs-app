// pages/investor/investor-detail/investor-detail.component.ts

import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog } from '@angular/material/dialog';

import { InvestorFacade }  from '../../../facades/investor.facade';
import { CreateContractDialogComponent } from '../../../components/create-contract-dialog/create-contract-dialog.component';

import { PageHeaderComponent }     from '../../../../../shared/components/navigation/page-header/page-header.component';
import { LoaderComponent }         from '../../../../../shared/components/feedback/loader/loader.component';
import { KpiCardComponent }        from '../../../../../shared/components/data-display/kpi-card/kpi-card.component';
import { BadgeComponent }          from '../../../../../shared/components/ui/badge/badge.component';
import { AvatarComponent }         from '../../../../../shared/components/ui/avatar/avatar.component';
import { AmountDisplayComponent }  from '../../../../../shared/components/data-display/amount-display/amount-display.component';
import { AlertComponent }          from '../../../../../shared/components/feedback/alert/alert.component';
import { EmptyStateComponent }     from '../../../../../shared/components/feedback/empty-state/empty-state.component';
import { formatCurrency, parseDecimal } from '../../../../../core/utils/helpers';

@Component({
  selector: 'app-investor-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [InvestorFacade],
  imports: [
    RouterLink, MatTabsModule,
    PageHeaderComponent, LoaderComponent, KpiCardComponent,
    BadgeComponent, AvatarComponent, AmountDisplayComponent,
    AlertComponent, EmptyStateComponent,
  ],
  templateUrl: './investor-detail.component.html',
  styleUrl:    './investor-detail.component.scss',
})
export class InvestorDetailComponent implements OnInit, OnDestroy {
  readonly facade  = inject(InvestorFacade);
  private route    = inject(ActivatedRoute);
  private dialog   = inject(MatDialog);

  formatCurrency = formatCurrency;
  parseDecimal   = parseDecimal;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.facade.loadDetail(id);
  }

  ngOnDestroy(): void {
    this.facade.resetDetail();
  }

  openCreateContractDialog(): void {
    const investor = this.facade.detail();
    if (!investor) return;

    this.dialog.open(CreateContractDialogComponent, {
      width: '600px',
      data: { investor },
    }).afterClosed().subscribe(result => {
      if (result) this.facade.createContract(investor.id, result);
    });
  }
}