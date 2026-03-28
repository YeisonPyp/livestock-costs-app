// weight-bulk-import.component.ts
import { Component, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CattleService } from '../../../services/cattle.service';
import { BulkWeightResult } from '../../../models/cattle.model';

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

  // ── Signals ─────────────────────────────────────────────────────────────────
  uploading = signal(false);
  result = signal<BulkWeightResult | null>(null);
  fileName = signal<string | null>(null);
  dragOver = signal(false);

  // ── Form state ──────────────────────────────────────────────────────────────
  file = signal<File | null>(null);
  pricePerKg = signal<number | null>(null);

  // ── Outputs ─────────────────────────────────────────────────────────────────
  importSuccess = output<number>();
  close = output<void>();

  // ── Computed ────────────────────────────────────────────────────────────────
  isFormValid = computed(() => {
    return this.file() !== null && this.pricePerKg() !== null && this.pricePerKg()! > 0;
  });

  isSuccess = computed(() => {
    const r = this.result();
    return r && r.recorded && r.recorded > 0;
  });

  hasErrors = computed(() => {
    const r = this.result();
    return r && r.errors && r.errors.length > 0;
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
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    
    return (
      validTypes.includes(file.type) ||
      validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
    );
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

  // ── Actions ─────────────────────────────────────────────────────────────────
  closeResult(): void {
    this.result.set(null);
    this.file.set(null);
    this.fileName.set(null);
    this.pricePerKg.set(null);
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
}