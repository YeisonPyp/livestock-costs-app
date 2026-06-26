// src/features/users/pages/user-form/user-form.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  input,
  output,
  signal,
  computed,
  effect,
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
} from 'rxjs';

import { PersonService } from '../../services/person.service';
import { UserService } from '../../services/user.service';
import { CatalogService } from '../../services/catalog.service';
import {
  UserCreatePayload,
  User,
  DocumentType,
  Country,
  State,
  City,
  Gender,
  PersonType,
} from '../../models/user.model';

import { FormCardComponent } from '../../../../shared/components/forms/form-card/form-card.component';
import { InputFieldComponent } from '../../../../shared/components/forms/input-field/input-field.component';
import {
  SelectFieldComponent,
  SelectOption,
} from '../../../../shared/components/forms/select-field/select-field.component';

// Validador de contraseñas coincidentes
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password        = control.get('password');
  const passwordConfirm = control.get('password_confirm');
  if (!password || !passwordConfirm) return null;
  if (password.value !== passwordConfirm.value) {
    passwordConfirm.setErrors({ passwordMismatch: true });
    return { passwordMismatch: true };
  }
  passwordConfirm.setErrors(null);
  return null;
}

// Pasos del formulario
type Step = 'person' | 'credentials';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormCardComponent,
    InputFieldComponent,
    SelectFieldComponent,
  ],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
})
export class UserFormComponent implements OnInit, OnDestroy {
  // ── Inputs / Outputs ──────────────────────────────────────────────
  user       = input<User | null>(null);
  loading    = input<boolean>(false);
  formSubmit = output<UserCreatePayload>();
  formCancel = output<void>();

  // ── Services ──────────────────────────────────────────────────────
  private fb             = inject(FormBuilder);
  private personService  = inject(PersonService);
  private catalogService = inject(CatalogService);

  // ── State ─────────────────────────────────────────────────────────
  form!: FormGroup;
  private destroy$ = new Subject<void>();

  // Stepper
  currentStep   = signal<Step>('person');
  steps: Step[] = ['person', 'credentials'];

  // Catalogs
  documentTypes = signal<DocumentType[]>([]);
  countries     = signal<Country[]>([]);
  states        = signal<State[]>([]);
  cities        = signal<City[]>([]);
  genders       = signal<Gender[]>([]);

  // Catalog options for selects
  documentTypeOptions = computed<SelectOption[]>(() =>
    this.documentTypes().map((d) => ({ label: `${d.code} – ${d.name}`, value: d.code }))
  );
  countryOptions = computed<SelectOption[]>(() =>
    this.countries().map((c) => ({ label: c.name, value: c.code }))
  );
  stateOptions = computed<SelectOption[]>(() =>
    this.states().map((s) => ({ label: s.name, value: s.code }))
  );
  cityOptions = computed<SelectOption[]>(() =>
    this.cities().map((c) => ({ label: c.name, value: c.code }))
  );
  genderOptions = computed<SelectOption[]>(() =>
    this.genders().map((g) => ({ label: g.name, value: g.code }))
  );

  // Loading states
  loadingCatalogs = signal(false);
  loadingStates   = signal(false);
  loadingCities   = signal(false);
  submitting      = signal(false);

  // Async validation
  emailAvailable    = signal<boolean | null>(null);
  documentAvailable = signal<boolean | null>(null);
  usernameAvailable = signal<boolean | null>(null);
  checkingEmail     = signal(false);
  checkingDocument  = signal(false);
  checkingUsername  = signal(false);

  // Person type
  personTypeValue = signal<PersonType>('N');
  isNatural       = computed(() => this.personTypeValue() === 'N');
  isJuridical     = computed(() => this.personTypeValue() === 'J');

  // Password visibility
  showPassword        = signal(false);
  showPasswordConfirm = signal(false);

  // Step validation
  personStepValid = computed(() => {
    const g = this.form;
    if (!g) return false;
    const fields = [
      'document_type', 'document_number', 'email',
      ...(this.isNatural() ? ['first_name', 'last_name'] : ['legal_name']),
    ];
    return fields.every((f) => g.get(f)?.valid) &&
      this.emailAvailable() !== false &&
      this.documentAvailable() !== false;
  });

  // Password strength
  passwordStrength = computed(() => {
    const pwd = this.form?.get('password')?.value ?? '';
    return this.calcPasswordStrength(pwd);
  });

  // SVG icons
  readonly checkSvg   = `<svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  readonly crossSvg   = `<svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  readonly spinnerSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="uf-spin"><circle cx="12" cy="12" r="10" stroke-opacity=".2"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>`;

  // ── Lifecycle ─────────────────────────────────────────────────────

  ngOnInit(): void {
    this.buildForm();
    this.loadCatalogs();
    this.setupValidations();
    this.setupCascades();
    this.listenPersonType();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Form setup ────────────────────────────────────────────────────

  private buildForm(): void {
    this.form = this.fb.group(
      {
        // Person fields
        person_type:      ['N', Validators.required],
        document_type:    ['', Validators.required],
        document_number:  ['', [Validators.required, Validators.minLength(4), Validators.maxLength(20)]],
        first_name:       ['', [Validators.required, Validators.maxLength(80)]],
        second_name:      ['', Validators.maxLength(80)],
        last_name:        ['', [Validators.required, Validators.maxLength(80)]],
        second_last_name: ['', Validators.maxLength(80)],
        legal_name:       ['', Validators.maxLength(200)],
        email:            ['', [Validators.required, Validators.email]],
        phone_number:     ['', Validators.maxLength(20)],
        country:          [''],
        state:            [''],
        city:             [''],
        gender:           [''],
        // Credentials
        username:         ['', Validators.maxLength(150)],
        password:         ['', [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/),
        ]],
        password_confirm: ['', Validators.required],
      },
      { validators: passwordMatchValidator }
    );
  }

  private listenPersonType(): void {
    this.form.get('person_type')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((type: PersonType) => {
        this.personTypeValue.set(type);
        this.applyPersonTypeValidations(type);
      });
    this.applyPersonTypeValidations('N');
  }

  private applyPersonTypeValidations(type: PersonType): void {
    const setRequired = (name: string, required: boolean) => {
      const ctrl = this.form.get(name);
      if (!ctrl) return;
      if (required) ctrl.addValidators(Validators.required);
      else          ctrl.removeValidators(Validators.required);
      ctrl.updateValueAndValidity({ emitEvent: false });
    };

    if (type === 'N') {
      setRequired('first_name',  true);
      setRequired('last_name',   true);
      setRequired('legal_name',  false);
    } else {
      setRequired('first_name',  false);
      setRequired('last_name',   false);
      setRequired('legal_name',  true);
    }
  }

  // ── Catalogs ──────────────────────────────────────────────────────

  private loadCatalogs(): void {
    this.loadingCatalogs.set(true);

    this.catalogService.getDocumentTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: (res) => this.documentTypes.set(res.data ?? []) });

    this.catalogService.getCountries()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.countries.set(res.data ?? []);
          this.loadingCatalogs.set(false);
        },
        error: () => this.loadingCatalogs.set(false),
      });

    this.catalogService.getGenders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: (res: any) => this.genders.set(res.data ?? []) });
  }

  private setupCascades(): void {
    this.form.get('country')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((code: string) => {
        this.form.get('state')!.setValue('', { emitEvent: false });
        this.form.get('city')!.setValue('',  { emitEvent: false });
        this.states.set([]); this.cities.set([]);
        if (!code) return;
        this.loadingStates.set(true);
        this.catalogService.getStatesByCountry(code)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res: any) => { this.states.set(res.data ?? []); this.loadingStates.set(false); },
            error: () => this.loadingStates.set(false),
          });
      });

    this.form.get('state')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((code: string) => {
        this.form.get('city')!.setValue('', { emitEvent: false });
        this.cities.set([]);
        if (!code) return;
        this.loadingCities.set(true);
        this.catalogService.getCitiesByState(code)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res: any) => { this.cities.set(res.data ?? []); this.loadingCities.set(false); },
            error: () => this.loadingCities.set(false),
          });
      });
  }

  // ── Async validations ─────────────────────────────────────────────

  private setupValidations(): void {
    // Email
    this.form.get('email')!.valueChanges
      .pipe(debounceTime(600), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((email: string) => {
        if (!email || this.form.get('email')!.invalid) {
          this.emailAvailable.set(null); return;
        }
        this.checkingEmail.set(true);
        this.personService.validateEmail(email)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res) => { this.emailAvailable.set(res.data?.available ?? false); this.checkingEmail.set(false); },
            error: () => { this.emailAvailable.set(null); this.checkingEmail.set(false); },
          });
      });

    // Document
    this.form.get('document_number')!.valueChanges
      .pipe(debounceTime(600), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((doc: string) => {
        if (!doc || this.form.get('document_number')!.invalid) {
          this.documentAvailable.set(null); return;
        }
        this.checkingDocument.set(true);
        this.personService.validateDocument(doc)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res) => { this.documentAvailable.set(res.data?.available ?? false); this.checkingDocument.set(false); },
            error: () => { this.documentAvailable.set(null); this.checkingDocument.set(false); },
          });
      });
  }

  // ── Stepper ───────────────────────────────────────────────────────

  goToStep(step: Step): void {
    if (step === 'credentials' && !this.personStepValid()) return;
    this.currentStep.set(step);
  }

  nextStep(): void {
    if (this.currentStep() === 'person' && this.personStepValid()) {
      this.currentStep.set('credentials');
    }
  }

  prevStep(): void {
    if (this.currentStep() === 'credentials') {
      this.currentStep.set('person');
    }
  }

  isStepCompleted(step: Step): boolean {
    if (step === 'person') return this.personStepValid();
    return false;
  }

  // ── Submit ────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.form.invalid || this.submitting()) return;
    const raw = this.form.getRawValue();

    const payload: UserCreatePayload = {
      document_type:    raw.document_type,
      document_number:  raw.document_number,
      person_type:      raw.person_type,
      email:            raw.email,
      password:         raw.password,
      password_confirm: raw.password_confirm,
    };

    // Nombre natural
    if (raw.person_type === 'N') {
      payload.first_name       = raw.first_name;
      payload.second_name      = raw.second_name      || undefined;
      payload.last_name        = raw.last_name;
      payload.second_last_name = raw.second_last_name || undefined;
    } else {
      payload.legal_name = raw.legal_name;
    }

    // Opcionales
    if (raw.phone_number) payload.phone_number = raw.phone_number;
    if (raw.country)      payload.country      = raw.country;
    if (raw.state)        payload.state        = raw.state;
    if (raw.city)         payload.city         = raw.city;
    if (raw.username)     payload.username     = raw.username;

    this.formSubmit.emit(payload);
  }

  onCancel(): void {
    this.formCancel.emit();
  }
  

  // ── Password strength ─────────────────────────────────────────────

  private calcPasswordStrength(pwd: string): {
    score: number;
    label: string;
    color: string;
  } {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8)  score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    const map = [
      { label: 'Muy débil',  color: '#ef4444' },
      { label: 'Débil',      color: '#f97316' },
      { label: 'Regular',    color: '#eab308' },
      { label: 'Buena',      color: '#22c55e' },
      { label: 'Muy fuerte', color: '#16a34a' },
    ];
    const entry = map[Math.min(score - 1, 4)] ?? { label: '', color: '#e2e8f0' };
    return { score, label: entry.label, color: entry.color };
  }

  // ── Control accessors ─────────────────────────────────────────────

  get ctrl() {
    return {
      person_type:      this.form.get('person_type'),
      document_type:    this.form.get('document_type'),
      document_number:  this.form.get('document_number'),
      first_name:       this.form.get('first_name'),
      second_name:      this.form.get('second_name'),
      last_name:        this.form.get('last_name'),
      second_last_name: this.form.get('second_last_name'),
      legal_name:       this.form.get('legal_name'),
      email:            this.form.get('email'),
      phone_number:     this.form.get('phone_number'),
      country:          this.form.get('country'),
      state:            this.form.get('state'),
      city:             this.form.get('city'),
      gender:           this.form.get('gender'),
      username:         this.form.get('username'),
      password:         this.form.get('password'),
      password_confirm: this.form.get('password_confirm'),
    };
  }

  // Suffix icons
  get emailSuffix(): string {
    if (this.checkingEmail())          return this.spinnerSvg;
    if (this.emailAvailable() === true)  return this.checkSvg;
    if (this.emailAvailable() === false) return this.crossSvg;
    return '';
  }

  get documentSuffix(): string {
    if (this.checkingDocument())          return this.spinnerSvg;
    if (this.documentAvailable() === true)  return this.checkSvg;
    if (this.documentAvailable() === false) return this.crossSvg;
    return '';
  }

  get passwordSuffix(): string {
    return this.showPassword()
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
           <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
           <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
           <line x1="1" y1="1" x2="23" y2="23"/>
         </svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
           <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
           <circle cx="12" cy="12" r="3"/>
         </svg>`;
  }
  // user-form.component.ts

// ── Señal reactiva del valor del password ─────────────────────────
private passwordVal = signal('');

// En ngOnInit, después de buildForm():
private listenPasswordChanges(): void {
  this.form.get('password')!.valueChanges
    .pipe(takeUntil(this.destroy$))
    .subscribe((val: string) => this.passwordVal.set(val ?? ''));
}

// Computed basados en la señal (reactivos correctamente)
readonly pwdHasMinLength = computed(
  () => this.passwordVal().length >= 8
);

readonly pwdHasUppercase = computed(
  () => /[A-Z]/.test(this.passwordVal())
);

readonly pwdHasNumber = computed(
  () => /[0-9]/.test(this.passwordVal())
);
  
  togglePassword(): void      { this.showPassword.update((v) => !v); }
  togglePasswordConfirm(): void { this.showPasswordConfirm.update((v) => !v); }

  get passwordInputType(): string { return this.showPassword() ? 'text' : 'password'; }
  get passwordConfirmType(): string { return this.showPasswordConfirm() ? 'text' : 'password'; }
}