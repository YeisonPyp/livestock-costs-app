// reports.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PageHeaderComponent }    from '../../../../shared/components/page-header/page-header.component';
import { LoaderComponent }         from '../../../../shared/components/loader/loader.component';
import { KpiCardComponent }        from '../../../../shared/components/display/kpi-card/kpi-card.component';
import { BadgeComponent }          from '../../../../shared/components/display/badge/badge.component';
import { AmountDisplayComponent }  from '../../../../shared/components/bills/amount-display/amount-display.component';
import { EmptyStateComponent }     from '../../../../shared/components/empty-state/empty-state.component';
import { ProgressBarComponent }    from '../../../../shared/components/display/progress-bar/progress-bar.component';

import { InvestmentService } from '../../services/investment.service';
import { ParticipationReport } from '../../models/investment.model';
import { formatCurrency } from '../../../../core/utils/helpers';

@Component({
  selector: 'app-investment-reports',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, LoaderComponent, KpiCardComponent, BadgeComponent, AmountDisplayComponent, EmptyStateComponent, ProgressBarComponent],
  templateUrl: './reports.component.html',
  styleUrl:    './reports.component.scss',
})
export class InvestmentReportsComponent implements OnInit {
  private svc      = inject(InvestmentService);
  private snackBar = inject(MatSnackBar);

  participation = signal<ParticipationReport[]>([]);
  cattleOwners  = signal<any[]>([]);
  loadingPart   = signal(true);
  loadingCattle = signal(true);

  formatCurrency = formatCurrency;

  totals = signal({ totalCapital: 0, totalProfits: 0, totalCattle: 0, avgRoi: 0 });

  ngOnInit(): void {
    this.loadParticipation();
    this.loadCattleOwners();
  }

  private loadParticipation(): void {
    this.svc.getParticipationReport().subscribe({
      next: (res) => {
        if (res.success) {
          this.participation.set(res.data);
          const data = res.data;
          const totalCap = data.reduce((s, r) => s + +r.total_capital, 0);
          const avgRoi = data.length ? data.reduce((s, r) => s + +r.roi_percentage, 0) / data.length : 0;
          this.totals.set({
            totalCapital: totalCap,
            totalProfits: data.reduce((s, r) => s + +r.total_profits, 0),
            totalCattle:  data.reduce((s, r) => s + r.cattle_count, 0),
            avgRoi:       avgRoi,
          });
        }
        this.loadingPart.set(false);
      },
      error: () => { this.loadingPart.set(false); },
    });
  }

  private loadCattleOwners(): void {
    this.svc.getCattleOwnersReport().subscribe({
      next: (res) => {
        if (res.success) this.cattleOwners.set(res.data);
        this.loadingCattle.set(false);
      },
      error: () => { this.loadingCattle.set(false); },
    });
  }

  participationPct(capital: number): number {
    const total = this.totals().totalCapital;
    return total > 0 ? (capital / total) * 100 : 0;
  }
}