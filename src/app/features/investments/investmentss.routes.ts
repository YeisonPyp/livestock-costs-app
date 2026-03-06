// investments.routes.ts
import { Routes } from '@angular/router';

export const INVESTMENTS_ROUTES: Routes = [
  {
    path: 'investments',
    loadComponent: () =>
      import('./pages/investment-list/investment-list.component').then(m => m.InvestmentListComponent),
  },
  {
    path: 'investments/:id',
    loadComponent: () =>
      import('./pages/investment-detail/investment-detail.component').then(m => m.InvestmentDetailComponent),
  },

  // Default redirect
  { path: '', redirectTo: 'investments', pathMatch: 'full' },
];