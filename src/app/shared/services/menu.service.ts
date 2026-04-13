import { Injectable } from '@angular/core';
import { signal } from '@angular/core';

export interface MenuItem {
  label: string;
  icon?: string;
  path?: string;
  children?: MenuItem[];
  badge?: string | number;
  color?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  menuItems = signal<MenuItem[]>([
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
      color: 'purple',
      path: '/investments/investments',
    },
    {
      label: 'Ventas',
      icon: 'shopping-cart',
      color: 'green',
      path: '/investments/sales',
    }

  ]);

  getMenuItems() {
    return this.menuItems();
  }
}