import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api-response.model';

import { INVESTMENT_ENDPOINTS } from './endpoints';
import {
  CattleOwnership,
  AssignCattlePayload,
  CattleOwnershipStatus,
} from '../models/investment.model';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

export interface CattleOwnershipSearchParams {
  page?: number;
  page_size?: number;
  investment?: string;
  investor?: string;
  status?: CattleOwnershipStatus | '';
  animal?: string;
  lot?: string;
  ordering?: string;
}

export interface RecordWeightPayload {
  weight: number;
  price_per_kg?: number;
  record_date?: string;
  notes?: string;
}

export interface WeightRecordResponse {
  id: string;
  weight: string;
  price_per_kg: string | null;
  estimated_value: string | null;
  record_date: string;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICIO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Servicio para gestión de propiedad de ganado.
 * 
 * Maneja la relación entre inversiones y animales/lotes.
 */
@Injectable({ providedIn: 'root' })
export class CattleOwnershipService {
  private readonly api = inject(ApiService);

  // ─── CRUD ────────────────────────────────────────────────────────────────

  /**
   * Obtiene listado de propiedades de ganado.
   */
  getAll(params?: CattleOwnershipSearchParams): Observable<ApiResponse<CattleOwnership[]>> {
    return this.api.get<CattleOwnership[]>(INVESTMENT_ENDPOINTS.CATTLE_OWNERSHIPS, params);
  }

  /**
   * Obtiene una propiedad por ID.
   */
  getById(id: string): Observable<ApiResponse<CattleOwnership>> {
    return this.api.get<CattleOwnership>(INVESTMENT_ENDPOINTS.CATTLE_OWNERSHIP(id));
  }

  /**
   * Asigna ganado a una inversión.
   */
  assign(payload: AssignCattlePayload): Observable<ApiResponse<CattleOwnership>> {
    return this.api.post<CattleOwnership>(
      INVESTMENT_ENDPOINTS.CATTLE_OWNERSHIPS,
      payload
    );
  }

  /**
   * Actualiza una propiedad de ganado.
   */
  update(id: string, payload: Partial<AssignCattlePayload>): Observable<ApiResponse<CattleOwnership>> {
    return this.api.patch<CattleOwnership>(
      INVESTMENT_ENDPOINTS.CATTLE_OWNERSHIP(id),
      payload
    );
  }

  // ─── OPERACIONES ─────────────────────────────────────────────────────────

  /**
   * Registra un peso para el animal asociado.
   */
  recordWeight(id: string, payload: RecordWeightPayload): Observable<ApiResponse<WeightRecordResponse>> {
    return this.api.post<WeightRecordResponse>(
      INVESTMENT_ENDPOINTS.CATTLE_OWNERSHIP_RECORD_WEIGHT(id),
      payload
    );
  }

  // ─── CONSULTAS ESPECÍFICAS ───────────────────────────────────────────────

  /**
   * Obtiene propiedades activas de una inversión.
   */
  getByInvestment(investmentId: string): Observable<ApiResponse<CattleOwnership[]>> {
    return this.getAll({
      investment: investmentId,
      status: 'active',
    });
  }

  /**
   * Obtiene todas las propiedades de un inversionista.
   */
  getByInvestor(investorId: string): Observable<ApiResponse<CattleOwnership[]>> {
    return this.getAll({ investor: investorId });
  }

  /**
   * Obtiene propiedades activas solamente.
   */
  getActive(params?: Omit<CattleOwnershipSearchParams, 'status'>): Observable<ApiResponse<CattleOwnership[]>> {
    return this.getAll({ ...params, status: 'active' });
  }

  /**
   * Verifica si un animal ya está asignado a alguna inversión activa.
   */
  isAnimalAssigned(animalId: string): Observable<boolean> {
    return new Observable(observer => {
      this.getAll({ animal: animalId, status: 'active' }).subscribe({
        next: (res) => {
          observer.next((res.data?.length ?? 0) > 0);
          observer.complete();
        },
        error: (err) => observer.error(err),
      });
    });
  }
}