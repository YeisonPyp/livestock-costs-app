import { Routes } from '@angular/router';

export const CATTLE_ROUTES: Routes = [
  // ── Default redirect ───────────────────────────────────────────────────────
  { path: '', redirectTo: 'animals', pathMatch: 'full' },

  // ── Reports ────────────────────────────────────────────────────────────────
  // {
  //   path: 'reports',
  //   loadComponent: () =>
  //     import('./pages/reports/cattle-reports.component').then(m => m.CattleReportsComponent),
  //   title: 'Reportes · Ganado',
  // },

  // ── Lots ───────────────────────────────────────────────────────────────────
  // {
  //   path: 'lots',
  //   loadComponent: () =>
  //     import('./pages/lots/lot-list/lot-list.component').then(m => m.LotListComponent),
  //   title: 'Lotes',
  // },
  // {
  //   path: 'lots/new',
  //   loadComponent: () =>
  //     import('./pages/lots/lot-form/lot-form.component').then(m => m.LotFormComponent),
  //   title: 'Nuevo Lote',
  // },
  // {
  //   path: 'lots/:id',
  //   loadComponent: () =>
  //     import('./pages/lots/lot-detail/lot-detail.component').then(m => m.LotDetailComponent),
  //   title: 'Detalle de Lote',
  // },
  // {
  //   path: 'lots/:id/edit',
  //   loadComponent: () =>
  //     import('./pages/lots/lot-form/lot-form.component').then(m => m.LotFormComponent),
  //   title: 'Editar Lote',
  // },

  // ── Animals ────────────────────────────────────────────────────────────────
  {
    path: 'animals',
    loadComponent: () =>
      import('./pages/animals/animal-list/animal-list.component').then(m => m.AnimalListComponent),
    title: 'Animales',
  },
  // {
  //   path: 'animals/new',
  //   loadComponent: () =>
  //     import('./pages/animals/animal-form/animal-form.component').then(m => m.AnimalFormComponent),
  //   title: 'Registrar Animal',
  // },
  // {
  //   path: 'animals/bulk-file',
  //   loadComponent: () =>
  //     import('./pages/animals/bulk-animals/bulk-animals.component').then(m => m.BulkAnimalsComponent),
  //   title: 'Carga Masiva de Animales',
  // },
  {
    path: 'animals/:id',
    loadComponent: () =>
      import('./pages/animals/animal-detail/animal-detail.component').then(m => m.AnimalDetailComponent),
    title: 'Detalle de Animal',
  },
  // {
  //   path: 'animals/:id/edit',
  //   loadComponent: () =>
  //     import('./pages/animals/animal-form/animal-form.component').then(m => m.AnimalFormComponent),
  //   title: 'Editar Animal',
  // },

  // ── Weights ────────────────────────────────────────────────────────────────
  // {
  //   path: 'weights/bulk',
  //   loadComponent: () =>
  //     import('./pages/weights/bulk-weight/bulk-weight.component').then(m => m.BulkWeightComponent),
  //   title: 'Pesaje Masivo',
  // },

  // // ── Health ─────────────────────────────────────────────────────────────────
  // {
  //   path: 'health',
  //   loadComponent: () =>
  //     import('./pages/health/health-list/health-list.component').then(m => m.HealthListComponent),
  //   title: 'Salud Animal',
  // },
  // {
  //   path: 'health/new',
  //   loadComponent: () =>
  //     import('./pages/health/health-form/health-form.component').then(m => m.HealthFormComponent),
  //   title: 'Nuevo Evento de Salud',
  // },
  // {
  //   path: 'health/batch',
  //   loadComponent: () =>
  //     import('./pages/health/health-form/health-form.component').then(m => m.HealthFormComponent),
  //   data: { batch: true },
  //   title: 'Evento Masivo de Salud',
  // },
];

/*
 * ── Register in app.routes.ts ───────────────────────────────────────────────
 *
 * { path: 'cattle', loadChildren: () =>
 *     import('./modules/cattle/cattle.routes').then(m => m.CATTLE_ROUTES) }
 *
 * ── Navigation map ──────────────────────────────────────────────────────────
 *
 * /cattle                   → redirect → /cattle/animals
 * /cattle/reports           → 3 tabs: inventario · ganancia de peso · lotes
 *
 * /cattle/lots              → lista (cards, filtros por estado)
 * /cattle/lots/new          → formulario
 * /cattle/lots/:id          → detalle (tabs: resumen · animales)
 * /cattle/lots/:id/edit     → formulario
 *
 * /cattle/animals           → tabla paginada (bulk-select, cambio de lote)
 * /cattle/animals/new       → formulario
 * /cattle/animals/bulk-file → carga masiva desde Excel
 * /cattle/animals/:id       → detalle (tabs: info · pesajes · salud + form rápido de peso)
 * /cattle/animals/:id/edit  → formulario
 *
 * /cattle/weights/bulk      → pesaje masivo (modo manual por lote + modo archivo)
 *
 * /cattle/health            → tabla (tabs: todos · pendientes · en retiro)
 * /cattle/health/new        → formulario (individual)
 * /cattle/health/batch      → formulario (modo masivo con selector de animales por chips)
 */