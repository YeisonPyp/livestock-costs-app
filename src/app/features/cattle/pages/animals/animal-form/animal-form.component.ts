import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PageHeaderComponent }     from '../../../../../shared/components/page-header/page-header.component';
import { FormCardComponent }       from '../../../../../shared/components/forms/form-card/form-card.component';
import { InputFieldComponent }     from '../../../../../shared/components/forms/input-field/input-field.component';
import { SelectFieldComponent }    from '../../../../../shared/components/forms/select-field/select-field.component';
import { AlertComponent }          from '../../../../../shared/components/display/alert/alert.component';
import { LoaderComponent }         from '../../../../../shared/components/loader/loader.component';

import { CattleService } from '../../../services/cattle.service';
import { Breed, Color, Lot } from '../../../models/cattle.model';

@Component({
  selector: 'app-animal-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    PageHeaderComponent, FormCardComponent, InputFieldComponent,
    SelectFieldComponent, AlertComponent, LoaderComponent,
  ],
  templateUrl: './animal-form.component.html',
  styleUrl:    './animal-form.component.scss',
})
export class AnimalFormComponent implements OnInit {
  private svc    = inject(CattleService);
  private fb     = inject(FormBuilder);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private snack  = inject(MatSnackBar);

  breeds  = signal<Breed[]>([]);
  colors  = signal<Color[]>([]);
  lots    = signal<Lot[]>([]);
  loading = signal(true);
  saving  = signal(false);
  error   = signal('');

  editId: string | null = null;
  get isEdit() { return this.editId !== null; }

  today = new Date().toISOString().split('T')[0];

  form = this.fb.group({
    tag:            ['', [Validators.required, Validators.maxLength(30)]],
    name:           ['', Validators.maxLength(100)],
    breed:          ['', [Validators.required]],
    color:          ['', [Validators.required]],
    gender:         ['M', [Validators.required]],
    birth_date:     [null as string | null],
    entry_date:     [this.today, [Validators.required]],
    entry_weight:   [null as number | null],
    lot:            ['', [Validators.required]],
    notes:          [''],
  });

  ngOnInit(): void {
    this.loadCatalogs();
  }

  private loadCatalogs(): void {
    // Load catalogs in parallel
    let pending = 3;
    const done = () => { 
      if (--pending === 0) this.afterCatalogsLoaded(); 
    };

    this.svc.getBreeds().subscribe({ 
      next: (r) => { 
        if (r.success) this.breeds.set(r.data); 
        done(); 
      }, 
      error: done 
    });

    this.svc.getColors().subscribe({ 
      next: (r) => { 
        if (r.success) this.colors.set(r.data); 
        done(); 
      }, 
      error: done 
    });

    this.svc.getLots().subscribe({ 
      next: (r) => { 
        if (r.success) {
          // Filter only active lots
          const activeLots = r.data.filter(l => l.status === 'active');
          this.lots.set(activeLots);
        }
        done(); 
      }, 
      error: done 
    });

    // Pre-fill lot from query param
    const qLot = this.route.snapshot.queryParamMap.get('lot');
    if (qLot) this.form.patchValue({ lot: qLot });
  }

  private afterCatalogsLoaded(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.editId = id;
      this.svc.getAnimalById(id).subscribe({
        next: (r) => { 
          if (r.success) {
            // Map field names from API response to form control names
            const data = r.data;
            this.form.patchValue({
              tag: data.tag_number,
              name: data.name,
              breed: data.breed,
              color: data.color,
              gender: data.gender,
              birth_date: data.birth_date,
              entry_date: data.entry_date,
              entry_weight: data.entry_weight ? parseFloat(data.entry_weight) : null,
              lot: data.lot,
              notes: data.notes,
            });
          } 
          this.loading.set(false); 
        },
        error: () => this.loading.set(false),
      });
    } else {
      this.loading.set(false);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) { 
      this.form.markAllAsTouched(); 
      return; 
    }

    this.saving.set(true);
    this.error.set('');

    const formValue = this.form.value;
    const payload = {
      tag_number: formValue.tag || undefined,
      name: formValue.name || '',
      breed: formValue.breed || undefined,
      color: formValue.color || undefined,
      gender: formValue.gender || undefined,
      birth_date: formValue.birth_date || undefined,
      entry_date: formValue.entry_date || undefined,
      entry_weight: formValue.entry_weight || undefined,
      lot: formValue.lot || undefined,
      notes: formValue.notes || '',
    };

    const req = this.isEdit
      ? this.svc.updateAnimal(this.editId!, payload??)
      : this.svc.createAnimal(payload);

    req.subscribe({
      next: (r: any) => {
        this.snack.open(
          r.message || (this.isEdit ? 'Animal actualizado' : 'Animal registrado'), 
          'Cerrar', 
          { duration: 3000 }
        );
        this.router.navigate(['/cattle/animals']);
      },
      error: (e: any) => { 
        this.error.set(e?.error?.message || 'Error al guardar'); 
        this.saving.set(false); 
      },
    });
  }

  hasError(fieldName: string, errorType: string): boolean {
    const control = this.form.get(fieldName);
    return !!(control?.hasError(errorType) && (control.touched || control.dirty));
  }

  // Convert breed object to select options
  get breedOptions() {
    return this.breeds().map(b => ({ 
      label: b.name, 
      value: b.id 
    }));
  }

  // Convert color object to select options
  get colorOptions() {
    return this.colors().map(c => ({ 
      label: c.name, 
      value: c.id 
    }));
  }

  // Convert lot object to select options
  get lotOptions() {
    return this.lots().map(l => ({ 
      label: `${l.code} - ${l.name}`, 
      value: l.id 
    }));
  }
}