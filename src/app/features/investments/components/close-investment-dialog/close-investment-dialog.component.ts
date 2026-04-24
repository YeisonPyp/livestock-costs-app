import {
  Component, ChangeDetectionStrategy, input, output
} from '@angular/core';

import { ModalComponent } from '../../../../shared/components/overlays/modal/modal.component';
import { AmountDisplayComponent } from '../../../../shared/components/data-display/amount-display/amount-display.component';
import type { ClosureStatus } from '../../models/investment.model';
import { parseDecimal } from '../../../../core/utils/helpers';

@Component({
  selector: 'app-close-investment-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalComponent, AmountDisplayComponent],
  templateUrl: './close-investment-dialog.component.html',
  styleUrl: './close-investment-dialog.component.scss'
})
export class CloseInvestmentDialogComponent {
  readonly closureStatus = input<ClosureStatus | null>(null);
  readonly loading       = input<boolean>(false);
  readonly confirmed     = output<void>();
  readonly cancelled     = output<void>();
  readonly parseDecimal = parseDecimal;
}