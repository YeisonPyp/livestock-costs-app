import { Component, OnInit, inject, signal } from '@angular/core';
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
import { InvestmentService } from '../../services/investment.service';
import { SaleEvent } from '../../models/investment.model';
import { formatCurrency } from '../../../../core/utils/helpers';

interface AnimalSelection {
  id: string;
  tag_number: string;
  name?: string;
  breed_name: string;
  current_weight?: string;
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
  ],
  templateUrl: './sale-list.component.html',
  styleUrl: './sale-list.component.scss',
})
export class SaleListComponent implements OnInit {
  private svc = inject(InvestmentService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  sales = signal<SaleEvent[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  totalPages = signal(1);

  showNewForm = signal(false);
  savingNew = signal(false);
  errorNew = signal('');
  newForm!: FormGroup;

  // Animal selection
  selectedAnimals = signal<AnimalSelection[]>([]);
  selectedCount = signal(0);
  selectedWeight = signal(0);

  filterFinalized = '';
  formatCurrency = formatCurrency;

  stats = signal({ total: 0, pending: 0, totalNet: 0, totalHeads: 0 });

  ngOnInit(): void {
    this.buildNewForm();
    this.load();
  }

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
    const w = +this.newForm.get('total_weight')?.value || 0;
    const p = +this.newForm.get('price_per_kg')?.value || 0;
    const gross = w * p;
    this.newForm.get('gross_amount')?.setValue(Math.round(gross * 100) / 100, { emitEvent: false });
  }

  load(): void {
    this.loading.set(true);
    const params: Record<string, any> = { page: this.currentPage() };
    if (this.filterFinalized !== '') params['is_finalized'] = this.filterFinalized;

    this.svc.getSales(params).subscribe({
      next: (res) => {
        if (res.success) {
          this.sales.set(res.data);
          this.totalPages.set(res.pagination?.total_pages ?? 1);
          this.stats.set({
            total: res.data.length,
            pending: res.data.filter(s => !s.is_finalized).length,
            totalNet: res.data.reduce((s, x) => s + +x.net_amount, 0),
            totalHeads: res.data.reduce((s, x) => s + x.total_heads, 0),
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error al cargar ventas', 'Cerrar', { duration: 3000 });
      },
    });
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.load();
  }

  goToPage(p: number): void {
    this.currentPage.set(p);
    this.load();
  }

  // ── Animal Selection ───────────────────────────────────────────────────────
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
        if (result && result.animals) {
          const animals = result.animals.map((a: any) => ({
            id: a.id,
            tag_number: a.tag_number,
            name: a.name,
            breed_name: a.breed_name,
            current_weight: a.current_weight,
          }));

          this.selectedAnimals.set(animals);
          this.selectedCount.set(result.totalHeads);
          this.selectedWeight.set(result.totalWeight);

          // Auto-llenar campos del formulario
          this.newForm.patchValue({
            total_heads: result.totalHeads,
            total_weight: Math.round(result.totalWeight * 100) / 100,
          });

          this.recalcGross();
          this.errorNew.set('');
        }
      });
  }

  removeSelectedAnimal(index: number): void {
    const animals = this.selectedAnimals();
    const removed = animals[index];

    animals.splice(index, 1);
    this.selectedAnimals.set([...animals]);
    this.selectedCount.set(animals.length);

    const weight = removed.current_weight ? parseFloat(removed.current_weight) : 0;
    this.selectedWeight.update(total => total - weight);

    this.newForm.patchValue({
      total_heads: animals.length,
      total_weight: Math.round(this.selectedWeight() * 100) / 100,
    });

    this.recalcGross();
  }

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
    const w = +raw.total_weight,
      p = +raw.price_per_kg;
    const payload = {
      ...raw,
      gross_amount: Math.round(w * p * 100) / 100,
      animal_ids: this.selectedAnimals().map(a => a.id),
    };

    this.svc.createSale(payload).subscribe({
      next: (res) => {
        this.savingNew.set(false);
        this.snackBar.open('Venta registrada exitosamente', 'Cerrar', { duration: 3000 });
        this.resetForm();
        this.load();
      },
      error: (err) => {
        this.savingNew.set(false);
        this.errorNew.set(err?.error?.message || 'Error al registrar la venta');
      },
    });
  }

  private resetForm(): void {
    this.newForm.reset({
      sale_date: this.today(),
      total_heads: 0,
      total_weight: 0,
      gross_amount: 0,
    });
    this.selectedAnimals.set([]);
    this.selectedCount.set(0);
    this.selectedWeight.set(0);
    this.showNewForm.set(false);
    this.errorNew.set('');
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }
}