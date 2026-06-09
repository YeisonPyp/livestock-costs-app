// table.types.ts

import { TemplateRef } from '@angular/core';

// ── Column Definition ─────────────────────────────────────────────────────────
export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'number' | 'date' | 'currency' | 'badge' | 'custom' | 'link';
  width?: string;
  align?: 'left' | 'center' | 'right';
  sticky?: boolean;
  
  /**
   * Función para formatear el valor de la celda.
   * Si type='badge', se usa para el texto del badge.
   */
  format?: (value: any, row?: any) => string;
  
  /**
   * Solo para type='badge'. Retorna el color del badge.
   * Valores posibles: 'success' | 'warning' | 'danger' | 'info' | 'default'
   */
  badgeColor?: (value: any, row?: any) => string;
  
  /**
   * Solo para type='link'. Retorna el routerLink.
   */
  linkRoute?: (row: any) => any[];
  
  /**
   * Template custom para la celda completa.
   * Uso: cuando type='custom', se renderiza este template.
   */
  cellTemplate?: TemplateRef<{ $implicit: any; row: any }>;

  /**
   * Clase CSS adicional para la celda.
   */
  cellClass?: string | ((value: any, row?: any) => string);
  
  /**
   * Si es false, la columna se oculta. 
   * Útil para mostrar/ocultar columnas dinámicamente.
   */
  visible?: boolean;
}

// ── Table Config ──────────────────────────────────────────────────────────────
export interface TableConfig {
  selectable?: boolean;
  searchable?: boolean;
  paginated?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  striped?: boolean;
  hover?: boolean;
  bordered?: boolean;
  compact?: boolean;
  serverPagination?: boolean;
  
  /** Muestra botones de descarga Excel/PDF en el header */
  exportable?: boolean;
  exportFormats?: ('excel' | 'pdf')[];
  exportFileName?: string;
  
  /** Muestra el total de resultados en el footer */
  showResultCount?: boolean;
  
  /** Placeholder del buscador */
  searchPlaceholder?: string;
  
  /** Altura máxima del body (scroll interno) */
  maxHeight?: string;
  
  /** Muestra primera/última página en paginación */
  showFirstLastPage?: boolean;
}

// ── Sort ──────────────────────────────────────────────────────────────────────
export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  column: string;
  direction: SortDirection;
}

// ── Pagination ────────────────────────────────────────────────────────────────
export interface PaginationParams {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_direction?: SortDirection;
}

// ── Export ─────────────────────────────────────────────────────────────────────
export interface ExportEvent {
  format: 'excel' | 'pdf';
  columns: TableColumn[];
  data: any[];
  fileName: string;
  filters?: {
    search?: string;
    sort?: SortState;
  };
}

// ── Defaults ──────────────────────────────────────────────────────────────────
export const DEFAULT_TABLE_CONFIG: TableConfig = {
  selectable: false,
  searchable: true,
  paginated: true,
  pageSize: 10,
  pageSizeOptions: [10, 25, 50, 100],
  striped: true,
  hover: true,
  bordered: false,
  compact: false,
  serverPagination: false,
  exportable: false,
  exportFormats: ['excel', 'pdf'],
  exportFileName: 'datos',
  showResultCount: true,
  searchPlaceholder: 'Buscar...',
  maxHeight: undefined,
  showFirstLastPage: true,
};