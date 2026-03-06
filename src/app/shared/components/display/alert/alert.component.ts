import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AlertType = 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.scss'
})
export class AlertComponent {
  @Input() type: AlertType = 'info';
  @Input() title = '';
  @Input() dismissible = false;
  @Output() dismissed = new EventEmitter<void>();

  visible = true;

  dismiss(): void {
    this.visible = false;
    this.dismissed.emit();
  }
}