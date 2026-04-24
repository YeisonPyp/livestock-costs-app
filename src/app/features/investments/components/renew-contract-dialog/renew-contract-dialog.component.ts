// components/renew-contract-dialog/renew-contract-dialog.component.ts

import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import type { RenewContractPayload, ContractDetail } from '../../models/contract.model';

interface DialogData { contract: ContractDetail; }

@Component({
  selector: 'app-renew-contract-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="dialog-sm">
      <div class="dialog-header">
        <h3>Renovar Contrato</h3>
        <button class="close-btn" (click)="close()">×</button>
      </div>
      <form [formGroup]="form" (ngSubmit)="confirm()" class="dialog-body">
        <p class="dialog-desc">
          Se creará un nuevo contrato basado en
          <strong>{{ data.contract.contractNumber }}</strong>.
        </p>

        <!-- Archivo -->
        <div class="form-group">
          <label class="form-label required">Nuevo archivo PDF</label>
          <div
            class="file-upload"
            [class.has-file]="selectedFile()"
            (dragover)="$event.preventDefault()"
            (drop)="onDrop($event)">
            @if (selectedFile(); as f) {
              <span class="file-name">{{ f.name }}</span>
              <button type="button" class="remove-file" (click)="selectedFile.set(null)">×</button>
            } @else {
              <label class="browse-btn">
                Seleccionar PDF
                <input type="file" accept=".pdf" (change)="onFileSelected($event)" hidden />
              </label>
            }
          </div>
          @if (fileError()) { <span class="error-text">{{ fileError() }}</span> }
        </div>

        <!-- Fechas -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label required">Fecha de Inicio</label>
            <input type="date" formControlName="startDate" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Fecha de Fin</label>
            <input type="date" formControlName="endDate" class="form-control" />
          </div>
        </div>

        <!-- Porcentajes (heredados pero editables) -->
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">% Inversionista</label>
            <input type="number" formControlName="investorPercentage"
              class="form-control" min="0" max="100" step="0.01"
              [placeholder]="data.contract.investorPercentage" />
          </div>
          <div class="form-group">
            <label class="form-label">% Operador</label>
            <input type="number" formControlName="operatorPercentage"
              class="form-control" min="0" max="100" step="0.01"
              [placeholder]="data.contract.operatorPercentage" />
          </div>
        </div>

        <div class="hint">Deja vacío para mantener los porcentajes actuales.</div>

        <!-- Notas -->
        <div class="form-group">
          <label class="form-label">Notas</label>
          <textarea formControlName="notes" class="form-control" rows="2"
            placeholder="Condiciones del nuevo período..."></textarea>
        </div>

        <div class="dialog-footer">
          <button type="button" class="btn btn-ghost" (click)="close()">Cancelar</button>
          <button type="submit" class="btn btn-primary"
            [disabled]="form.invalid || !selectedFile()">
            Crear Renovación
          </button>
        </div>
      </form>
    </div>
  `,
  styleUrl: '../_shared-dialog.scss',
})
export class RenewContractDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<RenewContractDialogComponent>);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);

  readonly selectedFile = signal<File | null>(null);
  readonly fileError    = signal<string | null>(null);

  form = this.fb.group({
    startDate:          ['', Validators.required],
    endDate:            [''],
    investorPercentage: [null as number | null],
    operatorPercentage: [null as number | null],
    notes:              [''],
  });

  onFileSelected(event: Event): void {
    const f = (event.target as HTMLInputElement).files?.[0];
    if (f) this.setFile(f);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const f = event.dataTransfer?.files[0];
    if (f) this.setFile(f);
  }

  confirm(): void {
    if (this.form.invalid || !this.selectedFile()) return;
    const v = this.form.value;
    const payload: RenewContractPayload = {
      contractFile:       this.selectedFile()!,
      startDate:          v.startDate!,
      endDate:            v.endDate    || null,
      investorPercentage: v.investorPercentage ?? null,
      operatorPercentage: v.operatorPercentage ?? null,
      notes:              v.notes     || undefined,
    };
    this.dialogRef.close(payload);
  }

  close(): void { this.dialogRef.close(null); }

  private setFile(file: File): void {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.fileError.set('Solo se permiten archivos PDF'); return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.fileError.set('El archivo no puede superar 10 MB'); return;
    }
    this.fileError.set(null);
    this.selectedFile.set(file);
  }
}