import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.scss'
})
export class KpiCardComponent {
  @Input() label = '';
  @Input() value = '';
  @Input() trend?: number;           // positive = up, negative = down
  @Input() trendLabel?: string;      // override auto-generated trend text
  @Input() trendDescription = '';    // e.g. "vs mes anterior"
  @Input() color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' = 'blue';
}