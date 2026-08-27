import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import { ENDPOINTS } from './endpoints';

import {
  SaleDecisionList,
  SaleDecisionDetail,
  SaleDecisionFilters,
  MakeDecisionPayload,
} from '../models';

import { toSaleDecisionList } from '../mappers/investment.mapper';
import { SaleDecisionType } from '../models/enums';

@Injectable({ providedIn: 'root' })
export class SaleDecisionService {
  private readonly api = inject(ApiService);

  // ── Listado / Detalle ─────────────────────────────────────────────

  list(filters?: SaleDecisionFilters): Observable<ApiResponse<SaleDecisionList[]>> {
    return this.api.get<any[]>(ENDPOINTS.SALE_DECISIONS, this.toParams(filters)).pipe(
      map(res => ({ ...res, data: res.data.map(toSaleDecisionList) }))
    );
  }

  getById(id: string): Observable<ApiResponse<SaleDecisionDetail>> {
    return this.api.get<any>(ENDPOINTS.SALE_DECISION(id)).pipe(
      map(res => ({ ...res, data: toSaleDecisionList(res.data) as unknown as SaleDecisionDetail }))
    );
  }

  // ── Decidir (Actualizado para coincidir con el Backend) ───────────

  makeDecision(id: string, payload: MakeDecisionPayload): Observable<ApiResponse<SaleDecisionDetail>> {
    const body: Record<string, any> = {
      decision_type: payload.decisionType,
      notes: payload.notes || '',
    };

    // ⚠️ Solo enviar withdraw_amount si la decisión es PARTIAL
    if (payload.decisionType === SaleDecisionType.PARTIAL) {
      body['withdraw_amount'] = payload.withdrawAmount;
    }

    return this.api.post<any>(ENDPOINTS.SALE_DECISION_DECIDE(id), body).pipe(
      map(res => ({ ...res, data: toSaleDecisionList(res.data) as unknown as SaleDecisionDetail }))
    );
  }

  resetDecision(id: string): Observable<ApiResponse<SaleDecisionDetail>> {
    return this.api.post<any>(ENDPOINTS.SALE_DECISION_RESET(id), {}).pipe(
      map(res => ({ ...res, data: toSaleDecisionList(res.data) as unknown as SaleDecisionDetail }))
    );
  }

  // ── Portal del inversionista ──────────────────────────────────────

  getMyPending(): Observable<ApiResponse<SaleDecisionList[]>> {
    return this.api.get<any[]>(ENDPOINTS.SALE_DECISIONS_PENDING).pipe(
      map(res => ({ ...res, data: res.data.map(toSaleDecisionList) }))
    );
  }

  getMyHistory(): Observable<ApiResponse<SaleDecisionList[]>> {
    return this.api.get<any[]>(ENDPOINTS.SALE_DECISIONS_HISTORY).pipe(
      map(res => ({ ...res, data: res.data.map(toSaleDecisionList) }))
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────

  private toParams(filters?: SaleDecisionFilters): Record<string, any> | undefined {
    if (!filters) return undefined;
    return {
      decision_type: filters.decisionType,
      is_processed: filters.isProcessed,
      investor: filters.investor,
      sale_event: filters.saleEvent,
      page: filters.page,
      page_size: filters.pageSize,
    };
  }
}