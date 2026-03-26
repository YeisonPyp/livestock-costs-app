// investor-list.component.ts
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
import { AvatarComponent }       from '../../../../shared/components/display/avatar/avatar.component';

import { InvestmentService } from '../../services/investment.service';
import { Investor } from '../../models/investment.model';
import { formatCurrency } from '../../../../core/utils/helpers';

@Component({
  selector: 'app-investor-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PageHeaderComponent, LoaderComponent, EmptyStateComponent, KpiCardComponent, BadgeComponent, AvatarComponent],
  templateUrl: './investor-list.component.html',
  styleUrl: './investor-list.component.scss',
})
export class InvestorListComponent implements OnInit {
  private svc      = inject(InvestmentService);
  private snackBar = inject(MatSnackBar);

  investors   = signal<Investor[]>([]);
  loading     = signal(true);
  currentPage = signal(1);
  totalPages  = signal(1);
  searchTerm  = '';
  showInactive = false;
  private search$ = new Subject<void>();

  stats = signal({ total: 0, active: 0, totalCapital: 0, pendingDecisions: 0 });
  formatCurrency = formatCurrency;

  ngOnInit(): void {
    this.search$.pipe(debounceTime(350)).subscribe(() => this.load());
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const params: Record<string, any> = { page: this.currentPage() };
    if (this.searchTerm)   params['search']    = this.searchTerm;
    if (!this.showInactive) params['is_active'] = true;

    this.svc.getInvestors(params).subscribe({
      next: (res) => {
        if (res.success) {
          this.investors.set(res.data);
          this.totalPages.set(res.pagination?.total_pages ?? 1);
          this.stats.set({
            total:            res.data.length,
            active:           res.data.filter(i => i.is_active).length,
            totalCapital:     res.data.reduce((s, i) => s + Number(i.total_capital ?? 0),
  0
),
            pendingDecisions: 0,
          });
        }
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.snackBar.open('Error al cargar inversionistas', 'Cerrar', { duration: 3000 }); },
    });
  }

  onSearch(): void { this.currentPage.set(1); this.search$.next(); }
  goToPage(p: number): void { this.currentPage.set(p); this.load(); }
}