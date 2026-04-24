// alert.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

export type AlertType = 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.scss',
  animations: [
    trigger('alertAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-8px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-4px)' }))
      ])
    ])
  ]
})
export class AlertComponent implements OnInit, OnDestroy {
  @Input() type: AlertType = 'info';
  @Input() message: string = '';
  @Input() title: string = '';
  @Input() dismissible = false;
  @Input() autoClose = false;
  @Input() autoCloseDuration = 5000; // 5 segundos

  @Output() dismissed = new EventEmitter<void>();

  isVisible = true;
  private autoCloseTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    if (this.autoClose) {
      this.startAutoClose();
    }
  }

  ngOnDestroy(): void {
    this.clearAutoClose();
  }

  dismiss(): void {
    this.isVisible = false;
    this.clearAutoClose();
    this.dismissed.emit();
  }

  private startAutoClose(): void {
    this.clearAutoClose();
    this.autoCloseTimer = setTimeout(() => {
      this.dismiss();
    }, this.autoCloseDuration);
  }

  private clearAutoClose(): void {
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = null;
    }
  }

  // Método público para resetear la alerta
  reset(): void {
    this.isVisible = true;
    if (this.autoClose) {
      this.startAutoClose();
    }
  }
}