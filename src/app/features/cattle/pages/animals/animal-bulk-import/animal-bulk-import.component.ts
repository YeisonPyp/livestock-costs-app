// animal-bulk-import.component.ts
import { Component, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CattleService } from '../../../services/cattle.service';
import { BulkImportResult, BulkImportError } from '../../../models/cattle.model';

@Component({
  selector: 'app-animal-bulk-import',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './animal-bulk-import.component.html',
  styleUrl: './animal-bulk-import.component.scss',
})
export class AnimalBulkImportComponent {
  private svc = inject(CattleService);
  private snack = inject(MatSnackBar);

  // ── Signals ─────────────────────────────────────────────────────────────────
  uploading = signal(false);
  uploadResult = signal<BulkImportResult | null>(null);
  showCapitalDetails = signal(false);

  // ── Outputs ─────────────────────────────────────────────────────────────────
  importSuccess = output<number>(); // Emite cantidad de animales creados
  close = output<void>();

  // ── Computed ────────────────────────────────────────────────────────────────
  groupedErrors = computed(() => {
    const result = this.uploadResult();
    if (!result?.errors?.length) return null;

    const groups: Record<string, BulkImportError[]> = {
      capital_insufficient: [],
      error: [],
      warning: [],
      exception: [],
    };

    result.errors.forEach(err => {
      const type = err.type || 'error';
      groups[type]?.push(err) ?? groups['error'].push(err);
    });

    return groups;
  });

  hasErrors = computed(() => {
    const result = this.uploadResult();
    return result && result.errors.length > 0;
  });

  isSuccess = computed(() => {
    const result = this.uploadResult();
    return result?.success && result.created > 0;
  });

  // ── Methods ─────────────────────────────────────────────────────────────────
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading.set(true);
    this.uploadResult.set(null);
    this.showCapitalDetails.set(false);

    this.svc.bulkCreateAnimalsFile(file).subscribe({
      next: r => {
        this.uploading.set(false);
        this.uploadResult.set(r.data);

        if (r.data.success && r.data.created > 0) {
          this.snack.open(
            `✅ ${r.data.created} animales creados exitosamente`,
            'Cerrar',
            { duration: 5000, panelClass: 'snack-success' }
          );
          this.importSuccess.emit(r.data.created);
        } else if (!r.data.success) {
          this.snack.open(
            '⚠️ No se pudo procesar el archivo',
            'Cerrar',
            { duration: 5000, panelClass: 'snack-warning' }
          );
        }

        input.value = '';
      },
      error: e => {
        this.uploading.set(false);
        this.snack.open(
          e?.error?.message || 'Error al procesar archivo',
          'Cerrar',
          { duration: 4000, panelClass: 'snack-error' }
        );
        input.value = '';
      },
    });
  }

  toggleCapitalDetails(): void {
    this.showCapitalDetails.update(v => !v);
  }

  closeResult(): void {
    this.uploadResult.set(null);
    this.showCapitalDetails.set(false);
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