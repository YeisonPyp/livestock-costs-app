// modules/investments/services/contract.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  InvestorContract,
  ContractListItem,
  CreateContractPayload,
  ActivateContractPayload,
  TerminateContractPayload,
  RenewContractPayload,
} from '../models/contract.model';

export interface ContractFilters {
  status?: string;
  contract_type?: string;
  investor?: string;
  search?: string;
  ordering?: string;
}

@Injectable({ providedIn: 'root' })
export class ContractService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/investments/contracts`;

  // ────────────────────────────────────────────
  // CRUD BÁSICO
  // ────────────────────────────────────────────

  /**
   * Lista todos los contratos con filtros opcionales
   */
  getContracts(filters?: ContractFilters): Observable<ApiResponse<ContractListItem[]>> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }
    return this.http.get<ApiResponse<ContractListItem[]>>(`${this.baseUrl}/`, { params });
  }

  /**
   * Obtiene detalle de un contrato
   */
  getContract(id: string): Observable<ApiResponse<InvestorContract>> {
    return this.http.get<ApiResponse<InvestorContract>>(`${this.baseUrl}/${id}/`);
  }

  /**
   * Crea un nuevo contrato (con archivo PDF)
   */
  createContract(payload: CreateContractPayload): Observable<ApiResponse<InvestorContract>> {
    const formData = new FormData();
    
    formData.append('investor_id', payload.investor_id);
    formData.append('contract_file', payload.contract_file);
    formData.append('contract_type', payload.contract_type);
    formData.append('start_date', payload.start_date);
    formData.append('investor_percentage', payload.investor_percentage.toString());
    formData.append('operator_percentage', payload.operator_percentage.toString());
    
    if (payload.end_date) {
      formData.append('end_date', payload.end_date);
    }
    if (payload.signed_date) {
      formData.append('signed_date', payload.signed_date);
    }
    if (payload.initial_investment) {
      formData.append('initial_investment', payload.initial_investment.toString());
    }
    if (payload.notes) {
      formData.append('notes', payload.notes);
    }
    if (payload.terms_and_conditions) {
      formData.append('terms_and_conditions', payload.terms_and_conditions);
    }

    return this.http.post<ApiResponse<InvestorContract>>(`${this.baseUrl}/`, formData);
  }

  // ────────────────────────────────────────────
  // ACCIONES
  // ────────────────────────────────────────────

  /**
   * Activa un contrato
   */
  activateContract(
    id: string, 
    payload?: ActivateContractPayload
  ): Observable<ApiResponse<InvestorContract>> {
    return this.http.post<ApiResponse<InvestorContract>>(
      `${this.baseUrl}/${id}/activate/`, 
      payload ?? {}
    );
  }

  /**
   * Termina un contrato
   */
  terminateContract(
    id: string, 
    payload: TerminateContractPayload
  ): Observable<ApiResponse<InvestorContract>> {
    return this.http.post<ApiResponse<InvestorContract>>(
      `${this.baseUrl}/${id}/terminate/`, 
      payload
    );
  }

  /**
   * Renueva un contrato (crea uno nuevo)
   */
  renewContract(
    id: string, 
    payload: RenewContractPayload
  ): Observable<ApiResponse<InvestorContract>> {
    const formData = new FormData();
    
    formData.append('contract_file', payload.contract_file);
    formData.append('start_date', payload.start_date);
    
    if (payload.end_date) {
      formData.append('end_date', payload.end_date);
    }
    if (payload.investor_percentage !== null && payload.investor_percentage !== undefined) {
      formData.append('investor_percentage', payload.investor_percentage.toString());
    }
    if (payload.operator_percentage !== null && payload.operator_percentage !== undefined) {
      formData.append('operator_percentage', payload.operator_percentage.toString());
    }
    if (payload.initial_investment) {
      formData.append('initial_investment', payload.initial_investment.toString());
    }
    if (payload.notes) {
      formData.append('notes', payload.notes);
    }
    if (payload.terms_and_conditions) {
      formData.append('terms_and_conditions', payload.terms_and_conditions);
    }

    return this.http.post<ApiResponse<InvestorContract>>(
      `${this.baseUrl}/${id}/renew/`, 
      formData
    );
  }

  /**
   * Descarga el PDF del contrato
   */
  downloadContract(id: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/download/`, {
      responseType: 'blob',
    });
  }

  // ────────────────────────────────────────────
  // CONSULTAS ESPECIALES
  // ────────────────────────────────────────────

  /**
   * Lista contratos activos
   */
  getActiveContracts(): Observable<ApiResponse<ContractListItem[]>> {
    return this.http.get<ApiResponse<ContractListItem[]>>(`${this.baseUrl}/active/`);
  }

  /**
   * Lista contratos por vencer
   */
  getExpiringContracts(days: number = 30): Observable<ApiResponse<ContractListItem[]>> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<ApiResponse<ContractListItem[]>>(`${this.baseUrl}/expiring/`, { params });
  }

  /**
   * Lista contratos vencidos
   */
  getExpiredContracts(): Observable<ApiResponse<ContractListItem[]>> {
    return this.http.get<ApiResponse<ContractListItem[]>>(`${this.baseUrl}/expired/`);
  }

  /**
   * Lista contratos de un inversionista específico
   */
  getInvestorContracts(
    investorId: string, 
    status?: string
  ): Observable<ApiResponse<ContractListItem[]>> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<ApiResponse<ContractListItem[]>>(
      `${environment.apiUrl}/investments/investors/${investorId}/contracts/`,
      { params }
    );
  }
}