// components/sale-summary-report/sale-summary-report.component.ts
import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { NotificationService } from '../../../../core/services/notification.service';
import { BadgeComponent } from '../../../../shared/components/ui/badge/badge.component';
import { AmountDisplayComponent } from '../../../../shared/components/data-display/amount-display/amount-display.component';
import { LoaderComponent } from '../../../../shared/components/feedback/loader/loader.component';

import type { SaleSummary, SaleSummaryInvestor } from '../../models/sale.model';
import { parseDecimal, formatCurrency } from '../../../../core/utils/helpers';

@Component({
  selector:        'app-sale-summary-report',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    BadgeComponent,
    AmountDisplayComponent,
    LoaderComponent,
  ],
  templateUrl: './sale-summary-report.component.html',
  styleUrl:    './sale-summary-report.component.scss',
})
export class SaleSummaryReportComponent {
  private notify = inject(NotificationService);

  // ══════════════════════════════════════════════════════════════
  // INPUTS / OUTPUTS
  // ══════════════════════════════════════════════════════════════

  readonly isOpen  = input.required<boolean>();
  readonly loading = input<boolean>(false);
  readonly summary = input<SaleSummary | null>(null);

  readonly closed = output<void>();

  // ══════════════════════════════════════════════════════════════
  // STATE
  // ══════════════════════════════════════════════════════════════

  readonly exporting = signal(false);

  // ══════════════════════════════════════════════════════════════
  // COMPUTED
  // ══════════════════════════════════════════════════════════════

  readonly investorCount = computed(
    () => this.summary()?.byInvestor.length ?? 0
  );

  readonly totalProfitLoss = computed(() =>
    parseDecimal(this.summary()?.totals.totalProfitLoss ?? '0')
  );

  readonly totalInvestorShare = computed(() =>
    parseDecimal(this.summary()?.totals.totalInvestorShare ?? '0')
  );

  readonly totalOperatorShare = computed(() =>
    parseDecimal(this.summary()?.totals.totalOperatorShare ?? '0')
  );

  // ══════════════════════════════════════════════════════════════
  // ACTIONS
  // ══════════════════════════════════════════════════════════════

  onClose(): void {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('ssr-backdrop')) {
      this.onClose();
    }
  }

  // ══════════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════════

  readonly parseDecimal   = parseDecimal;
  readonly formatCurrency = formatCurrency;

  decisionColor(type: string): 'success' | 'danger' | 'warning' | 'secondary' {
    const map: Record<string, any> = {
      reinvest: 'success',
      withdraw: 'danger',
      partial:  'warning',
      pending:  'secondary',
    };
    return map[type] ?? 'secondary';
  }

  decisionLabel(type: string): string {
    const map: Record<string, string> = {
      reinvest:        'Reinvertir',
      withdraw:        'Retirar',
      partial:         'Distribuir',
      pending:         'Pendiente',
      full_withdrawal: 'Retiro total',
    };
    return map[type] ?? type;
  }

  formatDate(date?: string | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  }

  // ══════════════════════════════════════════════════════════════
  // HELPERS DE ANIMALES
  // ══════════════════════════════════════════════════════════════

  /**
   * Calcula el peso total de una lista de animales
   */
  getAnimalsTotalWeight(animals: SaleSummaryInvestor['animals']): number {
    return animals.reduce((sum, a) => sum + parseDecimal(a.weight), 0);
  }

  /**
   * Calcula el valor bruto total de una lista de animales
   */
  getAnimalsTotalGross(animals: SaleSummaryInvestor['animals']): number {
    return animals.reduce((sum, a) => sum + parseDecimal(a.grossAmount), 0);
  }

  // ══════════════════════════════════════════════════════════════
  // EXPORT EXCEL
  // ══════════════════════════════════════════════════════════════

  async exportExcel(): Promise<void> {
    const data = this.summary();
    if (!data) return;

    this.exporting.set(true);

    try {
      const wb = XLSX.utils.book_new();

      // ── Hoja 1: Resumen general ──────────────────────────
      const generalData: any[][] = [
        ['REPORTE DE VENTA'],
        ['Ganadería Veracruz Y.P'],
        [`Generado: ${new Date().toLocaleDateString('es-CO', {
          day: '2-digit', month: 'long', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })}`],
        [],
        ['INFORMACIÓN DE LA VENTA'],
        ['Fecha',                data.saleEvent.saleDate],
        ['Descripción',          data.saleEvent.description],
        ['Comprador',            data.saleEvent.buyer],
        ['Estado',               data.saleEvent.isFinalized ? 'Finalizada' : 'Pendiente'],
        ['Fecha de finalización', this.formatDate(data.saleEvent.finalizedAt)],
        [],
        ['CIFRAS GENERALES'],
        ['Total cabezas',   data.saleEvent.totalHeads],
        ['Peso total (kg)', data.saleEvent.totalWeight],
        ['Precio por kg',   this.formatCurrency(parseDecimal(data.saleEvent.pricePerKg))],
        ['Monto bruto',     this.formatCurrency(parseDecimal(data.saleEvent.grossAmount))],
        ['Costos',          this.formatCurrency(parseDecimal(data.saleEvent.saleCosts))],
        ['Monto neto',      this.formatCurrency(parseDecimal(data.saleEvent.netAmount))],
        [],
        ['TOTALES'],
        ['Ganancia / Pérdida total', this.formatCurrency(this.totalProfitLoss())],
        ['Total inversionistas',     this.formatCurrency(this.totalInvestorShare())],
        ['Total operador',           this.formatCurrency(this.totalOperatorShare())],
        ['Decisiones pendientes',    data.totals.decisionsPending],
        ['Decisiones procesadas',    data.totals.decisionsProcessed],
      ];

      const wsGeneral = XLSX.utils.aoa_to_sheet(generalData);
      wsGeneral['!cols'] = [{ wch: 35 }, { wch: 30 }];
      wsGeneral['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
        { s: { r: 4, c: 0 }, e: { r: 4, c: 1 } },
        { s: { r: 11, c: 0 }, e: { r: 11, c: 1 } },
        { s: { r: 19, c: 0 }, e: { r: 19, c: 1 } },
      ];
      XLSX.utils.book_append_sheet(wb, wsGeneral, 'Resumen General');

      // ── Hoja 2: Detalle por inversionista ────────────────
      const investorHeaders = [
        'Código',
        'Nombre',
        'Cabezas',
        'Contrato',
        '% Inversionista',
        '% Operador',
        'Venta bruta',
        'Costos',
        'Venta neta',
        'Valor compra',
        'Ganancia/Pérdida',
        'Ganancia Inversionista',
        'Ganancia Operador',
        'Total a recibir',
        'Decisión',
        'Reinvertir',
        'Retirar',
        'Estado',
      ];

      const investorRows = data.byInvestor.map((inv) => {
        const f = inv.financials;
        return [
          inv.investorCode,
          inv.investorName,
          inv.heads,
          f?.contractNumber ?? '—',
          f ? `${f.investorPct}%` : '—',
          f ? `${f.operatorPct}%` : '—',
          f ? parseDecimal(f.grossSale)           : 0,
          f ? parseDecimal(f.costShare)           : 0,
          f ? parseDecimal(f.netSale)             : 0,
          f ? parseDecimal(f.purchaseValue)       : 0,
          f ? parseDecimal(f.profitLoss)          : 0,
          f ? parseDecimal(f.investorProfitShare) : 0,
          f ? parseDecimal(f.operatorProfitShare) : 0,
          f ? parseDecimal(f.investorReceivable)  : 0,
          this.decisionLabel(inv.decision.type),
          parseDecimal(inv.decision.reinvestAmount),
          parseDecimal(inv.decision.withdrawAmount),
          inv.decision.isProcessed ? 'Procesada' : 'Pendiente',
        ];
      });

      const wsInvestors = XLSX.utils.aoa_to_sheet([
        ['DETALLE POR INVERSIONISTA'],
        [],
        investorHeaders,
        ...investorRows,
      ]);

      wsInvestors['!cols'] = investorHeaders.map(() => ({ wch: 20 }));
      wsInvestors['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: investorHeaders.length - 1 } },
      ];
      XLSX.utils.book_append_sheet(wb, wsInvestors, 'Por Inversionista');

      // ── Hoja 3: Animales por inversionista ───────────────
      const animalRows: any[][] = [
        ['DETALLE DE ANIMALES'],
        [],
        ['Inversionista', 'Arete', 'Peso (kg)', 'Precio/kg', 'Valor bruto'],
      ];

      data.byInvestor.forEach((inv) => {
        inv.animals.forEach((a) => {
          animalRows.push([
            inv.investorName,
            a.tag,
            parseDecimal(a.weight),
            parseDecimal(a.pricePerKg),
            parseDecimal(a.grossAmount),
          ]);
        });
      });

      const wsAnimals = XLSX.utils.aoa_to_sheet(animalRows);
      wsAnimals['!cols'] = [
        { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 },
      ];
      wsAnimals['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];
      XLSX.utils.book_append_sheet(wb, wsAnimals, 'Animales');

      // ── Guardar ──────────────────────────────────────────
      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const fileName = `reporte-venta-${data.saleEvent.saleDate}.xlsx`;
      saveAs(blob, fileName);

      this.notify.success('Excel descargado correctamente');
    } catch (err) {
      console.error('Error exportando Excel:', err);
      this.notify.error('Error al exportar Excel');
    } finally {
      this.exporting.set(false);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // EXPORT PDF
  // ══════════════════════════════════════════════════════════════

  async exportPdf(): Promise<void> {
    const data = this.summary();
    if (!data) return;

    this.exporting.set(true);

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit:        'mm',
        format:      'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 15;

      // ── Header ───────────────────────────────────────────
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('Ganadería Veracruz Y.P', 14, yPos);
      yPos += 7;

      doc.setFontSize(13);
      doc.text('Reporte de Venta', 14, yPos);
      yPos += 6;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(
        `${data.saleEvent.description} — ${data.saleEvent.saleDate}`,
        14,
        yPos
      );
      yPos += 4;

      doc.setFontSize(8);
      doc.text(
        `Comprador: ${data.saleEvent.buyer}  |  Total cabezas: ${data.saleEvent.totalHeads}`,
        14,
        yPos
      );
      yPos += 4;

      const dateStr = new Date().toLocaleDateString('es-CO', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
      doc.text(`Generado: ${dateStr}`, 14, yPos);
      yPos += 3;

      // Línea separadora
      doc.setDrawColor(226, 232, 240);
      doc.line(14, yPos, pageWidth - 14, yPos);
      yPos += 5;

      // ── Sección: Cifras generales ────────────────────────
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('CIFRAS GENERALES', 14, yPos);
      yPos += 4;

      autoTable(doc, {
        startY: yPos,
        theme: 'grid',
        head: [['Concepto', 'Valor']],
        body: [
          ['Peso total',    `${data.saleEvent.totalWeight} kg`],
          ['Precio por kg', formatCurrency(parseDecimal(data.saleEvent.pricePerKg))],
          ['Monto bruto',   formatCurrency(parseDecimal(data.saleEvent.grossAmount))],
          ['Costos',        formatCurrency(parseDecimal(data.saleEvent.saleCosts))],
          ['Monto neto',    formatCurrency(parseDecimal(data.saleEvent.netAmount))],
          ['Ganancia total', formatCurrency(this.totalProfitLoss())],
        ],
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
        margin: { left: 14, right: 14 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 8;

      // ── Sección: Detalle por inversionista ───────────────
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('DETALLE POR INVERSIONISTA', 14, yPos);
      yPos += 4;

      autoTable(doc, {
        startY: yPos,
        head: [[
          'Código',
          'Nombre',
          'Cabezas',
          'Venta neta',
          'Ganancia',
          '% Inv',
          'A recibir',
          'Decisión',
        ]],
        body: data.byInvestor.map((inv) => {
          const f = inv.financials;
          return [
            inv.investorCode,
            inv.investorName,
            inv.heads,
            f ? formatCurrency(parseDecimal(f.netSale))              : '—',
            f ? formatCurrency(parseDecimal(f.profitLoss))           : '—',
            f ? `${f.investorPct}%`                                  : '—',
            f ? formatCurrency(parseDecimal(f.investorReceivable))   : '—',
            this.decisionLabel(inv.decision.type),
          ];
        }),
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          2: { halign: 'center' },
          3: { halign: 'right' },
          4: { halign: 'right', fontStyle: 'bold' },
          5: { halign: 'center' },
          6: { halign: 'right', fontStyle: 'bold' },
          7: { halign: 'center' },
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (pageData: any) => {
          const pageH = doc.internal.pageSize.getHeight();
          doc.setFontSize(7);
          doc.setTextColor(148, 163, 184);
          doc.text(
            `Página ${pageData.pageNumber}`,
            pageWidth - 14,
            pageH - 8,
            { align: 'right' }
          );
        },
      });

      // sale-summary-report.component.ts - dentro de exportPdf()

// ── (después del autoTable de inversionistas) ────────────────

yPos = (doc as any).lastAutoTable.finalY + 10;

// Verificar espacio, sino nueva página
const pageH = doc.internal.pageSize.getHeight();
if (yPos > pageH - 60) {
  doc.addPage();
  yPos = 15;
}

// ── Sección: Detalle de animales por inversionista ──────────
doc.setFontSize(10);
doc.setFont('helvetica', 'bold');
doc.setTextColor(30, 41, 59);
doc.text('DETALLE DE ANIMALES VENDIDOS', 14, yPos);
yPos += 5;

data.byInvestor.forEach((inv, idx) => {
  // Verificar espacio para el grupo
  if (yPos > pageH - 50) {
    doc.addPage();
    yPos = 15;
  }

  // Header del inversionista
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(24, 95, 165);
  doc.text(`${inv.investorCode} — ${inv.investorName}`, 14, yPos);
  yPos += 4;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const infoText = inv.financials
    ? `${inv.heads} cabezas · Total bruto: ${formatCurrency(parseDecimal(inv.financials.grossSale))}`
    : `${inv.heads} cabezas`;
  doc.text(infoText, 14, yPos);
  yPos += 3;

  // Tabla de animales
  const totalWeight = this.getAnimalsTotalWeight(inv.animals);
  const totalGross  = this.getAnimalsTotalGross(inv.animals);

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Arete', 'Peso (kg)', 'Precio/kg', 'Valor bruto']],
    body: inv.animals.map((a, i) => [
      i + 1,
      a.tag,
      a.weight,
      formatCurrency(parseDecimal(a.pricePerKg)),
      formatCurrency(parseDecimal(a.grossAmount)),
    ]),
    foot: [[
      '',
      'TOTAL',
      totalWeight.toFixed(2),
      '',
      formatCurrency(totalGross),
    ]],
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize:  7,
    },
    footStyles: {
      fillColor: [248, 250, 252],
      textColor: [30, 41, 59],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'left' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
    theme: 'grid',
  });

  yPos = (doc as any).lastAutoTable.finalY + 6;
});

      // ── Guardar ──────────────────────────────────────────
      const fileName = `reporte-venta-${data.saleEvent.saleDate}.pdf`;
      doc.save(fileName);

      this.notify.success('PDF descargado correctamente');
    } catch (err) {
      console.error('Error exportando PDF:', err);
      this.notify.error('Error al exportar PDF');
    } finally {
      this.exporting.set(false);
    }
  }
}