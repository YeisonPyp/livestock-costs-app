import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { debounceTime, Subject } from 'rxjs';
import { SelectOption } from '../../../../shared/components/forms/select-field/select-field.component';

import { FarmService } from '../../services/farm.service';
import { Farm, FARM_TYPES, FARM_STATUS } from '../../models/farm.model';
import { formatNumber } from '../../../../core/utils/helpers';
import { NotificationService } from '../../../../core/services/notification.service';
import { PageHeaderComponent } from '../../../../shared/components/navigation/page-header/page-header.component';
import { LoaderComponent } from '../../../../shared/components/feedback/loader/loader.component';
import { KpiCardComponent } from '../../../../shared/components/data-display/kpi-card/kpi-card.component';
import { EmptyStateComponent } from '../../../../shared/components/feedback/empty-state/empty-state.component';
import { BadgeComponent } from '../../../../shared/components/ui/badge/badge.component';
import { ConfirmDialogComponent } from '../../../../shared/components/feedback/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-farm-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    PageHeaderComponent,
    LoaderComponent,
    EmptyStateComponent,
    KpiCardComponent,
    BadgeComponent,
  ],
  templateUrl: './farm-list.component.html',
  styleUrl:    './farm-list.component.scss',
})
export class FarmListComponent implements OnInit {
  private farmService = inject(FarmService);
  private dialog      = inject(MatDialog);
  private notiService = inject(NotificationService);

  farms        = signal<Farm[]>([]);
  loading      = signal(true);
  currentPage  = signal(1);
  totalPages   = signal(1);
  totalCount   = signal(0);

  searchTerm   = '';
  statusFilter = '';
  typeFilter   = '';

  private search$ = new Subject<void>();

  farmTypeOptions:   SelectOption[] = [{ label: 'Todos los tipos',   value: '' }, ...FARM_TYPES];
  farmStatusOptions: SelectOption[] = [{ label: 'Todos los estados', value: '' }, ...FARM_STATUS];

  stats = signal({ totalFarms: 0, totalArea: 0, totalCattle: 0, availableCapacity: 0 });

  formatNumber = formatNumber;
  

  ngOnInit(): void {
    this.search$.pipe(debounceTime(350)).subscribe(() => this.loadFarms());
    this.loadFarms();
  }

  loadFarms(): void {
    this.loading.set(true);
    const params: Record<string, any> = { page: this.currentPage() };
    if (this.searchTerm)   params['search']    = this.searchTerm;
    if (this.statusFilter) params['status']    = this.statusFilter;
    if (this.typeFilter)   params['farm_type'] = this.typeFilter;

    this.farmService.getAll(params).subscribe({
      next: (res) => {
        if (res.success) {
          this.farms.set(res.data);
          this.totalCount.set(res.pagination?.count ?? res.data.length);
          this.totalPages.set(res.pagination?.total_pages ?? 1);
          this.calculateStats(res.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notiService.error('Error al cargar las fincas', );
      },
    });
  }

  private calculateStats(farms: Farm[]): void {
    this.stats.set({
      totalFarms:        farms.length,
      totalArea: farms.reduce((s, f) => s + Number(f.total_area || 0), 0),
      totalCattle:       farms.reduce((s, f) => s + f.current_cattle_count, 0),
      availableCapacity: farms.reduce((s, f) => s + f.available_capacity, 0),
    });
  }

  onSearch(): void { this.currentPage.set(1); this.search$.next(); }
  onFilterChange(): void { this.currentPage.set(1); this.loadFarms(); }
  goToPage(page: number): void { this.currentPage.set(page); this.loadFarms(); }
  clearFilters(): void { this.searchTerm = ''; this.statusFilter = ''; this.typeFilter = ''; this.onFilterChange(); }

  get hasFilters(): boolean { return !!(this.searchTerm || this.statusFilter || this.typeFilter); }

  getStatusLabel(s: string): string { return FARM_STATUS.find(x => x.value === s)?.label ?? s; }
  getTypeLabel(t: string):   string { return FARM_TYPES.find(x => x.value === t)?.label ?? t; }

  statusBadgeColor(s: string): 'success' | 'warning' | 'danger' {
    return s === 'active' ? 'success' : s === 'leased' ? 'warning' : 'danger';
  }

  confirmDelete(farm: Farm): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title:       'Eliminar Finca',
        message:     `¿Eliminar la finca "${farm.name}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        type:        'danger',
      },
    }).afterClosed().subscribe(ok => {
      if (ok) this.deleteFarm(farm.id);
    });
  }

  private deleteFarm(id: string): void {
    this.farmService.delete(id).subscribe({
      next: () => {
        this.notiService.success('Finca eliminada', );
        this.loadFarms();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Error al eliminar la finca';
        this.notiService.error(msg, );
      },
    });
  }
}