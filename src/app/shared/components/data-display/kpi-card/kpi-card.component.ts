import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  providers: [CurrencyPipe, DecimalPipe, PercentPipe],
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.scss'
})
export class KpiCardComponent {

  @Input() label = '';
  @Input() value: number | string = 0;

  @Input() format: 'currency' | 'number' | 'percent' | 'text' = 'number';
  @Input() currency = 'USD';

  @Input() icon?: string;

  @Input() trend?: number;
  @Input() trendLabel?: string;
  @Input() trendDescription = '';

  @Input() loading = false;

  @Input() color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' = 'blue';
  @Input() trendColor: 'blue' | 'green' | 'yellow' | 'red' | 'purple' = 'blue';

  constructor(
    private currencyPipe: CurrencyPipe,
    private decimalPipe: DecimalPipe,
    private percentPipe: PercentPipe
  ) {}

  get formattedValue(): string {

    if (this.value === null || this.value === undefined) return '';

    if (this.format === 'currency') {
      return this.currencyPipe.transform(
        Number(this.value),
        this.currency,
        'symbol',
        '1.0-0'
      ) ?? '';
    }

    if (this.format === 'percent') {
      return this.percentPipe.transform(Number(this.value) / 100) ?? '';
    }

    if (this.format === 'number') {
      return this.decimalPipe.transform(Number(this.value), '1.0-0') ?? '';
    }

    return String(this.value);
  }

    /** Convert kebab-case icon name to SVG path data (Feather/Lucide inline subset) */
  get iconPath(): string | null {
    return ICON_PATHS[this.icon ?? ''] ?? null;
  }
}

// Minimal inline icon registry — add more as needed
const ICON_PATHS: Record<string, string> = {
  'dollar-sign':    'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  'trending-up':   'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6',
  'trending-down': 'M23 18l-9.5-9.5-5 5L1 6M17 18h6v-6',
  'users':         'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm14 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  'shopping-cart': 'M6 2H3l-3 12h18l-1.5-9H7L6 2zM16 22a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 22a2 2 0 1 1-4 0 2 2 0 0 1 4 0z',
  'bar-chart-2':   'M18 20V10M12 20V4M6 20v-6',
  'package':       'M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
  'credit-card':   'M1 4h22v16H1zM1 10h22',
  'activity':      'M22 12h-4l-3 9L9 3l-3 9H2',
  'clock':         'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2',
  'zap':           'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  'percent':       'M19 5L5 19M6.5 4.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm11 11a2 2 0 1 1-4 0 2 2 0 0 1 4 0z',
};
