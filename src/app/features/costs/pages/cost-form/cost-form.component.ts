import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { FormCardComponent } from '../../../../shared/components/forms/form-card/form-card.component';
import { InputFieldComponent } from '../../../../shared/components/forms/input-field/input-field.component';
import { SelectFieldComponent } from '../../../../shared/components/forms/select-field/select-field.component';
import { AlertComponent } from '../../../../shared/components/display/alert/alert.component';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { AmountDisplayComponent } from '../../../../shared/components/bills/amount-display/amount-display.component';

import { CostService } from '../../services/cost.service';
import { CategoryService } from '../../services/category.service';
import { FarmService } from '../../../farms/services/farm.service';
import { Cost, Category } from '../../models/cost.model';
import { FarmsSimple } from '../../../farms/models/farm.model';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-cost-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    PageHeaderComponent,
    FormCardComponent,
    InputFieldComponent,
    SelectFieldComponent,
    AlertComponent,
    LoaderComponent,
    AmountDisplayComponent,
  ],
  templateUrl: './cost-form.component.html',
  styleUrl: './cost-form.component.scss',
})
export class CostFormComponent implements OnInit {
  private costSvc = inject(CostService);
  private catSvc = inject(CategoryService);
  private farmSvc = inject(FarmService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notSvc = inject(NotificationService);

  // ── State ──────────────────────────────────────────────────────────────────
  movableCategories = signal<Category[]>([]);
  listFarms = signal<FarmsSimple[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal('');

  editId: string | null = null;
  get isEdit(): boolean {
    return this.editId !== null;
  }

  today = new Date().toISOString().split('T')[0];

  // ── Form ───────────────────────────────────────────────────────────────────
  form = this.fb.nonNullable.group({
    category: ['', Validators.required],
    farm: ['', Validators.required],
    date: [this.today, Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    description: ['', [Validators.required, Validators.maxLength(500)]],
    notes: ['', [Validators.maxLength(1000)]],
  });

  ngOnInit(): void {
    this.loading.set(true);

    this.catSvc.getMovable().subscribe({
      next: (r) => {
        if (r.success) this.movableCategories.set(r.data);
        this.afterCatsLoaded();
      },
      error: () => this.afterCatsLoaded(),
    });

    this.farmSvc.getListSimple().subscribe({
      next: (r) => {
        if (r.success) this.listFarms.set(r.data);
      },
    });
  }

  private afterCatsLoaded(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.editId = id;
      this.loadForEdit();
    } else {
      this.loading.set(false);
    }
  }

  private loadForEdit(): void {
    this.costSvc.getById(this.editId!).subscribe({
      next: (r) => {
        if (r.success) {
          const cost = r.data;

          this.form.patchValue({
            category: cost.category,
            farm: cost.farm,
            date: cost.date,
            amount: Number(cost.amount),
            description: cost.description,
            notes: cost.notes ?? '',
          });
        }

        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set('');

    const v = this.form.getRawValue();

    const payload: Partial<Cost> = {
      category: v.category,
      farm: v.farm,
      date: v.date,
      description: v.description,
      notes: v.notes,
      amount: Number(v.amount).toFixed(2),
    };

    const req = this.isEdit
      ? this.costSvc.update(this.editId!, payload)
      : this.costSvc.create(payload);

    req.subscribe({
      next: (r) => {
        if (r.success) {
          this.notSvc.success(
            r.message ||
              (this.isEdit ? 'Costo actualizado' : 'Costo registrado'),
          );
          this.router.navigate(['/costs/costs']);
        }
      },
      error: (error) => {
        console.error('Error save costs', error);
        this.notSvc.error(error?.error?.message || 'Error al guardar el costo');
        this.saving.set(false);
      },
    });
  }

  get selectedCategoryLabel(): string {
    const id = this.form.value.category;
    return this.categoryOptions.find((c) => c.value === id)?.label ?? '—';
  }

  get selectedFarmLabel(): string {
    const id = this.form.value.farm;
    return this.farmOptions.find((c) => c.value === id)?.label ?? '—';
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  get categoryOptions(): { value: string; label: string }[] {
    return this.movableCategories().map((c) => ({
      value: c.id,
      label: `${c.code} – ${c.name}`,
    }));
  }

  get farmOptions(): { value: string; label: string }[] {
    return this.listFarms().map((c) => ({
      value: c.id,
      label: `${c.code} – ${c.name}`,
    }));
  }

  get previewAmount(): number {
    const v = this.form.value.amount;
    return v ? Number(v) : 0;
  }

  hasError(field: string, err: string): boolean {
    const c = this.form.get(field);
    return !!(c?.hasError(err) && c.touched);
  }
}
