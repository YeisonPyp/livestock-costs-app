// src/features/users/services/user.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { ApiResponse, UUID } from '../../../core/models/api-response.model';
import {
  User,
  UserList,
  UserCreatePayload,
  UserUpdatePayload,
  ChangePasswordPayload,
  SetPasswordPayload,
  UserSearchParams,
  UserFilterParams,
  UserStats,
  BulkActionPayload,
  BulkActionResult,
} from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly api = inject(ApiService);
  private readonly endpoint = '/users/users/';

  // ===========================================================================
  // CRUD
  // ===========================================================================

  /**
   * Listar usuarios con filtros opcionales
   * GET /users/users/
   */
  getAll(params: UserFilterParams = {}): Observable<ApiResponse<UserList[]>> {
    return this.api.get<UserList[]>(
      this.endpoint,
      this.cleanParams(params)
    );
  }

  /**
   * Obtener usuario por ID
   * GET /users/users/{id}/
   */
  getById(id: UUID): Observable<ApiResponse<User>> {
    return this.api.get<User>(`${this.endpoint}${id}/`);
  }

  /**
   * Crear usuario (+ persona en una sola transacción)
   * POST /users/users/
   * Usa UserCreateSerializer del backend
   */
  create(data: UserCreatePayload): Observable<ApiResponse<User>> {
    return this.api.post<User>(this.endpoint, data);
  }

  /**
   * Actualizar usuario completo
   * PUT /users/users/{id}/
   */
  update(
    id: UUID,
    data: UserUpdatePayload
  ): Observable<ApiResponse<User>> {
    // Si hay avatar (File), usar FormData
    if (data.avatar instanceof File) {
      const formData = this.toFormData(data);
      return this.api.put<User>(
        `${this.endpoint}${id}/`,
        formData
      );
    }
    return this.api.put<User>(
      `${this.endpoint}${id}/`,
      data
    );
  }

  /**
   * Actualizar usuario parcialmente
   * PATCH /users/users/{id}/
   */
  patch(
    id: UUID,
    data: Partial<UserUpdatePayload>
  ): Observable<ApiResponse<User>> {
    if (data.avatar instanceof File) {
      const formData = this.toFormData(data);
      return this.api.patch<User>(
        `${this.endpoint}${id}/`,
        formData
      );
    }
    return this.api.patch<User>(
      `${this.endpoint}${id}/`,
      data
    );
  }

  /**
   * Eliminar usuario
   * DELETE /users/users/{id}/
   */
  delete(id: UUID): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`${this.endpoint}${id}/`);
  }

  // ===========================================================================
  // USUARIO ACTUAL (/me/)
  // ===========================================================================

  /**
   * Obtener datos del usuario autenticado
   * GET /users/users/me/
   */
  getMe(): Observable<ApiResponse<User>> {
    return this.api.get<User>(`${this.endpoint}me/`);
  }

  /**
   * Actualizar datos del usuario autenticado
   * PATCH /users/users/me/
   */
  updateMe(
    data: Partial<UserUpdatePayload>
  ): Observable<ApiResponse<User>> {
    if (data.avatar instanceof File) {
      const formData = this.toFormData(data);
      return this.api.patch<User>(
        `${this.endpoint}me/`,
        formData
      );
    }
    return this.api.patch<User>(`${this.endpoint}me/`, data);
  }

  /**
   * Cambiar contraseña del usuario autenticado
   * POST /users/users/me/change-password/
   */
  changePassword(
    data: ChangePasswordPayload
  ): Observable<ApiResponse<void>> {
    return this.api.post<void>(
      `${this.endpoint}me/change-password/`,
      data
    );
  }

  // ===========================================================================
  // ADMINISTRACIÓN DE USUARIOS
  // ===========================================================================

  /**
   * Activar usuario
   * POST /users/users/{id}/activate/
   */
  activate(id: UUID): Observable<ApiResponse<User>> {
    return this.api.post<User>(
      `${this.endpoint}${id}/activate/`,
      {}
    );
  }

  /**
   * Desactivar usuario
   * POST /users/users/{id}/deactivate/
   */
  deactivate(id: UUID): Observable<ApiResponse<User>> {
    return this.api.post<User>(
      `${this.endpoint}${id}/deactivate/`,
      {}
    );
  }

  /**
   * Verificar usuario manualmente
   * POST /users/users/{id}/verify/
   */
  verify(id: UUID): Observable<ApiResponse<User>> {
    return this.api.post<User>(
      `${this.endpoint}${id}/verify/`,
      {}
    );
  }

  /**
   * Desverificar usuario
   * POST /users/users/{id}/unverify/
   */
  unverify(id: UUID): Observable<ApiResponse<User>> {
    return this.api.post<User>(
      `${this.endpoint}${id}/unverify/`,
      {}
    );
  }

  /**
   * Desbloquear cuenta de usuario
   * POST /users/users/{id}/unlock/
   */
  unlock(id: UUID): Observable<ApiResponse<User>> {
    return this.api.post<User>(
      `${this.endpoint}${id}/unlock/`,
      {}
    );
  }

  /**
   * Establecer nueva contraseña (solo admins)
   * POST /users/users/{id}/set-password/
   */
  setPassword(
    id: UUID,
    data: SetPasswordPayload
  ): Observable<ApiResponse<void>> {
    return this.api.post<void>(
      `${this.endpoint}${id}/set-password/`,
      data
    );
  }

  // ===========================================================================
  // BÚSQUEDA Y ESTADÍSTICAS
  // ===========================================================================

  /**
   * Búsqueda avanzada de usuarios
   * GET /users/users/search/?q=texto
   */
  search(params: UserSearchParams): Observable<ApiResponse<UserList[]>> {
    const cleanParams: Record<string, string | boolean> = { q: params.q };

    if (params.is_active !== undefined) {
      cleanParams['is_active'] = params.is_active;
    }
    if (params.is_verified !== undefined) {
      cleanParams['is_verified'] = params.is_verified;
    }
    if (params.is_staff !== undefined) {
      cleanParams['is_staff'] = params.is_staff;
    }

    return this.api.get<UserList[]>(
      `${this.endpoint}search/`,
      cleanParams
    );
  }

  /**
   * Estadísticas de usuarios
   * GET /users/users/stats/
   */
  getStats(): Observable<ApiResponse<UserStats>> {
    return this.api.get<UserStats>(`${this.endpoint}stats/`);
  }

  // ===========================================================================
  // OPERACIONES MASIVAS
  // ===========================================================================

  /**
   * Verificar múltiples usuarios
   * POST /users/users/bulk-verify/
   */
  bulkVerify(ids: UUID[]): Observable<ApiResponse<{ verified_count: number }>> {
    return this.api.post<{ verified_count: number }>(
      `${this.endpoint}bulk-verify/`,
      { ids }
    );
  }

  /**
   * Acción masiva sobre usuarios
   * POST /users/users/bulk-action/
   */
  bulkAction(
    data: BulkActionPayload
  ): Observable<ApiResponse<BulkActionResult>> {
    return this.api.post<BulkActionResult>(
      `${this.endpoint}bulk-action/`,
      data
    );
  }

  // ===========================================================================
  // UTILS PRIVADOS
  // ===========================================================================

  private cleanParams(
    params: Record<string, any>
  ): Record<string, string | number | boolean> {
    return Object.fromEntries(
      Object.entries(params).filter(
        ([, value]) =>
          value !== null && value !== undefined && value !== ''
      )
    ) as Record<string, string | number | boolean>;
  }

  /**
   * Convierte un objeto a FormData (para subir archivos como avatar)
   */
  private toFormData(
    data: Record<string, any>
  ): FormData {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });
    return formData;
  }
}