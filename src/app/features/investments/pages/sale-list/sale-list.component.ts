// sale-list.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PageHeaderComponent }   from '../../../../shared/components/page-header/page-header.component';
import { LoaderComponent }        from '../../../../shared/components/loader/loader.component';
import { EmptyStateComponent }    from '../../../../shared/components/empty-state/empty-state.component';
import { KpiCardComponent }       from '../../../../shared/components/display/kpi-card/kpi-card.component';
import { BadgeComponent }         from '../../../../shared/components/display/badge/badge.component';
import { AmountDisplayComponent } from '../../../../shared/components/bills/amount-display/amount-display.component';

import { InvestmentService } from '../../services/investment.service';
import { SaleEvent } from '../../models/investment.model';
import { formatCurrency } from '../../../../core/utils/helpers';

@Component({
  selector: 'app-sale-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule, PageHeaderComponent, LoaderComponent, EmptyStateComponent, KpiCardComponent, BadgeComponent, AmountDisplayComponent],
  templateUrl: './sale-list.component.html',
  styleUrl:    './sale-list.component.scss',
})
export class SaleListComponent implements OnInit {
  private svc      = inject(InvestmentService);
  private fb       = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  sales       = signal<SaleEvent[]>([]);
  loading     = signal(true);
  currentPage = signal(1);
  totalPages  = signal(1);

  showNewForm  = signal(false);
  savingNew    = signal(false);
  newForm!: FormGroup;

  filterFinalized = '';
  formatCurrency = formatCurrency;

  stats = signal({ total: 0, pending: 0, totalNet: 0, totalHeads: 0 });

  ngOnInit(): void {
    this.buildNewForm();
    this.load();
  }

  private buildNewForm(): void {
    this.newForm = this.fb.group({
      sale_date:    [this.today(), Validators.required],
      description:  ['', Validators.required],
      buyer_name:   [''],
      total_heads:  [null, [Validators.required, Validators.min(1)]],
      total_weight: [null, [Validators.required, Validators.min(0.01)]],
      price_per_kg: [null, [Validators.required, Validators.min(0.01)]],
      gross_amount: [{ value: null, disabled: true }],
      sale_costs:   [0, Validators.min(0)],
      notes:        [''],
    });

    // Auto-calcular monto bruto
    this.newForm.get('total_weight')?.valueChanges.subscribe(() => this.recalcGross());
    this.newForm.get('price_per_kg')?.valueChanges.subscribe(() => this.recalcGross());
  }

  private recalcGross(): void {
    const w = +this.newForm.get('total_weight')?.value || 0;
    const p = +this.newForm.get('price_per_kg')?.value || 0;
    this.newForm.get('gross_amount')?.setValue((w * p).toFixed(2), { emitEvent: false });
  }

  load(): void {
    this.loading.set(true);
    const params: Record<string, any> = { page: this.currentPage() };
    if (this.filterFinalized !== '') params['is_finalized'] = this.filterFinalized;

    this.svc.getSales(params).subscribe({
      next: (res) => {
        if (res.success) {
          this.sales.set(res.data);
          this.totalPages.set(res.pagination?.total_pages ?? 1);
          this.stats.set({
            total:      res.data.length,
            pending:    res.data.filter(s => !s.is_finalized).length,
            totalNet:   res.data.reduce((s, x) => s + +x.net_amount, 0),
            totalHeads: res.data.reduce((s, x) => s + x.total_heads, 0),
          });
        }
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.snackBar.open('Error al cargar ventas', 'Cerrar', { duration: 3000 }); },
    });
  }

  onFilterChange(): void { this.currentPage.set(1); this.load(); }
  goToPage(p: number): void { this.currentPage.set(p); this.load(); }

  submitNew(): void {
    if (this.newForm.invalid) { this.newForm.markAllAsTouched(); return; }
    this.savingNew.set(true);

    const raw = this.newForm.getRawValue();
    const w = +raw.total_weight, p = +raw.price_per_kg;
    const payload = { ...raw, gross_amount: (w * p).toFixed(2) };

    this.svc.createSale(payload).subscribe({
      next: (res) => {
        this.savingNew.set(false);
        this.snackBar.open('Venta registrada exitosamente', 'Cerrar', { duration: 3000 });
        this.showNewForm.set(false);
        this.load();
      },
      error: (err) => {
        this.savingNew.set(false);
        this.snackBar.open(err?.error?.message || 'Error al registrar la venta', 'Cerrar', { duration: 4000 });
      },
    });
  }

  private today(): string { return new Date().toISOString().split('T')[0]; }
}