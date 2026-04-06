// modules/investments/components/create-contract-dialog/create-contract-dialog.component.ts

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { ContractService } from '../../services/contract.service';
import { CONTRACT_TYPE_OPTIONS, CreateContractPayload } from '../../models/contract.model';
import { Investor } from '../../models/investment.model';

interface DialogData {
  investor?: Investor;
  investors?: Investor[];
}

@Component({
  selector: 'app-create-contract-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2>Nuevo Contrato</h2>
        <button class="close-btn" (click)="close()">×</button>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="dialog-body">
          <!-- Inversionista -->
          @if (!data.investor) {
            <div class="form-group">
              <label class="form-label required">Inversionista</label>
              <select formControlName="investor_id" class="form-control">
                <option value="">Seleccionar...</option>
                @for (inv of data.investors ?? []; track inv.id) {
                  <option [value]="inv.id">{{ inv.code }} - {{ inv.full_name }}</option>
                }
              </select>
              @if (form.get('investor_id')?.touched && form.get('investor_id')?.errors?.['required']) {
                <span class="error-text">Seleccione un inversionista</span>
              }
            </div>
          } @else {
            <div class="selected-investor">
              <span class="label">Inversionista:</span>
              <span class="value">{{ data.investor.code }} - {{ data.investor.full_name }}</span>
            </div>
          }

          <!-- Archivo -->
          <div class="form-group">
            <label class="form-label required">Archivo del Contrato (PDF)</label>
            <div class="file-upload" 
                 [class.has-file]="selectedFile()"
                 [class.drag-over]="isDragOver()"
                 (dragover)="onDragOver($event)"
                 (dragleave)="isDragOver.set(false)"
                 (drop)="onDrop($event)">
              @if (selectedFile()) {
                <div class="file-info">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="file-icon">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                  </svg>
                  <span class="file-name">{{ selectedFile()!.name }}</span>
                  <span class="file-size">({{ (selectedFile()!.size / 1024 / 1024).toFixed(2) }} MB)</span>
                  <button type="button" class="remove-file" (click)="removeFile()">×</button>
                </div>
              } @else {
                <div class="upload-prompt">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="upload-icon">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span>Arrastra el archivo aquí o</span>
                  <label class="browse-btn">
                    selecciona
                    <input type="file" accept=".pdf" (change)="onFileSelected($event)" hidden>
                  </label>
                </div>
              }
            </div>
            @if (fileError()) {
              <span class="error-text">{{ fileError() }}</span>
            }
          </div>

          <!-- Tipo y Fechas -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Tipo de Contrato</label>
              <select formControlName="contract_type" class="form-control">
                @for (type of typeOptions; track type.value) {
                  <option [value]="type.value">{{ type.label }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="form-label required">Fecha de Inicio</label>
              <input type="date" formControlName="start_date" class="form-control">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Fecha de Fin (opcional)</label>
              <input type="date" formControlName="end_date" class="form-control">
            </div>
            <div class="form-group">
              <label class="form-label">Fecha de Firma</label>
              <input type="date" formControlName="signed_date" class="form-control">
            </div>
          </div>

          <!-- Porcentajes -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">% Inversionista</label>
              <input type="number" formControlName="investor_percentage" 
                     class="form-control" min="0" max="100" step="0.01">
            </div>
            <div class="form-group">
              <label class="form-label required">% Operador</label>
              <input type="number" formControlName="operator_percentage" 
                     class="form-control" min="0" max="100" step="0.01">
            </div>
          </div>
          @if (percentageError()) {
            <span class="error-text">{{ percentageError() }}</span>
          }

          <!-- Inversión Inicial -->
          <div class="form-group">
            <label class="form-label">Inversión Inicial (opcional)</label>
            <input type="number" formControlName="initial_investment" 
                   class="form-control" min="0" step="0.01" placeholder="0.00">
          </div>

          <!-- Notas -->
          <div class="form-group">
            <label class="form-label">Notas</label>
            <textarea formControlName="notes" class="form-control" rows="3" 
                      placeholder="Observaciones..."></textarea>
          </div>
        </div>

        <div class="dialog-footer">
          <button type="button" class="btn btn-ghost" (click)="close()">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" 
                  [disabled]="submitting() || !isFormValid()">
            @if (submitting()) {
              <span class="spinner"></span>
              Guardando...
            } @else {
              Crear Contrato
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    @use '../../../../styles/variables' as *;

    .dialog-container { width: 100%; max-width: 600px; }
    .dialog-header { display: flex; justify-content: space-between; align-items: center; padding: $space-4 $space-5; border-bottom: 1px solid $border-color;
      h2 { margin: 0; font-size: $font-lg; font-weight: $weight-bold; }
    }
    .close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: $slate-400; &:hover { color: $slate-600; } }
    .dialog-body { padding: $space-5; max-height: 70vh; overflow-y: auto; }
    .dialog-footer { display: flex; justify-content: flex-end; gap: $space-3; padding: $space-4 $space-5; border-top: 1px solid $border-color; background: $slate-50; }

    .form-group { margin-bottom: $space-4; }
    .form-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: $space-4; }
    .form-label { display: block; font-size: $font-sm; font-weight: $weight-medium; color: $slate-700; margin-bottom: $space-1;
      &.required::after { content: '*'; color: $danger; margin-left: $space-1; }
    }
    .form-control { width: 100%; padding: $space-2 $space-3; border: 1px solid $border-color; border-radius: $border-radius; font-size: $font-sm; @include transition(border-color, box-shadow);
      &:focus { outline: none; border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.1); }
    }
    .error-text { display: block; color: $danger; font-size: $font-xs; margin-top: $space-1; }

    .selected-investor { display: flex; gap: $space-2; padding: $space-3; background: $slate-50; border-radius: $border-radius; margin-bottom: $space-4;
      .label { font-size: $font-sm; color: $slate-500; }
      .value { font-weight: $weight-medium; color: $slate-800; }
    }

    .file-upload { border: 2px dashed $border-color; border-radius: $border-radius-md; padding: $space-6; text-align: center; @include transition(border-color, background-color);
      &:hover, &.drag-over { border-color: $primary; background: rgba($primary, 0.02); }
      &.has-file { border-style: solid; background: $slate-50; padding: $space-4; }
    }
    .upload-prompt { display: flex; flex-direction: column; align-items: center; gap: $space-2; color: $slate-500; font-size: $font-sm; }
    .upload-icon { width: 48px; height: 48px; color: $slate-300; }
    .browse-btn { color: $primary; font-weight: $weight-medium; cursor: pointer; &:hover { text-decoration: underline; } }
    .file-info { display: flex; align-items: center; gap: $space-2; }
    .file-icon { width: 24px; height: 24px; color: $danger; }
    .file-name { font-weight: $weight-medium; color: $slate-800; }
    .file-size { color: $slate-400; font-size: $font-xs; }
    .remove-file { background: none; border: none; color: $slate-400; font-size: 20px; cursor: pointer; &:hover { color: $danger; } }

    .btn { display: inline-flex; align-items: center; gap: $space-2; padding: $space-2 $space-4; border: none; border-radius: $border-radius; font-size: $font-sm; font-weight: $weight-medium; cursor: pointer; @include transition(background-color);
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .btn-primary { background: $primary; color: $white; &:hover:not(:disabled) { background: $primary-hover; } }
    .btn-ghost { background: transparent; color: $slate-600; &:hover { background: $slate-100; } }
    .spinner { width: 16px; height: 16px; border: 2px solid transparent; border-top-color: currentColor; border-radius: 50%; animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class CreateContractDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CreateContractDialogComponent>);
  private contractService = inject(ContractService);
  private snackBar = inject(MatSnackBar);
  data = inject<DialogData>(MAT_DIALOG_DATA);

  typeOptions = CONTRACT_TYPE_OPTIONS;

  form: FormGroup;
  selectedFile = signal<File | null>(null);
  fileError = signal<string | null>(null);
  isDragOver = signal(false);
  submitting = signal(false);

  constructor() {
    this.form = this.fb.group({
      investor_id: [this.data.investor?.id ?? '', this.data.investor ? [] : [Validators.required]],
      contract_type: ['initial', Validators.required],
      start_date: ['', Validators.required],
      end_date: [''],
      signed_date: [''],
      investor_percentage: [60, [Validators.required, Validators.min(0), Validators.max(100)]],
      operator_percentage: [40, [Validators.required, Validators.min(0), Validators.max(100)]],
      initial_investment: [null],
      notes: [''],
    });

    // Sincronizar porcentajes
    this.form.get('investor_percentage')?.valueChanges.subscribe(val => {
      if (val !== null && val !== undefined) {
        this.form.patchValue({ operator_percentage: 100 - val }, { emitEvent: false });
      }
    });
  }

  percentageError = signal<string | null>(null);

  isFormValid(): boolean {
    const inv = this.form.value.investor_percentage ?? 0;
    const op = this.form.value.operator_percentage ?? 0;
    const sumOk = Math.abs((inv + op) - 100) < 0.01;
    
    if (!sumOk) {
      this.percentageError.set('Los porcentajes deben sumar 100%');
    } else {
      this.percentageError.set(null);
    }

    return this.form.valid && !!this.selectedFile() && sumOk;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.validateAndSetFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.validateAndSetFile(file);
    }
  }

  private validateAndSetFile(file: File): void {
    this.fileError.set(null);

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.fileError.set('Solo se permiten archivos PDF');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.fileError.set('El archivo no puede superar 10 MB');
      return;
    }

    this.selectedFile.set(file);
  }

  removeFile(): void {
    this.selectedFile.set(null);
  }

  submit(): void {
    if (!this.isFormValid()) return;

    this.submitting.set(true);

    const payload: CreateContractPayload = {
      investor_id: this.data.investor?.id ?? this.form.value.investor_id,
      contract_file: this.selectedFile()!,
      contract_type: this.form.value.contract_type,
      start_date: this.form.value.start_date,
      end_date: this.form.value.end_date || null,
      signed_date: this.form.value.signed_date || null,
      investor_percentage: this.form.value.investor_percentage,
      operator_percentage: this.form.value.operator_percentage,
      initial_investment: this.form.value.initial_investment || null,
      notes: this.form.value.notes || '',
    };

    this.contractService.createContract(payload)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.snackBar.open('Contrato creado exitosamente', 'Cerrar', { duration: 3000 });
            this.dialogRef.close(res.data);
          }
        },
        error: (err) => {
          const message = err.error?.message ?? 'Error al crear el contrato';
          this.snackBar.open(message, 'Cerrar', { duration: 5000 });
        },
      });
  }

  close(): void {
    this.dialogRef.close();
  }
}