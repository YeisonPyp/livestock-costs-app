import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PageHeaderComponent }    from '../../../../../shared/components/page-header/page-header.component';
import { LoaderComponent }         from '../../../../../shared/components/loader/loader.component';
import { BadgeComponent }          from '../../../../../shared/components/display/badge/badge.component';
import { AlertComponent }          from '../../../../../shared/components/display/alert/alert.component';
import { AmountDisplayComponent }  from '../../../../../shared/components/bills/amount-display/amount-display.component';
import { EmptyStateComponent }     from '../../../../../shared/components/empty-state/empty-state.component';
import { KpiCardComponent }        from '../../../../../shared/components/display/kpi-card/kpi-card.component';
import { ConfirmDialogComponent }  from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';

import { SaleService } from '../../../services';
import { SaleEvent, SaleDecision, SALE_DECISION_TYPES } from '../../../models/investment.model';
import { formatCurrency, parseDecimal } from '../../../../../core/utils/helpers';

@Component({
  selector: 'app-sale-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, LoaderComponent, BadgeComponent, AlertComponent, AmountDisplayComponent, EmptyStateComponent, KpiCardComponent],
  templateUrl: './sale-detail.component.html',
  styleUrl:    './sale-detail.component.scss',
})
export class SaleDetailComponent implements OnInit {
  private route    = inject(ActivatedRoute);
  private saleSvc      = inject(SaleService);
  private dialog   = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  sale      = signal<SaleEvent | null>(null);
  decisions = signal<SaleDecision[]>([]);
  loading   = signal(true);
  finalizing = signal(false);

  formatCurrency = formatCurrency;
  parseDecimal = parseDecimal;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadAll(id);
  }

  private loadAll(id: string): void {
    this.loading.set(true);
    this.saleSvc.getSaleEvent(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.sale.set(res.data);
          this.loadDecisions(id);
        }
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.snackBar.open('Error al cargar la venta', 'Cerrar', { duration: 3000 }); },
    });
  }

  private loadDecisions(id: string): void {
    this.saleSvc.getSaleEventDecisions(id).subscribe({ next: (r) => { if (r.success) this.decisions.set(r.data); } });
  }

  confirmFinalize(): void {
    const sale = this.sale();
    if (!sale) return;

    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title:       'Finalizar Venta',
        message:     `¿Confirmas finalizar esta venta? Se procesarán todas las decisiones de los inversionistas. Esta acción no se puede deshacer.`,
        confirmText: 'Finalizar',
        type:        'primary',
      },
    }).afterClosed().subscribe(ok => {
      if (ok) this.finalizeSale(sale.id);
    });
  }

  private finalizeSale(id: string): void {
    this.finalizing.set(true);
    this.saleSvc.finalizeSaleEvent(id).subscribe({
      next: () => {
        this.finalizing.set(false);
        this.snackBar.open('Venta finalizada exitosamente', 'Cerrar', { duration: 3000 });
        this.loadAll(id);
      },
      error: (err) => {
        this.finalizing.set(false);
        this.snackBar.open(err?.error?.error || 'Error al finalizar', 'Cerrar', { duration: 4000 });
      },
    });
  }

  decisionColor(type: string): 'success' | 'danger' | 'warning' | 'secondary' {
    const m: Record<string, any> = { reinvest: 'success', withdraw: 'danger', partial: 'warning', pending: 'secondary' };
    return m[type] ?? 'secondary';
  }

  decisionLabel(type: string): string {
    return SALE_DECISION_TYPES.find(d => d.value === type)?.label ?? type;
  }

  get pendingCount(): number { return this.decisions().filter(d => d.decision_type === 'pending').length; }
  get processedCount(): number { return this.decisions().filter(d => d.is_processed).length; }
}