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

    // {
    //   label: 'Fincas',
    //   icon: 'home',
    //   color: 'yellow',
    //   children: [
    //     {
    //       label: 'Lista de Fincas',
    //       icon: 'list',
    //       path: '/farms',
    //     },
    //     {
    //       label: 'Nueva Finca',
    //       icon: 'plus-circle',
    //       path: '/farms/new',
    //     },
    //   ],
    // },
    {
      label: 'Gestión de Costos',
      icon: 'dollar-sign',
      color: 'green',
      path: '/costs/costs',
    },
    // {
    //   label: 'Gestión de Costos',
    //   icon: 'dollar-sign',
    //   color: 'green',
    //   children: [
    //     {
    //       label: 'Registro de Costos',
    //       icon: 'list',
    //       path: '/costs/costs',
    //     },
    //     {
    //       label: 'Reportes',
    //       icon: 'file-text',
    //       path: '/costs/reports',
    //     },
    //   ],
    // },
    {
      label: 'Ganado',
      icon: 'plus-circle',
      color: 'purple',
      children: [
        {
          label: 'Lotes',
          icon: 'users',
          path: '/cattle/lots',
        },
        {
          label: 'Animales',
          icon: 'briefcase',
          path: '/cattle/animals',
        },
        {
          label: 'Salud',
          icon: 'shopping-cart',
          path: '/cattle/health',
        },
        {
          label: 'Reportes',
          icon: 'file-text',
          path: '/cattle/reports',
        },
      ]
    },
    {
      label: 'Inversiones',
      icon: 'trending-up',
      color: 'purple',
      children: [
        {
          label: 'Inversionistas',
          icon: 'users',
          path: '/investments/investors',
        },
        {
          label: 'Inversiones',
          icon: 'briefcase',
          path: '/investments/investments',
        },
        {
          label: 'Ventas',
          icon: 'shopping-cart',
          path: '/investments/sales',
        },
        {
          label: 'Decisiones',
          icon: 'check-circle',
          path: '/investments/decisions',
        },
        {
          label: 'Reportes',
          icon: 'file-text',
          path: '/investments/reports',
        },
      ],
    },
  ]);

  getMenuItems() {
    return this.menuItems();
  }
}