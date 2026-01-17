import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Cost } from '../models/cost.interface';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    count: number;
    current_page: number;
    total_pages: number;
    next: string | null;
    previous: string | null;
  };
}

export interface CostFilters {
  page?: number;
  page_size?: number;
  category?: number;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CostService {
  private apiUrl = `${environment.apiUrl}/costs/costs`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los costos con filtros y paginación
   */
  getCosts(filters: CostFilters = {}): Observable<ApiResponse<Cost[]>> {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<ApiResponse<Cost[]>>(`${this.apiUrl}/`, { params });
  }

  /**
   * Obtener un costo por ID
   */
  getCostById(id: number): Observable<ApiResponse<Cost>> {
    return this.http.get<ApiResponse<Cost>>(`${this.apiUrl}/${id}/`);
  }

  /**
   * Crear un nuevo costo
   */
  createCost(cost: Partial<Cost>): Observable<ApiResponse<Cost>> {
    return this.http.post<ApiResponse<Cost>>(`${this.apiUrl}/`, cost);
  }

  /**
   * Actualizar un costo existente
   */
  updateCost(id: number, cost: Partial<Cost>): Observable<ApiResponse<Cost>> {
    return this.http.put<ApiResponse<Cost>>(`${this.apiUrl}/${id}/`, cost);
  }

  /**
   * Eliminar un costo
   */
  deleteCost(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}/`);
  }

  /**
   * Obtener costos por categoría
   */
  getCostsByCategory(categoryId: number): Observable<ApiResponse<Cost[]>> {
    return this.getCosts({ category: categoryId });
  }

  /**
   * Obtener costos por rango de fechas
   */
  getCostsByDateRange(dateFrom: string, dateTo: string): Observable<ApiResponse<Cost[]>> {
    return this.getCosts({ date_from: dateFrom, date_to: dateTo });
  }

  /**
   * Obtener resumen de costos (total, promedio, etc.)
   */
  getCostsSummary(filters: CostFilters = {}): Observable<ApiResponse<any>> {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/summary/`, { params });
  }

  /**
   * Obtener total del mes
   */
  getTotalMonth(year: number, month: number): Observable<ApiResponse<{ total: number; count: number }>> {
    return this.http.get<ApiResponse<{ total: number; count: number }>>(
      `${this.apiUrl}/total_month/?year=${year}&month=${month}`
    );
  }

  /**
   * Obtener reporte mensual por categorías
   */
  getMonthlyReport(year: number, month: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(
      `${this.apiUrl}/monthly_report/?year=${year}&month=${month}`
    );
  }

  /**
   * Obtener total acumulado del año
   */
  getYearToDate(year: number): Observable<ApiResponse<{ total: number; count: number }>> {
    return this.http.get<ApiResponse<{ total: number; count: number }>>(
      `${this.apiUrl}/year-to-date/?year=${year}`
    );
  }
}