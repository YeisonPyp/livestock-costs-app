import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { KpiCardComponent }       from '../../../../shared/components/display/kpi-card/kpi-card.component';
import { AmountDisplayComponent } from '../../../../shared/components/bills/amount-display/amount-display.component';
import { BadgeComponent }         from '../../../../shared/components/display/badge/badge.component';
import { ProgressBarComponent }   from '../../../../shared/components/display/progress-bar/progress-bar.component';
import { LoaderComponent }        from '../../../../shared/components/loader/loader.component';
import { EmptyStateComponent }    from '../../../../shared/components/empty-state/empty-state.component';
import { AlertComponent }         from '../../../../shared/components/display/alert/alert.component';

import { CostService }      from '../../services/cost.service';
import { CategoryService }  from '../../services/category.service';
import {
  CostTotals, MonthlyReport, MonthlyReportCategory,
  MonthlySummary, CategorySummary,
} from '../../models/cost.model';

interface MonthOption { label: string; year: number; month: number; }

@Component({
  selector: 'app-cost-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    KpiCardComponent, AmountDisplayComponent, BadgeComponent,
    ProgressBarComponent, LoaderComponent, EmptyStateComponent, AlertComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl:    './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private costSvc = inject(CostService);
  private catSvc  = inject(CategoryService);

  // ── Month navigation ───────────────────────────────────────────────────────
  months: MonthOption[] = this.buildMonths();
  monthIdx = signal(0);                     // 0 = current
  activeMonth = computed(() => this.months[this.monthIdx()]);

  // ── Data ───────────────────────────────────────────────────────────────────
  totals        = signal<CostTotals | null>(null);
  prevTotals    = signal<CostTotals | null>(null);
  ytd           = signal<{ total: number; count: number } | null>(null);
  monthReport   = signal<MonthlyReport | null>(null);
  summaryByCat  = signal<CategorySummary[]>([]);
  trendMonths   = signal<MonthlySummary[]>([]);
  activeCatCount = signal(0);

  loading     = signal(true);
  loadingKpis = signal(true);

  // ── Derived ────────────────────────────────────────────────────────────────
  topCategories = computed(() =>
    this.summaryByCat().slice(0, 6)
  );

  yoyChange = computed((): number | null => {
    const c = this.totals()?.total;
    const p = this.prevTotals()?.total;
    if (!p || p === 0) return null;
    return ((c! - p) / p) * 100;
  });

  trendMax = computed(() =>
    Math.max(...this.trendMonths().map(m => m.total), 1)
  );

  ngOnInit(): void { this.loadAll(); }

  private loadAll(): void {
    const { year, month } = this.activeMonth();
    this.loadingKpis.set(true);
    this.loading.set(true);

    // Totals for selected month
    this.costSvc.getTotals({ date_from: this.firstDay(year, month), date_to: this.lastDay(year, month) }).subscribe({
      next: (r) => { if (r.success) this.totals.set(r.data); this.loadingKpis.set(false); },
      error: () => this.loadingKpis.set(false),
    });

    // Totals for previous month (for comparison)
    const prev = this.months[this.monthIdx() + 1];
    if (prev) {
      this.costSvc.getTotals({ date_from: this.firstDay(prev.year, prev.month), date_to: this.lastDay(prev.year, prev.month) }).subscribe({
        next: (r) => { if (r.success) this.prevTotals.set(r.data); },
      });
    }

    // YTD
    this.costSvc.getYearToDate(year).subscribe({
      next: (r) => { if (r.success) this.ytd.set(r.data as any); },
    });

    // Monthly report (breakdown by category)
    this.costSvc.getMonthlyReport(year, month).subscribe({
      next: (r) => { if (r.success) this.monthReport.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });

    // Summary by category for donut/bars
    this.costSvc.getSummaryByCategory({
      date_from: this.firstDay(year, month),
      date_to:   this.lastDay(year, month),
    }).subscribe({
      next: (r) => { if (r.success) this.summaryByCat.set(r.data); },
    });

    // 12-month trend
    this.costSvc.getSummaryByMonth({ date_from: this.firstDay(year - 1, month + 1), date_to: this.lastDay(year, month) }).subscribe({
      next: (r) => { if (r.success) this.trendMonths.set(r.data.slice(-12)); },
    });

    // Active category count
    this.catSvc.getMovable().subscribe({
      next: (r) => { if (r.success) this.activeCatCount.set(r.data.length); },
    });
  }

  // ── Month nav ──────────────────────────────────────────────────────────────
  prevMonth(): void {
    if (this.monthIdx() < this.months.length - 1) {
      this.monthIdx.update(i => i + 1);
      this.loadAll();
    }
  }

  nextMonth(): void {
    if (this.monthIdx() > 0) {
      this.monthIdx.update(i => i - 1);
      this.loadAll();
    }
  }

  selectMonthIdx(i: number): void { this.monthIdx.set(i); this.loadAll(); }

  // ── Helpers ────────────────────────────────────────────────────────────────
  private buildMonths(): MonthOption[] {
    const now = new Date();
    return Array.from({ length: 13 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return {
        label: d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }),
        year:  d.getFullYear(),
        month: d.getMonth() + 1,
      };
    });
  }

  private firstDay(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}-01`;
  }

  private lastDay(year: number, month: number): string {
    const d = new Date(year, month, 0);
    return `${year}-${String(month).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  trendBarHeight(total: number): number {
    return Math.max((total / this.trendMax()) * 100, 2);
  }

  categoryBarWidth(total: number): number {
    const max = this.topCategories()[0]?.total ?? 1;
    return Math.max((total / max) * 100, 2);
  }

  formatCOP(n: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);
  }

  capitalize(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

  get yoyLabel(): string {
    const c = this.yoyChange();
    if (c === null) return '';
    const sign = c >= 0 ? '+' : '';
    return `${sign}${c.toFixed(1)}% vs mes anterior`;
  }

  get yoyColor(): 'danger' | 'success' {
    const c = this.yoyChange();
    return (c ?? 0) > 0 ? 'danger' : 'success';
  }
}