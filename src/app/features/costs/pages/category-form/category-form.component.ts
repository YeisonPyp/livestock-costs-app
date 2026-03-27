import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { Category } from '../../models/cost.model';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CategoryService } from '../../services/category.service';
import { SelectFieldComponent } from '../../../../shared/components/forms/select-field/select-field.component';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    SelectFieldComponent,
  ],
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.scss'],
})
export class CategoryFormComponent implements OnInit, OnChanges, OnDestroy {
  /** Pasar una categoría existente activa el modo edición automáticamente */
  @Input() category: Category | null = null;
  @Input() categories: Category[] = [];
  /** Controla el estado de carga del botón submit */
  @Input() isSubmitting = false;
  @Input() parentId: string | null = null;
  /** Emite los datos del formulario listos para crear o actualizar */
  @Output() save = new EventEmitter<Partial<Category>>();
  /** Emite cuando el usuario cancela */
  @Output() cancel = new EventEmitter<void>();

  categoryForm!: FormGroup;
  isEditMode = false;
  isLoadingCode = false;
  parentsCategories = signal<Category[]>([]);

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.initFormData();
    this.setupParentChangeListener();
    this.categoryService.getParents().subscribe({
      next: (r) => {
        if (r.success) this.parentsCategories.set(r.data);
      },
    });
  }

  /**
   * Permite reutilizar el mismo componente instanciado si el padre
   * cambia el @Input() category (ej: abrir edición de otro registro
   * sin destruir/recrear el componente).
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['category'] &&
      !changes['category'].firstChange &&
      this.categoryForm
    ) {
      this.initFormData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Inicialización ──────────────────────────────────────────────────────────

  private buildForm(): void {
    this.categoryForm = this.fb.group({
      parent: [null as string | null],
      code: [{ value: '', disabled: true }, Validators.required],
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(255)]],
      level: [{ value: 1, disabled: true }],
      is_movement: [false],
      category_type: [
        { value: 'expense', disabled: true },
        Validators.required,
      ],
    });
  }

  get categoryTypeOptions() {
    return [
      { value: 'expense', label: 'Gasto' },
      { value: 'income', label: 'Ingreso' },
    ];
  }

  private initFormData(): void {
    // ───────── EDIT MODE ─────────
    if (this.category) {
  this.isEditMode = true;

  this.categoryForm.patchValue({
    code: this.category.code,
    name: this.category.name,
    description: this.category.description ?? '',
    parent: this.category.parent ?? null,
    level: this.category.level,
    is_movement: this.category.is_movement,
    category_type: this.category.category_type ?? 'expense',
  });

  // 👇 manejar estado correcto
  if (this.category.parent) {
    this.categoryForm.get('category_type')?.disable({ emitEvent: false });
  } else {
    this.categoryForm.get('category_type')?.enable({ emitEvent: false });
  }

  return;
}

    // ───────── CREATE MODE ─────────
    this.isEditMode = false;

    this.categoryForm.reset();

    this.categoryForm.patchValue({
      parent: this.parentId ?? null,
      level: 1,
      is_movement: false,
      category_type: 'expense',
    });

    // 👇 manejar estado del campo tipo
    if (this.parentId) {
      this.categoryForm.get('category_type')?.disable();
      this.updateLevelFromParent(this.parentId);
      this.fetchNextCode(this.parentId);
    } else {
      this.categoryForm.get('category_type')?.enable();
      this.fetchNextCode();
    }
  }

  // ─── Listeners ───────────────────────────────────────────────────────────────

private setupParentChangeListener(): void {
  this.categoryForm
    .get('parent')!
    .valueChanges.pipe(
      debounceTime(100),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    )
    .subscribe((parentId) => {

      const typeCtrl = this.categoryForm.get('category_type');
      const levelCtrl = this.categoryForm.get('level');

      // ───── SIN PADRE ─────
      if (!parentId) {
        levelCtrl?.setValue(1, { emitEvent: false });

        // 👇 habilitar tipo (usuario decide)
        typeCtrl?.enable({ emitEvent: false });
        typeCtrl?.setValue('expense', { emitEvent: false });

        if (!this.isEditMode) {
          this.fetchNextCode();
        }

        return;
      }

      // ───── CON PADRE ─────
      const parent = this.parentsCategories().find((c) => c.id === parentId);
      if (!parent) return;

      // nivel
      levelCtrl?.setValue(parent.level + 1, { emitEvent: false });

      // 👇 heredar tipo + BLOQUEAR
      typeCtrl?.setValue(parent.category_type, { emitEvent: false });
      typeCtrl?.disable({ emitEvent: false });

      // código
      if (!this.isEditMode) {
        this.fetchNextCode(parentId);
      }
    });
}

  // ─── Lógica de nivel ─────────────────────────────────────────────────────────

  private updateLevelFromParent(parentId: string | null): void {
    if (!parentId) {
      this.categoryForm.get('level')!.setValue(1, { emitEvent: false });
      return;
    }

    const parent = this.parentsCategories().find((c) => c.id === parentId);
    const newLevel = parent ? parent.level + 1 : 1;
    this.categoryForm.get('level')!.setValue(newLevel, { emitEvent: false });
  }

  // ─── Código automático ───────────────────────────────────────────────────────

  private fetchNextCode(parentId?: string): void {
    this.isLoadingCode = true;

    this.categoryService
      .getNextCode(parentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            const code = response.data.next_code;
            this.categoryForm.patchValue({ code }, { emitEvent: false });
          }
          this.isLoadingCode = false;
        },
        error: () => {
          this.isLoadingCode = false;
        },
      });
  }

  // ─── Submit / Cancel ─────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    // getRawValue() incluye controles disabled (level)
    const raw = this.categoryForm.getRawValue();

    const payload: Partial<Category> = {
      code: raw.code,
      name: raw.name,
      description: raw.description ?? '',
      parent: raw.parent ? raw.parent : null,
      level: raw.level,
      is_movement: raw.is_movement,
      category_type: raw.category_type,
    };
    this.save.emit(payload);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  // ─── Helpers de template ─────────────────────────────────────────────────────

  /** Excluye la categoría en edición para evitar auto-referencia como padre */
  get availableParentCategories(): Category[] {
    return this.isEditMode
      ? this.categories.filter((c) => c.id !== this.category?.id)
      : this.categories;
  }

  hasError(field: string, error: string): boolean {
    const ctrl = this.categoryForm.get(field);
    return !!(ctrl?.hasError(error) && ctrl.touched);
  }

  get categoryOptions() {
    return this.parentsCategories().map((c) => ({
      value: c.id,
      label: `${c.code} – ${c.name}`,
    }));
  }

  // ─── Accesores de controles (usados en template) ──────────────────────────────
  get code() {
    return this.categoryForm.get('code');
  }
  get name() {
    return this.categoryForm.get('name');
  }
  get description() {
    return this.categoryForm.get('description');
  }
  get parent() {
    return this.categoryForm.get('parent');
  }
  get level() {
    return this.categoryForm.get('level');
  }
  get is_movement() {
    return this.categoryForm.get('is_movement');
  }
}
