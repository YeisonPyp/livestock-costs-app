// services/sale-decision.service.ts

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
      map(res => ({ ...res, data: toSaleDecisionList(res.data) }))
    );
  }

  // ── Decidir ───────────────────────────────────────────────────────

  makeDecision(id: string, payload: MakeDecisionPayload): Observable<ApiResponse<SaleDecisionDetail>> {
    return this.api.post<any>(ENDPOINTS.SALE_DECISION_DECIDE(id), {
      decision_type: payload.decisionType,
      reinvest_amount: payload.reinvestAmount,
      withdraw_amount: payload.withdrawAmount,
      notes: payload.notes,
    }).pipe(
      map(res => ({ ...res, data: toSaleDecisionList(res.data) }))
    );
  }

  resetDecision(id: string): Observable<ApiResponse<SaleDecisionDetail>> {
    return this.api.post<any>(ENDPOINTS.SALE_DECISION_RESET(id), {}).pipe(
      map(res => ({ ...res, data: toSaleDecisionList(res.data) }))
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