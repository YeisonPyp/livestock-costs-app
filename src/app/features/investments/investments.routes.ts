// investments.routes.ts
import { Routes } from '@angular/router';

export const INVESTMENTS_ROUTES: Routes = [
  // ── Inversionistas ───────────────────────────────────────────────────────
  {
    path: 'investors',
    loadComponent: () =>
      import('./pages/investor-list/investor-list.component').then(m => m.InvestorListComponent),
  },
  {
    path: 'investors/new',
    loadComponent: () =>
      import('./pages/investor-form/investor-form.component').then(m => m.InvestorFormComponent),
  },
  {
    path: 'investors/:id',
    loadComponent: () =>
      import('./pages/investor-detail/investor-detail.component').then(m => m.InvestorDetailComponent),
  },
  {
    path: 'investors/:id/edit',
    loadComponent: () =>
      import('./pages/investor-form/investor-form.component').then(m => m.InvestorFormComponent),
  },

  // ── Contratos ──────────────────────────────────────────────────────────
      {
        path: 'contracts',
        loadComponent: () => import('./pages/contract-list/contract-list.component')
          .then(m => m.ContractListComponent),
      },
      // {
      //   path: 'contracts/new',
      //   loadComponent: () => import('./pages/contract-create/contract-create.component')
      //     .then(m => m.ContractCreateComponent),
      // },
      {
        path: 'contracts/:id',
        loadComponent: () => import('./pages/contract-detail/contract-detail.component')
          .then(m => m.ContractDetailComponent),
      },

  // ── Inversiones ──────────────────────────────────────────────────────────
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

  // ── Ventas ────────────────────────────────────────────────────────────────
  {
    path: 'sales',
    loadComponent: () =>
      import('./pages/sale-list/sale-list.component').then(m => m.SaleListComponent),
  },
  {
    path: 'sales/:id',
    loadComponent: () =>
      import('./pages/sale-detail/sale-detail.component').then(m => m.SaleDetailComponent),
  },

  // ── Decisiones ────────────────────────────────────────────────────────────
  {
    path: 'decisions',
    loadComponent: () =>
      import('./pages/sale-decision-detail/sale-decision-detail.component').then(m => m.SaleDecisionDetailComponent),
  },
  {
    path: 'decisions/:id',
    loadComponent: () =>
      import('./pages/sale-decision-detail/sale-decision-detail.component').then(m => m.SaleDecisionDetailComponent),
  },

  // ── Reportes ─────────────────────────────────────────────────────────────
  {
    path: 'reports',
    loadComponent: () =>
      import('./pages/reports/reports.component').then(m => m.InvestmentReportsComponent),
  },
  {
    path: 'dashboard-investors',
    loadComponent: () =>
      import('./pages/investor-dashboard/investor-dashboard.component').then(m => m.InvestorDashboardComponent),
  },

  // Default redirect
  { path: '', redirectTo: 'investors', pathMatch: 'full' },
];