// // investments.routes.ts
// import { Routes } from '@angular/router';

// export const INVESTMENTS_ROUTES: Routes = [
//   // ── Inversionistas ───────────────────────────────────────────────────────
//   {
//     path: 'investors',
//     loadComponent: () =>
//       import('./pages/investor/investor-list/investor-list.component').then(m => m.InvestorListComponent),
//   },
//   {
//     path: 'investors/new',
//     loadComponent: () =>
//       import('./pages/investor/investor-form/investor-form.component').then(m => m.InvestorFormComponent),
//   },
//   {
//     path: 'investors/:id',
//     loadComponent: () =>
//       import('./pages/investor/investor-detail/investor-detail.component').then(m => m.InvestorDetailComponent),
//   },
//   {
//     path: 'investors/:id/edit',
//     loadComponent: () =>
//       import('./pages/investor/investor-form/investor-form.component').then(m => m.InvestorFormComponent),
//   },

//   // ── Contratos ──────────────────────────────────────────────────────────
//       {
//         path: 'contracts',
//         loadComponent: () => import('./pages/investor/contract-list/contract-list.component')
//           .then(m => m.ContractListComponent),
//       },
//       // {
//       //   path: 'contracts/new',
//       //   loadComponent: () => import('./pages/contract-create/contract-create.component')
//       //     .then(m => m.ContractCreateComponent),
//       // },
//       {
//         path: 'contracts/:id',
//         loadComponent: () => import('./pages/investor/contract-detail/contract-detail.component')
//           .then(m => m.ContractDetailComponent),
//       },

//   // ── Inversiones ──────────────────────────────────────────────────────────
//   {
//     path: 'investments',
//     loadComponent: () =>
//       import('./pages/investment/investment-list/investment-list.component').then(m => m.InvestmentListComponent),
//   },
//   {
//     path: 'investments/:id',
//     loadComponent: () =>
//       import('./pages/investment/investment-detail/investment-detail.component').then(m => m.InvestmentDetailComponent),
//   },

//   // ── Ventas ────────────────────────────────────────────────────────────────
//   {
//     path: 'sales',
//     loadComponent: () =>
//       import('./pages/sale/sale-list/sale-list.component').then(m => m.SaleListComponent),
//   },
//   {
//     path: 'sales/:id',
//     loadComponent: () =>
//       import('./pages/sale/sale-detail/sale-detail.component').then(m => m.SaleDetailComponent),
//   },

//   // ── Decisiones ────────────────────────────────────────────────────────────
//   {
//     path: 'decisions',
//     loadComponent: () =>
//       import('./pages/sale/sale-decision-detail/sale-decision-detail.component').then(m => m.SaleDecisionDetailComponent),
//   },
//   {
//     path: 'decisions/:id',
//     loadComponent: () =>
//       import('./pages/sale/sale-decision-detail/sale-decision-detail.component').then(m => m.SaleDecisionDetailComponent),
//   },

//   // // ── Reportes ─────────────────────────────────────────────────────────────
//   // {
//   //   path: 'reports',
//   //   loadComponent: () =>
//   //     import('./pages/reports/reports.component').then(m => m.InvestmentReportsComponent),
//   // },
//   {
//     path: 'dashboard-investors',
//     loadComponent: () =>
//       import('./pages/investor/investor-dashboard/investor-dashboard.component').then(m => m.InvestorDashboardComponent),
//   },

//   // Default redirect
//   { path: '', redirectTo: 'investors', pathMatch: 'full' },
// ];

// investors.routes.ts
//
// Cada ruta lazy-carga su page y provee el facade a nivel de ruta.
// Esto garantiza que cada instancia tenga estado aislado y que el
// garbage collector libere los signals al salir de la ruta.

import { Routes } from '@angular/router';

export const INVESTOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/investor/investor-list/investor-list.component').then(
        m => m.InvestorListComponent
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/investor/investor-form/investor-form.component').then(
        m => m.InvestorFormComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/investor/investor-detail/investor-detail.component').then(
        m => m.InvestorDetailComponent
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./pages/investor/investor-form/investor-form.component').then(
        m => m.InvestorFormComponent
      ),
  },
];

export const CONTRACT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/investor/contract-list/contract-list.component').then(
        m => m.ContractListComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/investor/contract-detail/contract-detail.component').then(
        m => m.ContractDetailComponent
      ),
  },
];

export const INVESTMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/investment/investment-list/investment-list.component').then(
        m => m.InvestmentListComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/investment/investment-detail/investment-detail.component').then(
        m => m.InvestmentDetailComponent
      ),
  },
];

export const SALE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/sale/sale-list/sale-list.component').then(m => m.SaleListComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/sale/sale-detail/sale-detail.component').then(m => m.SaleDetailComponent),
  },
];

export const DECISION_ROUTES: Routes = [
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/sale/sale-decision-detail/sale-decision-detail.component').then(
        m => m.SaleDecisionDetailComponent
      ),
  },
];

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/reports/reports.component').then(m => m.InvestmentReportsComponent),
  },
];

export const INVESTOR_DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/investor-dashboard/investor-dashboard.component').then(
        m => m.InvestorDashboardComponent
      ),
  },
];