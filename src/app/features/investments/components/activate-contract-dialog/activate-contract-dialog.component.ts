// components/activate-contract-dialog/activate-contract-dialog.component.ts

import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import type { ActivateContractPayload } from '../../models/contract.model';

@Component({
  selector: 'app-activate-contract-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <div class="dialog-sm">
      <div class="dialog-header">
        <h3>Activar Contrato</h3>
        <button class="close-btn" (click)="close()">×</button>
      </div>
      <form [formGroup]="form" (ngSubmit)="confirm()" class="dialog-body">
        <p class="dialog-desc">
          Al activar el contrato pasará a estado <strong>Activo</strong>.
          Opcionalmente registra la fecha de firma.
        </p>
        <div class="form-group">
          <label class="form-label">Fecha de Firma <span class="optional">(opcional)</span></label>
          <input type="date" formControlName="signedDate" class="form-control" />
        </div>
        <div class="dialog-footer">
          <button type="button" class="btn btn-ghost" (click)="close()">Cancelar</button>
          <button type="submit" class="btn btn-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px;height:16px">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Activar
          </button>
        </div>
      </form>
    </div>
  `,
  styleUrl: '../_shared-dialog.scss',
})
export class ActivateContractDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ActivateContractDialogComponent>);

  form = this.fb.group({ signedDate: [''] });

  confirm(): void {
    const payload: ActivateContractPayload = {
      signedDate: this.form.value.signedDate || null,
    };
    this.dialogRef.close(payload);
  }

  close(): void { this.dialogRef.close(null); }
}