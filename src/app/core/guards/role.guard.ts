import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  const allowedRoles: string[] = route.data?.['roles'] ?? [];
  const user = auth.getCurrentUser();

  // Si no hay usuario aún, deja pasar (authGuard ya validó el token)
  // Evita loop cuando getCurrentUser() es null temporalmente
  if (!user) return true;

  const userRoles: string[] = user.roles ?? [];

  // Si la ruta no requiere roles específicos, deja pasar
  if (allowedRoles.length === 0) return true;

  // Verifica si tiene algún rol permitido
  if (allowedRoles.some(role => userRoles.includes(role))) return true;

  // No tiene acceso — redirige SIN volver a la misma ruta
  const isInvestor = userRoles.includes('investor');
  const redirectPath = isInvestor ? '/investor/dashboard' : '/dashboard';

  // Evita redirigir a la misma ruta (causa del loop)
  const currentPath = route.url.map(s => s.path).join('/');
  if (redirectPath.includes(currentPath)) return true;

  return router.createUrlTree([redirectPath]);
};