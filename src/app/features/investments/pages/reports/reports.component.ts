// pages/reports/reports.component.ts

import {
  Component, OnInit, ChangeDetectionStrategy, inject
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { ReportsFacade } from '../../facades/reports.facade';

import { PageHeaderComponent }    from '../../../../shared/components/navigation/page-header/page-header.component';
import { LoaderComponent }        from '../../../../shared/components/feedback/loader/loader.component';
import { EmptyStateComponent }    from '../../../../shared/components/feedback/empty-state/empty-state.component';
import { KpiCardComponent }       from '../../../../shared/components/data-display/kpi-card/kpi-card.component';
import { BadgeComponent }         from '../../../../shared/components/ui/badge/badge.component';
import { AmountDisplayComponent } from '../../../../shared/components/data-display/amount-display/amount-display.component';
import { formatCurrency, parseDecimal }         from '../../../../core/utils/helpers';
import { ProgressBarComponent }   from '../../../../shared/components/ui/progress-bar/progress-bar.component';

@Component({
  selector: 'app-investment-reports',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ReportsFacade],
  imports: [
    RouterLink,
    PageHeaderComponent, LoaderComponent, EmptyStateComponent,
    KpiCardComponent, BadgeComponent, AmountDisplayComponent, ProgressBarComponent,
  ],
  templateUrl: './reports.component.html',
  styleUrl:    './reports.component.scss',
})
export class InvestmentReportsComponent implements OnInit {
  readonly facade = inject(ReportsFacade);
  readonly formatCurrency = formatCurrency;
  readonly parseDecimal = parseDecimal;

  ngOnInit(): void { this.facade.loadAll(); }
}