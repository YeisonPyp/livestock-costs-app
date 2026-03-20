import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Farm, FarmSummary, Paddock, Employee } from '../models/farm.model';

@Injectable({
  providedIn: 'root'
})
export class FarmService {
  private api = inject(ApiService);
  private endpointFarms = '/farms/farms/';
  private endpointEmployees = '/farms/employees/';

  // ==================== FARMS ====================

  getAll(params?: Record<string, any>): Observable<ApiResponse<Farm[]>> {
    return this.api.get(this.endpointFarms, params);
  }

  getById(id: string): Observable<ApiResponse<Farm>> {
    return this.api.get(`${this.endpointFarms}${id}/`);
  }

  create(data: Partial<Farm>): Observable<ApiResponse<Farm>> {
    return this.api.post(this.endpointFarms, data);
  }

  update(id: string, data: Partial<Farm>): Observable<ApiResponse<Farm>> {
    return this.api.put(`${this.endpointFarms}${id}/`, data);
  }

  patch(id: string, data: Partial<Farm>): Observable<ApiResponse<Farm>> {
    return this.api.patch(`${this.endpointFarms}${id}/`, data);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.api.delete(`${this.endpointFarms}${id}/`);
  }

  getSummary(id: string): Observable<ApiResponse<FarmSummary>> {
    return this.api.get(`${this.endpointFarms}${id}/summary/`);
  }

  getAllSummary(): Observable<ApiResponse<Farm[]>> {
    return this.api.get(`${this.endpointFarms}all-summary/`);
  }

  getListSimple(): Observable<ApiResponse<Farm[]>> {
    return this.api.get(`${this.endpointFarms}simple/`);
  }

  // ==================== EMPLOYEES ====================

  getEmployeesFarm(farmId: string, activeOnly = true): Observable<ApiResponse<Employee[]>> {
    return this.api.get(`${this.endpointFarms}${farmId}/employees`, { active_only: activeOnly });
  }

  getPayroll(farmId: string): Observable<ApiResponse<any>> {
    return this.api.get(`${this.endpointFarms}${farmId}/payroll`);
  }

  getAllEmployees(params?: Record<string, any>): Observable<ApiResponse<Employee[]>> {
    return this.api.get(this.endpointEmployees, params);
  }

  createEmployee(data: Partial<Employee>): Observable<ApiResponse<Employee>> {
    return this.api.post(this.endpointEmployees, data);
  }

  getEmployeeById(id: string): Observable<ApiResponse<Employee>> {
    return this.api.get(`${this.endpointEmployees}${id}/`);
  }

  updateEmployee(id: string, data: Partial<Employee>): Observable<ApiResponse<Employee>> {
    return this.api.put(`${this.endpointEmployees}${id}/`, data);
  }

  patchEmployee(id: string, data: Partial<Employee>): Observable<ApiResponse<Employee>> {
    return this.api.patch(`${this.endpointEmployees}${id}/`, data);
  }

  deleteEmployee(id: string): Observable<ApiResponse<void>> {
    return this.api.delete(`${this.endpointEmployees}${id}/`);
  }

  terminateEmployee(id: string, data: { termination_date?: string; reason?: string }): Observable<ApiResponse<Employee>> {
    return this.api.post(`${this.endpointEmployees}${id}/terminate/`, data);
  }

}