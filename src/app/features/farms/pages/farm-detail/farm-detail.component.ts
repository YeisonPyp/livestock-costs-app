import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog } from '@angular/material/dialog';

import { PageHeaderComponent }   from '../../../../shared/components/page-header/page-header.component';
import { LoaderComponent }        from '../../../../shared/components/loader/loader.component';
import { StatsCardComponent }     from '../../../../shared/components/stats-card/stats-card.component';
import { BadgeComponent }         from '../../../../shared/components/display/badge/badge.component';
import { ProgressBarComponent }   from '../../../../shared/components/display/progress-bar/progress-bar.component';
import { DropdownMenuComponent, DropdownItem } from '../../../../shared/components/display/dropdown-menu/dropdown-menu.component';
import { EmptyStateComponent }    from '../../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { NotificationService } from '../../../../core/services/notification.service';

import {
  EmployeeFormDialogComponent,
  EmployeeDialogData,
} from '../employee-form-dialog/employee-form-dialog.component';

import { FarmService } from '../../services/farm.service';
import {
  Farm, FarmSummary, Paddock, Employee,
  PADDOCK_STATUS, EMPLOYEE_ROLES,
} from '../../models/farm.model';
import { formatNumber } from '../../../../core/utils/helpers';

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
    DropdownMenuComponent,
    EmptyStateComponent,
  ],
  templateUrl: './farm-detail.component.html',
  styleUrl:    './farm-detail.component.scss',
})
export class FarmDetailComponent implements OnInit {
  private route       = inject(ActivatedRoute);
  private farmService = inject(FarmService);
  private dialog      = inject(MatDialog);
  private notiService = inject(NotificationService);

  farm      = signal<Farm | null>(null);
  summary   = signal<FarmSummary | null>(null);
  paddocks  = signal<Paddock[]>([]);
  employees = signal<Employee[]>([]);
  loading   = signal(true);

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
          this.loadPaddocks(id);
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

  private loadPaddocks(id: string): void {
    // this.farmService.getPaddocks(id).subscribe({
    //   next: (res) => { if (res.success) this.paddocks.set(res.data); },
    // });
  }

  private loadEmployees(id: string): void {
    // this.farmService.getEmployees(id).subscribe({
    //   next: (res) => { if (res.success) this.employees.set(res.data); },
    // });
  }

  // ── Label helpers ──────────────────────────────────────────────────────────
  getPaddockStatusLabel(status: string): string {
    return PADDOCK_STATUS.find(s => s.value === status)?.label ?? status;
  }

  getEmployeeRoleLabel(role: string): string {
    return EMPLOYEE_ROLES.find(r => r.value === role)?.label ?? role;
  }

  paddockStatusColor(status: string): 'success' | 'danger' | 'warning' | 'info' | 'secondary' {
    const map: Record<string, any> = {
      available:   'success',
      occupied:    'info',
      resting:     'warning',
      maintenance: 'danger',
    };
    return map[status] ?? 'secondary';
  }

  employeeStatusColor(status: string): 'success' | 'danger' | 'secondary' {
    return status === 'active' ? 'success' : status === 'terminated' ? 'danger' : 'secondary';
  }

  // ── Dropdown actions per employee ─────────────────────────────────────────
  employeeActions(emp: Employee): DropdownItem[] {
    return [
      {
        label: 'Editar',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
               </svg>`,
        action: () => this.openEditEmployee(emp),
      },
      { label: '', divider: true } as any,
      {
        label: 'Retirar empleado',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="17" y1="8" x2="23" y2="14"/>
                <line x1="23" y1="8" x2="17" y2="14"/>
               </svg>`,
        color: 'danger',
        disabled: emp.status !== 'active',
        action: () => this.openTerminateEmployee(emp),
      },
    ];
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

  // ── Paddock form (placeholder) ─────────────────────────────────────────────
  openPaddockForm(): void {
    // TODO: Implement paddock dialog
  }
}