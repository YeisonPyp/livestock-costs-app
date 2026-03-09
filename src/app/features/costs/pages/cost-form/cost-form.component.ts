import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PageHeaderComponent }     from '../../../../shared/components/page-header/page-header.component';
import { FormCardComponent }       from '../../../../shared/components/forms/form-card/form-card.component';
import { InputFieldComponent }     from '../../../../shared/components/forms/input-field/input-field.component';
import { SelectFieldComponent }    from '../../../../shared/components/forms/select-field/select-field.component';
import { AlertComponent }          from '../../../../shared/components/display/alert/alert.component';
import { LoaderComponent }         from '../../../../shared/components/loader/loader.component';
import { AmountDisplayComponent }  from '../../../../shared/components/bills/amount-display/amount-display.component';

import { CostService }     from '../../services/cost.service';
import { CategoryService } from '../../services/category.service';
import { Cost, Category }  from '../../models/cost.model';

@Component({
  selector: 'app-cost-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    PageHeaderComponent, FormCardComponent, InputFieldComponent,
    SelectFieldComponent, AlertComponent, LoaderComponent, AmountDisplayComponent,
  ],
  templateUrl: './cost-form.component.html',
  styleUrl:    './cost-form.component.scss',
})
export class CostFormComponent implements OnInit {
  private costSvc  = inject(CostService);
  private catSvc   = inject(CategoryService);
  private fb       = inject(FormBuilder);
  private router   = inject(Router);
  private route    = inject(ActivatedRoute);
  private snack    = inject(MatSnackBar);

  // ── State ──────────────────────────────────────────────────────────────────
  movableCategories = signal<Category[]>([]);
  loading  = signal(true);
  saving   = signal(false);
  error    = signal('');

  editId: number | null = null;
  get isEdit(): boolean { return this.editId !== null; }

  today = new Date().toISOString().split('T')[0];

  // ── Form ───────────────────────────────────────────────────────────────────
  form = this.fb.group({
    category:    [null as number | null, [Validators.required]],
    date:        [this.today, [Validators.required]],
    amount:      [null as number | null, [Validators.required, Validators.min(0.01)]],
    description: ['', [Validators.required, Validators.maxLength(500)]],
    notes:       ['', [Validators.maxLength(1000)]],
  });

  ngOnInit(): void {
    this.catSvc.getMovable().subscribe({
      next: (r) => { if (r.success) this.movableCategories.set(r.data); this.afterCatsLoaded(); },
      error: () => this.afterCatsLoaded(),
    });
  }

  private afterCatsLoaded(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.editId = +id;
      this.loadForEdit();
    } else {
      this.loading.set(false);
    }
  }

  private loadForEdit(): void {
    this.costSvc.getById(this.editId!).subscribe({
      next: (r) => {
        if (r.success) {
          this.form.patchValue({
            category:    r.data.category,
            date:        r.data.date,
            amount:      r.data.amount,
            description: r.data.description,
            notes:       r.data.notes ?? '',
          });
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.saving.set(true);
    this.error.set('');

    const payload: Partial<Cost> = this.form.value as any;

    const req = this.isEdit
      ? this.costSvc.update(this.editId!, payload)
      : this.costSvc.create(payload);

    req.subscribe({
      next: (r) => {
        this.snack.open(r.message || (this.isEdit ? 'Costo actualizado' : 'Costo registrado'), 'Cerrar', { duration: 3000 });
        this.router.navigate(['/costs']);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Error al guardar');
        this.saving.set(false);
      },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  get categoryOptions(): { value: number; label: string }[] {
    return this.movableCategories().map(c => ({
      value: c.id,
      label: `${c.code} – ${c.name}`,
    }));
  }

  get previewAmount(): number {
    return Number(this.form.value.amount) || 0;
  }

  hasError(field: string, err: string): boolean {
    const c = this.form.get(field);
    return !!(c?.hasError(err) && c.touched);
  }
}