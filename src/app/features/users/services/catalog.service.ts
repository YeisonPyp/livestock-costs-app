// src/features/users/services/catalog.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, shareReplay } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  DocumentType,
  Country,
  State,
  City,
  Gender,
} from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private readonly api = inject(ApiService);
  private readonly base = '/users/';

  // ── Cache local con signals ────────────────────────────────────────
  // Evita re-fetching innecesario de catálogos estáticos
  readonly documentTypes = signal<DocumentType[]>([]);
  readonly countries = signal<Country[]>([]);
  readonly genders = signal<Gender[]>([]);

  // Observables con caché (shareReplay)
  private documentTypes$?: Observable<ApiResponse<DocumentType[]>>;
  private countries$?: Observable<ApiResponse<Country[]>>;
  private genders$?: Observable<ApiResponse<Gender[]>>;

  // ===========================================================================
  // TIPOS DE DOCUMENTO
  // ===========================================================================

  /**
   * GET /users/document-types/
   * Con caché: solo hace la petición una vez
   */
  getDocumentTypes(): Observable<ApiResponse<DocumentType[]>> {
    if (!this.documentTypes$) {
      this.documentTypes$ = this.api
        .get<DocumentType[]>(`${this.base}document-types/`)
        .pipe(
          tap((response) => {
            if (response.data) {
              this.documentTypes.set(response.data);
            }
          }),
          shareReplay(1)
        );
    }
    return this.documentTypes$;
  }

  // ===========================================================================
  // PAÍSES
  // ===========================================================================

  /**
   * GET /users/countries/
   * Con caché: solo hace la petición una vez
   */
  getCountries(): Observable<ApiResponse<Country[]>> {
    if (!this.countries$) {
      this.countries$ = this.api
        .get<Country[]>(`${this.base}countries/`)
        .pipe(
          tap((response) => {
            if (response.data) {
              this.countries.set(response.data);
            }
          }),
          shareReplay(1)
        );
    }
    return this.countries$;
  }

  // ===========================================================================
  // ESTADOS / DEPARTAMENTOS
  // ===========================================================================

  /**
   * GET /users/states/
   * Opcional: filtrar por country code
   */
  getStates(countryCode?: string): Observable<ApiResponse<State[]>> {
    const params = countryCode ? { country: countryCode } : {};
    return this.api.get<State[]>(
      `${this.base}states/`,
      params
    );
  }

  /**
   * GET /users/states/by-country/{code}/
   * Endpoint específico del backend para estados de un país
   */
  getStatesByCountry(countryCode: string): Observable<ApiResponse<State[]>> {
    return this.api.get<State[]>(
      `${this.base}states/by-country/${countryCode}/`
    );
  }

  // ===========================================================================
  // CIUDADES
  // ===========================================================================

  /**
   * GET /users/cities/
   * Opcional: filtrar por state code
   */
  getCities(stateCode?: string): Observable<ApiResponse<City[]>> {
    const params = stateCode ? { state: stateCode } : {};
    return this.api.get<City[]>(
      `${this.base}cities/`,
      params
    );
  }

  /**
   * GET /users/cities/by-state/{code}/
   * Endpoint específico del backend para ciudades de un estado
   */
  getCitiesByState(stateCode: string): Observable<ApiResponse<City[]>> {
    return this.api.get<City[]>(
      `${this.base}cities/by-state/${stateCode}/`
    );
  }

  // ===========================================================================
  // GÉNEROS
  // ===========================================================================

  /**
   * GET /users/genders/
   * Con caché
   */
  getGenders(): Observable<ApiResponse<Gender[]>> {
    if (!this.genders$) {
      this.genders$ = this.api
        .get<Gender[]>(`${this.base}genders/`)
        .pipe(
          tap((response) => {
            if (response.data) {
              this.genders.set(response.data);
            }
          }),
          shareReplay(1)
        );
    }
    return this.genders$;
  }

  // ===========================================================================
  // CARGA INICIAL (todos los catálogos a la vez)
  // ===========================================================================

  /**
   * Pre-carga todos los catálogos estáticos
   * Llamar en el OnInit del módulo de usuarios
   */
  preloadAll(): void {
    this.getDocumentTypes().subscribe();
    this.getCountries().subscribe();
    this.getGenders().subscribe();
  }

  /**
   * Invalida el caché (útil si cambian los catálogos)
   */
  invalidateCache(): void {
    this.documentTypes$ = undefined;
    this.countries$ = undefined;
    this.genders$ = undefined;
    this.documentTypes.set([]);
    this.countries.set([]);
    this.genders.set([]);
  }
}