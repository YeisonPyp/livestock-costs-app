// components/create-contract-dialog/create-contract-dialog.component.ts

import {
  Component, inject, signal, ChangeDetectionStrategy
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { finalize } from 'rxjs';

import { ContractService } from '../../services/contract.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { CONTRACT_TYPE_DISPLAY } from '../../models/contract.model';
import { ContractType } from '../../models/enums';
import type { CreateContractPayload } from '../../models/contract.model';
import type { InvestorDetail } from '../../models/investor.model';

interface DialogData {
  investor?: InvestorDetail;
  investors?: Pick<InvestorDetail, 'id' | 'code' | 'fullName'>[];
}

@Component({
  selector: 'app-create-contract-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './create-contract-dialog.component.html',
  styleUrl:    './create-contract-dialog.component.scss',
})
export class CreateContractDialogComponent {
  private fb             = inject(FormBuilder);
  private dialogRef      = inject(MatDialogRef<CreateContractDialogComponent>);
  private contractSvc    = inject(ContractService);
  private notify         = inject(NotificationService);
  readonly data          = inject<DialogData>(MAT_DIALOG_DATA);

  readonly typeOptions = Object.entries(CONTRACT_TYPE_DISPLAY).map(([value, meta]) => ({
    value: value as ContractType, label: meta.label,
  }));

  readonly selectedFile  = signal<File | null>(null);
  readonly fileError     = signal<string | null>(null);
  readonly isDragOver    = signal(false);
  readonly submitting    = signal(false);
  readonly percentageErr = signal<string | null>(null);

  readonly form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      investorId:          [this.data.investor?.id ?? '', this.data.investor ? [] : [Validators.required]],
      contractType:        [ContractType.INITIAL, Validators.required],
      startDate:           ['', Validators.required],
      endDate:             [''],
      signedDate:          [''],
      investorPercentage:  [60, [Validators.required, Validators.min(0), Validators.max(100)]],
      operatorPercentage:  [40, [Validators.required, Validators.min(0), Validators.max(100)]],
      initialInvestment:   [null],
      notes:               [''],
    });

    // Auto-sync operator percentage
    this.form.get('investorPercentage')?.valueChanges.subscribe(val => {
      if (val != null) {
        this.form.patchValue({ operatorPercentage: 100 - val }, { emitEvent: false });
      }
    });
  }

  isFormValid(): boolean {
    const inv = this.form.value.investorPercentage ?? 0;
    const op  = this.form.value.operatorPercentage ?? 0;
    const sumOk = Math.abs((inv + op) - 100) < 0.01;
    this.percentageErr.set(sumOk ? null : 'Los porcentajes deben sumar 100%');
    return this.form.valid && !!this.selectedFile() && sumOk;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) this.validateAndSetFile(input.files[0]);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.validateAndSetFile(file);
  }

  removeFile(): void { this.selectedFile.set(null); }

  submit(): void {
    if (!this.isFormValid()) return;

    const v = this.form.value;
    const payload: CreateContractPayload = {
      investorId:         this.data.investor?.id ?? v.investorId,
      contractFile:       this.selectedFile()!,
      contractType:       v.contractType,
      startDate:          v.startDate,
      endDate:            v.endDate   || null,
      signedDate:         v.signedDate || null,
      investorPercentage: v.investorPercentage,
      operatorPercentage: v.operatorPercentage,
      initialInvestment:  v.initialInvestment || null,
      notes:              v.notes || '',
    };

    this.submitting.set(true);
    this.contractSvc.create(payload)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (res) => {
          this.notify.success('Contrato creado exitosamente');
          this.dialogRef.close(res.data);
        },
        error: (err) => {
          this.notify.error(err.error?.message ?? 'Error al crear el contrato');
        },
      });
  }

  close(): void { this.dialogRef.close(); }

  // ── Helpers ───────────────────────────────────────────────

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
}