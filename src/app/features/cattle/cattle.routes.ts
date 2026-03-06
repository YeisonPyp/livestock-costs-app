import { Routes } from '@angular/router';

export const CATTLE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/animal-list/animal-list.component').then(m => m.AnimalListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./pages/animal-form/animal-form.component').then(m => m.AnimalFormComponent)
  },
//   {
//     path: 'lots',
//     loadComponent: () => import('./pages/lot-list/lot-list.component').then(m => m.LotListComponent)
//   },
//   {
//     path: 'lots/new',
//     loadComponent: () => import('./pages/lot-form/lot-form.component').then(m => m.LotFormComponent)
//   },
//   {
//     path: 'lots/:id',
//     loadComponent: () => import('./pages/lot-detail/lot-detail.component').then(m => m.LotDetailComponent)
//   },
//   {
//     path: 'lots/:id/edit',
//     loadComponent: () => import('./pages/lot-form/lot-form.component').then(m => m.LotFormComponent)
//   },
  {
    path: ':id',
    loadComponent: () => import('./pages/animal-detail/animal-detail.component').then(m => m.AnimalDetailComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./pages/animal-form/animal-form.component').then(m => m.AnimalFormComponent)
  }
];