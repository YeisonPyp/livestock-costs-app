// components/terminate-contract-dialog/terminate-contract-dialog.component.ts

import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import type { TerminateContractPayload } from '../../models/contract.model';

@Component({
  selector: 'app-terminate-contract-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="dialog-sm">
      <div class="dialog-header">
        <h3>Terminar Contrato</h3>
        <button class="close-btn" (click)="close()">×</button>
      </div>
      <form [formGroup]="form" (ngSubmit)="confirm()" class="dialog-body">
        <p class="dialog-desc">
          Esta acción <strong>no se puede deshacer</strong>.
          El contrato pasará a estado <em>Terminado</em>.
        </p>
        <div class="form-group">
          <label class="form-label required">Motivo de terminación</label>
          <textarea
            formControlName="reason"
            class="form-control"
            rows="3"
            placeholder="Describe el motivo de la terminación..."></textarea>
          @if (form.get('reason')?.touched && form.get('reason')?.errors?.['required']) {
            <span class="error-text">El motivo es requerido</span>
          }
        </div>
        <div class="dialog-footer">
          <button type="button" class="btn btn-ghost" (click)="close()">Cancelar</button>
          <button type="submit" class="btn btn-danger" [disabled]="form.invalid">
            Terminar Contrato
          </button>
        </div>
      </form>
    </div>
  `,
  styleUrl: '../_shared-dialog.scss',
})
export class TerminateContractDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<TerminateContractDialogComponent>);

  form = this.fb.group({
    reason: ['', Validators.required],
  });

  confirm(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const payload: TerminateContractPayload = { reason: this.form.value.reason! };
    this.dialogRef.close(payload);
  }

  close(): void { this.dialogRef.close(null); }
}