// src/features/users/components/user-status-badge/user-status-badge.component.ts
import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeType =
  | 'active'
  | 'inactive'
  | 'verified'
  | 'unverified'
  | 'locked'
  | 'staff'
  | 'natural'
  | 'juridical';

interface BadgeConfig {
  label: string;
  cssClass: string;
  icon: string;
}

@Component({
  selector: 'app-user-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="config().cssClass">
      <span class="badge__icon" [innerHTML]="config().icon"></span>
      {{ config().label }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.72rem;
      font-weight: 600;
      white-space: nowrap;
      letter-spacing: 0.01em;

      &__icon {
        display: flex;
        align-items: center;
        ::ng-deep svg { width: 11px; height: 11px; }
      }

      // ── Variantes ──────────────────────────────────
      &.badge--active    { background: #dcfce7; color: #16a34a; }
      &.badge--inactive  { background: #f1f5f9; color: #64748b; }
      &.badge--verified  { background: #dbeafe; color: #2563eb; }
      &.badge--unverified{ background: #fef9c3; color: #ca8a04; }
      &.badge--locked    { background: #fee2e2; color: #dc2626; }
      &.badge--staff     { background: #f3e8ff; color: #9333ea; }
      &.badge--natural   { background: #e0f2fe; color: #0284c7; }
      &.badge--juridical { background: #fef3c7; color: #b45309; }
    }
  `],
})
export class UserStatusBadgeComponent {
  type = input.required<BadgeType>();

  private readonly configs: Record<BadgeType, BadgeConfig> = {
    active: {
      label: 'Activo',
      cssClass: 'badge--active',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
               <circle cx="12" cy="12" r="10" fill="#16a34a" stroke="none"/>
               <polyline points="20 6 9 17 4 12" stroke="white"/>
             </svg>`,
    },
    inactive: {
      label: 'Inactivo',
      cssClass: 'badge--inactive',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
               <circle cx="12" cy="12" r="10"/>
             </svg>`,
    },
    verified: {
      label: 'Verificado',
      cssClass: 'badge--verified',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
               <polyline points="20 6 9 17 4 12"/>
             </svg>`,
    },
    unverified: {
      label: 'Sin verificar',
      cssClass: 'badge--unverified',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
               <circle cx="12" cy="12" r="10"/>
               <line x1="12" y1="8" x2="12" y2="12"/>
               <line x1="12" y1="16" x2="12.01" y2="16"/>
             </svg>`,
    },
    locked: {
      label: 'Bloqueado',
      cssClass: 'badge--locked',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
               <rect x="3" y="11" width="18" height="11" rx="2"/>
               <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
             </svg>`,
    },
    staff: {
      label: 'Staff',
      cssClass: 'badge--staff',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
               <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
             </svg>`,
    },
    natural: {
      label: 'Natural',
      cssClass: 'badge--natural',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
               <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
               <circle cx="12" cy="7" r="4"/>
             </svg>`,
    },
    juridical: {
      label: 'Jurídica',
      cssClass: 'badge--juridical',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
               <rect x="2" y="7" width="20" height="14" rx="2"/>
               <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
             </svg>`,
    },
  };

  readonly config = computed(() => this.configs[this.type()]);
}