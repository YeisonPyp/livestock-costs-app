// components/investment-form/investment-form.component.ts
//
// Componente presentacional puro. NO inyecta servicios directamente;
// recibe datos via @Input y emite eventos via @Output.
// La lógica de carga y validación de "inversión activa" se delega al facade
// a través del componente padre.

import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy,
  inject, input, output, signal, computed, effect
} from '@angular/core';
import {
  FormBuilder, FormGroup, Validators, ReactiveFormsModule,
  AbstractControl, ValidationErrors
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { InvestmentFacade } from '../../../facades/investment.facade';
import { AlertComponent }   from '../../../../../shared/components/feedback/alert/alert.component';

import type { CreateInvestmentPayload } from '../../../models/investment.model';
import { formatCurrency, parseDecimal } from '../../../../../core/utils/helpers';

// ── Validadores ────────────────────────────────────────────────────────────

function positiveAmountValidator(control: AbstractControl): ValidationErrors | null {
  const v = control.value;
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (isNaN(n))  return { invalidAmount: true };
  if (n <= 0)    return { minAmount: true };
  return null;
}

function notFutureDateValidator(control: AbstractControl): ValidationErrors | null {
  const v = control.value;
  if (!v) return null;
  const today = new Date(); today.setHours(23, 59, 59, 999);
  return new Date(v) > today ? { futureDate: true } : null;
}

// ── Componente ─────────────────────────────────────────────────────────────

@Component({
  selector: 'app-investment-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AlertComponent],
  templateUrl: './investment-form.component.html',
  styleUrl:    './investment-form.component.scss',
})
export class InvestmentFormComponent implements OnInit, OnDestroy {

  // ── Inputs ───────────────────────────────────────────────────
  readonly preselectedInvestorId = input<string | null>(null);
  readonly loading               = input<boolean>(false);

  // ── Outputs ──────────────────────────────────────────────────
  readonly formSubmit = output<CreateInvestmentPayload>();
  readonly formCancel = output<void>();

  // ── Dependencias ─────────────────────────────────────────────
  private readonly fb     = inject(FormBuilder);
  readonly facade         = inject(InvestmentFacade);   // acceso a estado de inversionistas
  private readonly destroy$ = new Subject<void>();

  // ── Estado local ─────────────────────────────────────────────
  readonly formValid  = signal(false);
  readonly today      = new Date().toLocaleDateString('en-CA');

  readonly form: FormGroup = this.fb.group({
    investorId:      ['', Validators.required],
    initialCapital:  [null, [Validators.required, positiveAmountValidator]],
    startDate:       ['', [Validators.required, notFutureDateValidator]],
    notes:           ['', Validators.maxLength(1000)],
  });

  // ── Derived ───────────────────────────────────────────────────

  readonly investorOptions = computed(() =>
    this.facade.formInvestors()
      .filter(i => i.isActive)
      .map(i => ({ value: i.id, label: `${i.code} — ${i.fullName}`, sub: i.documentNumber }))
  );

  readonly selectedInvestor = computed(() => {
    const id = this.form.get('investorId')?.value;
    return this.facade.formInvestors().find(i => i.id === id) ?? null;
  });

  readonly capitalPreview = computed(() => {
    const v = this.form.get('initialCapital')?.value;
    return v && !isNaN(Number(v)) ? formatCurrency(v) : '';
  });

  readonly canSubmit = computed(() =>
    this.formValid()
    && !this.loading()
    && !this.facade.formInvestorsLoading()
    && !this.facade.checkingActive()
    && !this.facade.hasActiveInvestment()
  );

  readonly submitLabel = computed(() => {
    if (this.loading())               return 'Guardando...';
    if (this.facade.checkingActive()) return 'Verificando...';
    return 'Crear inversión';
  });

  // ── Lifecycle ─────────────────────────────────────────────────

  ngOnInit(): void {
    this.form.get('startDate')?.setValue(this.today);
    this.facade.loadActiveInvestors();

    this.form.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.formValid.set(this.form.valid));
    this.formValid.set(this.form.valid);

    // Aplicar preselección cuando lleguen los inversionistas
    effect(() => {
      const id = this.preselectedInvestorId();
      if (id && this.facade.formInvestors().length > 0) {
        this.form.get('investorId')?.setValue(id);
      }
    }, { allowSignalWrites: true });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Handlers ──────────────────────────────────────────────────

  onInvestorChange(id: string): void {
    this.form.get('investorId')?.setValue(id);
    this.form.get('investorId')?.markAsTouched();
    if (id) this.facade.checkActiveInvestment(id);
    else    this.facade.hasActiveInvestment.set(false);
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (!this.canSubmit()) return;
    const v = this.form.getRawValue();
    this.formSubmit.emit({
      investorId:     v.investorId,
      initialCapital: v.initialCapital,
      startDate:      v.startDate,
      notes:          v.notes?.trim() || undefined,
    });
  }

  onCancel(): void { this.formCancel.emit(); }

  onRetryInvestors(): void { this.facade.loadActiveInvestors(); }

  // ── UI helpers ────────────────────────────────────────────────

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!c && c.invalid && c.touched;
  }

  getError(field: string): string {
    const errors = this.form.get(field)?.errors;
    if (!errors) return '';
    if (errors['required'])     return 'Este campo es requerido';
    if (errors['minAmount'])    return 'El monto debe ser mayor a 0';
    if (errors['invalidAmount'])return 'Ingrese un monto válido';
    if (errors['futureDate'])   return 'La fecha no puede ser futura';
    if (errors['maxlength'])    return `Máximo ${errors['maxlength'].requiredLength} caracteres`;
    return 'Campo inválido';
  }

  get charCount(): number { return this.form.get('notes')?.value?.length ?? 0; }

  formatCurrency = formatCurrency;
}