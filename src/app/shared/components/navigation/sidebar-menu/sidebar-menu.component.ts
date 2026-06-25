import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';

import { MenuService, MenuItem } from '../../../services/menu.service';

@Component({
  selector: 'app-sidebar-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({ height: '0', opacity: 0, overflow: 'hidden' })),
      state('expanded', style({ height: '*', opacity: 1, overflow: 'visible' })),
      transition('collapsed <=> expanded', animate('300ms ease-in-out')),
    ]),
    trigger('rotate', [
      state('collapsed', style({ transform: 'rotate(0deg)' })),
      state('expanded', style({ transform: 'rotate(180deg)' })),
      transition('collapsed <=> expanded', animate('300ms ease-in-out')),
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)' }),
        animate('300ms ease-in-out', style({ transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('300ms ease-in-out', style({ transform: 'translateX(-100%)' })),
      ]),
    ]),
  ],
  templateUrl: './sidebar-menu.component.html',
  styleUrl: './sidebar-menu.component.scss',
})
export class SidebarMenuComponent implements OnInit {
  private menuSvc = inject(MenuService);

  menuItems = signal<MenuItem[]>([]);
  expandedItems = signal<Set<string>>(new Set());
  isCollapsed = signal(false);
  isMobile = signal(false);
  isMobileSidebarOpen = signal(false);

  ngOnInit(): void {
    this.menuItems.set(this.menuSvc.getMenuItems());
    this.checkViewport();
  }

  // ✅ Detectar cambios de viewport
  @HostListener('window:resize', ['$event'])
  onWindowResize(event: Event): void {
    this.checkViewport();
  }

  // ✅ Cerrar sidebar al hacer click fuera en mobile
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isMobile()) {
      const target = event.target as HTMLElement;
      const sidebar = document.querySelector('.sidebar');
      const toggleBtn = document.querySelector('.collapse-btn');

      if (sidebar && !sidebar.contains(target) && !toggleBtn?.contains(target)) {
        this.isMobileSidebarOpen.set(false);
      }
    }
  }

  private checkViewport(): void {
    const isMobileView = window.innerWidth < 768; // Breakpoint de 768px
    this.isMobile.set(isMobileView);

    // Cerrar sidebar cuando cambia a desktop
    if (!isMobileView && this.isMobileSidebarOpen()) {
      this.isMobileSidebarOpen.set(false);
    }
  }

  toggleSubmenu(label: string, event: Event): void {
    event.preventDefault();
    const expanded = new Set(this.expandedItems());
    if (expanded.has(label)) {
      expanded.delete(label);
    } else {
      expanded.add(label);
    }
    this.expandedItems.set(expanded);
  }

  isSubMenuExpanded(label: string): boolean {
    return this.expandedItems().has(label);
  }

  toggleSidebar(): void {
    if (this.isMobile()) {
      // En mobile, mostrar/ocultar el sidebar
      this.isMobileSidebarOpen.set(!this.isMobileSidebarOpen());
    } else {
      // En desktop, contraer/expandir
      this.isCollapsed.set(!this.isCollapsed());
    }
  }

  closeMobileSidebar(): void {
    if (this.isMobile()) {
      this.isMobileSidebarOpen.set(false);
    }
  }

  getIconSvg(icon?: string): string {
    const iconMap: Record<string, string> = {
      'bar-chart-2': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
      'dollar-sign': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
      'home': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
      'trending-up': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 17"/><polyline points="17 6 23 6 23 12"/></svg>',
      'layers': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="12 2 2 7 2 17 12 22 22 17 22 7 12 2"/><polyline points="2 7 12 12 22 7"/><polyline points="2 17 12 12 22 17"/></svg>',
      'list': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
      'tag': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
      'file-text': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="13" x2="12" y2="17"/><line x1="9" y1="15" x2="15" y2="15"/></svg>',
      'users': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      'briefcase': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 7v-2a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>',
      'shopping-cart': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
      'check-circle': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/><circle cx="12" cy="12" r="10"/></svg>',
      'plus-circle': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
      'chevron-down': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>',
    };
    return iconMap[icon || ''] || '';
  }
}