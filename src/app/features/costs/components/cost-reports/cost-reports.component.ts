import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CostReportService } from '../../services/cost-report.service';
import { MonthlyReport } from '../../models/monthly-report.interface';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { TableComponent, TableColumn, TableConfig } from '../../../../shared/components/table/table.component';

interface ApiResponse {
  success: boolean;
  message: string;
  data: MonthlyReport[];
}

@Component({
  selector: 'app-cost-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, TableComponent, ButtonComponent],
  templateUrl: './cost-reports.component.html',
  styleUrls: ['./cost-reports.component.scss']
})
export class CostReportsComponent implements OnInit {
  startDate: string = '';
  endDate: string = '';
  reports: MonthlyReport[] = [];
  loading = false;
  errorMessage: string = '';
  
  // Configuración de columnas para la tabla
  tableColumns: TableColumn[] = [
    {
      key: 'date',
      label: 'Fecha',
      sortable: true,
      type: 'date',
      width: '120px'
    },
    {
      key: 'description',
      label: 'Descripción',
      sortable: true,
      type: 'text'
    },
    {
      key: 'amount',
      label: 'Monto',
      sortable: true,
      type: 'currency',
      align: 'right',
      width: '150px'
    },
    {
      key: 'category',
      label: 'Categoría',
      sortable: true,
      type: 'badge',
      width: '150px',
      badgeColor: (value: string) => this.getCategoryColor(value)
    },
    {
      key: 'total',
      label: 'Total Acumulado',
      sortable: true,
      type: 'currency',
      align: 'right',
      width: '170px'
    }
  ];

  // Configuración de la tabla
  tableConfig: TableConfig = {
    selectable: false,
    searchable: true,
    paginated: true,
    pageSize: 10,
    striped: true,
    hover: true,
    bordered: false,
    compact: false
  };

  constructor(private reportService: CostReportService) {}

  ngOnInit(): void {
    this.setDefaultDates();
  }

  /**
   * Establece fechas por defecto (mes actual)
   */
  private setDefaultDates(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    this.startDate = this.formatDate(firstDay);
    this.endDate = this.formatDate(lastDay);
  }

  /**
   * Formatea una fecha al formato YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Valida que las fechas sean correctas
   */
  private validateDates(): boolean {
    if (!this.startDate || !this.endDate) {
      this.errorMessage = 'Por favor selecciona ambas fechas';
      return false;
    }

    if (new Date(this.startDate) > new Date(this.endDate)) {
      this.errorMessage = 'La fecha inicial no puede ser mayor que la fecha final';
      return false;
    }

    this.errorMessage = '';
    return true;
  }

  /**
   * Genera el reporte con las fechas seleccionadas
   */
  generateReport(): void {
    if (!this.validateDates()) return;

    this.loading = true;
    this.errorMessage = '';
    
    this.reportService.getMonthlyReport(this.startDate, this.endDate)
      .subscribe({
        next: (response: ApiResponse) => {
          if (response.success) {
            this.reports = response.data || [];
            
            if (this.reports.length === 0) {
              this.errorMessage = 'No se encontraron datos para el período seleccionado';
            }
          } else {
            this.errorMessage = response.message || 'Error al generar el reporte';
            this.reports = [];
          }
        },
        error: (error) => {
          console.error('Error al generar reporte:', error);
          this.errorMessage = error.error?.message || 'Error al generar el reporte. Por favor intenta de nuevo.';
          this.reports = [];
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
  }

  /**
   * Descarga el reporte en formato PDF
   */
  downloadPdf(): void {
    if (!this.validateDates()) return;
    if (this.reports.length === 0) {
      this.errorMessage = 'No hay datos para descargar';
      return;
    }

    this.reportService.downloadPdf(this.startDate, this.endDate)
      .subscribe({
        next: (blob) => {
          const filename = `reporte_gastos_${this.startDate}_${this.endDate}.pdf`;
          this.downloadFile(blob, filename);
        },
        error: (error) => {
          console.error('Error al descargar PDF:', error);
          this.errorMessage = 'Error al descargar el PDF. Por favor intenta de nuevo.';
        }
      });
  }

  /**
   * Descarga el reporte en formato Excel
   */
  downloadExcel(): void {
    if (!this.validateDates()) return;
    if (this.reports.length === 0) {
      this.errorMessage = 'No hay datos para descargar';
      return;
    }

    this.reportService.downloadExcel(this.startDate, this.endDate)
      .subscribe({
        next: (blob) => {
          const filename = `reporte_gastos_${this.startDate}_${this.endDate}.xlsx`;
          this.downloadFile(blob, filename);
        },
        error: (error) => {
          console.error('Error al descargar Excel:', error);
          this.errorMessage = 'Error al descargar el Excel. Por favor intenta de nuevo.';
        }
      });
  }

  /**
   * Maneja la descarga de archivos
   */
  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Retorna el color del badge según la categoría
   */
  getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      'Alimentación': 'success',
      'Transporte': 'info',
      'Servicios': 'warning',
      'Entretenimiento': 'primary',
      'Salud': 'danger',
      'Educación': 'secondary',
      'Ejemplo 1': 'primary',
      'Ejemplo 2': 'info',
      'Ejemplo 3': 'success',
      'Otros': 'default'
    };
    return colors[category] || 'default';
  }

  /**
   * Calcula el total general de todos los reportes
   */
  get totalGeneral(): number {
    return this.reports.reduce((sum, report) => sum + (report.total || 0), 0);
  }

  /**
   * Calcula el total de entradas de todos los meses
   */
  get totalEntries(): number {
    return this.reports.reduce((sum, report) => sum + (report.entries?.length || 0), 0);
  }

  /**
   * Retorna todas las entradas de todos los meses
   */
  getAllEntries(): any[] {
    return this.reports.flatMap(report => report.entries || []);
  }

  /**
   * Formatea el mes para mostrar (de YYYY-MM a formato legible)
   */
  formatMonthDisplay(month: string): string {
    if (!month) return '';
    
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    
    return date.toLocaleDateString('es-CO', { 
      year: 'numeric', 
      month: 'long' 
    });
  }

  /**
   * Maneja el evento de clic en una fila
   */
  onRowClick(row: any): void {
    console.log('Fila seleccionada:', row);
    // Aquí puedes agregar lógica adicional, como abrir un modal con detalles
  }

  /**
   * Limpia los filtros y reportes
   */
  clearReport(): void {
    this.reports = [];
    this.errorMessage = '';
    this.setDefaultDates();
  }

  /**
   * Cierra el mensaje de error
   */
  closeError(): void {
    this.errorMessage = '';
  }
}