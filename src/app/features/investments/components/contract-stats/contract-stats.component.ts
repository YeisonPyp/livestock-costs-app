// components/contract-stats/contract-stats.component.ts

import {
  Component, Input, Output, EventEmitter, ChangeDetectionStrategy
} from '@angular/core';
import type { ContractViewMode } from '../../facades/contract.facade';

export interface ContractStats {
  total:    number;
  active:   number;
  expiring: number;
  expired:  number;
}

@Component({
  selector: 'app-contract-stats',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contract-stats.component.html',
  styleUrl: './contract-stats.component.scss',
})
export class ContractStatsComponent {
  @Input({ required: true }) stats!: ContractStats;
  @Input() activeMode: ContractViewMode = 'all';
  @Output() modeChange = new EventEmitter<ContractViewMode>();
}