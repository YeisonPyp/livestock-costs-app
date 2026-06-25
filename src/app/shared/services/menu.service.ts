// src/app/services/menu.service.ts
import { Injectable, computed, signal } from '@angular/core';

export interface MenuItem {
  label: string;
  icon?: string;
  path?: string;
  children?: MenuItem[];
  badge?: string | number;
  color?: MenuColor;
  roles?: string[]; // Control de acceso por rol
  disabled?: boolean;
}

// ✅ Tipo estricto para colores - evita errores de typo
export type MenuColor =
  | 'blue'
  | 'green'
  | 'red'
  | 'purple'
  | 'orange'
  | 'yellow'
  | 'pink'
  | 'indigo'
  | 'teal'
  | 'slate';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  // ── Estado privado ────────────────────────────────────────────────
  private readonly _menuItems = signal<MenuItem[]>([
    {
      label: 'Dashboard',
      icon: 'bar-chart-2',
      path: '/dashboard',
      color: 'blue',
    },
    {
      label: 'Categorías',
      icon: 'layers',
      color: 'pink',
      path: '/costs/categories',
    },
    {
      label: 'Fincas',
      icon: 'home',
      color: 'yellow',
      path: '/farms',
    },
    {
      label: 'Gestión de Costos',
      icon: 'dollar-sign',
      color: 'green',
      path: '/costs/costs',
    },
    {
      label: 'Inversionistas',
      icon: 'users',
      color: 'purple',
      path: '/investments/investors',
    },
    {
      label: 'Ganado',
      icon: 'plus-circle',
      color: 'orange',
      path: '/cattle/animals',
    },
    {
      label: 'Inversiones',
      icon: 'trending-up',
      color: 'indigo',
      path: '/investments/investments',
    },
    {
      label: 'Ventas',
      icon: 'shopping-cart',
      color: 'teal',
      path: '/investments/sales',
    },
  ]);

  // ── API Pública (solo lectura) ─────────────────────────────────────
  readonly menuItems = this._menuItems.asReadonly();

  // ── Computed: items habilitados solamente ──────────────────────────
  readonly activeMenuItems = computed(() =>
    this._menuItems().filter((item) => !item.disabled)
  );

  // ── Computed: total de badges ──────────────────────────────────────
  readonly totalBadgeCount = computed(() =>
    this._menuItems().reduce((acc, item) => {
      const badge = Number(item.badge) || 0;
      const childBadges =
        item.children?.reduce(
          (childAcc, child) => childAcc + (Number(child.badge) || 0),
          0
        ) || 0;
      return acc + badge + childBadges;
    }, 0)
  );

  // ── Métodos públicos ───────────────────────────────────────────────

  /**
   * Obtiene los items del menú (compatible con el código existente)
   */
  getMenuItems(): MenuItem[] {
    return this._menuItems();
  }

  /**
   * Actualiza el badge de un ítem específico
   */
  updateBadge(label: string, badge: string | number | undefined): void {
    this._menuItems.update((items) =>
      items.map((item) => (item.label === label ? { ...item, badge } : item))
    );
  }

  /**
   * Filtra el menú según los roles del usuario
   */
  getItemsByRole(userRoles: string[]): MenuItem[] {
    return this._menuItems().filter((item) => {
      // Si el item no tiene restricción de roles, es visible para todos
      if (!item.roles || item.roles.length === 0) return true;
      // Si tiene roles, verificar que el usuario tenga al menos uno
      return item.roles.some((role) => userRoles.includes(role));
    });
  }

  /**
   * Busca un ítem por su path (útil para breadcrumbs)
   */
  findItemByPath(path: string): MenuItem | undefined {
    const searchInItems = (items: MenuItem[]): MenuItem | undefined => {
      for (const item of items) {
        if (item.path === path) return item;
        if (item.children) {
          const found = searchInItems(item.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    return searchInItems(this._menuItems());
  }
}