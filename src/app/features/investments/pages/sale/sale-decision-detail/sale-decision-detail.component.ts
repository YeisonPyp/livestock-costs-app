import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PageHeaderComponent }    from '../../../../../shared/components/page-header/page-header.component';
import { LoaderComponent }         from '../../../../../shared/components/loader/loader.component';
import { BadgeComponent }          from '../../../../../shared/components/display/badge/badge.component';
import { AlertComponent }          from '../../../../../shared/components/display/alert/alert.component';
import { AmountDisplayComponent }  from '../../../../../shared/components/bills/amount-display/amount-display.component';

import { InvestmentService } from '../../../services/investment.service';
import { SaleDecision, SALE_DECISION_TYPES } from '../../../models/investment.model';
import { formatCurrency } from '../../../../../core/utils/helpers';

@Component({
  selector: 'app-sale-decision-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, PageHeaderComponent, LoaderComponent, BadgeComponent, AlertComponent, AmountDisplayComponent],
  templateUrl: './sale-decision-detail.component.html',
  styleUrl:    './sale-decision-detail.component.scss',
})
export class SaleDecisionDetailComponent implements OnInit {
  private route    = inject(ActivatedRoute);
  private router   = inject(Router);
  private fb       = inject(FormBuilder);
  private svc      = inject(InvestmentService);
  private snackBar = inject(MatSnackBar);

  decision = signal<SaleDecision | null>(null);
  loading  = signal(true);
  saving   = signal(false);

  selectedType = signal<'reinvest' | 'withdraw' | 'partial' | null>(null);
  partialForm!: FormGroup;

  formatCurrency = formatCurrency;
  SALE_DECISION_TYPES = SALE_DECISION_TYPES;

  ngOnInit(): void {
    this.partialForm = this.fb.group({
      reinvest_amount: [0, [Validators.required, Validators.min(0)]],
      withdraw_amount: [{ value: 0, disabled: true }],
    });

    // Auto-calcular el otro campo en parcial
    this.partialForm.get('reinvest_amount')?.valueChanges.subscribe(v => {
      const total = +(this.decision()?.investor_amount ?? 0);
      const reinvest = +v || 0;
      this.partialForm.get('withdraw_amount')?.setValue(Math.max(0, total - reinvest).toFixed(2), { emitEvent: false });
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadDecision(id);
  }

  private loadDecision(id: string): void {
    this.loading.set(true);
    this.svc.getSaleDecision(id).subscribe({
      next: (res) => {
        if (res.success) this.decision.set(res.data);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.snackBar.open('Error al cargar la decisión', 'Cerrar', { duration: 3000 }); },
    });
  }

  selectDecision(type: 'reinvest' | 'withdraw' | 'partial'): void {
    this.selectedType.set(type);
    if (type === 'partial') {
      this.partialForm.reset({ reinvest_amount: 0 });
    }
  }

  confirmDecision(): void {
    const id   = this.decision()?.id;
    const type = this.selectedType();
    if (!id || !type) return;

    let payload: any = { decision_type: type };

    if (type === 'partial') {
      if (this.partialForm.invalid) { this.partialForm.markAllAsTouched(); return; }
      const raw = this.partialForm.getRawValue();
      payload.reinvest_amount = +raw.reinvest_amount;
      payload.withdraw_amount = +raw.withdraw_amount;

      const total = +(this.decision()?.investor_amount ?? 0);
      if (Math.abs((payload.reinvest_amount + payload.withdraw_amount) - total) > 0.01) {
        this.snackBar.open('La suma de reinversión y retiro debe igualar el monto total', 'Cerrar', { duration: 4000 });
        return;
      }
    }

    this.saving.set(true);
    this.svc.makeDecision(id, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Decisión registrada exitosamente', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/investments/sales', this.decision()!.sale_event]);
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(err?.error?.error || 'Error al registrar decisión', 'Cerrar', { duration: 4000 });
      },
    });
  }

  decisionColor(type: string): 'success' | 'danger' | 'warning' | 'secondary' {
    const m: Record<string, any> = { reinvest: 'success', withdraw: 'danger', partial: 'warning', pending: 'secondary' };
    return m[type] ?? 'secondary';
  }

  get isAlreadyDecided(): boolean {
    const d = this.decision();
    return !!d && d.decision_type !== 'pending';
  }
}