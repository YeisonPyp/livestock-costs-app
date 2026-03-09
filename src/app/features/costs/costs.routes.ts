import { Routes } from '@angular/router';

export const COSTS_ROUTES: Routes = [
  // Dashboard
  {
    path: '',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'Dashboard · Costos',
  },

  // ── Cost entries ──────────────────────────────────────────────────────────
  {
    path: 'costs',
    loadComponent: () =>
      import('./pages/cost-list/cost-list.component').then(m => m.CostListComponent),
    title: 'Registro de Costos',
  },
  {
    path: 'costs/new',
    loadComponent: () =>
      import('./pages/cost-form/cost-form.component').then(m => m.CostFormComponent),
    title: 'Nuevo Costo',
  },
  {
    path: 'costs/:id/edit',
    loadComponent: () =>
      import('./pages/cost-form/cost-form.component').then(m => m.CostFormComponent),
    title: 'Editar Costo',
  },

  // ── Categories ────────────────────────────────────────────────────────────
  {
    path: 'categories',
    loadComponent: () =>
      import('./pages/category-list/category-list.component').then(m => m.CategoryListComponent),
    title: 'Categorías de Costos',
  },
  {
    path: 'categories/new',
    loadComponent: () =>
      import('./pages/category-form/category-form.component').then(m => m.CategoryFormComponent),
    title: 'Nueva Categoría',
  },
  {
    path: 'categories/:id/edit',
    loadComponent: () =>
      import('./pages/category-form/category-form.component').then(m => m.CategoryFormComponent),
    title: 'Editar Categoría',
  },

  // ── Reports ───────────────────────────────────────────────────────────────
  {
    path: 'reports',
    loadComponent: () =>
      import('./pages/reports/reports.component').then(m => m.ReportsComponent),
    title: 'Reportes de Costos',
  },
];