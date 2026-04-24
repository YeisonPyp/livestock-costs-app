// badge.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeColor = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary' | 'gray' | 'blue';
export type BadgeVariant = 'solid' | 'outline' | 'soft';
export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss'
})
export class BadgeComponent {
  @Input() label = '';
  @Input() color: BadgeColor = 'primary';
  @Input() variant: BadgeVariant = 'solid';
  @Input() size: BadgeSize = 'md';
  @Input() dot = false;
  @Input() icon = '';
  @Input() removable = false;
  @Input() disabled = false;

  onRemove(): void {
    // Este método puede ser extendido con @Output si es necesario
    console.log('Badge removed');
  }
}