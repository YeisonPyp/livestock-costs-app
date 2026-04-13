// // src/app/core/guards/role.guard.ts
// import { inject } from '@angular/core';
// import { CanActivateFn, Router } from '@angular/router';
// import { AuthService } from '../../features/auth/services/auth.service';

// export const roleGuard: CanActivateFn = (route) => {
//   const auth   = inject(AuthService);
//   const router = inject(Router);

//   const allowedRoles: string[]  = route.data?.['roles'] ?? [];
//   const userRoles: string[]     = auth.getCurrentUser()?.roles ?? [];

//   // Verifica si el usuario tiene AL MENOS UNO de los roles permitidos
//   const hasAccess = allowedRoles.some(role => userRoles.includes(role));

//   if (hasAccess) return true;

//   // Redirige al destino correcto según su rol real
//   const isInvestor = userRoles.includes('investor');
//   return router.createUrlTree(isInvestor ? ['/investor/dashboard'] : ['/dashboard']);
// };
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  const allowedRoles: string[] = route.data?.['roles'] ?? [];
  const userRoles: string[]    = auth.getCurrentUser()?.roles ?? [];

  if (allowedRoles.some(role => userRoles.includes(role))) return true;

  // Redirige al destino correcto si no tiene acceso
  return router.createUrlTree(
    auth.isInvestor() ? ['/investor/dashboard'] : ['/dashboard']
  );
};