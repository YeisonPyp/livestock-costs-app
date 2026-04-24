// pages/investor/contract-list/contract-list.component.ts

import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject
} from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';

import { ContractFacade, ContractViewMode } from '../../../facades/contract.facade';
import { CONTRACT_STATUS_DISPLAY, CONTRACT_TYPE_DISPLAY } from '../../../models/contract.model';
import { ContractStatus, ContractType } from '../../../models/enums';

import { PageHeaderComponent }     from '../../../../../shared/components/navigation/page-header/page-header.component';
import { LoaderComponent }         from '../../../../../shared/components/feedback/loader/loader.component';
import { BadgeColor, BadgeComponent }          from '../../../../../shared/components/ui/badge/badge.component';
import { EmptyStateComponent }     from '../../../../../shared/components/feedback/empty-state/empty-state.component';
import { AlertComponent }          from '../../../../../shared/components/feedback/alert/alert.component';
import { ContractStatsComponent }  from '../../../components/contract-stats/contract-stats.component';
import { SafeDatePipe } from "../../../../../shared/pipes/safe-date.pipe";

@Component({
  selector: 'app-contract-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ContractFacade],
  imports: [
    RouterLink, ReactiveFormsModule,
    PageHeaderComponent, LoaderComponent, BadgeComponent,
    EmptyStateComponent, AlertComponent, ContractStatsComponent,
    SafeDatePipe
],
  templateUrl: './contract-list.component.html',
  styleUrl:    './contract-list.component.scss',
})
export class ContractListComponent implements OnInit, OnDestroy {
  readonly facade = inject(ContractFacade);
  private  route  = inject(ActivatedRoute);
  private  router = inject(Router);

  private readonly destroy$ = new Subject<void>();

  // Opciones para selects
  readonly statusOptions = Object.entries(CONTRACT_STATUS_DISPLAY).map(([value, meta]) => ({
    value, label: meta.label,
  }));
  readonly typeOptions = Object.entries(CONTRACT_TYPE_DISPLAY).map(([value, meta]) => ({
    value, label: meta.label,
  }));

  filterForm = new FormGroup({
    search:        new FormControl(''),
    status:        new FormControl<ContractStatus | ''>(''),
    contractType:  new FormControl<ContractType | ''>(''),
    investorId:    new FormControl(''),
  });

  ngOnInit(): void {
    const investorId = this.route.snapshot.queryParamMap.get('investor');
    if (investorId) {
      this.facade.initInvestorFilter(investorId);
      this.filterForm.patchValue({ investorId });
    }

    this.facade.loadInvestors();
    this.facade.loadContracts();
    this.setupFilterListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setViewMode(mode: ContractViewMode): void {
    this.filterForm.reset({ search: '', status: '', contractType: '', investorId: '' });
    this.facade.setViewMode(mode);
  }

  applyFilters(): void {
    const v = this.filterForm.value;
    this.facade.applyFilters({
      status:     v.status        as ContractStatus | undefined,
      contractType: v.contractType as ContractType | undefined,
      investorId: v.investorId   || undefined,
      search:     v.search       || undefined,
    });
  }

  clearFilters(): void {
    this.filterForm.reset({ search: '', status: '', contractType: '', investorId: '' });
    this.facade.clearFilters(this.router, this.route);
  }

  getStatusColor(status: ContractStatus): BadgeColor {
    return CONTRACT_STATUS_DISPLAY[status]?.color ?? 'secondary';
  }

  getTypeColor(type: ContractType): BadgeColor {
    return CONTRACT_TYPE_DISPLAY[type]?.color ?? 'secondary';
  }

  private setupFilterListener(): void {
    this.filterForm.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => this.applyFilters());
  }
}