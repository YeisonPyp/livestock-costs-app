// src/features/users/pages/person-form/person-form.component.ts
import {
  Component,
  inject,
  input,
  output,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
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
import {
  Subject,
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  forkJoin,
} from 'rxjs';

import { PersonService }  from '../../services/person.service';
import { CatalogService } from '../../services/catalog.service';
import {
  Person,
  PersonCreatePayload,
  DocumentType,
  Country,
  State,
  City,
  Gender,
  PersonType,
} from '../../models/user.model';

import { FormCardComponent }   from '../../../../shared/components/forms/form-card/form-card.component';
import { InputFieldComponent } from '../../../../shared/components/forms/input-field/input-field.component';
import {
  SelectFieldComponent,
  SelectOption,
} from '../../../../shared/components/forms/select-field/select-field.component';

export type PersonFormMode = 'create' | 'edit';

// ── Secciones para el tracker de progreso ─────────────────────────
interface FormSection {
  id:       string;
  label:    string;
  fields:   string[];
  optional: boolean;
}

const FORM_SECTIONS: FormSection[] = [
  {
    id:       'identification',
    label:    'Identificación',
    fields:   ['document_type', 'document_number'],
    optional: false,
  },
  {
    id:       'names',
    label:    'Nombres',
    fields:   ['first_name', 'last_name'],
    optional: false,
  },
  {
    id:       'contact',
    label:    'Contacto',
    fields:   ['email'],
    optional: false,
  },
  {
    id:       'location',
    label:    'Ubicación',
    fields:   ['country', 'state', 'city'],
    optional: true,
  },
];

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
  styleUrl:    './person-form.component.scss',
})
export class PersonFormComponent implements OnInit, OnDestroy, OnChanges {

  // ── Inputs ────────────────────────────────────────────────────────
  mode      = input<PersonFormMode>('create');
  person    = input<Person | null>(null);
  loading   = input<boolean>(false);
  /** Modo compacto: oculta tarjetas y muestra todo en un grid plano */
  compact   = input<boolean>(false);
  /** Muestra el toggle "Crear usuario automáticamente" */
  showCreateUserToggle = input<boolean>(false);

  // ── Outputs ───────────────────────────────────────────────────────
  formSubmit = output<Partial<PersonCreatePayload>>();
  formCancel = output<void>();

  // ── Services ──────────────────────────────────────────────────────
  private fb             = inject(FormBuilder);
  private personService  = inject(PersonService);
  private catalogService = inject(CatalogService);
  private destroy$       = new Subject<void>();

  // ── Form ──────────────────────────────────────────────────────────
  form!: FormGroup;

  // ── Catalogs ──────────────────────────────────────────────────────
  documentTypes = signal<DocumentType[]>([]);
  countries     = signal<Country[]>([]);
  states        = signal<State[]>([]);
  cities        = signal<City[]>([]);
  genders       = signal<Gender[]>([]);

  documentTypeOptions = computed<SelectOption[]>(() =>
    this.documentTypes().map((d) => ({ label: `${d.name}`, value: d.code }))
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

  // ── Loading states ────────────────────────────────────────────────
  loadingCatalogs = signal(false);
  loadingStates   = signal(false);
  loadingCities   = signal(false);
  submitting      = signal(false);
  catalogsLoaded  = signal(false);

  // ── Async validation ──────────────────────────────────────────────
  emailAvailable    = signal<boolean | null>(null);
  documentAvailable = signal<boolean | null>(null);
  checkingEmail     = signal(false);
  checkingDocument  = signal(false);

  // ── UI state ──────────────────────────────────────────────────────
  personTypeValue  = signal<PersonType>('N');
  createUserToggle = signal(false);
  showSummary      = signal(false);

  // ── Computed ──────────────────────────────────────────────────────
  isEditMode  = computed(() => this.mode() === 'edit');
  isNatural   = computed(() => this.personTypeValue() === 'N');
  isJuridical = computed(() => this.personTypeValue() === 'J');

  /** Porcentaje de completitud del formulario (0-100) */
  formProgress = computed(() => {
    if (!this.form) return 0;
    const required = this.getRequiredFields();
    const filled   = required.filter((f) => {
      const val = this.form.get(f)?.value;
      return val !== null && val !== undefined && val !== '';
    });
    return Math.round((filled.length / required.length) * 100);
  });

  /** Puede enviar si el form es válido y no hay errores async pendientes */
  canSubmit = computed(() => {
    if (!this.form) return false;
    if (this.form.invalid)               return false;
    if (this.submitting() || this.loading()) return false;
    if (this.emailAvailable() === false)    return false;
    if (this.documentAvailable() === false) return false;
    if (this.checkingEmail())               return false;
    if (this.checkingDocument())            return false;
    return true;
  });

  /** Mensaje explicando por qué no se puede enviar */
  submitBlockReason = computed(() => {
    if (!this.form) return '';
    if (this.emailAvailable() === false)    return 'El correo ya está registrado';
    if (this.documentAvailable() === false) return 'El documento ya está registrado';
    if (this.checkingEmail())               return 'Verificando correo...';
    if (this.checkingDocument())            return 'Verificando documento...';
    if (this.form.invalid)                  return 'Completa los campos requeridos';
    return '';
  });

  // ── Suffix icons ──────────────────────────────────────────────────
  private readonly checkSvg   = `<svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  private readonly crossSvg   = `<svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  private readonly spinnerSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="pf-icon-spin"><circle cx="12" cy="12" r="10" stroke-opacity=".2"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>`;

  get emailSuffixIcon(): string {
    if (this.checkingEmail())            return this.spinnerSvg;
    if (this.emailAvailable() === true)  return this.checkSvg;
    if (this.emailAvailable() === false) return this.crossSvg;
    return '';
  }

  get documentSuffixIcon(): string {
    if (this.checkingDocument())            return this.spinnerSvg;
    if (this.documentAvailable() === true)  return this.checkSvg;
    if (this.documentAvailable() === false) return this.crossSvg;
    return '';
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
      address:          this.form.get('address'),
      country:          this.form.get('country'),
      state:            this.form.get('state'),
      city:             this.form.get('city'),
      gender:           this.form.get('gender'),
      birth_date:       this.form.get('birth_date'),
    };
  }

  get submitLabel(): string {
    if (this.submitting() || this.loading()) return 'Guardando...';
    return this.isEditMode() ? 'Actualizar persona' : 'Crear persona';
  }

  // ── Lifecycle ─────────────────────────────────────────────────────

  ngOnInit(): void {
    this.buildForm();
    this.loadCatalogs();
    this.setupAsyncValidations();
    this.setupCascadeSelects();
    this.listenPersonType();
  }

  /**
   * OnChanges es más predecible que effect() para reaccionar
   * al input `person` cuando el componente ya está inicializado
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['person'] && this.form) {
      const p = changes['person'].currentValue as Person | null;
      if (p) {
        this.patchForm(p);
      } else {
        this.resetForm();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Form setup ────────────────────────────────────────────────────

  private buildForm(): void {
    this.form = this.fb.group({
      person_type:      ['N', Validators.required],
      document_type:    ['', Validators.required],
      document_number:  ['', [
        Validators.required,
        Validators.minLength(4),
        Validators.maxLength(20),
        Validators.pattern(/^[a-zA-Z0-9\-]+$/),
      ]],
      first_name:       ['', [Validators.required, Validators.maxLength(80)]],
      second_name:      ['', Validators.maxLength(80)],
      last_name:        ['', [Validators.required, Validators.maxLength(80)]],
      second_last_name: ['', Validators.maxLength(80)],
      legal_name:       ['', Validators.maxLength(200)],
      email:            ['', [Validators.required, Validators.email]],
      phone_number:     ['', [
        Validators.maxLength(20),
        Validators.pattern(/^[\+]?[\d\s\-\(\)]{0,20}$/),
      ]],
      address:          ['', Validators.maxLength(200)],
      country:          [''],
      state:            [''],
      city:             [''],
      gender:           [''],
      birth_date:       [''],
    });

    // Si person fue pasado antes del OnInit (poco común pero posible)
    const p = this.person();
    if (p) this.patchForm(p);
  }

  private listenPersonType(): void {
    this.form.get('person_type')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((type: PersonType) => {
        this.personTypeValue.set(type);
        this.applyPersonTypeValidations(type);
        // Limpiar campos del otro tipo
        if (type === 'N') {
          this.form.get('legal_name')!.setValue('', { emitEvent: false });
        } else {
          this.form.get('first_name')!.setValue('',       { emitEvent: false });
          this.form.get('second_name')!.setValue('',      { emitEvent: false });
          this.form.get('last_name')!.setValue('',        { emitEvent: false });
          this.form.get('second_last_name')!.setValue('', { emitEvent: false });
          this.form.get('gender')!.setValue('',           { emitEvent: false });
          this.form.get('birth_date')!.setValue('',       { emitEvent: false });
        }
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

  private patchForm(person: Person): void {
    // Sincronizar signal de tipo
    const type = person.person_type ?? 'N';
    this.personTypeValue.set(type);
    this.applyPersonTypeValidations(type);

    // Resolver FKs: el backend puede devolver el code directamente
    // o un objeto anidado dependiendo del serializer usado
    const resolveCode = (val: any): string => {
      if (!val) return '';
      if (typeof val === 'string') return val;
      if (typeof val === 'object' && 'code' in val) return val.code;
      return String(val);
    };

    this.form.patchValue({
      person_type:      type,
      document_type:    resolveCode(person.document_type),
      document_number:  person.document_number ?? '',
      first_name:       person.first_name       ?? '',
      second_name:      person.second_name       ?? '',
      last_name:        person.last_name         ?? '',
      second_last_name: person.second_last_name  ?? '',
      legal_name:       person.legal_name        ?? '',
      email:            person.email             ?? '',
      phone_number:     person.phone_number      ?? '',
      address:          person.address           ?? '',
      country:          resolveCode(person.country),
      state:            resolveCode(person.state),
      city:             resolveCode(person.city),
      gender:           resolveCode(person.gender),
      birth_date:       (person as any).birth_date ?? '',
    }, { emitEvent: false });

    // Cascada: si hay estado, cargar ciudades
    const countryCode = resolveCode(person.country);
    const stateCode   = resolveCode(person.state);

    if (countryCode) {
      this.loadingStates.set(true);
      this.catalogService
        .getStatesByCountry(countryCode)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: any) => {
            this.states.set(res.data ?? []);
            this.loadingStates.set(false);
            // Después de cargar estados, cargar ciudades si aplica
            if (stateCode) {
              this.loadingCities.set(true);
              this.catalogService
                .getCitiesByState(stateCode)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: (r: any) => { this.cities.set(r.data ?? []); this.loadingCities.set(false); },
                  error: ()      => this.loadingCities.set(false),
                });
            }
          },
          error: () => this.loadingStates.set(false),
        });
    }

    // Limpiar estado de validación async (el email/doc ya existe, es del mismo registro)
    this.emailAvailable.set(null);
    this.documentAvailable.set(null);
  }

  private resetForm(): void {
    this.form.reset({ person_type: 'N' });
    this.personTypeValue.set('N');
    this.states.set([]);
    this.cities.set([]);
    this.emailAvailable.set(null);
    this.documentAvailable.set(null);
  }

  // ── Catalogs ──────────────────────────────────────────────────────

  private loadCatalogs(): void {
    this.loadingCatalogs.set(true);

    // Cargar en paralelo con forkJoin
    forkJoin({
      documentTypes: this.catalogService.getDocumentTypes(),
      countries:     this.catalogService.getCountries(),
      genders:       this.catalogService.getGenders(),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results: any) => {
          this.documentTypes.set(results.documentTypes?.data ?? []);
          this.countries.set(results.countries?.data ?? []);
          this.genders.set(results.genders?.data ?? []);
          this.loadingCatalogs.set(false);
          this.catalogsLoaded.set(true);
        },
        error: () => {
          this.loadingCatalogs.set(false);
          this.catalogsLoaded.set(true); // igual marcamos como cargado para no bloquear
        },
      });
  }

  // ── Cascade selects ───────────────────────────────────────────────

  private setupCascadeSelects(): void {
    // País → limpiar y cargar estados
    this.form.get('country')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((code: string) => {
        this.form.get('state')!.setValue('', { emitEvent: false });
        this.form.get('city')!.setValue('',  { emitEvent: false });
        this.states.set([]);
        this.cities.set([]);

        if (!code) return;
        this.loadingStates.set(true);

        this.catalogService
          .getStatesByCountry(code)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res: any) => { this.states.set(res.data ?? []); this.loadingStates.set(false); },
            error: ()        => this.loadingStates.set(false),
          });
      });

    // Estado → limpiar y cargar ciudades
    this.form.get('state')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((code: string) => {
        this.form.get('city')!.setValue('', { emitEvent: false });
        this.cities.set([]);

        if (!code) return;
        this.loadingCities.set(true);

        this.catalogService
          .getCitiesByState(code)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res: any) => { this.cities.set(res.data ?? []); this.loadingCities.set(false); },
            error: ()        => this.loadingCities.set(false),
          });
      });
  }

  // ── Async validations ─────────────────────────────────────────────

  private setupAsyncValidations(): void {
    // Email
    this.form.get('email')!.valueChanges
      .pipe(debounceTime(600), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((email: string) => {
        // Si es el mismo email del registro en edición → no validar
        if (this.isEditMode() && email === this.person()?.email) {
          this.emailAvailable.set(null);
          return;
        }
        if (!email || this.form.get('email')!.hasError('email')) {
          this.emailAvailable.set(null);
          return;
        }

        this.checkingEmail.set(true);
        this.personService
          .validateEmail(email)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next:  (res) => { this.emailAvailable.set(res.data?.available ?? false); this.checkingEmail.set(false); },
            error: ()    => { this.emailAvailable.set(null); this.checkingEmail.set(false); },
          });
      });

    // Documento
    this.form.get('document_number')!.valueChanges
      .pipe(debounceTime(600), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((doc: string) => {
        if (this.isEditMode() && doc === this.person()?.document_number) {
          this.documentAvailable.set(null);
          return;
        }
        if (!doc || this.form.get('document_number')!.invalid) {
          this.documentAvailable.set(null);
          return;
        }

        this.checkingDocument.set(true);
        this.personService
          .validateDocument(doc)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next:  (res) => { this.documentAvailable.set(res.data?.available ?? false); this.checkingDocument.set(false); },
            error: ()    => { this.documentAvailable.set(null); this.checkingDocument.set(false); },
          });
      });
  }

  // ── Submit ────────────────────────────────────────────────────────

  onSubmit(): void {
    // Marcar todos los campos como touched para mostrar errores
    this.form.markAllAsTouched();

    if (!this.canSubmit()) return;

    const raw = this.form.getRawValue();

    const payload: Record<string, unknown> = {
      person_type:     raw.person_type,
      document_type:   raw.document_type  || undefined,
      document_number: raw.document_number,
      email:           raw.email,
      phone_number:    raw.phone_number   || undefined,
      address:         raw.address        || undefined,
      country:         raw.country        || undefined,
      state:           raw.state          || undefined,
      city:            raw.city           || undefined,
      gender:          raw.gender         || undefined,
      birth_date:      raw.birth_date     || undefined,
    };

    if (raw.person_type === 'N') {
      payload['first_name']       = raw.first_name;
      payload['second_name']      = raw.second_name      || undefined;
      payload['last_name']        = raw.last_name;
      payload['second_last_name'] = raw.second_last_name || undefined;
    } else {
      payload['legal_name'] = raw.legal_name;
    }

    // Flag para crear usuario automático
    if (this.showCreateUserToggle() && this.createUserToggle()) {
      payload['create_user'] = true;
    }

    // Limpiar undefined
    const clean = Object.fromEntries(
      Object.entries(payload).filter(([, v]) => v !== undefined)
    );

    this.formSubmit.emit(clean as Partial<PersonCreatePayload>);
  }

  onCancel(): void {
    this.formCancel.emit();
  }

  // ── Progress helper ───────────────────────────────────────────────

  private getRequiredFields(): string[] {
    const base = ['document_type', 'document_number', 'email'];
    if (this.isNatural()) return [...base, 'first_name', 'last_name'];
    return [...base, 'legal_name'];
  }

  getSectionStatus(section: FormSection): 'complete' | 'partial' | 'empty' {
    const fields = section.id === 'names' && this.isJuridical()
      ? ['legal_name']
      : section.fields;

    const filled = fields.filter((f) => {
      const val = this.form?.get(f)?.value;
      return val !== null && val !== undefined && val !== '';
    });

    if (filled.length === 0)            return 'empty';
    if (filled.length === fields.length) return 'complete';
    return 'partial';
  }

  hasAsyncError(field: 'email' | 'document'): boolean {
    if (field === 'email')    return this.emailAvailable() === false;
    if (field === 'document') return this.documentAvailable() === false;
    return false;
  }

  toggleCreateUser(): void {
    this.createUserToggle.update((v) => !v);
  }
}