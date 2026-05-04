// services/cattle-ownership.service.ts

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import { ENDPOINTS } from './endpoints';

import {
  CattleOwnership,
  CattleOwnershipFilters,
  CattleOwnershipStatus,
  AssignCattlePayload,
  RecordWeightPayload,
  WeightRecord,
} from '../models';

import {
  toCattleOwnership,
  toWeightRecord,
  assignCattleToFormData,
} from '../mappers/investment.mapper';

@Injectable({ providedIn: 'root' })
export class CattleOwnershipService {
  private readonly api = inject(ApiService);

  // ── CRUD ──────────────────────────────────────────────────────────

  list(filters?: CattleOwnershipFilters): Observable<ApiResponse<CattleOwnership[]>> {
    return this.api.get<any[]>(ENDPOINTS.CATTLE_OWNERSHIPS, this.toParams(filters)).pipe(
      map(res => ({ ...res, data: res.data.map(toCattleOwnership) }))
    );
  }

  getById(id: string): Observable<ApiResponse<CattleOwnership>> {
    return this.api.get<any>(ENDPOINTS.CATTLE_OWNERSHIP(id)).pipe(
      map(res => ({ ...res, data: toCattleOwnership(res.data) }))
    );
  }

  assign(payload: AssignCattlePayload): Observable<ApiResponse<CattleOwnership>> {
    return this.api.post<any>(ENDPOINTS.CATTLE_OWNERSHIPS, assignCattleToFormData(payload as any)).pipe(
      map(res => ({ ...res, data: toCattleOwnership(res.data) }))
    );
  }

  update(id: string, payload: Partial<AssignCattlePayload>): Observable<ApiResponse<CattleOwnership>> {
    return this.api.patch<any>(ENDPOINTS.CATTLE_OWNERSHIP(id), assignCattleToFormData(payload as any)).pipe(
      map(res => ({ ...res, data: toCattleOwnership(res.data) }))
    );
  }

  // ── Operaciones ───────────────────────────────────────────────────

  recordWeight(id: string, payload: RecordWeightPayload): Observable<ApiResponse<WeightRecord>> {
    return this.api.post<any>(ENDPOINTS.CATTLE_OWNERSHIP_WEIGHT(id), {
      weight: payload.weight,
      price_per_kg: payload.pricePerKg,
      record_date: payload.recordDate,
      notes: payload.notes,
    }).pipe(
      map(res => ({ ...res, data: toWeightRecord(res.data) }))
    );
  }

  // ── Consultas específicas ─────────────────────────────────────────

  getByInvestment(investmentId: string): Observable<ApiResponse<CattleOwnership[]>> {
    return this.list({ investment: investmentId, status: CattleOwnershipStatus.ACTIVE });
  }

  getByInvestor(investorId: string): Observable<ApiResponse<CattleOwnership[]>> {
    return this.list({ investor: investorId });
  }

  getActive(filters?: Omit<CattleOwnershipFilters, 'status'>): Observable<ApiResponse<CattleOwnership[]>> {
    return this.list({ ...filters, status: CattleOwnershipStatus.ACTIVE });
  }

  // ── Helpers ───────────────────────────────────────────────────────

  private toParams(filters?: CattleOwnershipFilters): Record<string, any> | undefined {
    if (!filters) return undefined;
    return {
      status: filters.status,
      ownership_type: filters.ownershipType,
      investment: filters.investment,
      investment__investor: filters.investor,
      animal: filters.animal,
      lot: filters.lot,
      ordering: filters.ordering,
      page: filters.page,
      page_size: filters.pageSize,
    };
  }
}