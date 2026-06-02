// components/sale-stats/sale-stats.component.ts

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { KpiCardComponent } from '../../../../shared/components/data-display/kpi-card/kpi-card.component';
import type { SaleListStats } from '../../facades/sale.facade';

@Component({
  selector: 'app-sale-stats',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KpiCardComponent],
  templateUrl: './sale-stats.component.html',
  styleUrl: './sale-stats.component.scss',
})
export class SaleStatsComponent {
  @Input({ required: true }) stats!: SaleListStats;
}