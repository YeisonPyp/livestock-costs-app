// services/constants.service.ts

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { ApiResponse, SelectOption } from '../../../core/models/api-response.model';
import { ENDPOINTS } from './endpoints';

@Injectable({ providedIn: 'root' })
export class InvestmentConstantsService {
  private readonly api = inject(ApiService);

  getContractStatuses(): Observable<ApiResponse<SelectOption[]>> {
    return this.api.get<SelectOption[]>(ENDPOINTS.CONST_CONTRACT_STATUS);
  }

  getContractTypes(): Observable<ApiResponse<SelectOption[]>> {
    return this.api.get<SelectOption[]>(ENDPOINTS.CONST_CONTRACT_TYPES);
  }

  getInvestmentStatuses(): Observable<ApiResponse<SelectOption[]>> {
    return this.api.get<SelectOption[]>(ENDPOINTS.CONST_INV_STATUSES);
  }

  getMovementTypes(): Observable<ApiResponse<SelectOption[]>> {
    return this.api.get<SelectOption[]>(ENDPOINTS.CONST_MOVEMENT_TYPES);
  }

  getSaleDecisionTypes(): Observable<ApiResponse<SelectOption[]>> {
    return this.api.get<SelectOption[]>(ENDPOINTS.CONST_DECISION_TYPES);
  }

  getCattleOwnershipStatuses(): Observable<ApiResponse<SelectOption[]>> {
    return this.api.get<SelectOption[]>(ENDPOINTS.CONST_OWNERSHIP_STATUS);
  }
}