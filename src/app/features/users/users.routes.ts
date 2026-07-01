// src/features/users/users.routes.ts
import { Routes } from '@angular/router';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'persons',
    pathMatch: 'full',
  },
  {
    path: 'persons',
    loadComponent: () =>
      import('./pages/persons-list/persons-list.component').then(
        (m) => m.PersonsListComponent
      ),
    title: 'Personas · Ganadería Veracruz',
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./pages/users-list/users-list.component').then(
        (m) => m.UsersListComponent
      ),
    title: 'Usuarios · Ganadería Veracruz',
  },
  {
    path: 'users/:id',
    loadComponent: () =>
      import('./pages/user-detail/user-detail.component').then(
        (m) => m.UserDetailComponent
      ),
    title: 'Detalle de Usuario',
  },
  {
  path: 'profile',
  loadComponent: () =>
    import('./pages/my-profile/my-profile.component').then(
      (m) => m.MyProfileComponent
    ),
  title: 'Mi Perfil',
},
];