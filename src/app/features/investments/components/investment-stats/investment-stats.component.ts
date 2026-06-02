import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { KpiCardComponent } from '../../../../shared/components/data-display/kpi-card/kpi-card.component';
import type { StatsState } from '../../facades/investment.facade';

@Component({
  selector: 'app-investment-stats',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KpiCardComponent],
  templateUrl: './investment-stats.component.html',
  styleUrl: './investment-stats.component.scss',
})
export class InvestmentStatsComponent {
  @Input({ required: true }) stats!: StatsState;
}