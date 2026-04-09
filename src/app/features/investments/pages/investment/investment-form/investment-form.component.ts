import {
  Component,
  inject,
  input,
  output,
  OnInit,
  OnDestroy,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { 
  Subject, 
  takeUntil, 
  debounceTime, 
  distinctUntilChanged,
  finalize,
} from 'rxjs';

// ═══════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════
import { FormCardComponent } from '../../../../../shared/components/forms/form-card/form-card.component';
import { InputFieldComponent } from '../../../../../shared/components/forms/input-field/input-field.component';
import { SelectFieldComponent, SelectOption } from '../../../../../shared/components/forms/select-field/select-field.component';
import { AlertComponent } from '../../../../../shared/components/display/alert/alert.component';

// ═══════════════════════════════════════════════════════════════════════════
// MODULE IMPORTS
// ═══════════════════════════════════════════════════════════════════════════
import { 
  InvestorService,
  InvestmentService,
} from '../../../services';

import { 
  Investor, 
  Investment,
  CreateInvestmentPayload,
} from '../../../models/investment.model';
import { formatCurrency, parseDecimal } from '../../../../../core/utils/helpers';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

export type InvestmentFormMode = 'create' | 'edit';

interface InvestorSelectOption extends SelectOption {
  investor: Investor;
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDADORES PERSONALIZADOS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validador que verifica que el monto sea un número válido mayor a 0.
 */
function positiveAmountValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  
  if (value === null || value === undefined || value === '') {
    return null; // Dejar que `required` maneje esto
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return { invalidAmount: true };
  }
  
  if (num <= 0) {
    return { minAmount: { min: 0.01, actual: num } };
  }
  
  return null;
}

/**
 * Validador para fecha no futura (opcional).
 */
function notFutureDateValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  
  if (!value) return null;
  
  const inputDate = new Date(value);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  if (inputDate > today) {
    return { futureDate: true };
  }
  
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════════════

@Component({
  selector: 'app-investment-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormCardComponent,
    InputFieldComponent,
    SelectFieldComponent,
    AlertComponent,
  ],
  templateUrl: './investment-form.component.html',
  styleUrl: './investment-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvestmentFormComponent implements OnInit, OnDestroy {

  // ═══════════════════════════════════════════════════════════════════════════
  // INPUTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /** Inversión existente para modo edición (actualmente no soportado) */
  readonly investment = input<Investment | null>(null);
  
  /** ID del inversionista preseleccionado */
  readonly preselectedInvestorId = input<string | null>(null);
  
  /** Estado de carga externo (del componente padre) */
  readonly loading = input<boolean>(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // OUTPUTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /** Emite el payload cuando se envía el formulario */
  readonly formSubmit = output<CreateInvestmentPayload>();
  
  /** Emite cuando se cancela */
  readonly formCancel = output<void>();

  // ═══════════════════════════════════════════════════════════════════════════
  // SERVICIOS
  // ═══════════════════════════════════════════════════════════════════════════
  
  private readonly fb = inject(FormBuilder);
  private readonly investorService = inject(InvestorService);
  private readonly investmentService = inject(InvestmentService);

  // ═══════════════════════════════════════════════════════════════════════════
  // SUBJECTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  private readonly destroy$ = new Subject<void>();
  private readonly searchTerm$ = new Subject<string>();

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════
  
  /** Formulario reactivo */
  readonly form: FormGroup = this.fb.group({
    investor_id: ['', [Validators.required]],
    initial_capital: [null, [Validators.required, positiveAmountValidator]],
    start_date: ['', [Validators.required, notFutureDateValidator]],
    notes: ['', [Validators.maxLength(1000)]],
  });

  /** Lista de inversionistas disponibles */
  readonly investors = signal<Investor[]>([]);
  
  /** Estado de carga de inversionistas */
  readonly isLoadingInvestors = signal(false);
  
  /** Error al cargar inversionistas */
  readonly investorsError = signal<string | null>(null);
  
  /** Término de búsqueda */
  readonly searchTerm = signal('');
  
  /** Indica si hay una inversión activa para el inversionista seleccionado */
  readonly hasActiveInvestment = signal(false);
  
  /** Verificando si tiene inversión activa */
  readonly isCheckingActiveInvestment = signal(false);

  readonly formValid = signal(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED
  // ═══════════════════════════════════════════════════════════════════════════
  
  /** Modo de edición */
  readonly isEditMode = computed(() => !!this.investment());

  /** Opciones filtradas para el select de inversionistas */
  readonly investorOptions = computed<SelectOption[]>(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const list = this.investors();
    
    // Filtrar solo activos
    let filtered = list.filter(inv => inv.is_active);
    
    // Aplicar búsqueda si hay término
    if (term) {
      filtered = filtered.filter(inv => 
        inv.full_name.toLowerCase().includes(term) ||
        inv.code.toLowerCase().includes(term) ||
        inv.document_number.includes(term) ||
        (inv.email && inv.email.toLowerCase().includes(term))
      );
    }
    
    // Mapear a opciones de select
    return filtered.map(inv => ({
      value: inv.id,
      label: `${inv.code} - ${inv.full_name}`,
      sublabel: inv.document_number,
      disabled: false,
    }));
  });

  /** Inversionista seleccionado actualmente */
  readonly selectedInvestor = computed<Investor | null>(() => {
    const id = this.form.get('investor_id')?.value;
    if (!id) return null;
    return this.investors().find(inv => inv.id === id) ?? null;
  });

  /** Preview del capital formateado */
  readonly capitalPreview = computed(() => {
    const value = this.form.get('initial_capital')?.value;
    if (!value || isNaN(Number(value))) return '';
    return formatCurrency(value);
  });

  /** Indica si se puede enviar el formulario */
  readonly canSubmit = computed(() => {
    return this.formValid() &&
          !this.loading() &&
          !this.isLoadingInvestors() &&
          !this.isCheckingActiveInvestment() &&
          !this.hasActiveInvestment();
  });
  

  /** Texto del botón submit */
  readonly submitLabel = computed(() => {
    if (this.loading()) return 'Guardando...';
    if (this.isCheckingActiveInvestment()) return 'Verificando...';
    return this.isEditMode() ? 'Actualizar inversión' : 'Crear inversión';
  });

  /** Mensaje de ayuda para el capital */
  readonly capitalHelpText = computed(() => {
    const preview = this.capitalPreview();
    if (preview) {
      return `Equivale a ${preview}`;
    }
    return 'Ingrese el monto inicial de la inversión';
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCESSORS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /** Acceso rápido a los controles del formulario */
  get controls() {
    return {
      investor_id: this.form.get('investor_id')!,
      initial_capital: this.form.get('initial_capital')!,
      start_date: this.form.get('start_date')!,
      notes: this.form.get('notes')!,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTRUCTOR & LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════════

  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadInvestors();
    this.setDefaultDate();

    this.form.statusChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.formValid.set(this.form.valid);
      });

    // valor inicial
    this.formValid.set(this.form.valid);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SETUP
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Configura el debounce para la búsqueda.
   */
  private setupSearchDebounce(): void {
    this.searchTerm$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe(term => {
        this.searchTerm.set(term);
      });
  }

  /**
   * Establece la fecha de hoy como valor por defecto.
   */
  private setDefaultDate(): void {
    if (!this.investment()) {
      this.controls.start_date.setValue(this.today);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Carga la lista de inversionistas activos.
   */
  private loadInvestors(): void {
    this.isLoadingInvestors.set(true);
    this.investorsError.set(null);

    this.investorService
      .getActive()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingInvestors.set(false)),
      )
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.investors.set(res.data);
            this.applyInitialValues();
          } else {
            this.investorsError.set('No se pudieron cargar los inversionistas');
          }
        },
        error: (err) => {
          console.error('Error loading investors:', err);
          this.investorsError.set('Error al cargar los inversionistas');
        },
      });
  }

  /**
   * Aplica los valores iniciales (preselección o modo edición).
   */
  private applyInitialValues(): void {
    const investment = this.investment();
    const preselectedId = this.preselectedInvestorId();

    if (investment) {
      // Modo edición
      this.patchFormForEdit(investment);
    } else if (preselectedId) {
      // Preselección de inversionista
      this.controls.investor_id.setValue(preselectedId);
    }
  }

  /**
   * Rellena el formulario para modo edición.
   */
  private patchFormForEdit(investment: Investment): void {
    this.form.patchValue({
      investor_id: investment.investor,
      initial_capital: this.parseDecimal(investment.initial_capital),
      start_date: investment.start_date,
      notes: investment.notes ?? '',
    });

    // En modo edición, deshabilitar campos que no se pueden cambiar
    this.controls.investor_id.disable();
    this.controls.initial_capital.disable();
    this.controls.start_date.disable();
  }

  /**
   * Verifica si el inversionista ya tiene una inversión activa.
   */
  private checkActiveInvestment(investorId: string): void {
    if (!investorId) {
      this.hasActiveInvestment.set(false);
      this.isCheckingActiveInvestment.set(false);
      return;
    }

    this.isCheckingActiveInvestment.set(true);
    this.hasActiveInvestment.set(false);

    this.investmentService
      .getByInvestor(investorId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isCheckingActiveInvestment.set(false);
        })
      )
      .subscribe({
        next: (res) => {
          const activeInvestment =
            res?.data?.find((inv) => inv.status === 'active');

          this.hasActiveInvestment.set(!!activeInvestment);
        },
        error: () => {
          this.hasActiveInvestment.set(false);
        },
      });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Maneja el cambio en el campo de búsqueda.
   */
  onSearchChange(term: string): void {
    this.searchTerm$.next(term);
  }

  /**
   * Maneja el cambio de inversionista seleccionado.
   */
  onInvestorChange(investorId: string): void {
    this.controls.investor_id.setValue(investorId);
    this.controls.investor_id.markAsTouched();

    if (!this.isEditMode() && investorId) {
      this.checkActiveInvestment(investorId);
    }
  }

  /**
   * Envía el formulario.
   */
  onSubmit(): void {
    // Marcar todos los campos como touched para mostrar errores
    this.form.markAllAsTouched();

    if (!this.canSubmit()) {
      return;
    }

    const formValue = this.form.getRawValue();

    const payload: CreateInvestmentPayload = {
      investor_id: formValue.investor_id,
      initial_capital: formValue.initial_capital,
      start_date: formValue.start_date,
      notes: formValue.notes?.trim() || undefined,
    };

    this.formSubmit.emit(payload);
  }

  /**
   * Cancela el formulario.
   */
  onCancel(): void {
    this.formCancel.emit();
  }

  /**
   * Recarga los inversionistas.
   */
  onRetryLoadInvestors(): void {
    this.loadInvestors();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS PARA TEMPLATE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Verifica si un campo tiene error específico.
   */
  hasError(fieldName: keyof typeof this.controls, errorType: string): boolean {
    const control = this.controls[fieldName];
    return control.hasError(errorType) && control.touched;
  }

  /**
   * Verifica si un campo tiene cualquier error.
   */
  isInvalid(fieldName: keyof typeof this.controls): boolean {
    const control = this.controls[fieldName];
    return control.invalid && control.touched;
  }

  /**
   * Obtiene el mensaje de error para un campo.
   */
  getErrorMessage(fieldName: keyof typeof this.controls): string {
    const control = this.controls[fieldName];
    
    if (!control.errors || !control.touched) {
      return '';
    }

    const errors = control.errors;

    // Mapeo de errores a mensajes
    const errorMessages: Record<string, string> = {
      required: 'Este campo es requerido',
      minAmount: 'El monto debe ser mayor a 0',
      invalidAmount: 'Ingrese un monto válido',
      futureDate: 'La fecha no puede ser futura',
      maxlength: `Máximo ${errors['maxlength']?.requiredLength} caracteres`,
    };

    // Retornar el primer error encontrado
    for (const errorKey of Object.keys(errors)) {
      if (errorMessages[errorKey]) {
        return errorMessages[errorKey];
      }
    }

    return 'Campo inválido';
  }

  /**
   * Formatea un valor como moneda.
   */
  formatCurrency = formatCurrency;
  parseDecimal = parseDecimal;
  
  today = new Date().toLocaleDateString('en-CA');

  /**
   * Obtiene información adicional del inversionista seleccionado.
   */
  getInvestorInfo(): string {
    const investor = this.selectedInvestor();
    if (!investor) return '';

    const parts: string[] = [];
    
    if (investor.email) {
      parts.push(investor.email);
    }
    
    if (investor.phone) {
      parts.push(investor.phone);
    }

    return parts.join(' • ');
  }

  /**
   * Obtiene los porcentajes del inversionista seleccionado.
   */
  getInvestorPercentages(): string {
    const investor = this.selectedInvestor();
    if (!investor) return '';

    return `Participación: ${investor.investor_percentage}% inversionista / ${investor.operator_percentage}% operador`;
  }
  
}