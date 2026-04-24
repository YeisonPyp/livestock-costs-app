// services/investment.service.ts

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import { ENDPOINTS } from './endpoints';

import {
  InvestmentList,
  InvestmentDetail,
  InvestmentMovement,
  InvestmentDashboard,
  ClosureStatus,
  GlobalInvestmentSummary,
  InvestmentFilters,
  MovementFilters,
  CreateInvestmentPayload,
  ContributionPayload,
  WithdrawalPayload,
} from '../models';

import {
  toInvestmentList,
  toInvestmentDetail,
  toInvestmentMovement,
  toClosureStatus,
  toGlobalSummary,
} from '../mappers/investment.mapper';

@Injectable({ providedIn: 'root' })
export class InvestmentService {
  private readonly api = inject(ApiService);

  // ── CRUD ──────────────────────────────────────────────────────────

  list(filters?: InvestmentFilters): Observable<ApiResponse<InvestmentList[]>> {
    return this.api.get<any[]>(ENDPOINTS.INVESTMENTS, this.toParams(filters)).pipe(
      map(res => ({ ...res, data: res.data.map(toInvestmentList) }))
    );
  }

  getById(id: string): Observable<ApiResponse<InvestmentDetail>> {
    return this.api.get<any>(ENDPOINTS.INVESTMENT(id)).pipe(
      map(res => ({ ...res, data: toInvestmentDetail(res.data) }))
    );
  }

  create(payload: CreateInvestmentPayload): Observable<ApiResponse<InvestmentDetail>> {
    return this.api.post<any>(ENDPOINTS.INVESTMENTS, {
      investor_id: payload.investorId,
      initial_capital: payload.initialCapital,
      start_date: payload.startDate,
      notes: payload.notes,
    }).pipe(
      map(res => ({ ...res, data: toInvestmentDetail(res.data) }))
    );
  }

  // ── Operaciones de capital ────────────────────────────────────────

  contribute(id: string, payload: ContributionPayload): Observable<ApiResponse<InvestmentDetail>> {
    return this.api.post<any>(ENDPOINTS.INVESTMENT_CONTRIBUTE(id), {
      amount: payload.amount,
      effective_date: payload.effectiveDate,
      description: payload.description,
    }).pipe(
      map(res => ({ ...res, data: toInvestmentDetail(res.data) }))
    );
  }

  withdraw(id: string, payload: WithdrawalPayload): Observable<ApiResponse<InvestmentDetail>> {
    return this.api.post<any>(ENDPOINTS.INVESTMENT_WITHDRAW(id), {
      amount: payload.amount,
      effective_date: payload.effectiveDate,
      description: payload.description,
    }).pipe(
      map(res => ({ ...res, data: toInvestmentDetail(res.data) }))
    );
  }

  // ── Movimientos ───────────────────────────────────────────────────

  getMovements(id: string, filters?: MovementFilters): Observable<ApiResponse<InvestmentMovement[]>> {
    const params = filters ? {
      type: filters.type,
      date_from: filters.dateFrom,
      date_to: filters.dateTo,
      page: filters.page,
      page_size: filters.pageSize,
    } : undefined;
    return this.api.get<any[]>(ENDPOINTS.INVESTMENT_MOVEMENTS(id), params).pipe(
      map(res => ({ ...res, data: res.data.map(toInvestmentMovement) }))
    );
  }

  // ── Cierre ────────────────────────────────────────────────────────

  getClosureStatus(id: string): Observable<ApiResponse<ClosureStatus>> {
    return this.api.get<any>(ENDPOINTS.INVESTMENT_CLOSURE_STATUS(id)).pipe(
      map(res => ({ ...res, data: toClosureStatus(res.data) }))
    );
  }

  close(id: string): Observable<ApiResponse<InvestmentDetail>> {
    return this.api.post<any>(ENDPOINTS.INVESTMENT_CLOSE(id), {}).pipe(
      map(res => ({ ...res, data: toInvestmentDetail(res.data) }))
    );
  }

  // ── Dashboard y stats globales ────────────────────────────────────

  getDashboard(id: string): Observable<ApiResponse<InvestmentDashboard>> {
    return this.api.get<any>(ENDPOINTS.INVESTMENT_DASHBOARD(id)).pipe(
      map(res => ({ ...res, data: this.toDashboard(res.data) }))
    );
  }

  getGlobalSummary(): Observable<ApiResponse<GlobalInvestmentSummary>> {
    return this.api.get<any>(ENDPOINTS.GLOBAL_SUMMARY).pipe(
      map(res => ({ ...res, data: toGlobalSummary(res.data) }))
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────

  private toParams(filters?: InvestmentFilters): Record<string, any> | undefined {
    if (!filters) return undefined;
    return {
      status: filters.status,
      investor: filters.investor,
      search: filters.search,
      ordering: filters.ordering,
      page: filters.page,
      page_size: filters.pageSize,
    };
  }

  private toDashboard(raw: any): InvestmentDashboard {
    return {
      financial: {
        initialCapital: raw.financial.initial_capital,
        currentCapital: raw.financial.current_capital,
        totalContributions: raw.financial.total_contributions,
        totalWithdrawals: raw.financial.total_withdrawals,
        totalProfits: raw.financial.total_profits,
        totalCosts: raw.financial.total_costs,
        netProfit: raw.financial.net_profit,
        roi: raw.financial.roi,
      },
      cattle: {
        totalHeads: raw.cattle.total_heads,
        totalValue: raw.cattle.total_value,
        totalWeight: raw.cattle.total_weight,
        averageWeight: raw.cattle.average_weight,
        activeCount: raw.cattle.active_count,
      },
      movementsByType: raw.movements_by_type,
      recentMovements: (raw.recent_movements ?? []).map(toInvestmentMovement),
      monthlyEvolution: (raw.monthly_evolution ?? []).map((m: any) => ({
        month: m.month,
        credits: m.credits,
        debits: m.debits,
        net: m.net,
      })),
    };
  }
}