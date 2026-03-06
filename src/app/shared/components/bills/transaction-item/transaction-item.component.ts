import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Transaction {
  id: string | number;
  name: string;
  category: string;
  categoryIcon: string;     // SVG string
  categoryColor: string;    // hex color
  amount: number;
  type: 'expense' | 'income';
  date: Date | string;
  note?: string;
  currency?: string;
  locale?: string;
}

@Component({
  selector: 'app-transaction-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transaction-item.component.html',
  styleUrl: './transaction-item.component.scss'
})
export class TransactionItemComponent {
  @Input({ required: true }) transaction!: Transaction;
  @Input() clickable = true;
  @Input() currency = 'COP';
  @Input() locale = 'es-CO';

  @Output() clicked = new EventEmitter<Transaction>();

  get formattedAmount(): string {
    const curr = this.transaction.currency ?? this.currency;
    const loc  = this.transaction.locale ?? this.locale;
    return new Intl.NumberFormat(loc, {
      style: 'currency', currency: curr, minimumFractionDigits: 0
    }).format(this.transaction.amount);
  }

  get formattedDate(): string {
    return new Date(this.transaction.date).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'short'
    });
  }
}