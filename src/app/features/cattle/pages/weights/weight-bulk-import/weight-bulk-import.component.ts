// weight-bulk-import.component.ts
import { Component, inject, signal, computed, output, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CattleService } from '../../../services/cattle.service';
import { BulkWeightResult, WeightedAnimal } from '../../../models/cattle.model';

@Component({
  selector: 'app-weight-bulk-import',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './weight-bulk-import.component.html',
  styleUrl: './weight-bulk-import.component.scss',
})
export class WeightBulkImportComponent implements OnInit {
  private svc = inject(CattleService);
  private snack = inject(MatSnackBar);

  // ── Inputs ──────────────────────────────────────────────────────────────────
  mode = input<'default' | 'selection'>('default');
  title = input<string>('Carga Masiva de Pesajes');

  // ── Signals ─────────────────────────────────────────────────────────────────
  uploading = signal(false);
  result = signal<BulkWeightResult | null>(null);
  fileName = signal<string | null>(null);
  dragOver = signal(false);
  
  // Para modo selección
  selectedAnimalIds = signal<Set<string>>(new Set());
  showSelectionStep = signal(false);

  // ── Form state ──────────────────────────────────────────────────────────────
  file = signal<File | null>(null);
  pricePerKg = signal<number | null>(null);

  // ── Outputs ─────────────────────────────────────────────────────────────────
  importSuccess = output<number>();
  animalsSelected = output<WeightedAnimal[]>();
  close = output<void>();

  // ── Computed ────────────────────────────────────────────────────────────────
  isFormValid = computed(() => {
    return this.file() !== null &&
          this.pricePerKg() !== null &&
          this.pricePerKg()! > 0;
  });

  isSuccess = computed(() => {
    const r = this.result();
    return r && r.recorded && r.recorded > 0;
  });

  hasErrors = computed(() => {
    const r = this.result();
    return r && r.errors && r.errors.length > 0;
  });

  weightedAnimals = computed((): WeightedAnimal[] => {
    const r = this.result();
    return r?.animals || [];
  });

  selectedAnimals = computed((): WeightedAnimal[] => {
    const ids = this.selectedAnimalIds();
    return this.weightedAnimals().filter(a => ids.has(a.id));
  });

  allSelected = computed(() => {
    const animals = this.weightedAnimals();
    const selected = this.selectedAnimalIds();
    return animals.length > 0 && animals.every(a => selected.has(a.id));
  });

  totalSelectedWeight = computed(() => {
    return this.selectedAnimals().reduce((sum, a) => sum + (a.current_weight || 0), 0);
  });

  isSelectionMode = computed(() => this.mode() === 'selection');

  // Agrega estos computed al componente

  resultErrors = computed(() => this.result()?.errors ?? []);

  hasAnimalsToSelect = computed(() => 
    (this.result()?.animals?.length ?? 0) > 0
  );

  // Muestra resultado cuando hay resultado y NO hay paso de selección activo
  showResult = computed(() => 
    this.result() !== null && !this.showSelectionStep()
  );

  // En selection mode, muestra errores si hay resultado pero no animales
  showErrorsInSelectionMode = computed(() =>
    this.isSelectionMode() && 
    this.result() !== null && 
    !this.showSelectionStep() &&
    this.hasErrors()
  );

  // ── Lifecycle ───────────────────────────────────────────────────────────────
  ngOnInit(): void {
    console.log('WeightBulkImport initialized with mode:', this.mode());
  }

  // ── File handling ───────────────────────────────────────────────────────────
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.setFile(file || null);
    input.value = ''; // Reset para permitir seleccionar el mismo archivo
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);

    const file = event.dataTransfer?.files?.[0];
    if (file && this.isValidFileType(file)) {
      this.setFile(file);
    } else {
      this.snack.open('Formato de archivo no válido', 'Cerrar', { duration: 3000 });
    }
  }

  private setFile(file: File | null): void {
    this.file.set(file);
    this.fileName.set(file?.name || null);
  }

  private isValidFileType(file: File): boolean {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    return validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  }

  removeFile(): void {
    this.file.set(null);
    this.fileName.set(null);
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  submit(): void {
    if (!this.file()) {
      this.snack.open('Debes seleccionar un archivo', 'Cerrar', { duration: 3000 });
      return;
    }
    if (!this.pricePerKg() || this.pricePerKg()! <= 0) {
      this.snack.open('El precio por kg debe ser mayor a cero', 'Cerrar', { duration: 3000 });
      return;
    }

    this.uploading.set(true);
    this.result.set(null);
    this.showSelectionStep.set(false);
    this.selectedAnimalIds.set(new Set());

    this.svc.bulkWeightFile(this.file()!, this.pricePerKg()!, this.isSelectionMode()).subscribe({
      next: r => {
        const data        = r.data;
        const recorded    = data?.recorded   ?? 0;
        const errors      = data?.errors     ?? [];
        const animals     = data?.animals    ?? [];

        this.uploading.set(false);
        this.result.set(data);

        // Notificar éxito si hubo registros
        if (recorded > 0) {
          this.snack.open(
            `✅ ${recorded} pesajes registrados`,
            'Cerrar',
            { duration: 5000, panelClass: 'snack-success' }
          );
          this.importSuccess.emit(recorded);
        }

        // Notificar errores siempre (independiente del modo)
        if (errors.length > 0) {
          this.snack.open(
            recorded > 0
              ? `⚠️ ${recorded} pesajes registrados, pero ${errors.length} con errores.`
              : `⚠️ No se registraron pesajes. ${errors.length} errores encontrados.`,
            'Cerrar',
            { duration: 6000, panelClass: 'snack-warning' }
          );
        }

        // Mostrar selección SOLO si hay animales
        if (this.isSelectionMode() && animals.length > 0) {
          this.showSelectionStep.set(true);
          this.selectAll();
        }
        // Si selection mode pero sin animales → showResult() mostrará los errores
      },
      error: e => {
        this.uploading.set(false);
        this.snack.open(
          e?.error?.message || 'Error al procesar archivo',
          'Cerrar',
          { duration: 4000, panelClass: 'snack-error' }
        );
      },
    });
  }

  // ── Selection methods ───────────────────────────────────────────────────────
  toggleAnimal(id: string): void {
    const selected = new Set(this.selectedAnimalIds());
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    this.selectedAnimalIds.set(selected);
    console.log('Selected animals:', Array.from(selected));
  }

  selectAll(): void {
    const all = new Set(this.weightedAnimals().map(a => a.id));
    this.selectedAnimalIds.set(all);
    console.log('Selected all:', Array.from(all));
  }

  deselectAll(): void {
    this.selectedAnimalIds.set(new Set());
  }

  toggleAll(): void {
    if (this.allSelected()) {
      this.deselectAll();
    } else {
      this.selectAll();
    }
  }

  isAnimalSelected(id: string): boolean {
    return this.selectedAnimalIds().has(id);
  }

  confirmSelection(): void {
    const selected = this.selectedAnimals();
    console.log('Confirming selection:', selected);
    
    if (selected.length === 0) {
      this.snack.open('Selecciona al menos un animal', 'Cerrar', { duration: 3000 });
      return;
    }
    
    // Emitir los animales seleccionados
    this.animalsSelected.emit(selected);
    
    // Cerrar el modal
    this.close.emit();
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  closeResult(): void {
    this.result.set(null);
    this.file.set(null);
    this.fileName.set(null);
    this.pricePerKg.set(null);
    this.showSelectionStep.set(false);
    this.selectedAnimalIds.set(new Set());
  }

  closeModal(): void {
    this.close.emit();
  }

  // ── Formatters ──────────────────────────────────────────────────────────────
  formatCurrency(value?: number | null): string {
    if (value == null) return '—';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  formatWeight(value?: number | null): string {
    if (value == null) return '—';
    return `${value.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;
  }
}