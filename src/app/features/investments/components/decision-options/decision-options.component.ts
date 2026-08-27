import {
  Component, ChangeDetectionStrategy, input, output
} from '@angular/core';
import { SaleDecisionType } from '../../models/enums';
import { formatCurrency } from '../../../../core/utils/helpers';

@Component({
  selector: 'app-decision-options',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './decision-options.component.html',
  styleUrl: './decision-options.component.scss',
})
export class DecisionOptionsComponent {
  // ✨ Señales financieras mapeadas directamente desde el backend
  readonly investorAmount   = input.required<number>();   // Total $3.514.744
  readonly effectiveProfit  = input.required<number>();   // Utilidad $583.830
  readonly tax4x1000        = input.required<number>();   // GMF -$14.059
  readonly netValueToDecide = input.required<number>();   // Neto a decidir $2.916.855

  readonly selectedType     = input<SaleDecisionType | null>(null);
  readonly typeSelected     = output<SaleDecisionType>();

  readonly SaleDecisionType = SaleDecisionType;
  readonly fmt = formatCurrency;
}