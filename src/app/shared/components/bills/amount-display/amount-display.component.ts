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
  @Input({ required: true }) amount!: number;
  @Input() type: 'expense' | 'income' | 'neutral' = 'neutral';
  @Input() currency = 'COP';
  @Input() locale = 'es-CO';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() showSign = true;
  @Input() muted = false;

  get formatted(): string {
    return new Intl.NumberFormat(this.locale, {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(this.amount));
  }
}