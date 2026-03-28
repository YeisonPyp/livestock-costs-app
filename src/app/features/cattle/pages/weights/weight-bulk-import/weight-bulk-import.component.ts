// weight-bulk-import.component.ts
import { Component, inject, signal, computed, output, input } from '@angular/core';
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
export class WeightBulkImportComponent {
  private svc = inject(CattleService);
  private snack = inject(MatSnackBar);

  // ── Inputs ──────────────────────────────────────────────────────────────────
  /** Modo: 'default' solo registra, 'selection' permite seleccionar animales después */
  mode = input<'default' | 'selection'>('default');
  
  /** Título personalizado */
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
  animalsSelected = output<WeightedAnimal[]>();  // 👈 Nuevo
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

  weightedAnimals = computed(() => {
    return this.result()?.animals || [];
  });

  selectedAnimals = computed(() => {
    const ids = this.selectedAnimalIds();
    return this.weightedAnimals().filter(a => ids.has(a.id));
  });

  allSelected = computed(() => {
    const animals = this.weightedAnimals();
    const selected = this.selectedAnimalIds();
    return animals.length > 0 && animals.every(a => selected.has(a.id));
  });

  totalSelectedWeight = computed(() => {
    return this.selectedAnimals().reduce((sum, a) => sum + a.current_weight, 0);
  });

  // ── File handling ───────────────────────────────────────────────────────────
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.setFile(file || null);
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

    this.svc.bulkWeightFile(this.file()!, this.pricePerKg()!).subscribe({
      next: r => {
        this.uploading.set(false);
        this.result.set(r.data);

        if (r.data.recorded && r.data.recorded > 0) {
          this.snack.open(
            `✅ ${r.data.recorded} pesajes registrados`,
            'Cerrar',
            { duration: 5000, panelClass: 'snack-success' }
          );
          this.importSuccess.emit(r.data.recorded);

          // Si es modo selección, mostrar paso de selección
          if (this.mode() === 'selection' && r.data.animals?.length) {
            this.showSelectionStep.set(true);
            // Seleccionar todos por defecto
            this.selectAll();
          }
        } else if (r.data.errors?.length > 0) {
          this.snack.open(
            '⚠️ No se registraron pesajes. Revise los errores.',
            'Cerrar',
            { duration: 5000, panelClass: 'snack-warning' }
          );
        }
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
  }

  selectAll(): void {
    const all = new Set(this.weightedAnimals().map(a => a.id));
    this.selectedAnimalIds.set(all);
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

  confirmSelection(): void {
    const selected = this.selectedAnimals();
    if (selected.length === 0) {
      this.snack.open('Selecciona al menos un animal', 'Cerrar', { duration: 3000 });
      return;
    }
    this.animalsSelected.emit(selected);
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