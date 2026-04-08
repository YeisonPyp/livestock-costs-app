import {
  Component, OnInit, inject, signal, computed,
  output, input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { AlertComponent } from '../../../../shared/components/display/alert/alert.component';
import { AmountDisplayComponent } from '../../../../shared/components/bills/amount-display/amount-display.component';
import { AnimalSelectionModalComponent } from '../../components/animal-selection-modal/animal-selection-modal.component';
import { WeightBulkImportComponent } from '../../../cattle/pages/weights/weight-bulk-import/weight-bulk-import.component';

import { InvestmentService } from '../../services/investment.service';
import { WeightedAnimal } from '../../../cattle/models/cattle.model';
import { formatCurrency } from '../../../../core/utils/helpers';

interface AnimalSelection {
  id: string;
  tag_number: string;
  name?: string;
  breed_name: string;
  current_weight: number;
  investor_code?: string;
}

@Component({
  selector: 'app-sale-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AlertComponent,
    AmountDisplayComponent,
    WeightBulkImportComponent,
  ],
  templateUrl: './sale-create.component.html',
  styleUrl:    './sale-create.component.scss',
})
export class SaleCreateComponent implements OnInit {

  private svc      = inject(InvestmentService);
  private fb       = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog   = inject(MatDialog);

  // ── Outputs ───────────────────────────────────────────────────────────────
  saved  = output<void>();   // emite cuando la venta se guarda correctamente
  cancel = output<void>();   // emite cuando el usuario cancela

  // ── State ─────────────────────────────────────────────────────────────────
  form!: FormGroup;
  saving          = signal(false);
  error           = signal('');
  selectedAnimals = signal<AnimalSelection[]>([]);
  showWeightModal = signal(false);

  // ── Computed — resumen en tiempo real ─────────────────────────────────────
  totalHeads  = computed(() => this.selectedAnimals().length);
  totalWeight = computed(() =>
    this.selectedAnimals().reduce((s, a) => s + (a.current_weight || 0), 0)
  );
  pricePerKg = signal(0);

  grossAmount = computed(() =>
    Math.round(this.totalWeight() * this.pricePerKg() * 100) / 100
  );
  saleCosts = signal(0);
  netAmount = computed(() =>
    Math.round((this.grossAmount() - this.saleCosts()) * 100) / 100
  );

  hasAnimals = computed(() => this.selectedAnimals().length > 0);

  formatCurrency = formatCurrency;

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.buildForm();
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  private buildForm(): void {
    this.form = this.fb.group({
      sale_date:   [this.today(), Validators.required],
      description: ['',          Validators.required],
      buyer_id:    [null],
      sale_costs:  [0, [Validators.min(0)]],
      notes:       [''],
      price_per_kg:[null, [Validators.required, Validators.min(0.01)]],
    });

    // Sincronizar señales con el form para los computed
    this.form.get('price_per_kg')?.valueChanges.subscribe(v =>
      this.pricePerKg.set(+v || 0)
    );
    this.form.get('sale_costs')?.valueChanges.subscribe(v =>
      this.saleCosts.set(+v || 0)
    );
  }

  // ── Selección de animales — Modal ─────────────────────────────────────────
  openAnimalSelection(): void {
    this.dialog
      .open(AnimalSelectionModalComponent, {
        width:      '95%',
        maxWidth:   '1400px',
        maxHeight:  '90vh',
        disableClose: false,
      })
      .afterClosed()
      .subscribe((result) => {
        if (result?.animals) {
          this.setAnimals(result.animals.map((a: any) => ({
            id:             a.id,
            tag_number:     a.tag_number,
            name:           a.name,
            breed_name:     a.breed_name,
            current_weight: parseFloat(a.current_weight) || 0,
            investor_code:  a.investor_code,
          })));
        }
      });
  }

  // ── Selección de animales — Excel ─────────────────────────────────────────
  onWeightAnimalsSelected(animals: WeightedAnimal[]): void {
    this.setAnimals(animals.map(a => ({
      id:             a.id,
      tag_number:     a.tag_number,
      name:           a.name || '',
      breed_name:     a.breed_name || '',
      current_weight: a.current_weight,
      investor_code:  a.investor_code || undefined,
    })));
    this.showWeightModal.set(false);
    this.snackBar.open(
      `${animals.length} animales cargados`,
      'Cerrar',
      { duration: 3000 }
    );
  }

  // ── Helpers de selección ──────────────────────────────────────────────────
  private setAnimals(animals: AnimalSelection[]): void {
    this.selectedAnimals.set(animals);
    this.error.set('');
  }

  removeAnimal(index: number): void {
    const list = [...this.selectedAnimals()];
    list.splice(index, 1);
    this.selectedAnimals.set(list);
  }

  clearAnimals(): void {
    this.selectedAnimals.set([]);
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.hasAnimals()) {
      this.error.set('Debes seleccionar al menos un animal.');
      return;
    }
    if (this.netAmount() <= 0) {
      this.error.set('El monto neto debe ser mayor a cero.');
      return;
    }

    this.saving.set(true);
    this.error.set('');

    const raw   = this.form.getRawValue();
    const price = +raw.price_per_kg;

    // El nuevo endpoint espera items con peso y precio por animal
    const payload = {
      sale_date:   raw.sale_date,
      description: raw.description,
      buyer_id:    raw.buyer_id || null,
      sale_costs:  raw.sale_costs || 0,
      notes:       raw.notes || '',
      items: this.selectedAnimals().map(a => ({
        animal_id:    a.id,
        weight:       +a.current_weight.toFixed(2),
        price_per_kg: price,
      })),
    };

    this.svc.createSale(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Venta registrada exitosamente', 'Cerrar', { duration: 3000 });
        this.saved.emit();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(
          err?.error?.message || 'Error al registrar la venta.'
        );
      },
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }

  formatWeight(v: number): string {
    return `${v.toLocaleString('es-CO', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} kg`;
  }
}