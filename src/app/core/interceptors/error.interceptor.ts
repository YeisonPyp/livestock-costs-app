import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ha ocurrido un error inesperado';

      if (error.error instanceof ErrorEvent) {
        // Error del lado del cliente
        errorMessage = `Error: ${error.error.message}`;
      } else {
        // Error del lado del servidor
        // Ya no manejamos el 401 aquí, lo maneja el tokenRefreshInterceptor
        if (error.status === 403) {
          errorMessage = 'No tiene permisos para realizar esta acción.';
        } else if (error.status === 404) {
          errorMessage = 'Recurso no encontrado.';
        } else if (error.status === 500) {
          errorMessage = 'Error interno del servidor.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        // Solo mostramos notificación si no es un 401
        // (el 401 se maneja en el refresh interceptor)
        if (error.status !== 401) {
          notificationService.error(errorMessage);
        }
      }

      return throwError(() => error);
    })
  );
};