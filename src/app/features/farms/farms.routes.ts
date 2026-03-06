// farms.routes.ts
import { Routes } from '@angular/router';

export const FARMS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/farm-list/farm-list.component').then(m => m.FarmListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/farm-form/farm-form.component').then(m => m.FarmFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/farm-detail/farm-detail.component').then(m => m.FarmDetailComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/farm-form/farm-form.component').then(m => m.FarmFormComponent),
  },
];