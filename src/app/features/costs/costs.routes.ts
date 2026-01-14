import { Routes } from '@angular/router';

export const COSTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/cost-list/cost-list.component').then(m => m.CostListComponent)
  }
];
