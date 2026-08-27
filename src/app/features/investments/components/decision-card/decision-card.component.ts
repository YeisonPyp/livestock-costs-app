import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
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

  // ── ✨ Valores financieros desde el backend (con fallback) ────────
  readonly totalAmount = computed(() => {
    const d = this.decision();
    return parseDecimal(d.investorAmount);
  });

  readonly profitLoss = computed(() => {
    const d = this.decision();
    // Usar effectiveProfit del backend si existe, fallback a profitLoss
    return d.effectiveProfit
      ? parseDecimal(d.effectiveProfit)
      : Math.max(parseDecimal(d.profitLoss), 0);
  });

  readonly tax4x1000 = computed(() => {
    const d = this.decision();
    // Usar valor del backend si existe, fallback a cálculo local
    if (d.tax4x1000) return parseDecimal(d.tax4x1000);
    return parseDecimal(d.investorAmount) * 0.004;
  });

  readonly netValueToDecide = computed(() => {
    const d = this.decision();
    // Usar valor del backend si existe, fallback a cálculo local
    if (d.netValueToDecide) return parseDecimal(d.netValueToDecide);
    return this.totalAmount() - this.profitLoss() - this.tax4x1000();
  });

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