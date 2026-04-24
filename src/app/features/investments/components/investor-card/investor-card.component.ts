// components/investor-card/investor-card.component.ts
import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy
} from '@angular/core';

import { AvatarComponent } from '../../../../shared/components/ui/avatar/avatar.component';
import { BadgeComponent }  from '../../../../shared/components/ui/badge/badge.component';
import type { InvestorList } from '../../models/investor.model';
import { formatCurrency }  from '../../../../core/utils/helpers';

@Component({
  selector: 'app-investor-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AvatarComponent, BadgeComponent],
  templateUrl: './investor-card.component.html',
  styleUrl: './investor-card.component.scss',
})
export class InvestorCardComponent {
  @Input({ required: true }) investor!: InvestorList;
  @Output() cardClick = new EventEmitter<string>();

  fmt = (v: string | number) => formatCurrency(Number(v ?? 0));
}