import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SaleDecision } from '../../../../models/investment.model';

@Component({
  selector: 'app-decision-card',
  imports: [CommonModule],
  templateUrl: './decision-card.component.html',
  styleUrl: './decision-card.component.scss'
})

export class DecisionCardComponent {
  decision = input.required<SaleDecision>();
  decide   = output<{ decision: SaleDecision; type: 'reinvest' | 'withdraw' | 'partial' }>();

  emit(type: 'reinvest' | 'withdraw' | 'partial'): void {
    this.decide.emit({ decision: this.decision(), type });
  }

  isUrgent(): boolean {
    if (!this.decision().decision_deadline) return false;
    const days = Math.ceil(
      (new Date(this.decision().decision_deadline!).getTime() - Date.now()) / 86_400_000
    );
    return days <= 2;
  }

  deadlineClass(): string {
    if (!this.decision().decision_deadline) return '';
    const days = Math.ceil(
      (new Date(this.decision().decision_deadline!).getTime() - Date.now()) / 86_400_000
    );
    return days <= 0 ? 'urgent' : days <= 3 ? 'warning' : 'ok';
  }

  deadlineLabel(): string {
    if (!this.decision().decision_deadline) return '';
    const days = Math.ceil(
      (new Date(this.decision().decision_deadline!).getTime() - Date.now()) / 86_400_000
    );
    if (days <= 0)  return 'Vence hoy';
    if (days === 1) return 'Vence mañana';
    return `${days} días restantes`;
  }

  formatCOP(v: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP',
      maximumFractionDigits: 0,
    }).format(v);
  }
}