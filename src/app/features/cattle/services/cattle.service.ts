import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse, PaginatedResponse } from '../../../core/models/api-response.model';
import {
  Breed,
  Color,
  Lot,
  LotSummary,
  Animal,
  AnimalSummary,
  WeightRecord,
  Movement,
  HealthEvent,
  InventorySummary,
} from '../models/cattle.model';

@Injectable({
  providedIn: 'root'
})
export class CattleService {
  private api = inject(ApiService);

  // ==================== BREEDS ====================

  getBreeds(params?: Record<string, any>): Observable<ApiResponse<Breed[]>> {
    return this.api.get('cattle/breeds', params);
  }

  createBreed(data: Partial<Breed>): Observable<ApiResponse<Breed>> {
    return this.api.post('cattle/breeds', data);
  }

  // ==================== COLORS ====================

  getColors(): Observable<ApiResponse<Color[]>> {
    return this.api.get('cattle/colors');
  }

  // ==================== LOTS ====================

  getLots(params?: Record<string, any>): Observable<ApiResponse<PaginatedResponse<Lot>>> {
    return this.api.get('cattle/lots', params);
  }

  getLotById(id: string): Observable<ApiResponse<Lot>> {
    return this.api.get(`cattle/lots/${id}`);
  }

  createLot(data: Partial<Lot>): Observable<ApiResponse<Lot>> {
    return this.api.post('cattle/lots', data);
  }

  updateLot(id: string, data: Partial<Lot>): Observable<ApiResponse<Lot>> {
    return this.api.put(`cattle/lots/${id}`, data);
  }

  deleteLot(id: string): Observable<ApiResponse<void>> {
    return this.api.delete(`cattle/lots/${id}`);
  }

  getLotSummary(id: string): Observable<ApiResponse<LotSummary>> {
    return this.api.get(`cattle/lots/${id}/summary`);
  }

  getLotAnimals(id: string): Observable<ApiResponse<Animal[]>> {
    return this.api.get(`cattle/lots/${id}/animals`);
  }

  closeLot(id: string): Observable<ApiResponse<any>> {
    return this.api.post(`cattle/lots/${id}/close`, {});
  }

  // ==================== ANIMALS ====================

  getAnimals(params?: Record<string, any>): Observable<ApiResponse<PaginatedResponse<Animal>>> {
    return this.api.get('cattle/animals', params);
  }

  getAnimalById(id: string): Observable<ApiResponse<Animal>> {
    return this.api.get(`cattle/animals/${id}`);
  }

  createAnimal(data: Partial<Animal>): Observable<ApiResponse<Animal>> {
    return this.api.post('cattle/animals', data);
  }

  updateAnimal(id: string, data: Partial<Animal>): Observable<ApiResponse<Animal>> {
    return this.api.put(`cattle/animals/${id}`, data);
  }

  deleteAnimal(id: string): Observable<ApiResponse<void>> {
    return this.api.delete(`cattle/animals/${id}`);
  }

  getAnimalSummary(id: string): Observable<ApiResponse<AnimalSummary>> {
    return this.api.get(`cattle/animals/${id}/summary`);
  }

  // ==================== WEIGHT RECORDS ====================

  getAnimalWeightHistory(
    animalId: string,
    params?: Record<string, any>
  ): Observable<ApiResponse<WeightRecord[]>> {
    return this.api.get(`cattle/animals/${animalId}/weight-history`, params);
  }

  recordWeight(animalId: string, data: Partial<WeightRecord>): Observable<ApiResponse<any>> {
    return this.api.post(`cattle/animals/${animalId}/record-weight`, data);
  }

  bulkRecordWeight(data: {
    record_date?: string;
    price_per_kg?: number;
    weights: { animal_id: string; weight: number; body_condition_score?: number }[];
  }): Observable<ApiResponse<any>> {
    return this.api.post('cattle/weight-records/bulk', data);
  }

  // ==================== HEALTH EVENTS ====================

  getAnimalHealthEvents(animalId: string): Observable<ApiResponse<HealthEvent[]>> {
    return this.api.get(`cattle/animals/${animalId}/health-events`);
  }

  createHealthEvent(data: Partial<HealthEvent>): Observable<ApiResponse<HealthEvent>> {
    return this.api.post('cattle/health-events', data);
  }

  getPendingHealthEvents(days?: number): Observable<ApiResponse<any[]>> {
    return this.api.get('cattle/health-events/pending', { days: days || 30 });
  }

  getAnimalsInWithdrawal(): Observable<ApiResponse<any[]>> {
    return this.api.get('cattle/health-events/withdrawal');
  }

  createBatchHealthEvent(data: {
    animal_ids: string[];
    event_type: string;
    event_date?: string;
    product_name: string;
    dosage?: string;
    withdrawal_days?: number;
    total_cost?: number;
    veterinarian?: string;
    lot_id?: string;
    notes?: string;
  }): Observable<ApiResponse<any>> {
    return this.api.post('cattle/health-events/batch', data);
  }

  // ==================== MOVEMENTS ====================

  changeLot(
    animalId: string,
    lotId: string,
    movementDate?: string
  ): Observable<ApiResponse<Movement>> {
    return this.api.post(`cattle/animals/${animalId}/change-lot`, {
      lot_id: lotId,
      movement_date: movementDate,
    });
  }

  bulkChangeLot(
    animalIds: string[],
    lotId: string,
    movementDate?: string
  ): Observable<ApiResponse<any>> {
    return this.api.post('cattle/animals/bulk-change-lot', {
      animal_ids: animalIds,
      lot_id: lotId,
      movement_date: movementDate,
    });
  }

  recordDeath(
    animalId: string,
    data: { death_date: string; cause?: string }
  ): Observable<ApiResponse<any>> {
    return this.api.post(`cattle/animals/${animalId}/record-death`, data);
  }

  // ==================== REPORTS ====================

  getInventorySummary(farmId?: string): Observable<ApiResponse<InventorySummary>> {
    return this.api.get('cattle/reports/inventory', { farm_id: farmId });
  }

  getWeightGainReport(params: {
    lot_id?: string;
    start_date?: string;
    end_date?: string;
  }): Observable<ApiResponse<any[]>> {
    return this.api.get('cattle/reports/weight-gain', params);
  }

  getLotsSummary(): Observable<ApiResponse<any[]>> {
    return this.api.get('cattle/reports/lots-summary');
  }
}