import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ApiResponse } from '../../../core/models/api-response.interface';
import {
  Cost, CostFilters, CostTotals,
  CategorySummary, MonthlySummary, MonthlyReport, YearToDate,
} from '../models/cost.model';

@Injectable({ providedIn: 'root' })
export class CostService {
  private api  = inject(ApiService);
  private base = '/costs/costs';

  // ── CRUD ──────────────────────────────────────────────────────────────────
  getAll(filters: CostFilters = {}): Observable<ApiResponse<Cost[]>> {
    const params = this.cleanParams(filters);
    return this.api.get(`${this.base}/`, params);
  }

  getById(id: number): Observable<ApiResponse<Cost>> {
    return this.api.get(`${this.base}/${id}/`);
  }

  create(data: Partial<Cost>): Observable<ApiResponse<Cost>> {
    return this.api.post(`${this.base}/`, data);
  }

  update(id: number, data: Partial<Cost>): Observable<ApiResponse<Cost>> {
    return this.api.put(`${this.base}/${id}/`, data);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.api.delete(`${this.base}/${id}/`);
  }

  // ── Analytics ─────────────────────────────────────────────────────────────
  getTotals(filters?: Partial<CostFilters>): Observable<ApiResponse<CostTotals>> {
    return this.api.get(`${this.base}/totals/`, this.cleanParams(filters ?? {}));
  }

  getSummaryByCategory(filters?: Partial<CostFilters>): Observable<ApiResponse<CategorySummary[]>> {
    return this.api.get(`${this.base}/summary-by-category/`, this.cleanParams(filters ?? {}));
  }

  getSummaryByMonth(filters?: Partial<CostFilters>): Observable<ApiResponse<MonthlySummary[]>> {
    return this.api.get(`${this.base}/summary-by-month/`, this.cleanParams(filters ?? {}));
  }

  getTotalMonth(year: number, month: number): Observable<ApiResponse<{ total: number; count: number }>> {
    return this.api.get(`${this.base}/total-month/`, { year, month });
  }

  getMonthlyReport(year: number, month: number): Observable<ApiResponse<MonthlyReport>> {
    return this.api.get(`${this.base}/monthly-report/`, { year, month });
  }

  getYearToDate(year: number): Observable<ApiResponse<YearToDate>> {
    return this.api.get(`${this.base}/year-to-date/`, { year });
  }

  // ── Export ────────────────────────────────────────────────────────────────
  /** Returns a URL to trigger download — open in new tab or via anchor */
  exportExcelUrl(filters?: Partial<CostFilters>): string {
    const q = new URLSearchParams(this.cleanParams(filters ?? {})).toString();
    return `/api/${this.base}/export-excel/${q ? '?' + q : ''}`;
  }

  exportPdfUrl(filters?: Partial<CostFilters>): string {
    const q = new URLSearchParams(this.cleanParams(filters ?? {})).toString();
    return `/api/${this.base}/export-pdf/${q ? '?' + q : ''}`;
  }

  // ── Helper ────────────────────────────────────────────────────────────────
  private cleanParams(obj: Record<string, any>): Record<string, any> {
    return Object.fromEntries(
      Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && v !== '')
    );
  }
}