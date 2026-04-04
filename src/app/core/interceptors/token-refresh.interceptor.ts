import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpRequest,
  HttpHandlerFn
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, filter, take, throwError } from 'rxjs';
import { AuthService } from '../../features/auth/services/auth.service';

export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status === 401 &&
        !req.url.includes('/auth/login') &&
        !req.url.includes('/auth/refresh') &&
        authService.getRefreshToken()
      ) {
        return handleTokenRefresh(req, next, authService);
      }

      return throwError(() => error);
    })
  );
};

function handleTokenRefresh(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService
) {
  if (!authService.getIsRefreshing()) {
    authService.setIsRefreshing(true);
    authService.getRefreshTokenSubject().next(null);

    return authService.refreshToken().pipe(
      switchMap((response) => {
        const newToken = response.tokens.access;

        authService.setIsRefreshing(false);
        authService.getRefreshTokenSubject().next(newToken);

        const clonedReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${newToken}`
          }
        });

        return next(clonedReq);
      }),
      catchError((error) => {
        authService.setIsRefreshing(false);
        authService.logout();
        return throwError(() => error);
      })
    );
  }

  return authService.getRefreshTokenSubject().pipe(
    filter((token): token is string => token !== null),
    take(1),
    switchMap((token) => {
      const clonedReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });

      return next(clonedReq);
    })
  );
}