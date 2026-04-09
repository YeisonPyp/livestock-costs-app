import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api-response.model';

import { INVESTMENT_ENDPOINTS } from './endpoints';
import {
  Investor,
  InvestorSummary,
  InvestorStatement,
} from '../models/investment.model';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS ESPECÍFICOS DEL SERVICIO
// ═══════════════════════════════════════════════════════════════════════════

/** Parámetros de búsqueda para inversionistas */
export interface InvestorSearchParams {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
  has_active_contract?: boolean;
  ordering?: string;
}

/** Payload para crear inversionista */
export interface CreateInvestorPayload {
  person_id: string;
  investor_percentage?: number;
  operator_percentage?: number;
  notify_sales?: boolean;
  notify_weight_gains?: boolean;
  default_sale_decision?: string;
  notes?: string;
}

/** Payload para actualizar inversionista */
export interface UpdateInvestorPayload {
  investor_percentage?: number;
  operator_percentage?: number;
  notify_sales?: boolean;
  notify_weight_gains?: boolean;
  default_sale_decision?: string;
  notes?: string;
  is_active?: boolean;
}

/** Parámetros para estado de cuenta */
export interface StatementParams {
  start_date?: string; // ISO date
  end_date?: string;   // ISO date
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICIO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Servicio para gestión de inversionistas.
 * 
 * @example
 * ```typescript
 * // Obtener listado
 * this.investorService.getAll({ is_active: true }).subscribe(...)
 * 
 * // Obtener resumen
 * this.investorService.getSummary(investorId).subscribe(...)
 * ```
 */
@Injectable({ providedIn: 'root' })
export class InvestorService {
  private readonly api = inject(ApiService);

  // ─── CRUD ────────────────────────────────────────────────────────────────

  /**
   * Obtiene listado de inversionistas con filtros opcionales.
   */
  getAll(params?: InvestorSearchParams): Observable<ApiResponse<Investor[]>> {
    return this.api.get<Investor[]>(INVESTMENT_ENDPOINTS.INVESTORS, params);
  }

  /**
   * Obtiene un inversionista por ID.
   */
  getById(id: string): Observable<ApiResponse<Investor>> {
    return this.api.get<Investor>(INVESTMENT_ENDPOINTS.INVESTOR(id));
  }

  /**
   * Crea un nuevo inversionista.
   */
  create(payload: CreateInvestorPayload): Observable<ApiResponse<Investor>> {
    return this.api.post<Investor>(INVESTMENT_ENDPOINTS.INVESTORS, payload);
  }

  /**
   * Actualiza un inversionista existente.
   */
  update(id: string, payload: UpdateInvestorPayload): Observable<ApiResponse<Investor>> {
    return this.api.patch<Investor>(INVESTMENT_ENDPOINTS.INVESTOR(id), payload);
  }

  /**
   * Desactiva un inversionista (soft delete).
   */
  deactivate(id: string): Observable<ApiResponse<Investor>> {
    return this.update(id, { is_active: false });
  }

  /**
   * Reactiva un inversionista.
   */
  activate(id: string): Observable<ApiResponse<Investor>> {
    return this.update(id, { is_active: true });
  }

  // ─── RESÚMENES Y REPORTES ────────────────────────────────────────────────

  /**
   * Obtiene el resumen completo de un inversionista.
   * Incluye: datos personales, inversiones, ganado, decisiones pendientes.
   */
  getSummary(id: string): Observable<ApiResponse<InvestorSummary>> {
    return this.api.get<InvestorSummary>(INVESTMENT_ENDPOINTS.INVESTOR_SUMMARY(id));
  }

  /**
   * Obtiene el resumen del inversionista autenticado.
   * Útil para el portal del inversionista.
   */
  getMySummary(): Observable<ApiResponse<InvestorSummary>> {
    return this.api.get<InvestorSummary>(INVESTMENT_ENDPOINTS.MY_SUMMARY);
  }

  /**
   * Obtiene el estado de cuenta de un inversionista.
   * 
   * @param id - ID del inversionista
   * @param params - Rango de fechas (opcional)
   */
  getStatement(id: string, params?: StatementParams): Observable<ApiResponse<InvestorStatement>> {
    return this.api.get<InvestorStatement>(
      INVESTMENT_ENDPOINTS.INVESTOR_STATEMENT(id),
      params
    );
  }

  // ─── HELPERS ─────────────────────────────────────────────────────────────

  /**
   * Busca inversionistas por término (código o nombre).
   */
  search(term: string, limit: number = 10): Observable<ApiResponse<Investor[]>> {
    return this.getAll({
      search: term,
      page_size: limit,
      is_active: true,
    });
  }

  /**
   * Obtiene solo inversionistas activos.
   */
  getActive(): Observable<ApiResponse<Investor[]>> {
    return this.getAll({ is_active: true });
  }

  /**
   * Verifica si un inversionista tiene inversión activa.
   */
  hasActiveInvestment(id: string): Observable<boolean> {
    return this.getSummary(id).pipe(
      map(res => (res.data?.investments.count ?? 0) > 0)
    );
  }
}