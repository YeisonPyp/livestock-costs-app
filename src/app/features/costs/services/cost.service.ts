import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Cost, CostCreate, MonthlyTotal, CategoryTotal } from '../models/cost.interface';
import { ApiResponse } from '../../../core/models/api-response.interface';

@Injectable({
  providedIn: 'root'
})
export class CostService {

  constructor(private apiService: ApiService) {}

  getCosts(params?: any): Observable<ApiResponse<Cost[]>> {
    return this.apiService.get<Cost[]>('/costs/costs/', params);
  }

  createCost(cost: CostCreate): Observable<ApiResponse<Cost>> {
    return this.apiService.post<Cost>('/costs/costs/', cost);
  }

  getTotalMonth(year: number, month: number): Observable<ApiResponse<MonthlyTotal>> {
    return this.apiService.get<MonthlyTotal>('/costs/costs/total_month/', { year, month });
  }

  getTotalByCategory(categoryId: number, year: number, month: number): Observable<ApiResponse<CategoryTotal>> {
    return this.apiService.get<CategoryTotal>('/costs/costs/total_by_category/', {
      category_id: categoryId,
      year,
      month
    });
  }

  getMonthlyReport(year: number, month: number): Observable<ApiResponse<CategoryTotal[]>> {
    return this.apiService.get<CategoryTotal[]>('/costs/costs/monthly_report/', { year, month });
  }
}
