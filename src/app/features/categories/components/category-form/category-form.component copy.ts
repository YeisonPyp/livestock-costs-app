import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { FormCardComponent }   from '../../../../shared/components/forms/form-card/form-card.component';
import { InputFieldComponent } from '../../../../shared/components/forms/input-field/input-field.component';
import { SelectFieldComponent } from '../../../../shared/components/forms/select-field/select-field.component';
import { CheckboxToggleComponent } from '../../../../shared/components/forms/checkbox-toggle/checkbox-toggle.component';
import { AlertComponent }      from '../../../../shared/components/display/alert/alert.component';
import { LoaderComponent }     from '../../../../shared/components/loader/loader.component';

import { CategoryService } from '../../services/category.service';
import { Category } from '../../models/cost.model';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    PageHeaderComponent, FormCardComponent, InputFieldComponent,
    SelectFieldComponent, CheckboxToggleComponent, AlertComponent, LoaderComponent,
  ],
  templateUrl: './category-form.component.html',
  styleUrl:    './category-form.component.scss',
})
export class CategoryFormComponent implements OnInit {
  private svc      = inject(CategoryService);
  private fb       = inject(FormBuilder);
  private router   = inject(Router);
  private route    = inject(ActivatedRoute);
  private snack    = inject(MatSnackBar);

  // ── State ──────────────────────────────────────────────────────────────────
  categories  = signal<Category[]>([]);
  loading     = signal(true);
  saving      = signal(false);
  error       = signal('');

  editId: number | null  = null;
  parentId: number | null = null;
  get isEdit(): boolean { return this.editId !== null; }

  // ── Form ───────────────────────────────────────────────────────────────────
  form = this.fb.group({
    code:        ['', [Validators.required, Validators.maxLength(20)]],
    name:        ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(255)]],
    parent:      [null as number | null],
    level:       [1,  [Validators.required, Validators.min(1)]],
    is_movement: [false],
    is_active:   [true],
    color:       ['#94a3b8'],
  });

  ngOnInit(): void {
    this.loadCategories();

    // Edit mode: /categories/:id/edit
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') this.editId = +id;

    // Pre-set parent from query param: /categories/new?parent=3
    const pId = this.route.snapshot.queryParamMap.get('parent');
    if (pId) this.parentId = +pId;

    // Listen parent changes → auto-fill level
    this.form.get('parent')!.valueChanges.subscribe(parentId => {
      this.onParentChange(parentId);
    });
  }

  private loadCategories(): void {
    this.svc.getAll().subscribe({
      next: (r) => {
        if (r.success) this.categories.set(r.data);
        this.onCategoriesLoaded();
      },
      error: () => this.onCategoriesLoaded(),
    });
  }

  private onCategoriesLoaded(): void {
    this.loading.set(false);

    if (this.editId) {
      this.loadForEdit();
    } else {
      // Set parent from query param
      if (this.parentId) {
        this.form.patchValue({ parent: this.parentId });
      }
      // Auto-fill next code
      this.fetchNextCode(this.parentId ?? undefined);
    }
  }

  private loadForEdit(): void {
    this.loading.set(true);
    this.svc.getById(this.editId!).subscribe({
      next: (r) => {
        if (r.success) {
          this.form.patchValue({
            code:        r.data.code,
            name:        r.data.name,
            description: r.data.description ?? '',
            parent:      r.data.parent ?? null,
            level:       r.data.level,
            is_movement: r.data.is_movement,
            is_active:   r.data.is_active,
            color:       r.data.color ?? '#94a3b8',
          });
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private fetchNextCode(parentId?: number): void {
    this.svc.getNextCode(parentId).subscribe({
      next: (r) => { if (r.success && !this.form.value.code) this.form.patchValue({ code: r.data }); },
    });
  }

  private onParentChange(parentId: number | null): void {
    if (parentId) {
      const parent = this.categories().find(c => c.id === +parentId);
      if (parent) this.form.patchValue({ level: parent.level + 1 }, { emitEvent: false });
      this.fetchNextCode(+parentId);
    } else {
      this.form.patchValue({ level: 1 }, { emitEvent: false });
      this.fetchNextCode();
    }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.saving.set(true);
    this.error.set('');

    const payload: Partial<Category> = {
      ...(this.form.value as any),
      parent: this.form.value.parent ?? null,
    };

    const request = this.isEdit
      ? this.svc.update(this.editId!, payload)
      : this.svc.create(payload);

    request.subscribe({
      next: (r) => {
        this.snack.open(r.message || (this.isEdit ? 'Categoría actualizada' : 'Categoría creada'), 'Cerrar', { duration: 3000 });
        this.router.navigate(['/costs/categories']);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Error al guardar la categoría');
        this.saving.set(false);
      },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  get parentOptions(): { value: number; label: string }[] {
    return this.categories()
      .filter(c => !this.editId || c.id !== this.editId)
      .map(c => ({ value: c.id, label: `${'  '.repeat(c.level)}${c.code} – ${c.name}` }));
  }

  hasError(field: string, err: string): boolean {
    const c = this.form.get(field);
    return !!(c?.hasError(err) && c.touched);
  }
}