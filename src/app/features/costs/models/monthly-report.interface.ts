/**
 * Interfaz para una entrada individual de gasto
 */
export interface ReportEntry {
  date: string;          // Formato: YYYY-MM-DD
  description: string;
  amount: number;        // Monto individual del gasto
  category: string;
  total: number;         // Total acumulado hasta esta entrada
}

/**
 * Interfaz para el reporte mensual
 */
export interface MonthlyReport {
  month: string;         // Formato: YYYY-MM
  total: number;         // Total del mes
  entries: ReportEntry[];
}

/**
 * Interfaz para la respuesta completa del API
 */
export interface MonthlyReportApiResponse {
  success: boolean;
  message: string;
  data: MonthlyReport[];
}