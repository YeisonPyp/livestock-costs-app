// sale-list.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { KpiCardComponent } from '../../../../shared/components/display/kpi-card/kpi-card.component';
import { BadgeComponent } from '../../../../shared/components/display/badge/badge.component';
import { AmountDisplayComponent } from '../../../../shared/components/bills/amount-display/amount-display.component';
import { AlertComponent } from '../../../../shared/components/display/alert/alert.component';

import { AnimalSelectionModalComponent } from './animal-selection-modal/animal-selection-modal.component';
import { WeightBulkImportComponent } from '../../../cattle/pages/weights/weight-bulk-import/weight-bulk-import.component';
import { InvestmentService } from '../../services/investment.service';
import { SaleEvent } from '../../models/investment.model';
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
  selector: 'app-sale-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    LoaderComponent,
    EmptyStateComponent,
    KpiCardComponent,
    BadgeComponent,
    AmountDisplayComponent,
    AlertComponent,
    WeightBulkImportComponent,
  ],
  templateUrl: './sale-list.component.html',
  styleUrl: './sale-list.component.scss',
})
export class SaleListComponent implements OnInit {
  private svc = inject(InvestmentService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // ── State ─────────────────────────────────────────────────────────────────
  sales = signal<SaleEvent[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  totalPages = signal(1);

  // ── New Sale Form ─────────────────────────────────────────────────────────
  showNewForm = signal(false);
  savingNew = signal(false);
  errorNew = signal('');
  newForm!: FormGroup;

  // ── Animal Selection ──────────────────────────────────────────────────────
  selectedAnimals = signal<AnimalSelection[]>([]);
  showWeightImportModal = signal(false);
  lastPricePerKg = signal<number | null>(null);

  // ── Filters ───────────────────────────────────────────────────────────────
  filterFinalized = '';

  // ── Helpers ───────────────────────────────────────────────────────────────
  formatCurrency = formatCurrency;

  // ── Computed ──────────────────────────────────────────────────────────────
  stats = signal({ total: 0, pending: 0, totalNet: 0, totalHeads: 0 });

  selectedCount = computed(() => this.selectedAnimals().length);
  
  selectedWeight = computed(() => 
    this.selectedAnimals().reduce((sum, a) => sum + (a.current_weight || 0), 0)
  );

  hasSelectedAnimals = computed(() => this.selectedAnimals().length > 0);

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.buildNewForm();
    this.load();
  }

  // ── Form Builder ──────────────────────────────────────────────────────────
  private buildNewForm(): void {
    this.newForm = this.fb.group({
      sale_date: [this.today(), Validators.required],
      description: ['', Validators.required],
      buyer_name: [''],
      total_heads: [0, [Validators.required, Validators.min(1)]],
      total_weight: [0, [Validators.required, Validators.min(0.01)]],
      price_per_kg: [null, [Validators.required, Validators.min(0.01)]],
      gross_amount: [{ value: 0, disabled: true }],
      sale_costs: [0, Validators.min(0)],
      notes: [''],
    });

    // Auto-calcular monto bruto
    this.newForm.get('total_weight')?.valueChanges.subscribe(() => this.recalcGross());
    this.newForm.get('price_per_kg')?.valueChanges.subscribe(() => this.recalcGross());
  }

  private recalcGross(): void {
    const weight = +this.newForm.get('total_weight')?.value || 0;
    const price = +this.newForm.get('price_per_kg')?.value || 0;
    const gross = Math.round(weight * price * 100) / 100;
    this.newForm.get('gross_amount')?.setValue(gross, { emitEvent: false });
  }

  // ── Data Loading ──────────────────────────────────────────────────────────
  load(): void {
    this.loading.set(true);
    const params: Record<string, any> = { page: this.currentPage() };
    
    if (this.filterFinalized !== '') {
      params['is_finalized'] = this.filterFinalized;
    }

    this.svc.getSales(params).subscribe({
      next: (res) => {
        if (res.success) {
          this.sales.set(res.data);
          this.totalPages.set(res.pagination?.total_pages ?? 1);
          this.calculateStats(res.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error al cargar ventas', 'Cerrar', { duration: 3000 });
      },
    });
  }

  private calculateStats(data: SaleEvent[]): void {
    this.stats.set({
      total: data.length,
      pending: data.filter(s => !s.is_finalized).length,
      totalNet: data.reduce((s, x) => s + +x.net_amount, 0),
      totalHeads: data.reduce((s, x) => s + x.total_heads, 0),
    });
  }

  // ── Pagination & Filters ──────────────────────────────────────────────────
  onFilterChange(): void {
    this.currentPage.set(1);
    this.load();
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.load();
  }

  // ── Animal Selection (Manual - Dialog) ────────────────────────────────────
  openAnimalSelection(): void {
    this.dialog
      .open(AnimalSelectionModalComponent, {
        width: '95%',
        maxWidth: '1400px',
        maxHeight: '90vh',
        disableClose: false,
      })
      .afterClosed()
      .subscribe((result) => {
        if (result?.animals) {
          const animals: AnimalSelection[] = result.animals.map((a: any) => ({
            id: a.id,
            tag_number: a.tag_number,
            name: a.name,
            breed_name: a.breed_name,
            current_weight: parseFloat(a.current_weight) || 0,
            investor_code: a.investor_code,
          }));
          this.setSelectedAnimals(animals);
        }
      });
  }

  // ── Animal Selection (Weight Import Modal) ────────────────────────────────
  openWeightImportForSale(): void {
    this.showWeightImportModal.set(true);
  }

  onWeightAnimalsSelected(animals: WeightedAnimal[]): void {
    console.log('Animals selected from weight import:', animals);
    
    // Convertir WeightedAnimal a AnimalSelection
    const converted: AnimalSelection[] = animals.map(a => ({
      id: a.id,
      tag_number: a.tag_number,
      name: a.name || '',
      breed_name: a.breed_name || '',
      current_weight: a.current_weight,
      investor_code: a.investor_code || undefined,
    }));

    this.setSelectedAnimals(converted);
    this.showWeightImportModal.set(false);

    this.snackBar.open(
      `✅ ${animals.length} animales seleccionados para la venta`,
      'Cerrar',
      { duration: 4000 }
    );
  }

  closeWeightImportModal(): void {
    this.showWeightImportModal.set(false);
  }

  // ── Set Selected Animals ──────────────────────────────────────────────────
  private setSelectedAnimals(animals: AnimalSelection[]): void {
    this.selectedAnimals.set(animals);
    
    const totalWeight = animals.reduce((sum, a) => sum + a.current_weight, 0);

    this.newForm.patchValue({
      total_heads: animals.length,
      total_weight: Math.round(totalWeight * 100) / 100,
    });

    this.recalcGross();
    this.errorNew.set('');
  }

  // ── Remove Animal ─────────────────────────────────────────────────────────
  removeSelectedAnimal(index: number): void {
    const animals = [...this.selectedAnimals()];
    animals.splice(index, 1);
    this.selectedAnimals.set(animals);

    const totalWeight = animals.reduce((sum, a) => sum + a.current_weight, 0);

    this.newForm.patchValue({
      total_heads: animals.length,
      total_weight: Math.round(totalWeight * 100) / 100,
    });

    this.recalcGross();
  }

  // ── Clear All Animals ─────────────────────────────────────────────────────
  clearAllAnimals(): void {
    this.selectedAnimals.set([]);
    this.newForm.patchValue({
      total_heads: 0,
      total_weight: 0,
    });
    this.recalcGross();
  }

  // ── Submit New Sale ───────────────────────────────────────────────────────
  submitNew(): void {
    if (this.newForm.invalid) {
      this.newForm.markAllAsTouched();
      return;
    }

    if (this.selectedAnimals().length === 0) {
      this.errorNew.set('Debes seleccionar al menos un animal');
      return;
    }

    this.savingNew.set(true);
    this.errorNew.set('');

    const raw = this.newForm.getRawValue();
    const payload = {
      ...raw,
      gross_amount: Math.round(+raw.total_weight * +raw.price_per_kg * 100) / 100,
      animal_ids: this.selectedAnimals().map(a => a.id),
    };

    this.svc.createSale(payload).subscribe({
      next: () => {
        this.savingNew.set(false);
        this.snackBar.open('✅ Venta registrada exitosamente', 'Cerrar', { duration: 3000 });
        this.resetForm();
        this.load();
      },
      error: (err) => {
        this.savingNew.set(false);
        this.errorNew.set(err?.error?.message || 'Error al registrar la venta');
      },
    });
  }

  // ── Reset Form ────────────────────────────────────────────────────────────
  private resetForm(): void {
    this.newForm.reset({
      sale_date: this.today(),
      total_heads: 0,
      total_weight: 0,
      gross_amount: 0,
      sale_costs: 0,
    });
    this.selectedAnimals.set([]);
    this.showNewForm.set(false);
    this.errorNew.set('');
  }

  cancelNewForm(): void {
    this.resetForm();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private today(): string {
    return new Date().toISOString().split('T')[0];
  }

  formatWeight(value: number): string {
    return `${value.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;
  }
}