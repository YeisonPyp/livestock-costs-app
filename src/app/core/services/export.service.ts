// src/app/core/services/export.service.ts
import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Tipos ─────────────────────────────────────────────────────────

export interface ExportColumn {
  key: string;
  label: string;
  type?:
    | 'text'
    | 'number'
    | 'currency'
    | 'date'
    | 'badge'
    | 'custom'
    | 'link'
    | string;
  width?: string;
  format?: (value: any, row?: any) => string;
  align?: 'left' | 'center' | 'right';
}

export interface ExportConfig {
  fileName: string;
  title?: string;
  subtitle?: string;
  sheetName?: string;
  // Info del negocio para el encabezado del PDF
  companyName?: string;
  companyLogo?: string; // URL base64 o path
  // Formato de números/moneda
  locale?: string;
  currency?: string;
  // Metadatos adicionales
  generatedBy?: string;
  filters?: Record<string, string>;
  // Estilos
  headerColor?: string; // hex sin #
  orientation?: 'portrait' | 'landscape';
}

const DEFAULT_CONFIG: Partial<ExportConfig> = {
  fileName: 'export',
  sheetName: 'Datos',
  locale: 'es-CO',
  currency: 'COP',
  companyName: 'Ganadería Veracruz Y.P',
  headerColor: '1e293b',
  orientation: 'landscape',
};

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  // ══════════════════════════════════════════════════════════════════
  // EXCEL
  // ══════════════════════════════════════════════════════════════════

  exportToExcel(
    columns: ExportColumn[],
    data: any[],
    config?: Partial<ExportConfig>,
  ): void {
    const cfg = { ...DEFAULT_CONFIG, ...config } as ExportConfig;
    const visibleColumns = columns.filter((c) => c.type !== 'custom');

    // ── 1. Preparar datos ────────────────────────────────────────
    const rows = data.map((row) => this.buildRow(visibleColumns, row, cfg));

    // ── 2. Headers ───────────────────────────────────────────────
    const headers = visibleColumns.map((col) => col.label);

    // ── 3. Crear Workbook ────────────────────────────────────────
    const wb = XLSX.utils.book_new();

    // Filas de encabezado del reporte
    const reportHeader: any[][] = [];

    if (cfg.title) {
      reportHeader.push([cfg.title]);
    }
    if (cfg.subtitle) {
      reportHeader.push([cfg.subtitle]);
    }
    if (cfg.companyName) {
      reportHeader.push([`Empresa: ${cfg.companyName}`]);
    }

    // Fecha de generación
    reportHeader.push([
      `Generado: ${new Date().toLocaleDateString(cfg.locale, {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`,
    ]);

    // Filtros aplicados
    if (cfg.filters && Object.keys(cfg.filters).length > 0) {
      const filterStr = Object.entries(cfg.filters)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' | ');
      if (filterStr) {
        reportHeader.push([`Filtros: ${filterStr}`]);
      }
    }

    if (cfg.generatedBy) {
      reportHeader.push([`Generado por: ${cfg.generatedBy}`]);
    }

    // Fila vacía de separación
    reportHeader.push([]);

    // ── 4. Construir sheet ───────────────────────────────────────
    const sheetData = [...reportHeader, headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // ── 5. Aplicar anchos de columna ─────────────────────────────
    ws['!cols'] = visibleColumns.map((col) => {
      // Calcular ancho basado en el contenido más largo
      const maxLen = Math.max(
        col.label.length,
        ...rows.map((r) => String(r[visibleColumns.indexOf(col)] ?? '').length),
      );
      return { wch: Math.min(Math.max(maxLen + 2, 10), 50) };
    });

    // ── 6. Merge del título si existe ────────────────────────────
    if (cfg.title && visibleColumns.length > 1) {
      ws['!merges'] = reportHeader.map((_, i) => ({
        s: { r: i, c: 0 },
        e: { r: i, c: visibleColumns.length - 1 },
      }));
    }

    // ── 7. Agregar sheet al workbook y guardar ───────────────────
    XLSX.utils.book_append_sheet(wb, ws, cfg.sheetName);

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const fileName = this.sanitizeFileName(cfg.fileName);
    saveAs(blob, `${fileName}.xlsx`);
  }

  // ══════════════════════════════════════════════════════════════════
  // PDF
  // ══════════════════════════════════════════════════════════════════

  exportToPdf(
    columns: ExportColumn[],
    data: any[],
    config?: Partial<ExportConfig>,
  ): void {
    const cfg = { ...DEFAULT_CONFIG, ...config } as ExportConfig;
    const visibleColumns = columns.filter((c) => c.type !== 'custom');

    // ── 1. Crear documento ───────────────────────────────────────
    const doc = new jsPDF({
      orientation: cfg.orientation,
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 15;

    // ── 2. Encabezado ────────────────────────────────────────────
    // Empresa
    if (cfg.companyName) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text(cfg.companyName, 14, yPos);
      yPos += 8;
    }

    // Título del reporte
    if (cfg.title) {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(cfg.title, 14, yPos);
      yPos += 6;
    }

    // Subtítulo
    if (cfg.subtitle) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(cfg.subtitle, 14, yPos);
      yPos += 5;
    }

    // Fecha de generación
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const dateStr = new Date().toLocaleDateString(cfg.locale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    doc.text(`Generado: ${dateStr}`, 14, yPos);

    // Generado por
    if (cfg.generatedBy) {
      doc.text(`Por: ${cfg.generatedBy}`, pageWidth - 14, yPos, {
        align: 'right',
      });
    }
    yPos += 4;

    // Filtros aplicados
    if (cfg.filters && Object.keys(cfg.filters).length > 0) {
      const filterStr = Object.entries(cfg.filters)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join('  |  ');
      if (filterStr) {
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(`Filtros: ${filterStr}`, 14, yPos);
        yPos += 3;
      }
    }

    // Línea separadora
    yPos += 2;
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(14, yPos, pageWidth - 14, yPos);
    yPos += 4;

    // ── 3. Preparar datos de la tabla ────────────────────────────
    const tableHeaders = visibleColumns.map((col) => col.label);
    const tableRows = data.map((row) =>
      this.buildRow(visibleColumns, row, cfg).map(String),
    );

    // ── 4. Definir estilos de columnas ───────────────────────────
    const columnStyles: Record<number, any> = {};
    visibleColumns.forEach((col, i) => {
      const style: any = {};

      if (
        col.align === 'right' ||
        col.type === 'currency' ||
        col.type === 'number'
      ) {
        style.halign = 'right';
      } else if (col.align === 'center') {
        style.halign = 'center';
      }

      if (col.type === 'currency' || col.type === 'number') {
        style.fontStyle = 'bold';
      }

      if (Object.keys(style).length) {
        columnStyles[i] = style;
      }
    });

    // ── 5. Generar tabla ─────────────────────────────────────────
    const headerColorHex = cfg.headerColor ?? '1e293b';
    const r = parseInt(headerColorHex.substring(0, 2), 16);
    const g = parseInt(headerColorHex.substring(2, 4), 16);
    const b = parseInt(headerColorHex.substring(4, 6), 16);

    autoTable(doc, {
      head: [tableHeaders],
      body: tableRows,
      startY: yPos,
      columnStyles,
      styles: {
        fontSize: 7.5,
        cellPadding: 3,
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
        textColor: [30, 41, 59],
        font: 'helvetica',
      },
      headStyles: {
        fillColor: [r, g, b],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'left',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // slate-50
      },
      margin: { left: 14, right: 14 },
      // Footer con número de página
      didDrawPage: (pageData: any) => {
        const pageH = doc.internal.pageSize.getHeight();
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`Página ${pageData.pageNumber}`, pageWidth - 14, pageH - 8, {
          align: 'right',
        });
        // Total de registros en la primera página
        if (pageData.pageNumber === 1) {
          doc.text(`Total: ${data.length} registros`, 14, pageH - 8);
        }
      },
    });

    // ── 6. Guardar ───────────────────────────────────────────────
    const fileName = this.sanitizeFileName(cfg.fileName);
    doc.save(`${fileName}.pdf`);
  }

  // ══════════════════════════════════════════════════════════════════
  // MÉTODO UNIFICADO (el que conecta con app-table)
  // ══════════════════════════════════════════════════════════════════

  /**
   * Exportar directamente desde un ExportEvent del app-table
   */
  export(
    format: 'excel' | 'pdf',
    columns: ExportColumn[],
    data: any[],
    config?: Partial<ExportConfig>,
  ): void {
    if (format === 'excel') {
      this.exportToExcel(columns, data, config);
    } else {
      this.exportToPdf(columns, data, config);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // UTILS PRIVADOS
  // ══════════════════════════════════════════════════════════════════

  /**
   * Construye una fila de datos formateados para exportación
   */
  private buildRow(
    columns: ExportColumn[],
    row: any,
    cfg: ExportConfig,
  ): any[] {
    return columns.map((col) => {
      const value = this.resolveNestedKey(row, col.key);

      if (col.format) {
        return col.format(value, row);
      }

      switch (col.type) {
        case 'currency':
          return this.formatCurrency(value, cfg.locale, cfg.currency);

        case 'number':
          return this.formatNumber(value, cfg.locale);

        case 'date':
          return this.formatDate(value, cfg.locale);

        case 'badge':
        case 'link': // ✅ Tratar link igual que texto
          return value?.toString() ?? '';

        case 'custom':
          // Los custom no se pueden exportar, mostrar el valor raw
          return value?.toString() ?? '';

        default:
          return value?.toString() ?? '';
      }
    });
  }

  private resolveNestedKey(obj: any, key: string): any {
    return key.split('.').reduce((o, k) => o?.[k], obj);
  }

  private formatCurrency(
    value: any,
    locale = 'es-CO',
    currency = 'COP',
  ): string {
    if (value == null || isNaN(Number(value))) return '$0';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  }

  private formatNumber(value: any, locale = 'es-CO'): string {
    if (value == null || isNaN(Number(value))) return '0';
    return new Intl.NumberFormat(locale).format(Number(value));
  }

  private formatDate(value: any, locale = 'es-CO'): string {
    if (!value) return '';
    try {
      const date =
        typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
          ? new Date(value + 'T00:00:00')
          : new Date(value);

      if (isNaN(date.getTime())) return value?.toString() ?? '';

      return date.toLocaleDateString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return value?.toString() ?? '';
    }
  }

  private sanitizeFileName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s\-_]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase();
  }
}
