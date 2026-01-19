import { Routes } from '@angular/router';

export const COSTS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () => import('./components/cost-list/cost-list.component').then(m => m.CostListComponent)
  },
  {
    path: 'reports',
    loadComponent: () => import('./components/cost-reports/cost-reports.component').then(m => m.CostReportsComponent)
  }

];



