// services/contract.service.ts

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import { ENDPOINTS } from './endpoints';

import {
  ContractList,
  ContractDetail,
  ContractFilters,
  CreateContractPayload,
  ActivateContractPayload,
  TerminateContractPayload,
  RenewContractPayload,
} from '../models';

import {
  toContractList,
  toContractDetail,
  contractToFormData,
} from '../mappers/investment.mapper';

@Injectable({ providedIn: 'root' })
export class ContractService {
  private readonly api = inject(ApiService);

  // ── CRUD ──────────────────────────────────────────────────────────

  list(filters?: ContractFilters): Observable<ApiResponse<ContractList[]>> {
    return this.api.get<any[]>(ENDPOINTS.CONTRACTS, this.toParams(filters)).pipe(
      map(res => ({ ...res, data: res.data.map(toContractList) }))
    );
  }

  getById(id: string): Observable<ApiResponse<ContractDetail>> {
    return this.api.get<any>(ENDPOINTS.CONTRACT(id)).pipe(
      map(res => ({ ...res, data: toContractDetail(res.data) }))
    );
  }

  create(payload: CreateContractPayload): Observable<ApiResponse<ContractDetail>> {
    return this.api.post<any>(ENDPOINTS.CONTRACTS, contractToFormData(payload as any)).pipe(
      map(res => ({ ...res, data: toContractDetail(res.data) }))
    );
  }

  // ── Acciones ──────────────────────────────────────────────────────

  activate(id: string, payload: ActivateContractPayload = {}): Observable<ApiResponse<ContractDetail>> {
    const body = payload.signedDate ? { signed_date: payload.signedDate } : {};
    return this.api.post<any>(ENDPOINTS.CONTRACT_ACTIVATE(id), body).pipe(
      map(res => ({ ...res, data: toContractDetail(res.data) }))
    );
  }

  terminate(id: string, payload: TerminateContractPayload): Observable<ApiResponse<void>> {
    return this.api.post<void>(ENDPOINTS.CONTRACT_TERMINATE(id), payload);
  }

  renew(id: string, payload: RenewContractPayload): Observable<ApiResponse<ContractDetail>> {
    return this.api.post<any>(ENDPOINTS.CONTRACT_RENEW(id), contractToFormData(payload as any)).pipe(
      map(res => ({ ...res, data: toContractDetail(res.data) }))
    );
  }

  download(id: string): Observable<Blob> {
    return this.api.download(ENDPOINTS.CONTRACT_DOWNLOAD(id));
  }

  // ── Consultas especiales ──────────────────────────────────────────

  getActive(): Observable<ApiResponse<ContractList[]>> {
    return this.api.get<any[]>(ENDPOINTS.CONTRACTS_ACTIVE).pipe(
      map(res => ({ ...res, data: res.data.map(toContractList) }))
    );
  }

  getExpiring(days = 30): Observable<ApiResponse<ContractList[]>> {
    return this.api.get<any[]>(ENDPOINTS.CONTRACTS_EXPIRING, { days }).pipe(
      map(res => ({ ...res, data: res.data.map(toContractList) }))
    );
  }

  getExpired(): Observable<ApiResponse<ContractList[]>> {
    return this.api.get<any[]>(ENDPOINTS.CONTRACTS_EXPIRED).pipe(
      map(res => ({ ...res, data: res.data.map(toContractList) }))
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────

  private toParams(filters?: ContractFilters): Record<string, any> | undefined {
    if (!filters) return undefined;
    return {
      status: filters.status,
      contract_type: filters.contractType,
      investor_id: filters.investorId,
      search: filters.search,
      ordering: filters.ordering,
      page: filters.page,
      page_size: filters.pageSize,
    };
  }
}