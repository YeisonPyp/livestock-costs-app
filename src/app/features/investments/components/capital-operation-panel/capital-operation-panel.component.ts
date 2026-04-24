// components/capital-operation-panel/capital-operation-panel.component.ts
//
// Componente presentacional puro. Recibe tipo de operación y max via Input.
// Emite el payload listo para que el padre lo envíe al facade.

import {
  Component, OnInit, OnChanges, SimpleChanges,
  ChangeDetectionStrategy, input, output, inject
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';

import { formatCurrency } from '../../../../core/utils/helpers';
import type { ContributionPayload, WithdrawalPayload } from '../../models/investment.model';

export type OperationType = 'contribute' | 'withdraw';

@Component({
  selector: 'app-capital-operation-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './capital-operation-panel.component.html',
  styleUrl: './capital-operation-panel.component.scss',
})
export class CapitalOperationPanelComponent implements OnInit, OnChanges {
  readonly type      = input.required<OperationType>();
  readonly maxAmount = input<number>(0);
  readonly loading   = input<boolean>(false);

  readonly submitted = output<ContributionPayload | WithdrawalPayload>();
  readonly cancelled = output<void>();

  private fb = inject(FormBuilder);

  readonly today = new Date().toISOString().split('T')[0];
  readonly formatCurrency = formatCurrency;

  form = this.fb.group({
    amount:        [null as number | null, [Validators.required, Validators.min(0.01)]],
    effectiveDate: [this.today],
    description:   [''],
  });

  ngOnInit(): void { this.configureValidators(); }

  ngOnChanges(c: SimpleChanges): void {
    if (c['type'] || c['maxAmount']) this.configureValidators();
  }

  get amountInvalid(): boolean {
    const ctrl = this.form.get('amount')!;
    return ctrl.invalid && ctrl.touched;
  }

  get amountError(): string {
    const errors = this.form.get('amount')?.errors;
    if (!errors) return '';
    if (errors['required']) return 'El monto es requerido';
    if (errors['min'])      return 'El monto debe ser mayor a 0';
    if (errors['max'])      return `Máximo disponible: ${formatCurrency(this.maxAmount())}`;
    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.value;
    this.submitted.emit({
      amount:        v.amount!,
      effectiveDate: v.effectiveDate || undefined,
      description:   v.description   || undefined,
    });
  }

  private configureValidators(): void {
    const amountCtrl = this.form.get('amount');
    const validators = [Validators.required, Validators.min(0.01)];
    if (this.type() === 'withdraw' && this.maxAmount() > 0) {
      validators.push(Validators.max(this.maxAmount()));
    }
    amountCtrl?.setValidators(validators);
    amountCtrl?.updateValueAndValidity();

    const defaultDesc = this.type() === 'contribute' ? 'Aporte de capital' : 'Retiro de capital';
    if (!this.form.get('description')?.value) {
      this.form.get('description')?.setValue(defaultDesc);
    }
  }
}