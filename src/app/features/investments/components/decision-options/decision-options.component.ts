// components/decision-options/decision-options.component.ts
//
// Las tres tarjetas de opción (Reinvertir / Retirar / Distribuir).
// Extraídas del sale-decision-detail para reutilización y claridad.

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
  readonly investorAmount = input.required<number>();
  readonly selectedType   = input<SaleDecisionType | null>(null);
  readonly typeSelected   = output<SaleDecisionType>();

  readonly SaleDecisionType = SaleDecisionType;
  readonly fmt = formatCurrency;
}