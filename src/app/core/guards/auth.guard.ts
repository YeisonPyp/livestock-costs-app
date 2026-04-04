import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const hasToken = authService.isAuthenticated();
  const hasRefreshToken = !!authService.getRefreshToken();

  // Si tiene token o refresh token, puede intentar acceder
  if (hasToken || hasRefreshToken) {
    return true;
  }

  // Si no tiene ninguno, redirige al login
  router.navigate(['/auth/login'], { 
    queryParams: { returnUrl: state.url } 
  });
  return false;
};