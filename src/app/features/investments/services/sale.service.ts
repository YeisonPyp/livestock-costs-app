import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api-response.model';

import { INVESTMENT_ENDPOINTS } from './endpoints';
import {
  SaleEvent,
  SaleEventItem,
  SaleDecision,
  CreateSaleEventPayload,
  MakeDecisionPayload,
  SaleDecisionType,
} from '../models/investment.model';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

export interface SaleEventSearchParams {
  page?: number;
  page_size?: number;
  is_finalized?: boolean;
  date_from?: string;
  date_to?: string;
  buyer?: string;
  ordering?: string;
}

export interface SaleDecisionSearchParams {
  page?: number;
  page_size?: number;
  sale_event?: string;
  investment?: string;
  investor?: string;
  decision_type?: SaleDecisionType | '';
  is_processed?: boolean;
  ordering?: string;
}

export interface FinalizeResponse {
  sale_event: SaleEvent;
  processed_decisions: number;
  movements_created: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICIO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Servicio para gestión de ventas y decisiones.
 */
@Injectable({ providedIn: 'root' })
export class SaleService {
  private readonly api = inject(ApiService);

  // ═══════════════════════════════════════════════════════════════════════════
  // SALE EVENTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Obtiene listado de eventos de venta.
   */
  getSaleEvents(params?: SaleEventSearchParams): Observable<ApiResponse<SaleEvent[]>> {
    return this.api.get<SaleEvent[]>(INVESTMENT_ENDPOINTS.SALE_EVENTS, params);
  }

  /**
   * Obtiene un evento de venta por ID.
   */
  getSaleEvent(id: string): Observable<ApiResponse<SaleEvent>> {
    return this.api.get<SaleEvent>(INVESTMENT_ENDPOINTS.SALE_EVENT(id));
  }

  /**
   * Crea un nuevo evento de venta.
   */
  createSaleEvent(payload: CreateSaleEventPayload): Observable<ApiResponse<SaleEvent>> {
    return this.api.post<SaleEvent>(INVESTMENT_ENDPOINTS.SALE_EVENTS, payload);
  }

  /**
   * Obtiene las decisiones asociadas a un evento de venta.
   */
  getSaleEventDecisions(saleEventId: string): Observable<ApiResponse<SaleDecision[]>> {
    return this.api.get<SaleDecision[]>(
      INVESTMENT_ENDPOINTS.SALE_EVENT_DECISIONS(saleEventId)
    );
  }

  /**
   * Finaliza un evento de venta.
   * Procesa todas las decisiones tomadas y genera los movimientos.
   */
  finalizeSaleEvent(saleEventId: string): Observable<ApiResponse<FinalizeResponse>> {
    return this.api.post<FinalizeResponse>(
      INVESTMENT_ENDPOINTS.SALE_EVENT_FINALIZE(saleEventId),
      {}
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SALE DECISIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Obtiene listado de decisiones de venta.
   */
  getDecisions(params?: SaleDecisionSearchParams): Observable<ApiResponse<SaleDecision[]>> {
    return this.api.get<SaleDecision[]>(INVESTMENT_ENDPOINTS.SALE_DECISIONS, params);
  }

  /**
   * Obtiene una decisión por ID.
   */
  getDecision(id: string): Observable<ApiResponse<SaleDecision>> {
    return this.api.get<SaleDecision>(INVESTMENT_ENDPOINTS.SALE_DECISION(id));
  }

  /**
   * Registra una decisión (reinvertir, retirar, parcial).
   */
  makeDecision(id: string, payload: MakeDecisionPayload): Observable<ApiResponse<SaleDecision>> {
    return this.api.post<SaleDecision>(
      INVESTMENT_ENDPOINTS.SALE_DECISION_DECIDE(id),
      payload
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSULTAS ESPECÍFICAS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Obtiene decisiones pendientes.
   */
  getPendingDecisions(): Observable<ApiResponse<SaleDecision[]>> {
    return this.getDecisions({
      decision_type: 'pending',
      is_processed: false,
    });
  }

  /**
   * Obtiene decisiones de un inversionista.
   */
  getDecisionsByInvestment(investmentId: string): Observable<ApiResponse<SaleDecision[]>> {
    return this.getDecisions({ investment: investmentId });
  }

  /**
   * Obtiene decisiones de un inversionista.
   */
  getDecisionsByInvestor(investorId: string): Observable<ApiResponse<SaleDecision[]>> {
    return this.getDecisions({ investor: investorId });
  }

  /**
   * Obtiene ventas no finalizadas.
   */
  getOpenSales(): Observable<ApiResponse<SaleEvent[]>> {
    return this.getSaleEvents({ is_finalized: false });
  }

  /**
   * Verifica si todas las decisiones de una venta están tomadas.
   */
  allDecisionsMade(saleEvent: SaleEvent): boolean {
    return saleEvent.all_decisions_made ?? false;
  }

  /**
   * Verifica si una venta puede finalizarse.
   */
  canFinalize(saleEvent: SaleEvent): boolean {
    return !saleEvent.is_finalized && this.allDecisionsMade(saleEvent);
  }
}