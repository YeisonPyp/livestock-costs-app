// services/sale-event.service.ts

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import { ENDPOINTS } from './endpoints';

import {
  SaleEventList,
  SaleEventDetail,
  SaleEventFilters,
  CreateSaleEventPayload,
  GenerateDecisionsPayload,
  GenerateDecisionsResult,
  SaleSummary,
  FinalizeResult,
} from '../models';

import {
  toSaleEventList,
  toSaleEventDetail,
  toGenerateDecisionsResult,
  toFinalizeResult,
} from '../mappers/investment.mapper';

@Injectable({ providedIn: 'root' })
export class SaleEventService {
  private readonly api = inject(ApiService);

  // ── CRUD ──────────────────────────────────────────────────────────

  list(filters?: SaleEventFilters): Observable<ApiResponse<SaleEventList[]>> {
    return this.api.get<any[]>(ENDPOINTS.SALE_EVENTS, this.toParams(filters)).pipe(
      map(res => ({ ...res, data: res.data.map(toSaleEventList) }))
    );
  }

  getById(id: string): Observable<ApiResponse<SaleEventDetail>> {
    return this.api.get<any>(ENDPOINTS.SALE_EVENT(id)).pipe(
      map(res => ({ ...res, data: toSaleEventDetail(res.data) }))
    );
  }

  // ── Fase 1: Crear ─────────────────────────────────────────────────

  create(payload: CreateSaleEventPayload): Observable<ApiResponse<SaleEventDetail>> {
    const body = this.buildCreateBody(payload);
  
  // ← Temporal: verificar el body
  console.log('📤 Create sale body:', JSON.stringify(body, null, 2));

    return this.api.post<any>(ENDPOINTS.SALE_EVENTS, body).pipe(
      map(res => ({ ...res, data: toSaleEventDetail(res.data) }))
    );
  }

  // ── Fase 2: Generar decisiones ────────────────────────────────────

  generateDecisions(
    id: string,
    payload: GenerateDecisionsPayload = {}
  ): Observable<ApiResponse<GenerateDecisionsResult>> {
    return this.api.post<any>(ENDPOINTS.SALE_EVENT_GENERATE(id), {
      decision_deadline: payload.decisionDeadline,
    }).pipe(
      map(res => ({ ...res, data: toGenerateDecisionsResult(res.data) }))
    );
  }

  // ── Fase 4: Procesar ──────────────────────────────────────────────

  process(id: string): Observable<ApiResponse<SaleEventDetail>> {
    return this.api.post<any>(ENDPOINTS.SALE_EVENT_PROCESS(id), {}).pipe(
      map(res => ({ ...res, data: toSaleEventDetail(res.data) }))
    );
  }

  // ── Resumen ───────────────────────────────────────────────────────

  getSummary(id: string): Observable<ApiResponse<SaleSummary>> {
    return this.api.get<any>(ENDPOINTS.SALE_EVENT_SUMMARY(id));
  }

  // ── Evidencia ─────────────────────────────────────────────────────

  uploadEvidence(id: string, file: File): Observable<ApiResponse<SaleEventDetail>> {
    const fd = new FormData();
    fd.append('evidence_file', file);
    return this.api.post<any>(ENDPOINTS.SALE_EVENT_UPLOAD_EV(id), fd).pipe(
      map(res => ({ ...res, data: toSaleEventDetail(res.data) }))
    );
  }

  deleteEvidence(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<void>(ENDPOINTS.SALE_EVENT_DELETE_EV(id));
  }

  downloadEvidence(id: string): Observable<Blob> {
    return this.api.download(ENDPOINTS.SALE_EVENT_DOWNLOAD_EV(id));
  }

  // ── Consultas específicas ─────────────────────────────────────────

  getOpen(): Observable<ApiResponse<SaleEventList[]>> {
    return this.list({ isFinalized: false });
  }

  // ── Helpers ───────────────────────────────────────────────────────

  canFinalize(event: SaleEventList): boolean {
    return !event.isFinalized && event.allDecisionsMade;
  }

  private toParams(filters?: SaleEventFilters): Record<string, any> | undefined {
    if (!filters) return undefined;
    return {
      is_finalized: filters.isFinalized,
      sale_date: filters.saleDate,
      buyer: filters.buyer,
      ordering: filters.ordering,
      page: filters.page,
      page_size: filters.pageSize,
    };
  }

  // sale-event.service.ts

  private buildCreateBody(payload: CreateSaleEventPayload): Record<string, any> {
    const body: Record<string, any> = {
      // ✅ Campos requeridos
      sale_date: payload.saleDate,
      items: payload.items.map(item => ({
        animal_id: item.animalId,
        weight: item.weight,
        price_per_kg: item.pricePerKg,
      })),
    };

    // ✅ Campos opcionales — solo si tienen valor
    if (payload.description) {
      body['description'] = payload.description;
    }

    if (payload.saleCosts != null && payload.saleCosts > 0) {
      body['sale_costs'] = payload.saleCosts;
    }

    if (payload.buyerId) {
      body['buyer_id'] = payload.buyerId;
    }

    return body;
  }

private buildCreateFormData(payload: CreateSaleEventPayload): FormData {
  const fd = new FormData();

  // Campos requeridos
  fd.append('sale_date', payload.saleDate);
  fd.append(
    'items',
    JSON.stringify(
      payload.items.map((i) => ({
        animal_id: i.animalId,
        weight: i.weight,
        price_per_kg: i.pricePerKg,
      })),
    ),
  );

  // Campos opcionales — solo si tienen valor
  if (payload.description) {
    fd.append('description', payload.description);
  }

  if (payload.saleCosts != null && payload.saleCosts > 0) {
    fd.append('sale_costs', String(payload.saleCosts));
  }

  if (payload.buyerId) {
    fd.append('buyer_id', payload.buyerId);
  }

  return fd;
}
}