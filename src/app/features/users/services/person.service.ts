import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Person, PersonSimple, PersonSearchParams } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class PersonService {
  private api = inject(ApiService);
  private endpoint = '/users/persons/';

  // =========================
  // CRUD
  // =========================

  getAll(params?: Record<string, any>): Observable<ApiResponse<Person[]>> {
    return this.api.get(this.endpoint, this.cleanParams(params ?? {}));
  }

  getById(id: string | number): Observable<ApiResponse<Person>> {
    return this.api.get(`${this.endpoint}${id}/`);
  }

  create(data: Partial<Person>): Observable<ApiResponse<Person>> {
    return this.api.post(this.endpoint, data);
  }

  update(id: string | number, data: Partial<Person>): Observable<ApiResponse<Person>> {
    return this.api.put(`${this.endpoint}${id}/`, data);
  }

  patch(id: string | number, data: Partial<Person>): Observable<ApiResponse<Person>> {
    return this.api.patch(`${this.endpoint}${id}/`, data);
  }

  delete(id: string | number): Observable<ApiResponse<void>> {
    return this.api.delete(`${this.endpoint}${id}/`);
  }

  search(params: PersonSearchParams): Observable<ApiResponse<PersonSimple[]>> {
    const clean: Record<string, string> = { q: params.q };
    if (params.document_type) clean['document_type'] = params.document_type;
    if (params.person_type)   clean['person_type']   = params.person_type;
    return this.api.get(`${this.endpoint}search/`, clean);
  }


  // =========================
  // VALIDATIONS
  // =========================

  validateEmail(email: string): Observable<ApiResponse<{ available: boolean }>> {
    return this.api.post(`${this.endpoint}validate-email/`, { email });
  }

  validateDocument(document_number: string): Observable<ApiResponse<{ available: boolean }>> {
    return this.api.post(`${this.endpoint}validate-document/`, { document_number });
  }

  // =========================
  // STATS
  // =========================

  getStats(): Observable<ApiResponse<any>> {
    return this.api.get(`${this.endpoint}stats/`);
  }

  // =========================
  // BULK
  // =========================

  bulkAction(data: any): Observable<ApiResponse<any>> {
    return this.api.post(`${this.endpoint}bulk-action/`, data);
  }

  // =========================
  // UTILS
  // =========================

  private cleanParams(params: Record<string, any>) {
    return Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== null && v !== undefined && v !== '')
    );
  }
}
