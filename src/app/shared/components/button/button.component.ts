import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="getButtonClasses()"
      (click)="handleClick()"
    >
      @if (loading) {
        <span class="inline-block animate-spin mr-2">⏳</span>
      }
      @if (icon && !loading) {
        <span class="mr-2">{{ icon }}</span>
      }
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    .btn-base {
      @apply px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
    }
    .btn-primary {
      @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
    }
    .btn-secondary {
      @apply bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500;
    }
    .btn-danger {
      @apply bg-red-600 text-white hover:bg-red-700 focus:ring-red-500;
    }
    .btn-success {
      @apply bg-green-600 text-white hover:bg-green-700 focus:ring-green-500;
    }
  `]
})
export class ButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() variant: 'primary' | 'secondary' | 'danger' | 'success' = 'primary';
  @Input() loading = false;
  @Input() disabled = false;
  @Input() icon?: string;
  @Output() clicked = new EventEmitter<void>();

  handleClick(): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit();
    }
  }

  getButtonClasses(): string {
    const baseClass = 'btn-base';
    const variantClass = `btn-${this.variant}`;
    return `${baseClass} ${variantClass}`;
  }
}
