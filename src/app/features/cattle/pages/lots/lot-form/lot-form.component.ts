import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PageHeaderComponent }  from '../../../../../shared/components/page-header/page-header.component';
import { FormCardComponent }    from '../../../../../shared/components/forms/form-card/form-card.component';
import { InputFieldComponent }  from '../../../../../shared/components/forms/input-field/input-field.component';
import { SelectFieldComponent } from '../../../../../shared/components/forms/select-field/select-field.component';
import { AlertComponent }       from '../../../../../shared/components/display/alert/alert.component';
import { LoaderComponent }      from '../../../../../shared/components/loader/loader.component';

import { CattleService }   from '../../../services/cattle.service';
import { ApiService }      from '../../../../../core/services/api.service';
import { Lot }             from '../../../models/cattle.model';

@Component({
  selector: 'app-lot-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    PageHeaderComponent, FormCardComponent, InputFieldComponent,
    SelectFieldComponent, AlertComponent, LoaderComponent,
  ],
  templateUrl: './lot-form.component.html',
  styleUrl:    './lot-form.component.scss',
})
export class LotFormComponent implements OnInit {
  private svc    = inject(CattleService);
  private api    = inject(ApiService);
  private fb     = inject(FormBuilder);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private snack  = inject(MatSnackBar);

  farms   = signal<{ value: number; label: string }[]>([]);
  loading = signal(false);
  saving  = signal(false);
  error   = signal('');

  editId: number | null = null;
  get isEdit() { return this.editId !== null; }

  today = new Date().toISOString().split('T')[0];

  form = this.fb.group({
    name:        ['', [Validators.required, Validators.maxLength(100)]],
    code:        ['', [Validators.required, Validators.maxLength(30)]],
    farm:        [null as number | null, [Validators.required]],
    entry_date:  [this.today, [Validators.required]],
    description: [''],
  });

  ngOnInit(): void {
    // Load farms from core farms endpoint
    this.api.get<any[]>('/farms/').subscribe({
      next: (r: any) => {
        const data = r.data ?? r;
        this.farms.set(data.map((f: any) => ({ value: f.id, label: f.name })));
      },
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.editId = +id;
      this.loading.set(true);
      this.svc.getLotById(this.editId).subscribe({
        next: (r) => {
          if (r.success) this.form.patchValue(r.data as any);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.error.set('');

    const req = this.isEdit
      ? this.api.put<Lot>(`/v1/cattle/lots/${this.editId}/`, this.form.value)
      : this.svc.createLot(this.form.value as any);

    req.subscribe({
      next: (r: any) => {
        this.snack.open(r.message || (this.isEdit ? 'Lote actualizado' : 'Lote creado'), 'Cerrar', { duration: 3000 });
        this.router.navigate(['/cattle/lots']);
      },
      error: (e: any) => { this.error.set(e?.error?.message || 'Error al guardar'); this.saving.set(false); },
    });
  }

  hasError(f: string, e: string): boolean {
    const c = this.form.get(f);
    return !!(c?.hasError(e) && c.touched);
  }
}