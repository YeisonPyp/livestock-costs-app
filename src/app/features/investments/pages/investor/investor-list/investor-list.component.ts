// pages/investor/investor-list/investor-list.component.ts

import {
  Component, OnInit, ChangeDetectionStrategy, inject, signal
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { InvestorFacade } from '../../../facades/investor.facade';
import { PageHeaderComponent }   from '../../../../../shared/components/navigation/page-header/page-header.component';
import { LoaderComponent }       from '../../../../../shared/components/feedback/loader/loader.component';
import { EmptyStateComponent }   from '../../../../../shared/components/feedback/empty-state/empty-state.component';
import { KpiCardComponent }      from '../../../../../shared/components/data-display/kpi-card/kpi-card.component';
import { formatCurrency }        from '../../../../../core/utils/helpers';
import { InvestorCardComponent } from '../../../components/investor-card/investor-card.component';
import { InvestorStatsComponent } from '../../../components/investor-stats/investor-stats.component';

@Component({
  selector: 'app-investor-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [InvestorFacade],
  imports: [
    FormsModule, PageHeaderComponent, LoaderComponent, 
    EmptyStateComponent, InvestorCardComponent, InvestorStatsComponent,
  ],
  templateUrl: './investor-list.component.html',
  styleUrl: './investor-list.component.scss',
})
export class InvestorListComponent implements OnInit {
  readonly facade = inject(InvestorFacade);

  private readonly search$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  formatCurrency = formatCurrency;

  ngOnInit(): void {
    this.facade.loadInvestors();

    this.search$
      .pipe(debounceTime(350), takeUntil(this.destroy$))
      .subscribe(search => this.facade.updateListFilter({ search }));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(value: string): void {
    this.search$.next(value);
  }
}