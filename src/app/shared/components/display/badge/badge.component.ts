import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeColor = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary' | 'gray';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss'
})
export class BadgeComponent {
  @Input() color: BadgeColor = 'primary';
  @Input() outline = false;
  @Input() dot = false;
  @Input() size: 'sm' | 'md' = 'md';
}