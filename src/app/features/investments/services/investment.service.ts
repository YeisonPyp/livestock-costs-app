// import { Injectable, inject } from '@angular/core';
// import { Observable } from 'rxjs';
// import { ApiService } from '../../../core/services/api.service';
// import { ApiResponse } from '../../../core/models/api-response.model';
// import {
//   Investor, InvestorSummary, InvestorStatement,
//   Investment, InvestmentMovement,
//   CattleOwnership,
//   SaleEvent, SaleDecision, MakeDecisionPayload,
//   ParticipationReport,
// } from '../models/investment.model';

// @Injectable({ providedIn: 'root' })
// export class InvestmentService {
//   private api = inject(ApiService);
  

//   // ── Investors ──────────────────────────────────────────────────────────────
//   getInvestors(params?: Record<string, any>): Observable<ApiResponse<Investor[]>> {
//     return this.api.get('/investments/investors/', params);
//   }

//   getInvestor(id: string): Observable<ApiResponse<Investor>> {
//     return this.api.get(`/investments/investors/${id}/`);
//   }

//   createInvestor(data: Partial<Investor>): Observable<ApiResponse<Investor>> {
//     return this.api.post('/investments/investors/', data);
//   }

//   updateInvestor(id: string, data: Partial<Investor>): Observable<ApiResponse<Investor>> {
//     return this.api.put(`/investments/investors/${id}/`, data);
//   }

//   getInvestorSummary(id: string): Observable<ApiResponse<InvestorSummary>> {
//     return this.api.get(`/investments/investors/${id}/summary/`);
//   }

//   getMyInvestorSummary(): Observable<ApiResponse<InvestorSummary>> {
//     return this.api.get(`/investments/investors/me/summary/`);
//   }

//   getInvestorStatement(id: string, params?: { start_date?: string; end_date?: string }): Observable<ApiResponse<InvestorStatement>> {
//     return this.api.get(`/investments/investors/${id}/statement/`, params);
//   }

//   // ── Investments ────────────────────────────────────────────────────────────
//   getInvestments(params?: Record<string, any>): Observable<ApiResponse<Investment[]>> {
//     return this.api.get('/investments/investments/', params);
//   }

//   getInvestment(id: string): Observable<ApiResponse<Investment>> {
//     return this.api.get(`/investments/investments/${id}/`);
//   }

//   createInvestment(data: Partial<Investment>): Observable<ApiResponse<Investment>> {
//     return this.api.post('/investments/investments/', data);
//   }

//   contribute(id: string, payload: ContributeWithdrawPayload): Observable<ApiResponse<{ movement: InvestmentMovement; new_balance: number }>> {
//     return this.api.post(`/investments/investments/${id}/contribute/`, payload);
//   }

//   withdraw(id: string, payload: ContributeWithdrawPayload): Observable<ApiResponse<{ movement: InvestmentMovement; new_balance: number }>> {
//     return this.api.post(`/investments/investments/${id}/withdraw/`, payload);
//   }

//   getMovements(id: string): Observable<ApiResponse<InvestmentMovement[]>> {
//     return this.api.get(`/investments/investments/${id}/movements/`);
//   }

//   // ── Cattle Ownerships ──────────────────────────────────────────────────────
//   getCattleOwnerships(params?: Record<string, any>): Observable<ApiResponse<CattleOwnership[]>> {
//     return this.api.get('/investments/cattle-ownerships/', params);
//   }

//   getCattleOwnership(id: string): Observable<ApiResponse<CattleOwnership>> {
//     return this.api.get(`/investments/cattle-ownerships/${id}/`);
//   }

//   createCattleOwnership(data: Partial<CattleOwnership>): Observable<ApiResponse<CattleOwnership>> {
//     return this.api.post('/investments/cattle-ownerships/', data);
//   }

//   recordWeight(id: string, data: { weight: number; price_per_kg?: number; record_date?: string }): Observable<ApiResponse<any>> {
//     return this.api.post(`/investments/cattle-ownerships/${id}/record-weight/`, data);
//   }

//   // ── Sales ──────────────────────────────────────────────────────────────────
//   getSales(params?: Record<string, any>): Observable<ApiResponse<SaleEvent[]>> {
//     return this.api.get('/investments/sale-events/', params);
//   }

//   getSale(id: string): Observable<ApiResponse<SaleEvent>> {
//     return this.api.get(`/investments/sale-events/${id}/`);
//   }

//   createSale(data: Partial<SaleEvent>): Observable<ApiResponse<SaleEvent>> {
//     return this.api.post('/investments/sale-events/', data);
//   }

//   getSaleDecisions(saleId: string): Observable<ApiResponse<SaleDecision[]>> {
//     return this.api.get(`/investments/sale-events/${saleId}/decisions/`);
//   }

//   finalizeSale(saleId: string): Observable<ApiResponse<any>> {
//     return this.api.post(`/investments/sale-events/${saleId}/finalize/`, {});
//   }

//   // ── Sale Decisions ─────────────────────────────────────────────────────────
//   getSaleDecisionsList(params?: Record<string, any>): Observable<ApiResponse<SaleDecision[]>> {
//     return this.api.get('/investments/sale-decisions/', params);
//   }

//   getSaleDecision(id: string): Observable<ApiResponse<SaleDecision>> {
//     return this.api.get(`/investments/sale-decisions/${id}/`);
//   }

//   makeDecision(id: string, payload: MakeDecisionPayload): Observable<ApiResponse<{ decision: SaleDecision }>> {
//     return this.api.post(`/investments/sale-decisions/${id}/decide/`, payload);
//   }

//   // ── Reports ────────────────────────────────────────────────────────────────
//   getParticipationReport(): Observable<ApiResponse<ParticipationReport[]>> {
//     return this.api.get('/investments/reports/participation/');
//   }

//   getCattleOwnersReport(investorId?: string): Observable<ApiResponse<any[]>> {
//     const params = investorId ? { investor_id: investorId } : undefined;
//     return this.api.get('/investments/reports/cattle-owners/', params);
//   }
// }

import { Injectable, inject, signal } from '@angular/core';
import { Observable, shareReplay, tap, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api-response.model';

import { INVESTMENT_ENDPOINTS } from './endpoints';
import {
  Investment,
  InvestmentDetail,
  InvestmentMovement,
  InvestmentDashboard,
  ClosureStatus,
  GlobalSummary,
  CapitalEvolution,
  InvestorRanking,
  PendingActions,
  CreateInvestmentPayload,
  ContributePayload,
  WithdrawPayload,
  InvestmentStatus,
} from '../models/investment.model';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS ESPECÍFICOS
// ═══════════════════════════════════════════════════════════════════════════

/** Parámetros de búsqueda para inversiones */
export interface InvestmentSearchParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: InvestmentStatus | '';
  investor?: string; // UUID
  ordering?: string;
}

/** Parámetros para filtrar movimientos */
export interface MovementSearchParams {
  page?: number;
  page_size?: number;
  type?: string;
  date_from?: string;
  date_to?: string;
}

/** Response de operación de capital */
export interface CapitalOperationResponse {
  movement: InvestmentMovement;
  investment: Investment;
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICIO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Servicio para gestión de inversiones.
 * 
 * Maneja:
 * - CRUD de inversiones
 * - Operaciones de capital (aportes, retiros)
 * - Movimientos
 * - Estadísticas globales
 * - Cierre de inversiones
 * 
 * @example
 * ```typescript
 * // Crear inversión
 * this.investmentService.create({
 *   investor_id: '...',
 *   initial_capital: 5000000,
 * }).subscribe(...)
 * 
 * // Registrar aporte
 * this.investmentService.contribute(investmentId, {
 *   amount: 1000000,
 *   description: 'Aporte adicional',
 * }).subscribe(...)
 * ```
 */
@Injectable({ providedIn: 'root' })
export class InvestmentService {
  private readonly api = inject(ApiService);

  // ─── Cache simple para estadísticas globales ─────────────────────────────
  private globalSummaryCache$: Observable<ApiResponse<GlobalSummary>> | null = null;
  private readonly cacheTimeout = signal<number | null>(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // CRUD
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Obtiene listado de inversiones con filtros.
   */
  getAll(params?: InvestmentSearchParams): Observable<ApiResponse<Investment[]>> {
    return this.api.get<Investment[]>(INVESTMENT_ENDPOINTS.INVESTMENTS, params);
  }

  /**
   * Alias para mantener compatibilidad.
   * @deprecated Usar `getAll()` en su lugar.
   */
  getInvestments(params?: InvestmentSearchParams): Observable<ApiResponse<Investment[]>> {
    return this.getAll(params);
  }

  /**
   * Obtiene una inversión por ID.
   */
  getById(id: string): Observable<ApiResponse<InvestmentDetail>> {
    return this.api.get<InvestmentDetail>(INVESTMENT_ENDPOINTS.INVESTMENT(id));
  }

  /**
   * Alias para mantener compatibilidad.
   * @deprecated Usar `getById()` en su lugar.
   */
  getInvestment(id: string): Observable<ApiResponse<InvestmentDetail>> {
    return this.getById(id);
  }

  /**
   * Crea una nueva inversión.
   */
  create(payload: CreateInvestmentPayload): Observable<ApiResponse<Investment>> {
    this.invalidateCache();
    return this.api.post<Investment>(INVESTMENT_ENDPOINTS.INVESTMENTS, payload);
  }

  /**
   * Alias para mantener compatibilidad.
   * @deprecated Usar `create()` en su lugar.
   */
  createInvestment(payload: CreateInvestmentPayload): Observable<ApiResponse<Investment>> {
    return this.create(payload);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OPERACIONES DE CAPITAL
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Registra un aporte de capital.
   * 
   * @param id - ID de la inversión
   * @param payload - Datos del aporte
   * @returns El movimiento creado y la inversión actualizada
   */
  contribute(id: string, payload: ContributePayload): Observable<ApiResponse<InvestmentMovement>> {
    this.invalidateCache();
    return this.api.post<InvestmentMovement>(
      INVESTMENT_ENDPOINTS.INVESTMENT_CONTRIBUTE(id),
      this.normalizePayload(payload)
    );
  }

  /**
   * Registra un retiro de capital.
   * 
   * @param id - ID de la inversión
   * @param payload - Datos del retiro
   * @returns El movimiento creado y la inversión actualizada
   */
  withdraw(id: string, payload: WithdrawPayload): Observable<ApiResponse<InvestmentMovement>> {
    this.invalidateCache();
    return this.api.post<InvestmentMovement>(
      INVESTMENT_ENDPOINTS.INVESTMENT_WITHDRAW(id),
      this.normalizePayload(payload)
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MOVIMIENTOS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Obtiene los movimientos de una inversión.
   */
  getMovements(
    investmentId: string,
    params?: MovementSearchParams
  ): Observable<ApiResponse<InvestmentMovement[]>> {
    return this.api.get<InvestmentMovement[]>(
      INVESTMENT_ENDPOINTS.INVESTMENT_MOVEMENTS(investmentId),
      params
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CIERRE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Obtiene el estado de cierre de una inversión.
   * Indica si puede cerrarse y qué lo bloquea.
   */
  getClosureStatus(id: string): Observable<ApiResponse<ClosureStatus>> {
    return this.api.get<ClosureStatus>(INVESTMENT_ENDPOINTS.INVESTMENT_CLOSURE_STATUS(id));
  }

  /**
   * Cierra una inversión.
   * Solo procede si pasa todas las validaciones.
   */
  close(id: string): Observable<ApiResponse<Investment>> {
    this.invalidateCache();
    return this.api.post<Investment>(INVESTMENT_ENDPOINTS.INVESTMENT_CLOSE(id), {});
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DASHBOARD Y ESTADÍSTICAS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Obtiene el dashboard completo de una inversión.
   * Incluye: financiero, ganado, movimientos por tipo, evolución mensual.
   */
  getDashboard(id: string): Observable<ApiResponse<InvestmentDashboard>> {
    return this.api.get<InvestmentDashboard>(INVESTMENT_ENDPOINTS.INVESTMENT_DASHBOARD(id));
  }

  /**
   * Obtiene el resumen global de todas las inversiones.
   * Usa caché de 5 minutos para evitar llamadas frecuentes.
   */
  getGlobalSummary(forceRefresh = false): Observable<ApiResponse<GlobalSummary>> {
    if (this.globalSummaryCache$ && !forceRefresh) {
      return this.globalSummaryCache$;
    }

    this.globalSummaryCache$ = this.api
      .get<GlobalSummary>(INVESTMENT_ENDPOINTS.GLOBAL_SUMMARY)
      .pipe(
        tap(() => this.setCacheTimeout()),
        shareReplay({ bufferSize: 1, refCount: true }),
        catchError(err => {
          this.invalidateCache();
          throw err;
        })
      );

    return this.globalSummaryCache$;
  }

  /**
   * Obtiene la evolución del capital mes a mes.
   * 
   * @param months - Cantidad de meses hacia atrás (default: 12)
   */
  getCapitalEvolution(months = 12): Observable<ApiResponse<CapitalEvolution[]>> {
    return this.api.get<CapitalEvolution[]>(
      INVESTMENT_ENDPOINTS.CAPITAL_EVOLUTION,
      { months }
    );
  }

  /**
   * Obtiene el ranking de inversionistas por capital.
   * 
   * @param limit - Cantidad de resultados (default: 10)
   */
  getInvestorRanking(limit = 10): Observable<ApiResponse<InvestorRanking[]>> {
    return this.api.get<InvestorRanking[]>(
      INVESTMENT_ENDPOINTS.INVESTOR_RANKING,
      { limit }
    );
  }

  /**
   * Obtiene las acciones pendientes (decisiones, contratos, etc.).
   */
  getPendingActions(): Observable<ApiResponse<PendingActions>> {
    return this.api.get<PendingActions>(INVESTMENT_ENDPOINTS.PENDING_ACTIONS);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Obtiene inversiones activas.
   */
  getActive(): Observable<ApiResponse<Investment[]>> {
    return this.getAll({ status: 'active' });
  }

  /**
   * Obtiene inversiones de un inversionista específico.
   */
  getByInvestor(investorId: string): Observable<ApiResponse<Investment[]>> {
    return this.getAll({ investor: investorId });
  }

  /**
   * Verifica si una inversión puede recibir aportes.
   */
  canContribute(investment: Investment): boolean {
    return investment.status === 'active';
  }

  /**
   * Verifica si una inversión puede procesar retiros.
   */
  canWithdraw(investment: Investment, amount: number): boolean {
    if (investment.status !== 'active') return false;
    return parseFloat(investment.current_capital) >= amount;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVADOS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Normaliza el payload convirtiendo números a strings si es necesario.
   */
  private normalizePayload<T extends Record<string, any>>(payload: T): T {
    const normalized = { ...payload } as Record<string, any>;
    
    if (typeof normalized['amount'] === 'number') {
      normalized['amount'] = normalized['amount'].toString();
    }
    
    return normalized as T;
  }

  /**
   * Invalida el caché de estadísticas globales.
   */
  private invalidateCache(): void {
    this.globalSummaryCache$ = null;
    if (this.cacheTimeout()) {
      clearTimeout(this.cacheTimeout()!);
      this.cacheTimeout.set(null);
    }
  }

  /**
   * Configura el timeout de caché (5 minutos).
   */
  private setCacheTimeout(): void {
    this.cacheTimeout.set(
      window.setTimeout(() => this.invalidateCache(), 5 * 60 * 1000)
    );
  }
}