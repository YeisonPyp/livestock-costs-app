import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-bar.component.html',
  styleUrl: './progress-bar.component.scss'
})
export class ProgressBarComponent {
  @Input() value = 0;
  @Input() max = 100;
  @Input() label = '';
  @Input() subtitle = '';
  @Input() showValue = true;
  @Input() showSubtitle = false;
  @Input() trackHeight = 8;
  @Input() format: 'percent' | 'fraction' | 'currency' = 'percent';
  @Input() currency = 'COP';
  @Input() locale = 'es-CO';

  /** Thresholds for color changes. Defaults: warn at 75%, danger at 90% */
  @Input() warnAt = 75;
  @Input() dangerAt = 90;

  get clampedValue(): number {
    return Math.min(100, Math.max(0, (this.value / this.max) * 100));
  }

  get statusColor(): 'success' | 'warning' | 'danger' | 'primary' {
    if (this.clampedValue >= this.dangerAt) return 'danger';
    if (this.clampedValue >= this.warnAt)   return 'warning';
    if (this.clampedValue >= 100)           return 'success';
    return 'primary';
  }

  get displayValue(): string {
    switch (this.format) {
      case 'fraction': return `${this.value} / ${this.max}`;
      case 'currency':
        return new Intl.NumberFormat(this.locale, {
          style: 'currency', currency: this.currency,
          minimumFractionDigits: 0
        }).format(this.value);
      default: return `${Math.round(this.clampedValue)}%`;
    }
  }
}