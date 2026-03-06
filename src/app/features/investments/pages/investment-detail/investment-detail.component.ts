import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { PageHeaderComponent }    from '../../../../shared/components/page-header/page-header.component';
import { LoaderComponent }         from '../../../../shared/components/loader/loader.component';
import { KpiCardComponent }        from '../../../../shared/components/display/kpi-card/kpi-card.component';
import { BadgeComponent }          from '../../../../shared/components/display/badge/badge.component';
import { AmountDisplayComponent }  from '../../../../shared/components/bills/amount-display/amount-display.component';
import { AlertComponent }          from '../../../../shared/components/display/alert/alert.component';
import { EmptyStateComponent }     from '../../../../shared/components/empty-state/empty-state.component';

import { InvestmentService } from '../../services/investment.service';
import { Investment, InvestmentMovement, CattleOwnership, MOVEMENT_TYPES } from '../../models/investment.model';
import { formatCurrency } from '../../../../core/utils/helpers';

@Component({
  selector: 'app-investment-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatTabsModule, ReactiveFormsModule,
    PageHeaderComponent, LoaderComponent, KpiCardComponent,
    BadgeComponent, AmountDisplayComponent, AlertComponent, EmptyStateComponent,
  ],
  templateUrl: './investment-detail.component.html',
  styleUrl:    './investment-detail.component.scss',
})
export class InvestmentDetailComponent implements OnInit {
  private route    = inject(ActivatedRoute);
  private fb       = inject(FormBuilder);
  private svc      = inject(InvestmentService);
  private snackBar = inject(MatSnackBar);

  investment = signal<Investment | null>(null);
  movements  = signal<InvestmentMovement[]>([]);
  cattle     = signal<CattleOwnership[]>([]);
  loading    = signal(true);

  // inline contribute/withdraw panel
  activePanel = signal<'contribute' | 'withdraw' | null>(null);
  panelForm!: FormGroup;
  panelSaving = signal(false);

  formatCurrency = formatCurrency;

  ngOnInit(): void {
    this.panelForm = this.fb.group({
      amount:      [null, [Validators.required, Validators.min(0.01)]],
      description: [''],
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadAll(id);
  }

  private loadAll(id: string): void {
    this.loading.set(true);
    this.svc.getInvestment(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.investment.set(res.data);
          this.loadMovements(id);
          this.loadCattle();
        }
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.snackBar.open('Error al cargar la inversión', 'Cerrar', { duration: 3000 }); },
    });
  }

  private loadMovements(id: string): void {
    this.svc.getMovements(id).subscribe({ next: (r) => { if (r.success) this.movements.set(r.data); } });
  }

  private loadCattle(): void {
    const invId = this.investment()?.id;
    if (!invId) return;
    this.svc.getCattleOwnerships({ investment: invId }).subscribe({ next: (r) => { if (r.success) this.cattle.set(r.data); } });
  }

  openPanel(type: 'contribute' | 'withdraw'): void {
    this.activePanel.set(type);
    this.panelForm.reset({ amount: null, description: type === 'contribute' ? 'Aporte de capital' : 'Retiro de capital' });
  }

  closePanel(): void { this.activePanel.set(null); }

  submitPanel(): void {
    if (this.panelForm.invalid) { this.panelForm.markAllAsTouched(); return; }
    const id = this.investment()?.id;
    if (!id) return;

    this.panelSaving.set(true);
    const type = this.activePanel()!;
    const payload = this.panelForm.value;

    const req$ = type === 'contribute'
      ? this.svc.contribute(id, payload)
      : this.svc.withdraw(id, payload);

    req$.subscribe({
      next: (res) => {
        this.panelSaving.set(false);
        this.snackBar.open(type === 'contribute' ? 'Aporte registrado' : 'Retiro procesado', 'Cerrar', { duration: 3000 });
        this.closePanel();
        this.loadAll(id);
      },
      error: (err) => {
        this.panelSaving.set(false);
        this.snackBar.open(err?.error?.error || 'Error al procesar', 'Cerrar', { duration: 4000 });
      },
    });
  }

  movementIsCredit(type: string): boolean {
    return ['contribution', 'reinvestment', 'dividend', 'sale_profit'].includes(type);
  }

  movementLabel(type: string): string {
    return MOVEMENT_TYPES.find(m => m.value === type)?.label ?? type;
  }

  movementColor(type: string): 'success' | 'danger' | 'warning' | 'info' | 'secondary' {
    const m = MOVEMENT_TYPES.find(x => x.value === type);
    return (m?.color as any) ?? 'secondary';
  }
}