// components/investor-stats/investor-stats.component.ts

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { KpiCardComponent } from '../../../../shared/components/data-display/kpi-card/kpi-card.component';
import { formatCurrency } from '../../../../core/utils/helpers';

export interface InvestorStats {
  total:        number;
  active:       number;
  totalCapital: number;
  totalInvestments: number;
}

@Component({
  selector: 'app-investor-stats',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KpiCardComponent],
  templateUrl: './investor-stats.component.html',
  styleUrl: './investor-stats.component.scss',
})
export class InvestorStatsComponent {
  @Input({ required: true }) stats!: InvestorStats;
  fmt = (v: number) => formatCurrency(v);

  ngOnChanges() {
    console.log('STATS CHANGE:', this.stats);
  }
}