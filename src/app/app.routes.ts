import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { roleGuard } from './core/guards/role.guard';
import { InvestorLayoutComponent } from './layout/investor-layout/investor-layout.component';

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
        path: 'investments',
        loadChildren: () => import('./features/investments/investments.routes').then(m => m.INVESTMENTS_ROUTES)
      },
      {
        path: 'cattle',
        loadChildren: () => import('./features/cattle/cattle.routes').then(m => m.CATTLE_ROUTES)
      }
    ]
  },
  {
    path: 'investor',
    component: InvestorLayoutComponent,   // layout limpio, sin sidebar
    canActivate: [authGuard, roleGuard],
    data: { roles: ['investor'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/investments/pages/investor/investor-dashboard/investor-dashboard.component')
          .then(m => m.InvestorDashboardComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
