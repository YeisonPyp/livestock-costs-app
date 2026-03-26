import {
  Component,
  inject,
  input,
  output,
  OnInit,
  OnDestroy,
  signal,
  computed,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { Investor, Investment } from '../../models/investment.model';
import { InvestmentService } from '../../services/investment.service';

// ─── Shared UI components ─────────────────────────────────────────────────────
import { FormCardComponent } from '../../../../shared/components/forms/form-card/form-card.component';
import { InputFieldComponent } from '../../../../shared/components/forms/input-field/input-field.component';
import { SelectFieldComponent, SelectOption } from '../../../../shared/components/forms/select-field/select-field.component';

export type InvestmentFormMode = 'create' | 'edit';

@Component({
  selector: 'app-investment-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormCardComponent,
    InputFieldComponent,
    SelectFieldComponent,
  ],
  templateUrl: './investment-form.component.html',
  styleUrl: './investment-form.component.scss',
})
export class InvestmentFormComponent implements OnInit, OnDestroy {
  // ─── Inputs ───────────────────────────────────────────────────────────────
  /** Pasar un Investment pre-cargado activa el modo edición */
  investment    = input<Investment | null>(null);
  /** Pre-seleccionar un inversor (útil al abrir desde la ficha del inversor) */
  preselectedInvestorId = input<string | null>(null);
  loading       = input<boolean>(false);

  // ─── Outputs ──────────────────────────────────────────────────────────────
  formSubmit = output<Record<string, any>>();
  formCancel = output<void>();

  // ─── Services ─────────────────────────────────────────────────────────────
  private fb                = inject(FormBuilder);
  private investmentService = inject(InvestmentService);
  private destroy$          = new Subject<void>();

  // ─── State ────────────────────────────────────────────────────────────────
  form!: FormGroup;

  investors        = signal<Investor[]>([]);
  loadingInvestors = signal(false);
  submitting       = signal(false);

  // Búsqueda en el select de inversores
  investorSearch  = signal('');

  // ─── Computed ─────────────────────────────────────────────────────────────
  isEditMode = computed(() => !!this.investment());

  investorOptions = computed<SelectOption[]>(() => {
    const q = this.investorSearch().toLowerCase();
    return this.investors()
      .filter(i => i.is_active)
      .filter(i =>
        !q ||
        i.full_name.toLowerCase().includes(q) ||
        i.document_number.includes(q) ||
        i.code.toLowerCase().includes(q)
      )
      .map(i => ({
        label: `${i.full_name} · ${i.document_number}`,
        value: i.id,
      }));
  });

  selectedInvestor = computed(() => {
    const id = this.form?.get('investor_id')?.value;
    return id ? this.investors().find(i => i.id === id) ?? null : null;
  });

  // ─── Control accessors ────────────────────────────────────────────────────
  get ctrl() {
    return {
      investor_id:     this.form.get('investor_id'),
      initial_capital: this.form.get('initial_capital'),
      start_date:      this.form.get('start_date'),
      notes:           this.form.get('notes'),
    };
  }

  get submitLabel(): string {
    if (this.submitting()) return 'Guardando...';
    return this.isEditMode() ? 'Actualizar inversión' : 'Crear inversión';
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.buildForm();
    this.loadInvestors();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Form setup ───────────────────────────────────────────────────────────
  private buildForm(): void {
    this.form = this.fb.group({
      investor_id:     ['', Validators.required],
      initial_capital: ['', [Validators.required, Validators.min(1)]],
      start_date:      ['', Validators.required],
      notes:           [''],
    });
  }

  private patchForm(inv: Investment): void {
    this.form.patchValue({
      investor_id:     inv.investor,
      initial_capital: inv.initial_capital,
      start_date:      inv.start_date,
      notes:           inv.notes ?? '',
    });
  }

  // ─── Investors ────────────────────────────────────────────────────────────
  private loadInvestors(): void {
    this.loadingInvestors.set(true);
    this.investmentService.getInvestors({ is_active: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.investors.set(res.data ?? []);
          this.loadingInvestors.set(false);

          // Aplicar preselección o datos de edición
          const pre = this.preselectedInvestorId();
          const inv = this.investment();
          if (inv) {
            this.patchForm(inv);
          } else if (pre) {
            this.form.get('investor_id')!.setValue(pre);
          }

          // Fecha de hoy por defecto en creación
          if (!inv && !this.form.get('start_date')!.value) {
            this.form.get('start_date')!.setValue(this.todayIso());
          }
        },
        error: () => this.loadingInvestors.set(false),
      });
  }

  // ─── Submit ───────────────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.form.invalid || this.submitting()) return;
    const raw = this.form.getRawValue();

    const payload: Record<string, any> = {
      investor_id:     raw.investor_id,
      initial_capital: String(raw.initial_capital),   // la API espera string decimal
      start_date:      raw.start_date,                 // "YYYY-MM-DD"
    };

    if (raw.notes?.trim()) payload['notes'] = raw.notes.trim();

    this.formSubmit.emit(payload);
  }

  onCancel(): void { this.formCancel.emit(); }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  private todayIso(): string {
    return new Date().toISOString().split('T')[0];
  }

  /** Formatea número como moneda COP para la preview */
  formatCOP(value: string | number): string {
    const n = Number(value);
    if (!n || isNaN(n)) return '';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(n);
  }

  get capitalPreview(): string {
    return this.formatCOP(this.form?.get('initial_capital')?.value ?? '');
  }
}