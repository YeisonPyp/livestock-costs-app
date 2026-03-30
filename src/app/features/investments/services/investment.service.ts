import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  Investor, InvestorSummary, InvestorStatement,
  Investment, InvestmentMovement,
  CattleOwnership,
  SaleEvent, SaleDecision,
  ContributeWithdrawPayload, MakeDecisionPayload,
  ParticipationReport,
} from '../models/investment.model';

@Injectable({ providedIn: 'root' })
export class InvestmentService {
  private api = inject(ApiService);
  

  // ── Investors ──────────────────────────────────────────────────────────────
  getInvestors(params?: Record<string, any>): Observable<ApiResponse<Investor[]>> {
    return this.api.get('/investments/investors/', params);
  }

  getInvestor(id: string): Observable<ApiResponse<Investor>> {
    return this.api.get(`/investments/investors/${id}/`);
  }

  createInvestor(data: Partial<Investor>): Observable<ApiResponse<Investor>> {
    return this.api.post('/investments/investors/', data);
  }

  updateInvestor(id: string, data: Partial<Investor>): Observable<ApiResponse<Investor>> {
    return this.api.put(`/investments/investors/${id}/`, data);
  }

  getInvestorSummary(id: string): Observable<ApiResponse<InvestorSummary>> {
    return this.api.get(`/investments/investors/${id}/summary/`);
  }

  getInvestorStatement(id: string, params?: { start_date?: string; end_date?: string }): Observable<ApiResponse<InvestorStatement>> {
    return this.api.get(`/investments/investors/${id}/statement/`, params);
  }

  // ── Investments ────────────────────────────────────────────────────────────
  getInvestments(params?: Record<string, any>): Observable<ApiResponse<Investment[]>> {
    return this.api.get('/investments/investments/', params);
  }

  getInvestment(id: string): Observable<ApiResponse<Investment>> {
    return this.api.get(`/investments/investments/${id}/`);
  }

  createInvestment(data: Partial<Investment>): Observable<ApiResponse<Investment>> {
    return this.api.post('/investments/investments/', data);
  }

  contribute(id: string, payload: ContributeWithdrawPayload): Observable<ApiResponse<{ movement: InvestmentMovement; new_balance: number }>> {
    return this.api.post(`/investments/investments/${id}/contribute/`, payload);
  }

  withdraw(id: string, payload: ContributeWithdrawPayload): Observable<ApiResponse<{ movement: InvestmentMovement; new_balance: number }>> {
    return this.api.post(`/investments/investments/${id}/withdraw/`, payload);
  }

  getMovements(id: string): Observable<ApiResponse<InvestmentMovement[]>> {
    return this.api.get(`/investments/investments/${id}/movements/`);
  }

  // ── Cattle Ownerships ──────────────────────────────────────────────────────
  getCattleOwnerships(params?: Record<string, any>): Observable<ApiResponse<CattleOwnership[]>> {
    return this.api.get('/investments/cattle-ownerships/', params);
  }

  getCattleOwnership(id: string): Observable<ApiResponse<CattleOwnership>> {
    return this.api.get(`/investments/cattle-ownerships/${id}/`);
  }

  createCattleOwnership(data: Partial<CattleOwnership>): Observable<ApiResponse<CattleOwnership>> {
    return this.api.post('/investments/cattle-ownerships/', data);
  }

  recordWeight(id: string, data: { weight: number; price_per_kg?: number; record_date?: string }): Observable<ApiResponse<any>> {
    return this.api.post(`/investments/cattle-ownerships/${id}/record-weight/`, data);
  }

  // ── Sales ──────────────────────────────────────────────────────────────────
  getSales(params?: Record<string, any>): Observable<ApiResponse<SaleEvent[]>> {
    return this.api.get('/investments/sale-events/', params);
  }

  getSale(id: string): Observable<ApiResponse<SaleEvent>> {
    return this.api.get(`/investments/sale-events/${id}/`);
  }

  createSale(data: Partial<SaleEvent>): Observable<ApiResponse<SaleEvent>> {
    return this.api.post('/investments/sale-events/', data);
  }

  getSaleDecisions(saleId: string): Observable<ApiResponse<SaleDecision[]>> {
    return this.api.get(`/investments/sale-events/${saleId}/decisions/`);
  }

  finalizeSale(saleId: string): Observable<ApiResponse<any>> {
    return this.api.post(`/investments/sale-events/${saleId}/finalize/`, {});
  }

  // ── Sale Decisions ─────────────────────────────────────────────────────────
  getSaleDecisionsList(params?: Record<string, any>): Observable<ApiResponse<SaleDecision[]>> {
    return this.api.get('/investments/sale-decisions/', params);
  }

  getSaleDecision(id: string): Observable<ApiResponse<SaleDecision>> {
    return this.api.get(`/investments/sale-decisions/${id}/`);
  }

  makeDecision(id: string, payload: MakeDecisionPayload): Observable<ApiResponse<{ decision: SaleDecision }>> {
    return this.api.post(`/investments/sale-decisions/${id}/decide/`, payload);
  }

  // ── Reports ────────────────────────────────────────────────────────────────
  getParticipationReport(): Observable<ApiResponse<ParticipationReport[]>> {
    return this.api.get('/investments/reports/participation/');
  }

  getCattleOwnersReport(investorId?: string): Observable<ApiResponse<any[]>> {
    const params = investorId ? { investor_id: investorId } : undefined;
    return this.api.get('/investments/reports/cattle-owners/', params);
  }
}