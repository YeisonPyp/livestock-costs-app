import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { roleGuard } from './core/guards/role.guard';
import { InvestorDashboardComponent } from './features/investments/pages/investor-dashboard/investor-dashboard.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['super_admin', 'admin'] }, 
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/costs/pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'costs',
        loadChildren: () => import('./features/costs/costs.routes').then(m => m.COSTS_ROUTES)
      },
      {
        path: 'farms',
        loadChildren: () => import('./features/farms/farms.routes').then(m => m.FARMS_ROUTES)
      },
      {
        path: 'investments/investors',
        loadChildren: () => import('./features/investments/investments.routes').then(m => m.INVESTOR_ROUTES)
      },
      {
        path: 'investments/contracts',
        loadChildren: () => import('./features/investments/investments.routes').then(m => m.CONTRACT_ROUTES)
      },
      {
        path: 'investments/investments',
        loadChildren: () => import('./features/investments/investments.routes').then(m => m.INVESTMENT_ROUTES)
      },
      {
        path: 'investments/sales',
        loadChildren: () => import('./features/investments/investments.routes').then(m => m.SALE_ROUTES)
      },
      {
        path: 'investments/reports',
        loadChildren: () => import('./features/investments/investments.routes').then(m => m.REPORTS_ROUTES)
      },
      {
        path: 'cattle',
        loadChildren: () => import('./features/cattle/cattle.routes').then(m => m.CATTLE_ROUTES)
      }
    ]
  },
  {
    path: 'investor',
    component: InvestorDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['investor'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/investments/pages/investor-dashboard/investor-dashboard.component').then(m => m.InvestorDashboardComponent)
      },
    ]
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/navigation/not-found/not-found.component')
      .then(m => m.NotFoundComponent)
  }
];
