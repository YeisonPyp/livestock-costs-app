import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MonthlyReportApiResponse } from '../models/monthly-report.interface';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CostReportService {
  private apiUrl = `${environment.apiUrl}/costs/reports`; // Ajusta según tu configuración

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el reporte mensual entre dos fechas
   * @param startDate Fecha de inicio (YYYY-MM-DD)
   * @param endDate Fecha de fin (YYYY-MM-DD)
   * @returns Observable con la respuesta del API
   */
  getMonthlyReport(startDate: string, endDate: string): Observable<MonthlyReportApiResponse> {
    const params = new HttpParams()
      .set('start_date', startDate)
      .set('end_date', endDate);

    return this.http.get<MonthlyReportApiResponse>(`${this.apiUrl}/monthly-report/`, { params });
  }

  /**
   * Descarga el reporte en formato PDF
   * @param startDate Fecha de inicio (YYYY-MM-DD)
   * @param endDate Fecha de fin (YYYY-MM-DD)
   * @returns Observable con el Blob del PDF
   */
  downloadPdf(startDate: string, endDate: string): Observable<Blob> {
    const params = new HttpParams()
      .set('start_date', startDate)
      .set('end_date', endDate);

    return this.http.get(`${this.apiUrl}/export-pdf/`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Descarga el reporte en formato Excel
   * @param startDate Fecha de inicio (YYYY-MM-DD)
   * @param endDate Fecha de fin (YYYY-MM-DD)
   * @returns Observable con el Blob del Excel
   */
  downloadExcel(startDate: string, endDate: string): Observable<Blob> {
    const params = new HttpParams()
      .set('start_date', startDate)
      .set('end_date', endDate);

    return this.http.get(`${this.apiUrl}/export-excel/`, {
      params,
      responseType: 'blob'
    });
  }
}