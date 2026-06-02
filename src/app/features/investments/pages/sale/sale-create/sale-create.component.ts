import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  output,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

import { AnimalSelectionModalComponent } from '../../../components/animal-selection-modal/animal-selection-modal.component';
import { WeightBulkImportComponent } from '../../../../cattle/pages/weights/weight-bulk-import/weight-bulk-import.component';
import { SaleEventService } from '../../../services';
import { WeightedAnimal } from '../../../../cattle/models/cattle.model';
import { formatCurrency } from '../../../../../core/utils/helpers';
import { AlertComponent } from '../../../../../shared/components/feedback/alert/alert.component';
import { NotificationService } from '../../../../../core/services/notification.service';
import type { CreateSaleEventPayload } from '../../../models/sale.model';
import { catchError, finalize, of, switchMap, tap } from 'rxjs';

// ── Tipos locales ──────────────────────────────────────────────────────────

interface AnimalSelection {
  id: string;
  tagNumber: string;
  name?: string;
  breedName: string;
  currentWeight: number;
  investorCode?: string;
}

interface EvidenceInfo {
  file: File;
  name: string;
  size: string;
}

// ── Constantes de validación de evidencia ──────────────────────────────────
const ALLOWED_MIME_TYPES = ['application/pdf'];
const MAX_FILE_MB = 10;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

@Component({
  selector: 'app-sale-create',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AlertComponent,
    WeightBulkImportComponent,
  ],
  templateUrl: './sale-create.component.html',
  styleUrl: './sale-create.component.scss',
})
export class SaleCreateComponent implements OnInit {
  private readonly saleSvc = inject(SaleEventService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  // ── Outputs ───────────────────────────────────────────────────────────
  saved = output<void>();
  cancel = output<void>();

  // ── Form state ────────────────────────────────────────────────────────
  form!: FormGroup;
  saving = signal(false);
  error = signal('');
  selectedAnimals = signal<AnimalSelection[]>([]);
  showWeightModal = signal(false);

  // ── Evidence state ────────────────────────────────────────────────────
  evidenceInfo = signal<EvidenceInfo | null>(null);
  evidenceError = signal('');
  isDragging = signal(false);

  // Exponer constante al template
  readonly MAX_FILE_MB = MAX_FILE_MB;

  // ── Signals de precio (sincronizados con el form) ─────────────────────
  pricePerKg = signal(0);
  saleCostsValue = signal(0);

  // ── Computed ──────────────────────────────────────────────────────────
  totalHeads = computed(() => this.selectedAnimals().length);

  totalWeight = computed(() =>
    this.selectedAnimals().reduce((s, a) => s + (a.currentWeight || 0), 0),
  );

  grossAmount = computed(
    () => Math.round(this.totalWeight() * this.pricePerKg() * 100) / 100,
  );

  netAmount = computed(
    () =>
      Math.round((this.grossAmount() - this.saleCostsValue()) * 100) / 100,
  );

  hasAnimals = computed(() => this.selectedAnimals().length > 0);

  showSummary = computed(() => this.hasAnimals() && this.pricePerKg() > 0);

  // ── UI Helpers ────────────────────────────────────────────────────────
  readonly formatCurrency = formatCurrency;

  // ── Lifecycle ─────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.buildForm();
  }

  // ── Form ──────────────────────────────────────────────────────────────
  private buildForm(): void {
    this.form = this.fb.group({
      sale_date: [this.today(), Validators.required],
      description: ['', Validators.required],
      buyer_id: [null],
      sale_costs: [0, [Validators.min(0)]],
      notes: [''],
      price_per_kg: [null, [Validators.required, Validators.min(0.01)]],
    });

    // Sincronizar signals con el form para los computed
    this.form
      .get('price_per_kg')
      ?.valueChanges.subscribe((v) => this.pricePerKg.set(+v || 0));

    this.form
      .get('sale_costs')
      ?.valueChanges.subscribe((v) => this.saleCostsValue.set(+v || 0));
  }

  // ── Animal Selection — Modal ──────────────────────────────────────────
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
          this.setAnimals(
            result.animals.map((a: any) => ({
              id: a.id,
              tagNumber: a.tag_number,
              name: a.name,
              breedName: a.breed_name,
              currentWeight: parseFloat(a.current_weight) || 0,
              investorCode: a.investor_code,
            })),
          );
        }
      });
  }

  // ── Animal Selection — Excel ──────────────────────────────────────────
  onWeightAnimalsSelected(animals: WeightedAnimal[]): void {
    this.setAnimals(
      animals.map((a) => ({
        id: a.id,
        tagNumber: a.tag_number,
        name: a.name || '',
        breedName: a.breed_name || '',
        currentWeight: a.current_weight,
        investorCode: a.investor_code || undefined,
      })),
    );
    this.showWeightModal.set(false);
    this.notify.success(`${animals.length} animales cargados`);
  }

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

  // ── Evidence ──────────────────────────────────────────────────────────
  triggerFileInput(): void {
    this.fileInputRef?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      this.processFile(input.files[0]);
    }
    // Reset para permitir seleccionar el mismo archivo
    input.value = '';
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const file = event.dataTransfer?.files?.[0];
    if (file) this.processFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  removeEvidence(): void {
    this.evidenceInfo.set(null);
    this.evidenceError.set('');
  }

  private processFile(file: File): void {
    this.evidenceError.set('');

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      this.evidenceError.set('Solo se permiten archivos PDF.');
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      this.evidenceError.set(
        `El archivo excede el tamaño máximo de ${MAX_FILE_MB}MB.`,
      );
      return;
    }

    this.evidenceInfo.set({
      file,
      name: file.name,
      size: this.formatFileSize(file.size),
    });
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  // ── Submit ────────────────────────────────────────────────────────────
  // sale-create.component.ts — submit()

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

  const raw = this.form.getRawValue();
  const evidenceFile = this.evidenceInfo()?.file ?? null;

  // ✅ Payload SIN evidencia
  const payload: CreateSaleEventPayload = {
    saleDate: raw.sale_date,
    description: raw.description || '',
    buyerId: raw.buyer_id || null,
    saleCosts: Number(raw.sale_costs) || 0,
    items: this.selectedAnimals().map((a) => ({
      animalId: a.id,
      weight: +a.currentWeight.toFixed(2),
      pricePerKg: +raw.price_per_kg,
    })),
  };

  // ── Paso 1: Crear venta ──────────────────────────────────────────
  this.saleSvc.create(payload).pipe(
    // ── Paso 2: Subir evidencia (si hay) ─────────────────────────
    switchMap((createRes) => {
      const saleId = createRes.data.id;

      if (evidenceFile) {
        return this.saleSvc.uploadEvidence(saleId, evidenceFile).pipe(
          catchError((err) => {
            console.warn('Error subiendo evidencia:', err);
            this.notify.warning(
              'Venta creada, pero hubo un error al subir la evidencia.'
            );
            return of(createRes);
          }),
        );
      }

      return of(createRes);
    }),

    // ── Paso 3: Generar decisiones ───────────────────────────────
    switchMap((res) => {
      const saleId = res.data.id;

      return this.saleSvc.generateDecisions(saleId).pipe(
        tap((genRes) => {
          this.notify.success(
            `Venta registrada. ${genRes.data.decisionsCreated} decisión(es) generada(s).`
          );
        }),
        catchError((err) => {
          console.warn('Error generando decisiones:', err);
          this.notify.warning(
            'Venta creada, pero hubo un error al generar las decisiones.'
          );
          return of(null);
        }),
      );
    }),

    finalize(() => this.saving.set(false)),
  ).subscribe({
    next: () => {
      this.resetForm();
      this.saved.emit();
    },
    error: (err) => {
      this.error.set(
        err?.error?.message || 'Error al registrar la venta.'
      );
    },
  });
}

  private resetForm(): void {
    this.selectedAnimals.set([]);
    this.pricePerKg.set(0);
    this.saleCostsValue.set(0);
    this.error.set('');
    this.evidenceInfo.set(null);
    this.evidenceError.set('');
  }

  onCancel(): void {
    this.cancel.emit();
  }

  hasFieldError(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  formatWeight(v: number): string {
    return `${v.toLocaleString('es-CO', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} kg`;
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }
}