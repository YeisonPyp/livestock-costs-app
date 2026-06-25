// sidebar-menu.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

import { MenuService } from '../../../services/menu.service';
import { SidebarService } from '../../../services/sidebar.service';

@Component({
  selector: 'app-sidebar-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  animations: [
    // ✅ Solo para submenús - NO para el sidebar principal
    trigger('expandCollapse', [
      state(
        'collapsed',
        style({ height: '0px', opacity: 0, overflow: 'hidden' })
      ),
      state(
        'expanded',
        style({ height: '*', opacity: 1, overflow: 'visible' })
      ),
      transition('collapsed <=> expanded', animate('250ms ease-in-out')),
    ]),
    trigger('rotateChevron', [
      state('collapsed', style({ transform: 'rotate(0deg)' })),
      state('expanded', style({ transform: 'rotate(180deg)' })),
      transition('collapsed <=> expanded', animate('250ms ease-in-out')),
    ]),
  ],
  templateUrl: './sidebar-menu.component.html',
  styleUrl: './sidebar-menu.component.scss',
})
export class SidebarMenuComponent implements OnInit {
  private menuSvc = inject(MenuService);
  readonly sidebarService = inject(SidebarService);

  // ✅ Usar directamente el computed del MenuService
  readonly menuItems = this.menuSvc.activeMenuItems;

  // Estado local del componente
  readonly expandedItems = signal<Set<string>>(new Set());

  ngOnInit(): void {
    // No necesitamos checkViewport() aquí
    // El SidebarService ya lo maneja con BreakpointObserver
  }

  // ── Métodos de navegación ─────────────────────────────────────────

  toggleSubmenu(label: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.expandedItems.update((expanded) => {
      const newSet = new Set(expanded);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  }

  isSubMenuExpanded(label: string): boolean {
    return this.expandedItems().has(label);
  }

  onMenuItemClick(): void {
    // Cerrar sidebar al navegar en mobile
    this.sidebarService.closeMobileSidebar();
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }

  onOverlayClick(): void {
    this.sidebarService.closeMobileSidebar();
  }

  // ── Íconos SVG ────────────────────────────────────────────────────
  getIconSvg(icon?: string): string {
    const iconMap: Record<string, string> = {
      'bar-chart-2': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" 
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>`,
      'dollar-sign': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" 
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>`,
      'home': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" 
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>`,
      'trending-up': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" 
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 17"/>
        <polyline points="17 6 23 6 23 12"/>
      </svg>`,
      'layers': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" 
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2"/>
        <polyline points="2 12 12 17 22 12"/>
        <polyline points="2 17 12 22 22 17"/>
      </svg>`,
      'users': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" 
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>`,
      'plus-circle': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" 
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="16"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
      </svg>`,
      'shopping-cart': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" 
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="9" cy="21" r="1"/>
        <circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>`,
      'chevron-down': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" 
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"/>
      </svg>`,
    };
    return iconMap[icon ?? ''] ?? '';
  }
}