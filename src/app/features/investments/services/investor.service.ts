// services/investor.service.ts

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import { ENDPOINTS } from './endpoints';

import {
  InvestorList,
  InvestorDetail,
  InvestorSummary,
  InvestorStatement,
  InvestorFilters,
  InvestorSummaryParams,
  StatementParams,
  CreateInvestorPayload,
  UpdateInvestorPayload,
  DeactivateInvestorPayload,
  DeactivateInvestorResult,
  DeactivationStatus,
  ContractList,
  ContractFilters,
} from '../models';

import {
  toInvestorList,
  toInvestorDetail,
  toInvestorSummary,
  toInvestorStatement,
  toDeactivateResult,
  toDeactivationStatus,
  toContractList,
} from '../mappers/investment.mapper';

@Injectable({ providedIn: 'root' })
export class InvestorService {
  private readonly api = inject(ApiService);

  // ── CRUD ──────────────────────────────────────────────────────────

  list(filters?: InvestorFilters): Observable<ApiResponse<InvestorList[]>> {
    const params = filters ? this.toSnakeParams(filters) : undefined;
    return this.api.get<any[]>(ENDPOINTS.INVESTORS, params).pipe(
      map(res => ({ ...res, data: res.data.map(toInvestorList) }))
    );
  }

  getById(id: string): Observable<ApiResponse<InvestorDetail>> {
    return this.api.get<any>(ENDPOINTS.INVESTOR(id)).pipe(
      map(res => ({ ...res, data: toInvestorDetail(res.data) }))
    );
  }

  create(payload: CreateInvestorPayload): Observable<ApiResponse<InvestorDetail>> {
    return this.api.post<any>(ENDPOINTS.INVESTORS, this.toSnakeCase(payload)).pipe(
      map(res => ({ ...res, data: toInvestorDetail(res.data) }))
    );
  }

  update(id: string, payload: UpdateInvestorPayload): Observable<ApiResponse<InvestorDetail>> {
    return this.api.patch<any>(ENDPOINTS.INVESTOR(id), this.toSnakeCase(payload)).pipe(
      map(res => ({ ...res, data: toInvestorDetail(res.data) }))
    );
  }

  // ── Activación ────────────────────────────────────────────────────

  deactivate(
    id: string,
    payload: DeactivateInvestorPayload = {}
  ): Observable<ApiResponse<DeactivateInvestorResult>> {
    return this.api.post<any>(ENDPOINTS.INVESTOR_DEACTIVATE(id), payload).pipe(
      map(res => ({ ...res, data: toDeactivateResult(res.data) }))
    );
  }

  reactivate(id: string): Observable<ApiResponse<void>> {
    return this.api.post<void>(ENDPOINTS.INVESTOR_REACTIVATE(id), {});
  }

  getDeactivationStatus(id: string): Observable<ApiResponse<DeactivationStatus>> {
    return this.api.get<any>(ENDPOINTS.INVESTOR_DEACT_STATUS(id)).pipe(
      map(res => ({ ...res, data: toDeactivationStatus(res.data) }))
    );
  }

  // ── Resumen ───────────────────────────────────────────────────────

  getSummary(id: string, params?: InvestorSummaryParams): Observable<ApiResponse<InvestorSummary>> {
    const snakeParams = params ? {
      include_decisions: params.includeDecisions,
      include_movements: params.includeMovements,
      include_cattle: params.includeCattle,
    } : undefined;
    return this.api.get<any>(ENDPOINTS.INVESTOR_SUMMARY(id), snakeParams).pipe(
      map(res => ({ ...res, data: toInvestorSummary(res.data) }))
    );
  }

  getMySummary(): Observable<ApiResponse<InvestorSummary>> {
    return this.api.get<any>(ENDPOINTS.MY_SUMMARY).pipe(
      map(res => ({ ...res, data: toInvestorSummary(res.data) }))
    );
  }

  // ── Estado de cuenta ──────────────────────────────────────────────

  getStatement(id: string, params?: StatementParams): Observable<ApiResponse<InvestorStatement>> {
    const snakeParams = params ? {
      date_from: params.dateFrom,
      date_to: params.dateTo,
    } : undefined;
    return this.api.get<any>(ENDPOINTS.INVESTOR_STATEMENT(id), snakeParams).pipe(
      map(res => ({ ...res, data: toInvestorStatement(res.data) }))
    );
  }

  // ── Contratos ─────────────────────────────────────────────────────

  getContracts(id: string, filters?: ContractFilters): Observable<ApiResponse<ContractList[]>> {
    const params = filters ? this.toSnakeParams(filters) : undefined;
    return this.api.get<any[]>(ENDPOINTS.INVESTOR_CONTRACTS(id), params).pipe(
      map(res => ({ ...res, data: res.data.map(toContractList) }))
    );
  }

  // ── Helpers privados ──────────────────────────────────────────────

  private toSnakeCase(obj: Record<string, any>): Record<string, any> {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [k.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`), v])
    );
  }

  private toSnakeParams(filters: Record<string, any>): Record<string, any> {
    const map: Record<string, string> = {
      pageSize: 'page_size',
      isActive: 'is_active',
      personId: 'person_id',
    };
    return Object.fromEntries(
      Object.entries(filters)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [map[k] ?? k.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`), v])
    );
  }
}