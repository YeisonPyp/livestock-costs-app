import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';

import { CattleService } from '../../services/cattle.service';
import { FarmService } from '../../../farms/services/farm.service';
import {
  Animal,
  Breed,
  Color,
  Lot,
  ANIMAL_CATEGORIES,
  ANIMAL_GENDER,
  ANIMAL_STATUS,
} from '../../models/cattle.model';
import { Farm } from '../../../farms/models/farm.model';

@Component({
  selector: 'app-animal-form',
  imports: [CommonModule, RouterLink, ReactiveFormsModule, MatAutocompleteModule, PageHeaderComponent, LoaderComponent],
  templateUrl: './animal-form.component.html',
  styleUrl: './animal-form.component.scss'
})
export class AnimalFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cattleService = inject(CattleService);
  private farmService = inject(FarmService);
  private snackBar = inject(MatSnackBar);

  form!: FormGroup;
  loading = signal(false);
  saving = signal(false);
  isEditMode = signal(false);
  animalId = signal<string | null>(null);

  breeds = signal<Breed[]>([]);
  colors = signal<Color[]>([]);
  farms = signal<Farm[]>([]);
  lots = signal<Lot[]>([]);
  allAnimals = signal<Animal[]>([]);

  genderOptions = ANIMAL_GENDER;
  categoryOptions = ANIMAL_CATEGORIES;

  ngOnInit(): void {
    this.initForm();
    this.loadCatalogs();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.animalId.set(id);
      this.loadAnimal(id);
    }
  }

  private initForm(): void {
    const today = new Date().toISOString().split('T')[0];
    
    this.form = this.fb.group({
      tag_number: ['', Validators.required],
      name: [''],
      electronic_id: [''],
      registry_number: [''],
      breed_id: ['', Validators.required],
      gender: ['', Validators.required],
      category: ['', Validators.required],
      color: [''],
      farm_id: [''],
      lot_id: [''],
      birth_date: [''],
      entry_date: [today, Validators.required],
      birth_weight: [null],
      entry_weight: [null],
      purchase_price: [0],
      mother_id: [''],
      father_id: [''],
      brand_mark: [''],
      distinctive_marks: [''],
      is_pregnant: [false],
      expected_calving_date: [''],
      total_calvings: [0],
      is_castrated: [false],
      castration_date: [''],
      notes: [''],
    });
  }

  private loadCatalogs(): void {
    // Load breeds
    this.cattleService.getBreeds({ is_active: true }).subscribe({
      next: (response) => {
        if (response.success) {
          this.breeds.set(response.data);
        }
      }
    });

    // Load colors
    this.cattleService.getColors().subscribe({
      next: (response) => {
        if (response.success) {
          this.colors.set(response.data);
        }
      }
    });

    // Load farms
    this.farmService.getAll({ status: 'active' }).subscribe({
      next: (response) => {
        if (response.success) {
          this.farms.set(response.data);
        }
      }
    });

    // Load lots
    this.cattleService.getLots({ status: 'active' }).subscribe({
      next: (response) => {
        if (response.success) {
          this.lots.set(response.data.results);
        }
      }
    });

    // Load animals for genealogy
    this.cattleService.getAnimals({ status: 'active' }).subscribe({
      next: (response) => {
        if (response.success) {
          this.allAnimals.set(response.data.results);
        }
      }
    });
  }

  private loadAnimal(id: string): void {
    this.loading.set(true);
    
    this.cattleService.getAnimalById(id).subscribe({
      next: (response) => {
        if (response.success) {
          const animal = response.data;
          this.form.patchValue({
            tag_number: animal.tag_number,
            name: animal.name,
            electronic_id: animal.electronic_id,
            registry_number: animal.registry_number,
            breed_id: typeof animal.breed === 'string' ? animal.breed : animal.breed.id,
            gender: animal.gender,
            category: animal.category,
            color: animal.color,
            farm_id: animal.farm,
            lot_id: animal.lot,
            birth_date: animal.birth_date,
            entry_date: animal.entry_date,
            birth_weight: animal.birth_weight,
            entry_weight: animal.entry_weight,
            purchase_price: animal.purchase_price,
            mother_id: animal.mother,
            father_id: animal.father,
            brand_mark: animal.brand_mark,
            distinctive_marks: animal.distinctive_marks,
            is_pregnant: animal.is_pregnant,
            expected_calving_date: animal.expected_calving_date,
            total_calvings: animal.total_calvings,
            is_castrated: animal.is_castrated,
            castration_date: animal.castration_date,
            notes: animal.notes,
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error al cargar el animal', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/cattle']);
      }
    });
  }

  filteredLots(): Lot[] {
    const farmId = this.form.get('farm_id')?.value;
    if (!farmId) return this.lots();
    return this.lots().filter(lot => lot.farm === farmId);
  }

  onFarmChange(): void {
    // Reset lot when farm changes
    this.form.get('lot_id')?.setValue('');
  }

  femaleAnimals(): Animal[] {
    const currentId = this.animalId();
    return this.allAnimals().filter(a => 
      a.gender === 'F' && a.id !== currentId
    );
  }

  maleAnimals(): Animal[] {
    const currentId = this.animalId();
    return this.allAnimals().filter(a => 
      a.gender === 'M' && a.id !== currentId
    );
  }

  showReproductiveSection(): boolean {
    return !!this.form.get('gender')?.value;
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && control?.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    
    const formData = { ...this.form.value };
    
    // Clean empty values
    Object.keys(formData).forEach(key => {
      if (formData[key] === '' || formData[key] === null) {
        delete formData[key];
      }
    });

    const request = this.isEditMode()
      ? this.cattleService.updateAnimal(this.animalId()!, formData)
      : this.cattleService.createAnimal(formData);

    request.subscribe({
      next: (response) => {
        this.saving.set(false);
        this.snackBar.open(
          this.isEditMode() ? 'Animal actualizado exitosamente' : 'Animal creado exitosamente',
          'Cerrar',
          { duration: 3000 }
        );
        this.router.navigate(['/cattle']);
      },
      error: (error) => {
        this.saving.set(false);
        const message = error.error?.message || 'Error al guardar el animal';
        this.snackBar.open(message, 'Cerrar', { duration: 3000 });
      }
    });
  }
}