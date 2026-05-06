// components/investment-form/investment-form.component.ts

import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy,
  inject, input, output, signal, computed, effect
} from '@angular/core';
import {
  FormBuilder, FormGroup, Validators, ReactiveFormsModule,
  AbstractControl, ValidationErrors
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { InvestmentFacade }       from '../../../facades/investment.facade';
import { AlertComponent }         from '../../../../../shared/components/feedback/alert/alert.component';
import { InputFieldComponent }    from '../../../../../shared/components/forms/input-field/input-field.component';
import { SelectFieldComponent }   from '../../../../../shared/components/forms/select-field/select-field.component';
import { FormCardComponent }      from '../../../../../shared/components/forms/form-card/form-card.component';

import type { CreateInvestmentPayload } from '../../../models/investment.model';
import { formatCurrency } from '../../../../../core/utils/helpers';

// ══════════════════════════════════════════════════════════════
// Validadores
// ══════════════════════════════════════════════════════════════

function positiveAmountValidator(ctrl: AbstractControl): ValidationErrors | null {
  const v = ctrl.value;
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (isNaN(n))  return { invalidAmount: true };
  if (n <= 0)    return { minAmount: true };
  return null;
}

function notFutureDateValidator(ctrl: AbstractControl): ValidationErrors | null {
  if (!ctrl.value) return null;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return new Date(ctrl.value) > today ? { futureDate: true } : null;
}

// ══════════════════════════════════════════════════════════════
// Componente
// ══════════════════════════════════════════════════════════════

@Component({
  selector: 'app-investment-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AlertComponent,
    InputFieldComponent,
    SelectFieldComponent,
    FormCardComponent,
  ],
  templateUrl: './investment-form.component.html',
  styleUrl:    './investment-form.component.scss',
})
export class InvestmentFormComponent implements OnInit, OnDestroy {

  // ── Inputs / Outputs ─────────────────────────────────────
  readonly preselectedInvestorId = input<string | null>(null);
  readonly loading               = input<boolean>(false);
  readonly formSubmit            = output<CreateInvestmentPayload>();
  readonly formCancel            = output<void>();

  // ── Inyecciones ──────────────────────────────────────────
  private readonly fb       = inject(FormBuilder);
  readonly facade            = inject(InvestmentFacade);
  private readonly destroy$  = new Subject<void>();

  // ── Estado local ─────────────────────────────────────────
  readonly formValid = signal(false);
  readonly today     = new Date().toLocaleDateString('en-CA');

  // ── Formulario ───────────────────────────────────────────
  readonly form: FormGroup = this.fb.group({
    investorId:     ['', Validators.required],
    initialCapital: [null, [Validators.required, positiveAmountValidator]],
    startDate:      ['', [Validators.required, notFutureDateValidator]],
    notes:          ['', Validators.maxLength(1000)],
  });

  get f() { return this.form.controls; }

  // ══════════════════════════════════════════════════════════
  // Computed
  // ══════════════════════════════════════════════════════════

  readonly investorOptions = computed(() =>
    this.facade.formInvestors()
      .filter(i => i.isActive)
      .map(i => ({
        value: i.id,
        label: `${i.code} — ${i.fullName}`,
      }))
  );

  readonly selectedInvestor = computed(() => {
    const id = this.form.get('investorId')?.value;
    if (!id) return null;
    return this.facade.formInvestors().find(i => i.id === id) ?? null;
  });

  readonly capitalPreview = computed(() => {
    const v = this.form.get('initialCapital')?.value;
    return v && !isNaN(Number(v)) && Number(v) > 0
      ? formatCurrency(v)
      : '';
  });

  /** ¿Está verificando algo? */
  readonly isChecking = computed(() =>
    this.facade.checkingActive() || this.facade.checkingContract()
  );

  /**
   * ¿Ya se completaron AMBAS verificaciones?
   * Solo es true cuando ninguna está en progreso Y hay un investor seleccionado
   */
  readonly validationComplete = computed(() =>
    !!this.selectedInvestor()
    && !this.facade.checkingActive()
    && !this.facade.checkingContract()
    && this.facade.hasActiveContract() !== null
  );

  /**
   * Bloqueo DURO: inversión activa existente
   * → No puede continuar bajo ninguna circunstancia
   */
  readonly hasHardBlock = computed(() =>
    this.facade.hasActiveInvestment()
  );

  /**
   * Bloqueo SUAVE: sin contrato activo
   * → Advertencia, pero NO bloquea el submit
   *
   * Cambiar a bloqueo duro si tu negocio lo requiere
   */
  readonly hasContractBlock = computed(() =>
    this.facade.hasActiveContract() === false
  );

  /**
   * ¿Todo está validado y OK?
   */
  readonly investorValidated = computed(() =>
    this.validationComplete()
    && !this.hasHardBlock()
    && !this.hasContractBlock()
  );

  /** ¿Se puede enviar? */
  readonly canSubmit = computed(() =>
    this.formValid()
    && !this.loading()
    && !this.facade.formInvestorsLoading()
    && !this.isChecking()
    && !this.hasHardBlock()
    && !this.hasContractBlock()
  );

  readonly submitLabel = computed(() => {
    if (this.loading())      return 'Guardando...';
    if (this.isChecking())   return 'Verificando...';
    return 'Crear Inversión';
  });

  // ══════════════════════════════════════════════════════════
  // Lifecycle
  // ══════════════════════════════════════════════════════════

  private preselectEffect = effect(() => {
    const id = this.preselectedInvestorId();
    const investors = this.facade.formInvestors();

    if (id && investors.length > 0) {
      this.form.get('investorId')?.setValue(id);
      this.facade.validateInvestorSelection(id);
    }
  }, { allowSignalWrites: true });

  ngOnInit(): void {
    this.form.get('startDate')?.setValue(this.today);
    this.facade.loadActiveInvestors();

    this.form.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.formValid.set(this.form.valid));

    this.formValid.set(this.form.valid);
  }

  ngOnDestroy(): void {
    this.facade.resetValidationState();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ══════════════════════════════════════════════════════════
  // Handlers
  // ══════════════════════════════════════════════════════════

  onInvestorChange(investorId: string | number): void {
    const idStr = String(investorId ?? '');
    this.form.get('investorId')?.setValue(idStr);
    this.form.get('investorId')?.markAsTouched();
    this.facade.validateInvestorSelection(idStr);
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

  onCancel(): void {
    this.formCancel.emit();
  }

  onRetryInvestors(): void {
    this.facade.loadActiveInvestors();
  }

  // ══════════════════════════════════════════════════════════
  // UI Helpers
  // ══════════════════════════════════════════════════════════

  get charCount(): number {
    return this.form.get('notes')?.value?.length ?? 0;
  }
}