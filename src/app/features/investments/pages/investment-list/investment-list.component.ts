import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, Subject } from 'rxjs';

import { PageHeaderComponent }  from '../../../../shared/components/page-header/page-header.component';
import { LoaderComponent }       from '../../../../shared/components/loader/loader.component';
import { EmptyStateComponent }   from '../../../../shared/components/empty-state/empty-state.component';
import { KpiCardComponent }      from '../../../../shared/components/display/kpi-card/kpi-card.component';
import { BadgeComponent }        from '../../../../shared/components/display/badge/badge.component';
import { AmountDisplayComponent } from '../../../../shared/components/bills/amount-display/amount-display.component';

import { InvestmentService } from '../../services/investment.service';
import { Investment, INVESTMENT_STATUS } from '../../models/investment.model';
import { formatCurrency } from '../../../../core/utils/helpers';

@Component({
  selector: 'app-investment-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    PageHeaderComponent, LoaderComponent, EmptyStateComponent,
    KpiCardComponent, BadgeComponent, AmountDisplayComponent,
  ],
  templateUrl: './investment-list.component.html',
  styleUrl:    './investment-list.component.scss',
})
export class InvestmentListComponent implements OnInit {
  private svc      = inject(InvestmentService);
  private snackBar = inject(MatSnackBar);

  investments = signal<Investment[]>([]);
  loading     = signal(true);
  currentPage = signal(1);
  totalPages  = signal(1);

  statusFilter = '';
  investorFilter = '';
  private search$ = new Subject<void>();

  statusOptions = [{ label: 'Todos', value: '' }, ...INVESTMENT_STATUS];

  stats = signal({
    total: 0,
    active: 0,
    totalCapital: 0,
    totalProfits: 0,
  });

  formatCurrency = formatCurrency;

  ngOnInit(): void {
    this.search$.pipe(debounceTime(300)).subscribe(() => this.load());
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const params: Record<string, any> = { page: this.currentPage() };
    if (this.statusFilter)   params['status']   = this.statusFilter;
    if (this.investorFilter) params['investor']  = this.investorFilter;

    this.svc.getInvestments(params).subscribe({
      next: (res) => {
        if (res.success) {
          this.investments.set(res.data);
          this.totalPages.set(res.pagination?.total_pages ?? 1);
          this.stats.set({
            total:        res.data.length,
            active:       res.data.filter(i => i.status === 'active').length,
            totalCapital: res.data.reduce((s, i) => s + +i.current_capital, 0),
            totalProfits: res.data.reduce((s, i) => s + +i.total_profits, 0),
          });
        }
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.snackBar.open('Error al cargar inversiones', 'Cerrar', { duration: 3000 }); },
    });
  }

  onFilterChange(): void { this.currentPage.set(1); this.load(); }
  goToPage(p: number): void { this.currentPage.set(p); this.load(); }

  statusColor(s: string): 'success' | 'secondary' | 'warning' {
    return s === 'active' ? 'success' : s === 'paused' ? 'warning' : 'secondary';
  }

  roiColor(roi: number): string {
    return roi > 0 ? 'positive' : roi < 0 ? 'negative' : '';
  }
}