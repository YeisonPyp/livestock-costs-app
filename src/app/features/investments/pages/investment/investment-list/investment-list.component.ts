// pages/investment-list/investment-list.component.ts

import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { InvestmentFacade } from '../../../facades/investment.facade';
import { InvestmentFormComponent } from '../investment-form/investment-form.component';
import { InvestmentStatsComponent } from '../../../components/investment-stats/investment-stats.component';

import { PageHeaderComponent }    from '../../../../../shared/components/navigation/page-header/page-header.component';
import { LoaderComponent }        from '../../../../../shared/components/feedback/loader/loader.component';
import { EmptyStateComponent }    from '../../../../../shared/components/feedback/empty-state/empty-state.component';
import { BadgeComponent }         from '../../../../../shared/components/ui/badge/badge.component';
import { AmountDisplayComponent } from '../../../../../shared/components/data-display/amount-display/amount-display.component';
import { ModalComponent }         from '../../../../../shared/components/overlays/modal/modal.component';
import { ButtonComponent }        from '../../../../../shared/components/ui/button/button.component';

import { InvestmentStatus } from '../../../models/enums';
import type { CreateInvestmentPayload } from '../../../models/investment.model';
import { formatDate } from '../../../../../core/utils/helpers';

@Component({
  selector: 'app-investment-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [InvestmentFacade],
  imports: [
    RouterLink, FormsModule,
    PageHeaderComponent, LoaderComponent, EmptyStateComponent,
    BadgeComponent, AmountDisplayComponent, ModalComponent,
    ButtonComponent, InvestmentFormComponent, InvestmentStatsComponent,
  ],
  templateUrl: './investment-list.component.html',
  styleUrl:    './investment-list.component.scss',
})
export class InvestmentListComponent implements OnInit, OnDestroy {
  readonly facade = inject(InvestmentFacade);
  private readonly destroy$ = new Subject<void>();
  private readonly search$  = new Subject<string>();

  readonly formatDate = formatDate;

  readonly statusOptions = [
    { value: '',                          label: 'Todos los estados' },
    { value: InvestmentStatus.ACTIVE,     label: 'Activa'     },
    { value: InvestmentStatus.CLOSED,     label: 'Cerrada'    },
    { value: InvestmentStatus.SUSPENDED,  label: 'Suspendida' },
  ];

  ngOnInit(): void {
    this.facade.loadInitialData();
    this.search$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => this.facade.updateFilter({ search }));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(value: string): void { this.search$.next(value); }

  onCreateSubmit(payload: CreateInvestmentPayload): void {
    this.facade.createInvestment(payload);
  }
}