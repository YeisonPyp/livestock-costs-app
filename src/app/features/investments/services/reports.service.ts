// services/reports.service.ts

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import { ENDPOINTS } from './endpoints';

import { ParticipationReport, CattleOwnerReport } from '../models';
import { toParticipationReport, toCattleOwnerReport } from '../mappers/investment.mapper';

@Injectable({ providedIn: 'root' })
export class InvestmentReportsService {
  private readonly api = inject(ApiService);

  getParticipationReport(): Observable<ApiResponse<ParticipationReport[]>> {
    return this.api.get<any[]>(ENDPOINTS.REPORT_PARTICIPATION).pipe(
      map(res => ({ ...res, data: res.data.map(toParticipationReport) }))
    );
  }

  getCattleOwnersReport(investorId?: string): Observable<ApiResponse<CattleOwnerReport[]>> {
    const params = investorId ? { investor_id: investorId } : undefined;
    return this.api.get<any[]>(ENDPOINTS.REPORT_CATTLE_OWNERS, params).pipe(
      map(res => ({ ...res, data: res.data.map(toCattleOwnerReport) }))
    );
  }
}