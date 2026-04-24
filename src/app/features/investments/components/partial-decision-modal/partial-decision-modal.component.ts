// components/partial-decision-modal/partial-decision-modal.component.ts

import {
  Component, OnInit, ChangeDetectionStrategy,
  input, output, inject
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { formatCurrency } from '../../../../core/utils/helpers';

@Component({
  selector: 'app-partial-decision-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './partial-decision-modal.component.html',
  styleUrl:    './partial-decision-modal.component.scss',
})
export class PartialDecisionModalComponent implements OnInit {
  readonly totalAmount = input.required<number>();
  readonly submitted   = output<{ reinvestAmount: number; withdrawAmount: number }>();
  readonly cancelled   = output<void>();

  private fb = inject(FormBuilder);
  readonly fmt = formatCurrency;
  sumError = false;

  form = this.fb.group({
    reinvestAmount: [0, [Validators.required, Validators.min(0)]],
    withdrawAmount: [{ value: 0, disabled: true }],
  });

  ngOnInit(): void {
    this.form.get('reinvestAmount')?.valueChanges.subscribe(v => {
      const reinvest = +(v ?? 0);
      this.form.get('withdrawAmount')?.setValue(
        Number(Math.max(0, this.totalAmount() - reinvest).toFixed(2)),
        { emitEvent: false }
      );
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const raw = this.form.getRawValue();
    const reinvest  = +(raw.reinvestAmount ?? 0);
    const withdraw  = +(raw.withdrawAmount ?? 0);
    this.sumError = Math.abs((reinvest + withdraw) - this.totalAmount()) > 0.01;
    if (this.sumError) return;
    this.submitted.emit({ reinvestAmount: reinvest, withdrawAmount: withdraw });
  }
}