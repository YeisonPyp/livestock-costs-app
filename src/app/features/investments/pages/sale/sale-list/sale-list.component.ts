// sale-list.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { LoaderComponent } from '../../../../../shared/components/loader/loader.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { KpiCardComponent } from '../../../../../shared/components/display/kpi-card/kpi-card.component';
import { BadgeComponent } from '../../../../../shared/components/display/badge/badge.component';
import { AmountDisplayComponent } from '../../../../../shared/components/bills/amount-display/amount-display.component';
import { AlertComponent } from '../../../../../shared/components/display/alert/alert.component';

import { WeightBulkImportComponent } from '../../../../cattle/pages/weights/weight-bulk-import/weight-bulk-import.component';
import { InvestmentService } from '../../../services/investment.service';
import { SaleEvent } from '../../../models/investment.model';
import { formatCurrency } from '../../../../../core/utils/helpers';
import { SaleCreateComponent } from '../sale-create/sale-create.component';

interface AnimalSelection {
  id: string;
  tag_number: string;
  name?: string;
  breed_name: string;
  current_weight: number;
  investor_code?: string;
}

@Component({
  selector: 'app-sale-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    LoaderComponent,
    EmptyStateComponent,
    KpiCardComponent,
    BadgeComponent,
    AmountDisplayComponent,
    AlertComponent,
    SaleCreateComponent,
  ],
  templateUrl: './sale-list.component.html',
  styleUrl: './sale-list.component.scss',
})
export class SaleListComponent implements OnInit {
  private svc = inject(InvestmentService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // ── State ─────────────────────────────────────────────────────────────────
  sales = signal<SaleEvent[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  totalPages = signal(1);

  // ── New Sale Form ─────────────────────────────────────────────────────────
  showDrawer = signal(false);  // ← reemplaza showNewForm
  openDrawer(): void  { this.showDrawer.set(true); }
  onSaleSaved(): void {
    this.showDrawer.set(false);
    this.load();
  }

  // ── Filters ───────────────────────────────────────────────────────────────
  filterFinalized = '';

  // ── Helpers ───────────────────────────────────────────────────────────────
  formatCurrency = formatCurrency;

  // ── Computed ──────────────────────────────────────────────────────────────
  stats = signal({ total: 0, pending: 0, totalNet: 0, totalHeads: 0 });

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.load();
  }

  // ── Data Loading ──────────────────────────────────────────────────────────
  load(): void {
    this.loading.set(true);
    const params: Record<string, any> = { page: this.currentPage() };
    
    if (this.filterFinalized !== '') {
      params['is_finalized'] = this.filterFinalized;
    }

    this.svc.getSales(params).subscribe({
      next: (res) => {
        if (res.success) {
          this.sales.set(res.data);
          this.totalPages.set(res.pagination?.total_pages ?? 1);
          this.calculateStats(res.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error al cargar ventas', 'Cerrar', { duration: 3000 });
      },
    });
  }

  private calculateStats(data: SaleEvent[]): void {
    this.stats.set({
      total: data.length,
      pending: data.filter(s => !s.is_finalized).length,
      totalNet: data.reduce((s, x) => s + +x.net_amount, 0),
      totalHeads: data.reduce((s, x) => s + x.total_heads, 0),
    });
  }

  // ── Pagination & Filters ──────────────────────────────────────────────────
  onFilterChange(): void {
    this.currentPage.set(1);
    this.load();
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.load();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private today(): string {
    return new Date().toISOString().split('T')[0];
  }

  formatWeight(value: number): string {
    return `${value.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;
  }
}