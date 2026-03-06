import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PageHeaderComponent }  from '../../../../shared/components/page-header/page-header.component';
import { LoaderComponent }       from '../../../../shared/components/loader/loader.component';
import { FormCardComponent }     from '../../../../shared/components/forms/form-card/form-card.component';
import { InputFieldComponent }   from '../../../../shared/components/forms/input-field/input-field.component';
import { SelectFieldComponent, SelectOption } from '../../../../shared/components/forms/select-field/select-field.component';

import { FarmService } from '../../services/farm.service';
import { FARM_TYPES, FARM_STATUS } from '../../models/farm.model';

@Component({
  selector: 'app-farm-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    PageHeaderComponent,
    LoaderComponent,
    FormCardComponent,
    InputFieldComponent,
    SelectFieldComponent,
  ],
  templateUrl: './farm-form.component.html',
  styleUrl:    './farm-form.component.scss',
})
export class FarmFormComponent implements OnInit {
  private fb          = inject(FormBuilder);
  private router      = inject(Router);
  private route       = inject(ActivatedRoute);
  private farmService = inject(FarmService);
  private snackBar    = inject(MatSnackBar);

  form!: FormGroup;
  loading    = signal(false);
  saving     = signal(false);
  isEditMode = signal(false);
  farmId     = signal<string | null>(null);

  farmTypeOptions:   SelectOption[] = FARM_TYPES.map(t => ({ label: t.label, value: t.value }));
  farmStatusOptions: SelectOption[] = FARM_STATUS.map(s => ({ label: s.label, value: s.value }));

  get f() { return this.form.controls; }

  ngOnInit(): void {
    this.initForm();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.farmId.set(id);
      this.loadFarm(id);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      name:                ['', Validators.required],
      legal_name:          [''],
      farm_type:           ['', Validators.required],
      status:              ['active', Validators.required],
      description:         [''],
      address:             [''],
      latitude:            [null],
      longitude:           [null],
      altitude:            [null],
      total_area:          [null, [Validators.required, Validators.min(0.01)]],
      usable_area:         [null],
      forest_area:         [0],
      water_area:          [0],
      pasture_area:        [0],
      infrastructure_area: [0],
      cattle_capacity:     [0],
      carrying_capacity:   [null],
      phone:               [''],
      email:               ['', Validators.email],
      notes:               [''],
    });
  }

  private loadFarm(id: string): void {
    this.loading.set(true);
    this.farmService.getById(id).subscribe({
      next: (res) => {
        if (res.success) this.form.patchValue(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error al cargar la finca', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/farms']);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.saving.set(true);
    const data = this.form.value;
    const req$ = this.isEditMode()
      ? this.farmService.update(this.farmId()!, data)
      : this.farmService.create(data);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open(
          this.isEditMode() ? 'Finca actualizada exitosamente' : 'Finca creada exitosamente',
          'Cerrar', { duration: 3000 }
        );
        this.router.navigate(['/farms']);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err.error?.message || 'Error al guardar la finca';
        this.snackBar.open(msg, 'Cerrar', { duration: 3000 });
      },
    });
  }
}