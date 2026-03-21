import {
  Component,
  inject,
  input,
  output,
  OnInit,
  OnDestroy,
  effect,
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

import { PersonService } from '../../services/person.service';
import { CatalogService } from '../../services/catalog.service';
import {
  Person,
  DocumentType,
  Country,
  State,
  City,
  Gender,
} from '../../models/user.model';

// ─── Shared UI components ─────────────────────────────────────────────────────
import { FormCardComponent } from '../../../../shared/components/forms/form-card/form-card.component';
import { InputFieldComponent } from '../../../../shared/components/forms/input-field/input-field.component';
import { SelectFieldComponent, SelectOption } from '../../../../shared/components/forms/select-field/select-field.component';

export type PersonFormMode = 'create' | 'edit';

@Component({
  selector: 'app-person-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormCardComponent,
    InputFieldComponent,
    SelectFieldComponent,
  ],
  templateUrl: './person-form.component.html',
  styleUrl: './person-form.component.scss',
})
export class PersonFormComponent implements OnInit, OnDestroy {
  // ─── Inputs ───────────────────────────────────────────────────────────────
  mode    = input<PersonFormMode>('create');
  person  = input<Person | null>(null);
  loading = input<boolean>(false);

  // ─── Outputs ──────────────────────────────────────────────────────────────
  formSubmit = output<Partial<Person>>();
  formCancel = output<void>();

  // ─── Services ─────────────────────────────────────────────────────────────
  private fb             = inject(FormBuilder);
  private personService  = inject(PersonService);
  private catalogService = inject(CatalogService);

  // ─── State ────────────────────────────────────────────────────────────────
  form!: FormGroup;
  private destroy$ = new Subject<void>();

  // Catalog data — raw
  documentTypes = signal<DocumentType[]>([]);
  countries     = signal<Country[]>([]);
  states        = signal<State[]>([]);
  cities        = signal<City[]>([]);
  genders       = signal<Gender[]>([]);

  // Catalog data — mapped to SelectOption[] for app-select-field
  documentTypeOptions = computed<SelectOption[]>(() =>
    this.documentTypes().map(d => ({ label: d.name, value: d.code }))
  );
  countryOptions = computed<SelectOption[]>(() =>
    this.countries().map(c => ({ label: c.name, value: c.code }))
  );
  stateOptions = computed<SelectOption[]>(() =>
    this.states().map(s => ({ label: s.name, value: s.code }))
  );
  cityOptions = computed<SelectOption[]>(() =>
    this.cities().map(c => ({ label: c.name, value: c.code }))
  );
  genderOptions = computed<SelectOption[]>(() =>
    this.genders().map(g => ({ label: g.name, value: g.code }))
  );

  // Loading states
  loadingCatalogs = signal(false);
  loadingStates   = signal(false);
  loadingCities   = signal(false);
  submitting      = signal(false);

  // Async validation state
  emailAvailable    = signal<boolean | null>(null);
  documentAvailable = signal<boolean | null>(null);
  checkingEmail     = signal(false);
  checkingDocument  = signal(false);

  // Reactive person_type as signal (kept in sync with form control)
  personTypeValue = signal<'N' | 'J'>('N');

  // Computed helpers
  isEditMode  = computed(() => this.mode() === 'edit');
  isNatural   = computed(() => this.personTypeValue() === 'N');
  isJuridical = computed(() => this.personTypeValue() === 'J');

  // ─── Control accessors (passed to [control] in app-input-field / app-select-field) ──
  get ctrl() {
    return {
      document_type:    this.form.get('document_type'),
      document_number:  this.form.get('document_number'),
      first_name:       this.form.get('first_name'),
      second_name:      this.form.get('second_name'),
      last_name:        this.form.get('last_name'),
      second_last_name: this.form.get('second_last_name'),
      legal_name:       this.form.get('legal_name'),
      email:            this.form.get('email'),
      phone_number:     this.form.get('phone_number'),
      address:          this.form.get('address'),
      country:          this.form.get('country'),
      state:            this.form.get('state'),
      city:             this.form.get('city'),
      gender:           this.form.get('gender'),
      birth_date:       this.form.get('birth_date'),
    };
  }

  // Async validation errors surfaced as external messages to app-input-field
  get emailExtraError(): string {
    return this.emailAvailable() === false ? 'Este correo ya está registrado.' : '';
  }
  get documentExtraError(): string {
    return this.documentAvailable() === false ? 'Este documento ya está registrado.' : '';
  }

  // Suffix icons for async validation feedback
  get emailSuffixIcon(): string {
    if (this.checkingEmail()) return this.spinnerSvg;
    if (this.emailAvailable() === true)  return this.checkSvg;
    if (this.emailAvailable() === false) return this.crossSvg;
    return '';
  }
  get documentSuffixIcon(): string {
    if (this.checkingDocument()) return this.spinnerSvg;
    if (this.documentAvailable() === true)  return this.checkSvg;
    if (this.documentAvailable() === false) return this.crossSvg;
    return '';
  }

  private checkSvg  = `<svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  private crossSvg  = `<svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  private spinnerSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin .7s linear infinite"><circle cx="12" cy="12" r="10" stroke-opacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="1"/></svg>`;

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  constructor() {
    effect(() => {
      const p = this.person();
      if (p && this.form) this.patchForm(p);
    });
  }

  ngOnInit(): void {
    this.buildForm();
    this.loadCatalogs();
    this.setupAsyncValidations();
    this.setupCascadeSelects();
    this.listenPersonType();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Form Setup ───────────────────────────────────────────────────────────

  private buildForm(): void {
    this.form = this.fb.group({
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
      address:          ['', Validators.maxLength(200)],
      country:          [''],
      state:            [''],
      city:             [''],
      gender:           [''],
      birth_date:       [''],
    });
  }

  private listenPersonType(): void {
    this.form.get('person_type')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((type: 'N' | 'J') => {
        this.personTypeValue.set(type);
        this.applyPersonTypeValidations(type);
      });
    this.applyPersonTypeValidations('N');
  }

  private applyPersonTypeValidations(type: 'N' | 'J'): void {
    if (type === 'N') {
      this.setRequired('first_name', true);
      this.setRequired('last_name',  true);
      this.setRequired('legal_name', false);
    } else {
      this.setRequired('first_name', false);
      this.setRequired('last_name',  false);
      this.setRequired('legal_name', true);
    }
  }

  private setRequired(name: string, required: boolean): void {
    const ctrl = this.form.get(name);
    if (!ctrl) return;
    if (required) ctrl.addValidators(Validators.required);
    else ctrl.clearValidators();
    ctrl.updateValueAndValidity({ emitEvent: false });
  }

  private patchForm(person: Person): void {
    this.personTypeValue.set(person.person_type ?? 'N');
    this.form.patchValue({
      person_type:      person.person_type,
      document_type:    person.document_type?.code  ?? '',
      document_number:  person.document_number,
      first_name:       person.first_name,
      second_name:      person.second_name           ?? '',
      last_name:        person.last_name,
      second_last_name: person.second_last_name      ?? '',
      legal_name:       person.legal_name            ?? '',
      email:            person.email,
      phone_number:     person.phone_number          ?? '',
      address:          person.address               ?? '',
      country:          person.country?.code         ?? '',
      state:            person.state?.code           ?? '',
      city:             person.city?.code            ?? '',
      gender:           person.gender?.code          ?? '',
      birth_date:       (person as any).birth_date   ?? '',
    });
  }

  // ─── Catalogs ─────────────────────────────────────────────────────────────

  private loadCatalogs(): void {
    this.loadingCatalogs.set(true);

    this.catalogService.getDocumentTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: res => this.documentTypes.set(res.data ?? []) });

    this.catalogService.getCountries()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => { this.countries.set(res.data ?? []); this.loadingCatalogs.set(false); },
        error: () => this.loadingCatalogs.set(false),
      });

    this.catalogService.getGenders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: (res: any) => this.genders.set(res.data ?? []) });
  }

  // ─── Cascade Selects ──────────────────────────────────────────────────────

  private setupCascadeSelects(): void {
    this.form.get('country')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((code: string) => {
        this.form.get('state')!.setValue('', { emitEvent: false });
        this.form.get('city')!.setValue('',  { emitEvent: false });
        this.states.set([]); this.cities.set([]);
        if (!code) return;
        this.loadingStates.set(true);
        this.catalogService.getStatesByCountry(code).pipe(takeUntil(this.destroy$)).subscribe({
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
        this.catalogService.getCitiesByState(code).pipe(takeUntil(this.destroy$)).subscribe({
          next: (res: any) => { this.cities.set(res.data ?? []); this.loadingCities.set(false); },
          error: () => this.loadingCities.set(false),
        });
      });
  }

  // ─── Async Validations ────────────────────────────────────────────────────

  private setupAsyncValidations(): void {
    this.form.get('email')!.valueChanges
      .pipe(debounceTime(600), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(email => {
        if (!email || this.form.get('email')!.invalid) { this.emailAvailable.set(null); return; }
        if (this.isEditMode() && email === this.person()?.email) { this.emailAvailable.set(null); return; }
        this.checkingEmail.set(true);
        this.personService.validateEmail(email).pipe(takeUntil(this.destroy$)).subscribe({
          next: res => { this.emailAvailable.set(res.data?.available ?? false); this.checkingEmail.set(false); },
          error: () => { this.emailAvailable.set(null); this.checkingEmail.set(false); },
        });
      });

    this.form.get('document_number')!.valueChanges
      .pipe(debounceTime(600), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(doc => {
        if (!doc || this.form.get('document_number')!.invalid) { this.documentAvailable.set(null); return; }
        if (this.isEditMode() && doc === this.person()?.document_number) { this.documentAvailable.set(null); return; }
        this.checkingDocument.set(true);
        this.personService.validateDocument(doc).pipe(takeUntil(this.destroy$)).subscribe({
          next: res => { this.documentAvailable.set(res.data?.available ?? false); this.checkingDocument.set(false); },
          error: () => { this.documentAvailable.set(null); this.checkingDocument.set(false); },
        });
      });
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.form.invalid || this.submitting()) return;
    const raw = this.form.getRawValue();

    // La API espera strings planos, no objetos { code }
    const payload: Record<string, any> = {
      person_type:     raw.person_type,
      document_type:   raw.document_type   || undefined,   // "CC", "NIT", etc.
      document_number: raw.document_number,
      email:           raw.email,
      phone_number:    raw.phone_number    || undefined,
      address:         raw.address         || undefined,
      country:         raw.country         || undefined,   // "COL"
      state:           raw.state           || undefined,
      city:            raw.city            || undefined,
      gender:          raw.gender          || undefined,   // "M", "F"
      birth_date:      raw.birth_date      || undefined,   // "YYYY-MM-DD"
    };

    if (raw.person_type === 'N') {
      payload['first_name']       = raw.first_name;
      payload['second_name']      = raw.second_name      || '';
      payload['last_name']        = raw.last_name;
      payload['second_last_name'] = raw.second_last_name || '';
    } else {
      payload['legal_name'] = raw.legal_name;
    }

    // Elimina claves undefined para no ensuciar el body
    const clean = Object.fromEntries(
      Object.entries(payload).filter(([_, v]) => v !== undefined)
    );

    this.formSubmit.emit(clean as Partial<Person>);
  }

  onCancel(): void { this.formCancel.emit(); }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  get submitLabel(): string {
    if (this.submitting()) return 'Guardando...';
    return this.isEditMode() ? 'Actualizar persona' : 'Crear persona';
  }
}