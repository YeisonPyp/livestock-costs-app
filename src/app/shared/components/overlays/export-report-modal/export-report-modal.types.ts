export type ExportFormat = 'excel' | 'pdf';

export interface ExportReportConfig {
  /** Título que se muestra en el header del modal */
  title?: string;
  /** Subtítulo / descripción */
  subtitle?: string;
  /** Mostrar botón Excel */
  showExcel?: boolean;
  /** Mostrar botón PDF */
  showPdf?: boolean;
  /** Etiqueta personalizada para el checkbox */
  allDataLabel?: string;
  /** Fecha mínima permitida */
  minDate?: string;
  /** Fecha máxima permitida (default: hoy) */
  maxDate?: string;
}

export interface ExportReportPayload {
  format: ExportFormat;
  allData: boolean;
  startDate: string | null;
  endDate: string | null;
}

export const DEFAULT_EXPORT_CONFIG: ExportReportConfig = {
  title: 'Exportar Reporte',
  subtitle: 'Seleccione el rango de fechas y el formato de exportación.',
  showExcel: true,
  showPdf: true,
  allDataLabel: 'Traer toda la información',
  minDate: undefined,
  maxDate: undefined,
};