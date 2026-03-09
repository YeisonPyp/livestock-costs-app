import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { PageHeaderComponent }    from '../../../../shared/components/page-header/page-header.component';
import { KpiCardComponent }        from '../../../../shared/components/display/kpi-card/kpi-card.component';
import { AmountDisplayComponent }  from '../../../../shared/components/bills/amount-display/amount-display.component';
import { ProgressBarComponent }    from '../../../../shared/components/display/progress-bar/progress-bar.component';
import { BadgeComponent }          from '../../../../shared/components/display/badge/badge.component';
import { LoaderComponent }         from '../../../../shared/components/loader/loader.component';
import { EmptyStateComponent }     from '../../../../shared/components/empty-state/empty-state.component';
import { AlertComponent }          from '../../../../shared/components/display/alert/alert.component';

import { CostService }         from '../../services/cost.service';
import { CategoryService }     from '../../services/category.service';
import {
  CostTotals, CategorySummary, MonthlySummary, Cost, Category,
} from '../../models/cost.model';

@Component({
  selector: 'app-cost-reports',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    PageHeaderComponent, KpiCardComponent, AmountDisplayComponent,
    ProgressBarComponent, BadgeComponent, LoaderComponent, EmptyStateComponent, AlertComponent,
  ],
  templateUrl: './reports.component.html',
  styleUrl:    './reports.component.scss',
})
export class ReportsComponent implements OnInit {
  private costSvc = inject(CostService);
  private catSvc  = inject(CategoryService);

  // ── Filters ────────────────────────────────────────────────────────────────
  startDate = '';
  endDate   = '';

  // ── Data ───────────────────────────────────────────────────────────────────
  totals       = signal<CostTotals | null>(null);
  byCat        = signal<CategorySummary[]>([]);
  byMonth      = signal<MonthlySummary[]>([]);
  entries      = signal<Cost[]>([]);
  categories   = signal<Category[]>([]);

  loading      = signal(false);
  error        = signal('');
  generated    = signal(false);

  // ── Derived ────────────────────────────────────────────────────────────────
  entriesByMonth = computed(() => {
    const map = new Map<string, Cost[]>();
    for (const e of this.entries()) {
      const key = e.date.slice(0, 7);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  });

  catMaxTotal = computed(() => Math.max(...this.byCat().map(c => c.total), 1));

  ngOnInit(): void {
    // Default: current month
    const now = new Date();
    this.startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}-01`;
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.endDate = last.toISOString().split('T')[0];

    this.catSvc.getAll().subscribe({
      next: (r) => { if (r.success) this.categories.set(r.data); },
    });

    this.generate();
  }

  generate(): void {
    if (!this.startDate || !this.endDate) { this.error.set('Selecciona ambas fechas'); return; }
    if (this.startDate > this.endDate) { this.error.set('La fecha inicio no puede ser mayor que la final'); return; }

    this.loading.set(true);
    this.error.set('');
    this.generated.set(false);

    const f = { date_from: this.startDate, date_to: this.endDate };

    // Fire all in parallel
    let pending = 3;
    const done = () => { if (--pending === 0) { this.loading.set(false); this.generated.set(true); } };

    this.costSvc.getTotals(f).subscribe({ next: (r) => { if (r.success) this.totals.set(r.data); done(); }, error: done });
    this.costSvc.getSummaryByCategory(f).subscribe({ next: (r) => { if (r.success) this.byCat.set(r.data); done(); }, error: done });
    this.costSvc.getAll({ ...f, page_size: 200 }).subscribe({ next: (r) => { if (r.success) this.entries.set(r.data); done(); }, error: done });
  }

  reset(): void {
    const now = new Date();
    this.startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}-01`;
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    this.endDate = last.toISOString().split('T')[0];
    this.generate();
  }

  // ── Export ────────────────────────────────────────────────────────────────
  exportExcel(): void {
    window.open(this.costSvc.exportExcelUrl({ date_from: this.startDate, date_to: this.endDate }), '_blank');
  }

  exportPdf(): void {
    window.open(this.costSvc.exportPdfUrl({ date_from: this.startDate, date_to: this.endDate }), '_blank');
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  catName(id: number): string {
    return this.categories().find(c => c.id === id)?.name ?? '—';
  }

  catColor(id: number): string {
    return this.categories().find(c => c.id === id)?.color ?? '#94a3b8';
  }

  monthLabel(key: string): string {
    const [y, m] = key.split('-');
    return new Date(+y, +m - 1, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  }

  formatDate(d: string): string {
    return new Date(d + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  monthTotal(entries: Cost[]): number {
    return entries.reduce((s, e) => s + e.amount, 0);
  }
}