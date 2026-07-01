import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';

import { SaleDecisionType } from '../../models/enums';
import type { SaleDecisionSummary } from '../../models/sale.model';
import { formatCurrency, parseDecimal } from '../../../../core/utils/helpers';

@Component({
  selector: 'app-decision-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './decision-card.component.html',
  styleUrl: './decision-card.component.scss',
})
export class DecisionCardComponent {
  readonly decision = input.required<SaleDecisionSummary>();
  readonly saving   = input<boolean>(false);

  readonly decide = output<{
    decision: SaleDecisionSummary;
    type: SaleDecisionType;
  }>();

  readonly SaleDecisionType = SaleDecisionType;
  readonly fmt = (v: string | number) => formatCurrency(parseDecimal(v));
  readonly pd  = parseDecimal;

  emit(type: SaleDecisionType): void {
    if (this.saving()) return;
    this.decide.emit({ decision: this.decision(), type });
  }

  isUrgent(): boolean {
    const dl = this.decision().decisionDeadline;
    if (!dl) return false;
    return Math.ceil((new Date(dl).getTime() - Date.now()) / 86_400_000) <= 2;
  }

  deadlineClass(): 'urgent' | 'warning' | 'ok' {
    const dl = this.decision().decisionDeadline;
    if (!dl) return 'ok';
    const days = Math.ceil((new Date(dl).getTime() - Date.now()) / 86_400_000);
    return days <= 0 ? 'urgent' : days <= 3 ? 'warning' : 'ok';
  }

  deadlineLabel(): string {
    const dl = this.decision().decisionDeadline;
    if (!dl) return '';
    const days = Math.ceil((new Date(dl).getTime() - Date.now()) / 86_400_000);
    if (days <= 0) return 'Vence hoy';
    if (days === 1) return 'Vence mañana';
    return `${days} días restantes`;
  }
}