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

  /** Lista completa de categorías para el selector de padre */
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
    });
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
      is_movement: this.category.is_movement
    });

    return;
  }

  // ───────── CREATE MODE ─────────
  this.isEditMode = false;

  this.categoryForm.reset({
    code: '',
    name: '',
    description: '',
    parent: this.parentId ?? null,
    level: 1,
    is_movement: false
  });

  if (this.parentId) {
    this.updateLevelFromParent(this.parentId);
    this.fetchNextCode(this.parentId);
  } else {
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
        if (!parentId) {
          this.level?.setValue(1, { emitEvent: false });
          return;
        }

        const parent = this.parentsCategories().find((c) => c.id === parentId);

        if (!parent) return;

        // calcular nivel
        const newLevel = parent.level + 1;

        this.level?.setValue(newLevel, { emitEvent: false });

        // obtener código
        this.fetchNextCode(parentId);
      });
  }

  // ─── Lógica de nivel ─────────────────────────────────────────────────────────

  private updateLevelFromParent(parentId: string | null): void {

  if (!parentId) {
    this.categoryForm.get('level')!.setValue(1, { emitEvent: false });
    return;
  }

  const parent = this.parentsCategories().find(c => c.id === parentId);

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

            this.categoryForm.patchValue(
              { code },
              { emitEvent: false }
            );
          }

          this.isLoadingCode = false;
        },
        error: () => {
          this.isLoadingCode = false;
        }
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
  return this.parentsCategories().map(c => ({
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
