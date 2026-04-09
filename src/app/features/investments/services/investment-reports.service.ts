import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api-response.model';

import { INVESTMENT_ENDPOINTS } from './endpoints';
import { ParticipationReport } from '../models/investment.model';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

export interface CattleOwnerReport {
  investor_code: string;
  investor_name: string;
  animal_tag: string;
  breed: string;
  purchase_value: string;
  current_weight: string;
  current_value: string;
  weight_gain: string;
  acquisition_date: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SERVICIO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Servicio para reportes del módulo de inversiones.
 */
@Injectable({ providedIn: 'root' })
export class InvestmentReportsService {
  private readonly api = inject(ApiService);

  /**
   * Reporte de participación de todos los inversionistas.
   */
  getParticipationReport(): Observable<ApiResponse<ParticipationReport[]>> {
    return this.api.get<ParticipationReport[]>(INVESTMENT_ENDPOINTS.REPORT_PARTICIPATION);
  }

  /**
   * Reporte de propietarios de ganado.
   * 
   * @param investorId - Filtrar por inversionista (opcional)
   */
  getCattleOwnersReport(investorId?: string): Observable<ApiResponse<CattleOwnerReport[]>> {
    const params = investorId ? { investor_id: investorId } : undefined;
    return this.api.get<CattleOwnerReport[]>(
      INVESTMENT_ENDPOINTS.REPORT_CATTLE_OWNERS,
      params
    );
  }
}