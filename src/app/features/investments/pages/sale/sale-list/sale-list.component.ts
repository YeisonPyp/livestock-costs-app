// pages/sale-list/sale-list.component.ts

import {
  Component, OnInit, ChangeDetectionStrategy, inject
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { SaleFacade } from '../../../facades/sale.facade';
import { PageHeaderComponent }    from '../../../../../shared/components/navigation/page-header/page-header.component';
import { LoaderComponent }        from '../../../../../shared/components/feedback/loader/loader.component';
import { EmptyStateComponent }    from '../../../../../shared/components/feedback/empty-state/empty-state.component';
import { BadgeComponent }         from '../../../../../shared/components/ui/badge/badge.component';
import { AmountDisplayComponent } from '../../../../../shared/components/data-display/amount-display/amount-display.component';
import { KpiCardComponent }       from '../../../../../shared/components/data-display/kpi-card/kpi-card.component';
import { SaleCreateDrawerComponent } from '../../../components/sale-create-drawer/sale-create-drawer.component';
import { SaleStatsComponent } from '../../../components/sale-stats/sale-stats.component';

@Component({
  selector: 'app-sale-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SaleFacade],
  imports: [
    RouterLink, FormsModule,
    PageHeaderComponent, LoaderComponent, EmptyStateComponent,
    BadgeComponent, AmountDisplayComponent, KpiCardComponent,
    SaleCreateDrawerComponent, SaleStatsComponent,
  ],
  templateUrl: './sale-list.component.html',
})
export class SaleListComponent implements OnInit {
  readonly facade = inject(SaleFacade);

  ngOnInit(): void { this.facade.loadSales(); }
}