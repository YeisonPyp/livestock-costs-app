import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

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
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/costs/pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'categories',
        loadChildren: () => import('./features/categories/categories.routes').then(m => m.CATEGORIES_ROUTES)
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
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
