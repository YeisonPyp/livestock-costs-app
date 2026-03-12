import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api-response.interface';
import { Farm, FarmSummary, Paddock, Employee } from '../models/farm.model';

@Injectable({
  providedIn: 'root'
})
export class FarmService {
  private api = inject(ApiService);
  private endpoint = '/farms/farms/';

  // ==================== FARMS ====================

  getAll(params?: Record<string, any>): Observable<ApiResponse<Farm[]>> {
    return this.api.get(this.endpoint, params);
  }

  getById(id: string): Observable<ApiResponse<Farm>> {
    return this.api.get(`${this.endpoint}${id}`);
  }

  create(data: Partial<Farm>): Observable<ApiResponse<Farm>> {
    return this.api.post(this.endpoint, data);
  }

  update(id: string, data: Partial<Farm>): Observable<ApiResponse<Farm>> {
    return this.api.put(`${this.endpoint}${id}`, data);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.api.delete(`${this.endpoint}${id}`);
  }

  getSummary(id: string): Observable<ApiResponse<FarmSummary>> {
    return this.api.get(`${this.endpoint}${id}/summary`);
  }

  getAllSummary(): Observable<ApiResponse<Farm[]>> {
    return this.api.get(`${this.endpoint}all-summary`);
  }

  getListSimple(): Observable<ApiResponse<Farm[]>> {
    return this.api.get(`${this.endpoint}simple`);
  }

  // ==================== PADDOCKS ====================

  getPaddocks(farmId: string): Observable<ApiResponse<Paddock[]>> {
    return this.api.get(`${this.endpoint}${farmId}/paddocks`);
  }

  getAvailablePaddocks(farmId: string, params?: Record<string, any>): Observable<ApiResponse<Paddock[]>> {
    return this.api.get('farms/paddocks/available', { farm_id: farmId, ...params });
  }

  createPaddock(data: Partial<Paddock>): Observable<ApiResponse<Paddock>> {
    return this.api.post('farms/paddocks', data);
  }

  updatePaddock(id: string, data: Partial<Paddock>): Observable<ApiResponse<Paddock>> {
    return this.api.put(`farms/paddocks/${id}`, data);
  }

  deletePaddock(id: string): Observable<ApiResponse<void>> {
    return this.api.delete(`farms/paddocks/${id}`);
  }

  startPaddockOccupation(id: string, cattleCount: number): Observable<ApiResponse<Paddock>> {
    return this.api.post(`farms/paddocks/${id}/start-occupation`, { cattle_count: cattleCount });
  }

  endPaddockOccupation(id: string, restDays?: number): Observable<ApiResponse<Paddock>> {
    return this.api.post(`farms/paddocks/${id}/end-occupation`, { rest_days: restDays });
  }

  getRotationSchedule(farmId: string): Observable<ApiResponse<any[]>> {
    return this.api.get(`${this.endpoint}/${farmId}/rotation-schedule`);
  }

  // ==================== EMPLOYEES ====================

  getEmployees(farmId: string, activeOnly = true): Observable<ApiResponse<Employee[]>> {
    return this.api.get(`${this.endpoint}/${farmId}/employees`, { active_only: activeOnly });
  }

  createEmployee(data: Partial<Employee>): Observable<ApiResponse<Employee>> {
    return this.api.post('farms/employees', data);
  }

  updateEmployee(id: string, data: Partial<Employee>): Observable<ApiResponse<Employee>> {
    return this.api.put(`farms/employees/${id}`, data);
  }

  terminateEmployee(id: string, data: { termination_date?: string; reason?: string }): Observable<ApiResponse<Employee>> {
    return this.api.post(`farms/employees/${id}/terminate`, data);
  }

  getPayroll(farmId: string): Observable<ApiResponse<any>> {
    return this.api.get(`${this.endpoint}/${farmId}/payroll`);
  }
}