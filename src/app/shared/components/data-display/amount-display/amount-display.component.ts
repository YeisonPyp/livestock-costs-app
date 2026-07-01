import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-amount-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './amount-display.component.html',
  styleUrl: './amount-display.component.scss'
})
export class AmountDisplayComponent {
  @Input({ required: true }) amount!: number | string;
  @Input() type: 'expense' | 'income' | 'neutral' = 'neutral';
  @Input() currency = 'COP';
  @Input() locale = 'es-CO';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() showSign = true;
  @Input() muted = false;

  // ✅ nuevo
  @Input() fractionDigits = 2;

  get formatted(): string {
    const safeAmount = Number(this.amount) || 0;

    return new Intl.NumberFormat(this.locale, {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: this.fractionDigits,
      maximumFractionDigits: this.fractionDigits
    }).format(Math.abs(safeAmount));
  }
}