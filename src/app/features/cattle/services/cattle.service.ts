import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  Breed, Color,
  Lot, LotSummary, LotFilters,
  AnimalListItem, AnimalDetail, AnimalSummary, AnimalFilters,
  WeightRecord, BulkWeightPayload, WeightFilters,
  HealthEvent, BatchHealthEvent, BatchHealthEventCreate, WithdrawalAnimal, HealthFilters,
  Movement,
  InventoryReport, WeightGainReport, LotsSummaryReport,
  BulkImportResult, BulkWeightResult,
  WeightHistoryItem,
} from '../models/cattle.model';

@Injectable({ providedIn: 'root' })
export class CattleService {
  private api = inject(ApiService);
  private base = '/cattle';

  // ── Breeds ────────────────────────────────────────────────────────────────
  getBreeds(): Observable<ApiResponse<Breed[]>> {
    return this.api.get(`${this.base}/breeds/`);
  }
  createBreed(payload: Partial<Breed>): Observable<ApiResponse<Breed>> {
    return this.api.post(`${this.base}/breeds/`, payload);
  }

  
  // ── Animals list ────────────────────────────────────────────────────────────
  getAnimals(filters: AnimalFilters = {}): Observable<ApiResponse<AnimalListItem[]>> {
    return this.api.get(`${this.base}/animals/`, filters);
  }

  // ── Animal detail ───────────────────────────────────────────────────────────
  getAnimal(id: string): Observable<ApiResponse<AnimalDetail>> {
    return this.api.get(`${this.base}/animals/${id}/`);
  }

  // ── Delete animal ───────────────────────────────────────────────────────────
  deleteAnimal(id: string): Observable<ApiResponse<{ message: string }>> {
    return this.api.delete(`${this.base}/animals/${id}/`);
  }

  // ── Animal summary ──────────────────────────────────────────────────────────
  getAnimalSummary(id: string): Observable<ApiResponse<AnimalSummary>> {
    return this.api.get(`${this.base}/animals/${id}/summary/`);
  }

  // ── Weight history ──────────────────────────────────────────────────────────
  getWeightHistory(id: string): Observable<ApiResponse<WeightHistoryItem[]>> {
    return this.api.get(`${this.base}/animals/${id}/weight-history/`);
  }

  // ── Bulk create animals from file ───────────────────────────────────────────
  bulkCreateAnimalsFile(file: File): Observable<ApiResponse<BulkImportResult>> {
    const form = new FormData();
    form.append('file', file);
    return this.api.post(`${this.base}/animals/create-bulks-file/`, form);
  }

  // ── Bulk weight from file ───────────────────────────────────────────────────
  bulkWeightFile(file: File, pricePerKg: number, returnAnimals: boolean = false ): Observable<ApiResponse<BulkWeightResult>> {
    const form = new FormData();
    form.append('file', file);
    form.append('price_per_kg', pricePerKg.toString());
    form.append('return_animals', returnAnimals ? 'true' : 'false');
    
    return this.api.post(`${this.base}/weight-records/bulk-weight-file/`, form);
  }
  

  // // ── Colors ────────────────────────────────────────────────────────────────
  getColors(): Observable<ApiResponse<Color[]>> {
    return this.api.get(`${this.base}/colors/`);
  }
  // createColor(payload: Partial<Color>): Observable<ApiResponse<Color>> {
  //   return this.api.post(`${this.base}/colors/`, payload);
  // }

  // // ── Lots ──────────────────────────────────────────────────────────────────
  getLots(): Observable<ApiResponse<Lot[]>> {
    return this.api.get(`${this.base}/lots/`);
  }
  createLot(payload: Partial<Lot>): Observable<ApiResponse<Lot>> {
    return this.api.post(`${this.base}/lots/`, payload);
  }
  // getLotById(id: string): Observable<ApiResponse<Lot>> {
  //   return this.api.get(`${this.base}/lots/${id}/`);
  // }
  // getLotSummary(id: string): Observable<ApiResponse<LotSummary>> {
  //   return this.api.get(`${this.base}/lots/${id}/summary/`);
  // }
  // /** GET /lots/{id}/animals/ — active animals in lot */
  // getLotAnimals(id: string, filters: AnimalFilters = {}): Observable<ApiResponse<AnimalListItem[]>> {
  //   return this.api.get(`${this.base}/lots/${id}/animals/`, filters);
  // }
  // closeLot(id: string): Observable<ApiResponse<{ message: string }>> {
  //   return this.api.post(`${this.base}/lots/${id}/close/`, {});
  // }
  // updateLot(id: string, payload: Partial<Lot>): Observable<ApiResponse<Lot>> {
  //   return this.api.put(`${this.base}/lots/${id}/`, payload);
  // }

  // // ── Animals ───────────────────────────────────────────────────────────────
  // getAnimals(filters: AnimalFilters = {}): Observable<ApiResponse<AnimalListItem[]>> {
  //   return this.api.get(`${this.base}/animals/`, filters);
  // }
  // /** POST /animals/create-bulks-file/ — Excel upload */
  // createAnimalsBulkFile(file: File): Observable<ApiResponse<{ count: number }>> {
  //   const form = new FormData();
  //   form.append('file', file);
  //   return this.api.post(`${this.base}/animals/create-bulks-file/`, form);
  // }
  // getAnimalById(id: string): Observable<ApiResponse<AnimalDetail>> {
  //   return this.api.get(`${this.base}/animals/${id}/`);
  // }
  // getAnimalSummary(id: string): Observable<ApiResponse<AnimalSummary>> {
  //   return this.api.get(`${this.base}/animals/${id}/summary/`);
  // }
  // getAnimalWeightHistory(id: string, params?: { start_date?: string; end_date?: string }): Observable<ApiResponse<WeightRecord[]>> {
  //   return this.api.get(`${this.base}/animals/${id}/weight-history/`, params);
  // }
  // getAnimalHealthEvents(id: string): Observable<ApiResponse<HealthEvent[]>> {
  //   return this.api.get(`${this.base}/animals/${id}/health-events/`);
  // }
  // /** POST /animals/{id}/record-weight/ */
  // recordWeight(id: string, payload: {
  //   weight: number;
  //   record_date: string;
  //   price_per_kg?: number;
  //   body_condition_score?: number;
  //   notes?: string;
  // }): Observable<ApiResponse<WeightRecord>> {
  //   return this.api.post(`${this.base}/animals/${id}/record-weight/`, payload);
  // }
  // /** POST /animals/{id}/change-farm/ — payload: { farm_id } */
  // changeFarm(id: string, farmId: string): Observable<ApiResponse<Movement>> {
  //   return this.api.post(`${this.base}/animals/${id}/change-farm/`, { farm_id: farmId });
  // }
  // /** POST /animals/{id}/record-death/ — payload: { death_date, cause } */
  // recordDeath(id: string, payload: { death_date: string; cause?: string }): Observable<ApiResponse<{ message: string }>> {
  //   return this.api.post(`${this.base}/animals/${id}/record-death/`, payload);
  // }
  // /** POST /animals/bulk-change-lot/ — payload: { animal_ids, lot_id } */
  // bulkChangeLot(animalIds: string[], lotId: string): Observable<ApiResponse<{ changed_count: number }>> {
  //   return this.api.post(`${this.base}/animals/bulk-change-lot/`, { animal_ids: animalIds, lot_id: lotId });
  // }
  updateAnimal(id: string, payload: Partial<AnimalDetail>): Observable<ApiResponse<AnimalDetail>> {
    return this.api.put(`${this.base}/animals/${id}/`, payload);
  }

  // // ── Weight records ────────────────────────────────────────────────────────
  // getWeightRecords(filters: WeightFilters = {}): Observable<ApiResponse<WeightRecord[]>> {
  //   return this.api.get(`${this.base}/weight-records/`, filters);
  // }
  // createWeightRecord(payload: Partial<WeightRecord>): Observable<ApiResponse<WeightRecord>> {
  //   return this.api.post(`${this.base}/weight-records/`, payload);
  // }
  // /** POST /weight-records/bulk/ — payload: { weights[], record_date, price_per_kg } */
  // createWeightRecordsBulk(payload: BulkWeightPayload): Observable<ApiResponse<{ recorded_count: number }>> {
  //   return this.api.post(`${this.base}/weight-records/bulk/`, payload);
  // }
  // /** POST /weight-records/bulk-file/ — Excel upload */
  // createWeightRecordsBulkFile(file: File, extraData?: { record_date?: string; price_per_kg?: number }): Observable<ApiResponse<{ recorded_count: number }>> {
  //   const form = new FormData();
  //   form.append('file', file);
  //   if (extraData?.record_date)  form.append('record_date', extraData.record_date);
  //   if (extraData?.price_per_kg) form.append('price_per_kg', String(extraData.price_per_kg));
  //   return this.api.post(`${this.base}/weight-records/bulk-file/`, form);
  // }

  // // ── Health events ─────────────────────────────────────────────────────────
  // getHealthEvents(filters: HealthFilters = {}): Observable<ApiResponse<HealthEvent[]>> {
  //   return this.api.get(`${this.base}/health-events/`, filters);
  // }
  // createHealthEvent(payload: Partial<HealthEvent>): Observable<ApiResponse<HealthEvent>> {
  //   return this.api.post(`${this.base}/health-events/`, payload);
  // }
  // /** GET /health-events/pending/?days=30 */
  // getPendingHealthEvents(days = 30): Observable<ApiResponse<HealthEvent[]>> {
  //   return this.api.get(`${this.base}/health-events/pending/`, { days });
  // }
  // /** GET /health-events/withdrawal/ */
  // getWithdrawalAnimals(): Observable<ApiResponse<WithdrawalAnimal[]>> {
  //   return this.api.get(`${this.base}/health-events/withdrawal/`);
  // }
  // /** POST /health-events/batch/ */
  // createHealthEventBatch(payload: BatchHealthEventCreate): Observable<ApiResponse<BatchHealthEvent>> {
  //   return this.api.post(`${this.base}/health-events/batch/`, payload);
  // }

  // // ── Reports ───────────────────────────────────────────────────────────────
  // getInventoryReport(params?: { farm_id?: string }): Observable<ApiResponse<InventoryReport>> {
  //   return this.api.get(`${this.base}/reports/inventory/`, params);
  // }
  // getWeightGainReport(params?: { lot_id?: string; start_date?: string; end_date?: string }): Observable<ApiResponse<WeightGainReport[]>> {
  //   return this.api.get(`${this.base}/reports/weight-gain/`, params);
  // }
  // getLotsSummaryReport(): Observable<ApiResponse<LotsSummaryReport[]>> {
  //   return this.api.get(`${this.base}/reports/lots-summary/`);
  // }

}