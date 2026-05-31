import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../../../../core/services/notification.service';
import { CostService } from '../../../costs/services/cost.service';
import {
  EmployeeFormDialogComponent,
  EmployeeDialogData,
} from '../employee-form-dialog/employee-form-dialog.component';

import { FarmService } from '../../services/farm.service';
import { Farm, FarmSummary, Employee, EMPLOYEE_ROLES,} from '../../models/farm.model';
import { formatNumber } from '../../../../core/utils/helpers';
import { CostFilters } from '../../../costs/models/cost.model';
import { PageHeaderComponent } from '../../../../shared/components/navigation/page-header/page-header.component';
import { LoaderComponent } from '../../../../shared/components/feedback/loader/loader.component';
import { TableColumn, TableComponent, TableConfig } from '../../../../shared/components/data-display/table/table.component';
import { EmptyStateComponent } from '../../../../shared/components/feedback/empty-state/empty-state.component';
import { ProgressBarComponent } from '../../../../shared/components/ui/progress-bar/progress-bar.component';
import { BadgeComponent } from '../../../../shared/components/ui/badge/badge.component';
import { StatsCardComponent } from '../../../../shared/components/data-display/stats-card/stats-card.component';
import { ExportReportModalComponent } from '../../../../shared/components/overlays/export-report-modal/export-report-modal.component';
import { ExportReportPayload, ExportReportConfig  } from '../../../../shared/components/overlays/export-report-modal/export-report-modal.types';


@Component({
  selector: 'app-farm-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTabsModule,
    PageHeaderComponent,
    LoaderComponent,
    StatsCardComponent,
    BadgeComponent,
    ProgressBarComponent,
    EmptyStateComponent,
    TableComponent,
    ExportReportModalComponent,
  ],
  templateUrl: './farm-detail.component.html',
  styleUrl:    './farm-detail.component.scss',
})
export class FarmDetailComponent implements OnInit {
  private route       = inject(ActivatedRoute);
  private farmService = inject(FarmService);
  private dialog      = inject(MatDialog);
  private notiService = inject(NotificationService);
  private costSvc     = inject(CostService);

  farm      = signal<Farm | null>(null);
  summary   = signal<FarmSummary | null>(null);
  employees = signal<Employee[]>([]);
  loading   = signal(true);
  startDate = '';
  endDate   = '';

  private activeFilters(): Partial<CostFilters> {
    const farmId = this.farm()?.id;

    return {
      farm_id: farmId
    };
  }

  formatNumber = formatNumber;

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadFarm(id);
  }

  // ── Data loaders ───────────────────────────────────────────────────────────
  private loadFarm(id: string): void {
    this.loading.set(true);
    this.farmService.getById(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.farm.set(res.data);
          this.loadSummary(id);
          this.loadEmployees(id);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notiService.error('Error al cargar la finca',);
      },
    });
  }

  private loadSummary(id: string): void {
    this.farmService.getSummary(id).subscribe({
      next: (res) => { if (res.success) this.summary.set(res.data); },
    });
  }

  private loadEmployees(id: string): void {
    this.farmService.getEmployeesFarm(id).subscribe({
      next: (res) => {
        if (res.success) this.employees.set(res.data);
      },
    });
  }

  // ── Table config ───────────────────────────────────────────────────────────
  tableConfig: TableConfig = {
    searchable:       false,
    paginated:        false,
    striped:          true,
    hover:            true,
    bordered:         false,
    compact:          false,
  };

  columns: TableColumn[] = [
    { key: 'full_name',    label: 'Nombre'                                                           },
    { key: 'role',         label: 'Rol',          format: (v) => this.getEmployeeRoleLabel(v)        },
    { key: 'job_title',    label: 'Cargo',         format: (v) => v || '—'                           },
    { key: 'hire_date',    label: 'Ingreso',       type: 'date'                                      },
    { key: 'tenure_years', label: 'Antigüedad',    format: (v) => `${v} año${v !== 1 ? 's' : ''}`   },
    { key: 'lives_on_farm',label: 'Vive en Finca', format: (v) => v ? 'Sí' : 'No', align: 'center' },
    { key: 'status',       label: 'Estado',        type: 'badge',
      badgeColor: (v) => v === 'active' ? 'success' : 'danger',
      format:     (v) => v === 'active' ? 'Activo'  : 'Retirado'
    },
  ];

  // ── Label helpers ──────────────────────────────────────────────────────────
  getEmployeeRoleLabel(role: string): string {
    return EMPLOYEE_ROLES.find(r => r.value === role)?.label ?? role;
  }

  employeeStatusColor(status: string): 'success' | 'danger' | 'secondary' {
    return status === 'active' ? 'success' : status === 'terminated' ? 'danger' : 'secondary';
  }

  // ── Employee dialog openers ────────────────────────────────────────────────
  openAddEmployee(): void {
    const farmId = this.farm()?.id;
    if (!farmId) return;

    this.dialog
      .open(EmployeeFormDialogComponent, {
        data: { farmId } as EmployeeDialogData,
        width: '560px',
        disableClose: true,
      })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) this.loadEmployees(farmId);
      });
  }

  openEditEmployee(emp: Employee): void {
    const farmId = this.farm()?.id;
    if (!farmId) return;

    this.dialog
      .open(EmployeeFormDialogComponent, {
        data: { farmId, employee: emp } as EmployeeDialogData,
        width: '560px',
        disableClose: true,
      })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) this.loadEmployees(farmId);
      });
  }

  openTerminateEmployee(emp: Employee): void {
    const farmId = this.farm()?.id;
    if (!farmId) return;

    this.dialog
      .open(EmployeeFormDialogComponent, {
        data: { farmId, employee: emp, terminate: true } as EmployeeDialogData,
        width: '520px',
        disableClose: true,
      })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) this.loadEmployees(farmId);
      });
  }

  // ── Export ──────────────────────────────────────────────────────────────────

  // ── Estado modal ───────────────────────────────────────────────────────────
  showExport = signal(false);

  readonly exportConfig: ExportReportConfig = {
    title: 'Exportar Reporte de Costos',
    subtitle: 'Seleccione el rango de fechas o exporte toda la información.',
    showExcel: true,
    showPdf: true,
    allDataLabel: 'Traer toda la información',
  };

  activeFiltersCosts = computed<Partial<CostFilters>>(() => {
    const filters: Partial<CostFilters> = {};
    const farmId = this.farm()?.id;

    if (farmId) filters.farm_id = farmId;
    if (this.startDate) filters.start_date = this.startDate;
    if (this.endDate) filters.end_date = this.endDate;

    return filters;
  });

  onExport(payload: ExportReportPayload): void {
    const filters = this.buildExportFilters(payload);

    const request$ =
      payload.format === 'excel'
        ? this.costSvc.exportExcel(filters)
        : this.costSvc.exportPdf(filters);

    const fileName =
      payload.format === 'excel'
        ? 'reporte_costos.xlsx'
        : 'reporte_costos.pdf';

    const mimeType =
      payload.format === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf';

    request$.subscribe({
      next: (blob) => this.downloadFile(blob, fileName, mimeType),
      error: (error) => {
        console.error('Error exportando reporte de costos', error);
      },
    });
  }

  private buildExportFilters(payload: ExportReportPayload): Partial<CostFilters> {
    const filters: Partial<CostFilters> = {
      ...this.activeFilters(),
    };

    // El rango de fechas del modal debe tener prioridad
    delete filters.start_date;
    delete filters.end_date;

    if (!payload.allData) {
      filters.start_date = payload.startDate!;
      filters.end_date = payload.endDate!;
    }

    return filters;
  }

  private downloadFile(blob: Blob, fileName: string, mimeType: string): void {
    const file = new Blob([blob], { type: mimeType });
    const url = window.URL.createObjectURL(file);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  }


  exportExcel(): void {
    this.costSvc.exportExcel(this.activeFilters()).subscribe((blob) => {
      const file = new Blob([blob]);
      const url = window.URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reporte_costos.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  exportPdf(): void {
    this.costSvc.exportPdf(this.activeFilters()).subscribe((blob) => {
      const file = new Blob([blob], { type: 'application/pdf' });

      const url = window.URL.createObjectURL(file);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'reporte_costos.pdf';
      a.click();

      window.URL.revokeObjectURL(url);
    });
  }
}