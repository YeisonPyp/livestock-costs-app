// src/features/users/services/person.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  Person,
  PersonSimple,
  PersonCreatePayload,
  PersonUpdatePayload,
  PersonSearchParams,
  PersonFilterParams,
  PersonStats,
  EmailValidationResult,
  DocumentValidationResult,
  BulkActionPayload,
  BulkActionResult,
} from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class PersonService {
  private readonly api = inject(ApiService);
  private readonly endpoint = '/users/persons/';

  // ===========================================================================
  // CRUD
  // ===========================================================================

  /**
   * Listar personas con filtros opcionales
   * GET /users/persons/
   */
  getAll(params: PersonFilterParams  = {}): Observable<ApiResponse<Person[]>> {
    return this.api.get<Person[]>(
      this.endpoint,
      this.cleanParams(params)
    );
  }

  /**
   * Obtener persona por ID
   * GET /users/persons/{id}/
   */
  getById(id: string): Observable<ApiResponse<Person>> {
    return this.api.get<Person>(`${this.endpoint}${id}/`);
  }

  /**
   * Crear persona
   * POST /users/persons/
   *
   * Si se incluye create_user: true, el backend crea automáticamente
   * un usuario con username=nombre.apellido y password=documento
   */
  create(data: PersonCreatePayload): Observable<ApiResponse<Person>> {
    return this.api.post<Person>(this.endpoint, data);
  }

  /**
   * Actualizar persona completa
   * PUT /users/persons/{id}/
   */
  update(
    id: string,
    data: PersonUpdatePayload
  ): Observable<ApiResponse<Person>> {
    return this.api.put<Person>(
      `${this.endpoint}${id}/`,
      data
    );
  }

  /**
   * Actualizar persona parcialmente
   * PATCH /users/persons/{id}/
   */
  patch(
    id: string,
    data: PersonUpdatePayload
  ): Observable<ApiResponse<Person>> {
    return this.api.patch<Person>(
      `${this.endpoint}${id}/`,
      data
    );
  }

  /**
   * Eliminar persona
   * DELETE /users/persons/{id}/
   */
  delete(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`${this.endpoint}${id}/`);
  }

  // ===========================================================================
  // BÚSQUEDA
  // ===========================================================================

  /**
   * Búsqueda avanzada de personas
   * GET /users/persons/search/?q=texto
   */
  search(params: PersonSearchParams): Observable<ApiResponse<PersonSimple[]>> {
    const cleanParams: Record<string, string> = { q: params.q };

    if (params.document_type) {
      cleanParams['document_type'] = params.document_type;
    }
    if (params.person_type) {
      cleanParams['person_type'] = params.person_type;
    }

    return this.api.get<PersonSimple[]>(
      `${this.endpoint}search/`,
      cleanParams
    );
  }

  // ===========================================================================
  // VALIDACIONES
  // ===========================================================================

  /**
   * Verificar si un email está disponible
   * POST /users/persons/validate-email/
   */
  validateEmail(
    email: string
  ): Observable<ApiResponse<EmailValidationResult>> {
    return this.api.post<EmailValidationResult>(
      `${this.endpoint}validate-email/`,
      { email }
    );
  }

  /**
   * Verificar si un número de documento está disponible
   * POST /users/persons/validate-document/
   */
  validateDocument(
    document_number: string
  ): Observable<ApiResponse<DocumentValidationResult>> {
    return this.api.post<DocumentValidationResult>(
      `${this.endpoint}validate-document/`,
      { document_number }
    );
  }

  // ===========================================================================
  // ESTADÍSTICAS
  // ===========================================================================

  /**
   * Obtener estadísticas de personas
   * GET /users/persons/stats/
   */
  getStats(): Observable<ApiResponse<PersonStats>> {
    return this.api.get<PersonStats>(`${this.endpoint}stats/`);
  }

  // ===========================================================================
  // ACCIONES MASIVAS
  // ===========================================================================

  /**
   * Ejecutar acción masiva sobre personas
   * POST /users/persons/bulk-action/
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

  /**
   * Elimina parámetros nulos, undefined o vacíos antes de enviarlos a la API
   */
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
}