import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpRequest,
  HttpHandlerFn
} from '@angular/common/http';
import { inject } from '@angular/core';
import {
  catchError,
  switchMap,
  filter,
  take,
  throwError
} from 'rxjs';
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
        return handleRefresh(req, next, authService);
      }

      return throwError(() => error);
    })
  );
};

function handleRefresh(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService
) {
  if (authService.getIsRefreshing()) {
    return authService.getRefreshTokenSubject().pipe(
      filter((token): token is string => token !== null),
      take(1),
      switchMap((token) => {
        return next(addToken(req, token));
      })
    );
  }

  authService.setIsRefreshing(true);
  authService.getRefreshTokenSubject().next(null);

  return authService.refreshToken().pipe(
    switchMap((response) => {
      const token = response.data.tokens.access;

      authService.setIsRefreshing(false);
      authService.getRefreshTokenSubject().next(token);

      return next(addToken(req, token));
    }),
    catchError((error) => {
      authService.setIsRefreshing(false);
      authService.logout();
      return throwError(() => error);
    })
  );
}

function addToken(req: HttpRequest<unknown>, token: string) {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}