// components/create-contract-dialog/create-contract-dialog.component.ts

import {
  Component, inject, signal, computed,
  ChangeDetectionStrategy, OnInit
} from '@angular/core';
import {
  FormBuilder, FormGroup, ReactiveFormsModule, Validators
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { InputFieldComponent }    from '../../../../shared/components/forms/input-field/input-field.component';
import { SelectFieldComponent }   from '../../../../shared/components/forms/select-field/select-field.component';

import { CONTRACT_TYPE_DISPLAY }  from '../../models/contract.model';
import { ContractType }           from '../../models/enums';

import type { CreateContractPayload } from '../../models/contract.model';
import type { InvestorDetail }        from '../../models/investor.model';
import { ContractFacade } from '../../facades/contract.facade';

// ══════════════════════════════════════════════════════════════
// Interfaz de datos del diálogo
// ══════════════════════════════════════════════════════════════

export interface ContractDialogData {
  /** Si viene, el investor está preseleccionado y no se puede cambiar */
  investor?: InvestorDetail;
  /** Lista de investors para seleccionar (cuando no viene uno fijo) */
  investors?: Pick<InvestorDetail, 'id' | 'code' | 'fullName'>[];
}

// ══════════════════════════════════════════════════════════════
// Constantes
// ══════════════════════════════════════════════════════════════

const MAX_FILE_SIZE_MB   = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_EXTENSIONS  = ['.pdf'];

@Component({
  selector: 'app-create-contract-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ContractFacade],
  imports: [
    ReactiveFormsModule,
    InputFieldComponent,
    SelectFieldComponent,
  ],
  templateUrl: './create-contract-dialog.component.html',
  styleUrl:    './create-contract-dialog.component.scss',
})
export class CreateContractDialogComponent implements OnInit {

  // ── Inyecciones ───────────────────────────────────────────
  private fb          = inject(FormBuilder);
  private dialogRef   = inject(MatDialogRef<CreateContractDialogComponent>);
  readonly facade     = inject(ContractFacade);
  readonly data       = inject<ContractDialogData>(MAT_DIALOG_DATA);

  // ── Estado ────────────────────────────────────────────────
  readonly selectedFile  = signal<File | null>(null);
  readonly fileError     = signal<string | null>(null);
  readonly isDragOver    = signal(false);
  readonly submitting    = signal(false);

  // ── Computed ──────────────────────────────────────────────
  /** true si el investor viene precargado y no se puede cambiar */
  readonly hasFixedInvestor = computed(() => !!this.data.investor);

  /** Título dinámico */
  readonly dialogTitle = computed(() =>
    this.hasFixedInvestor()
      ? `Nuevo Contrato — ${this.data.investor!.code}`
      : 'Nuevo Contrato'
  );

  // ── Opciones para selects ─────────────────────────────────
  readonly typeOptions = Object.entries(CONTRACT_TYPE_DISPLAY).map(
    ([value, meta]) => ({ value: value as ContractType, label: meta.label })
  );

  readonly investorOptions = computed(() =>
    (this.data.investors ?? []).map(inv => ({
      value: inv.id,
      label: `${inv.code} — ${inv.fullName}`,
    }))
  );

  // ── Formulario ────────────────────────────────────────────
  readonly form: FormGroup;

  get f() { return this.form.controls; }

  /** Fecha de hoy para limitar inputs de fecha */
  readonly today = new Date().toISOString().split('T')[0];

  constructor() {
    this.form = this.fb.group({
      investorId: [
        this.data.investor?.id ?? '',
        this.data.investor ? [] : [Validators.required],
      ],
      contractType:       [ContractType.INITIAL, Validators.required],
      startDate:          ['', Validators.required],
      endDate:            [''],
      signedDate:         [''],
      investorPercentage: [
        60,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      operatorPercentage: [{ value: 40, disabled: true }],
      initialInvestment:  [null, [Validators.min(0)]],
      notes:              [''],
    });
  }

  // ══════════════════════════════════════════════════════════
  // Lifecycle
  // ══════════════════════════════════════════════════════════

  ngOnInit(): void {
    console.log('Dialog data:', this.data);
    this.setupPercentageSync();
    this.prefillFromInvestor();
  }

  // ══════════════════════════════════════════════════════════
  // Setup
  // ══════════════════════════════════════════════════════════

  /**
   * Sincroniza operatorPercentage = 100 - investorPercentage
   */
  private setupPercentageSync(): void {
    this.form.get('investorPercentage')?.valueChanges.subscribe(val => {
      const v = Number(val) ?? 0;
      if (v >= 0 && v <= 100) {
        this.form.get('operatorPercentage')?.setValue(
          100 - v,
          { emitEvent: false }
        );
      }
    });
  }

  /**
   * Si viene un investor precargado, prellenar datos que ya conocemos
   */
  private prefillFromInvestor(): void {
    const investor = this.data.investor;
    if (!investor) return;
  }

  // ══════════════════════════════════════════════════════════
  // Validación del formulario
  // ══════════════════════════════════════════════════════════

  get isFormValid(): boolean {
    return this.form.valid && !!this.selectedFile() && !this.fileError();
  }

  get percentageError(): string | null {
    const inv = this.form.get('investorPercentage')?.value ?? 0;
    const op  = this.form.getRawValue().operatorPercentage ?? 0;
    const sum = Number(inv) + Number(op);

    if (Math.abs(sum - 100) > 0.01) {
      return 'Los porcentajes deben sumar 100%';
    }
    return null;
  }

  // ══════════════════════════════════════════════════════════
  // Manejo de archivos
  // ══════════════════════════════════════════════════════════

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.validateAndSetFile(file);
    }
    // Reset para poder re-seleccionar el mismo archivo
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const file = event.dataTransfer?.files[0];
    if (file) this.validateAndSetFile(file);
  }

  removeFile(): void {
    this.selectedFile.set(null);
    this.fileError.set(null);
  }

  private validateAndSetFile(file: File): void {
    this.fileError.set(null);

    const extension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      this.fileError.set(
        `Solo se permiten archivos: ${ALLOWED_EXTENSIONS.join(', ')}`
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.fileError.set(
        `El archivo no puede superar ${MAX_FILE_SIZE_MB} MB`
      );
      return;
    }

    this.selectedFile.set(file);
  }

  /** Tamaño del archivo formateado */
  get fileSizeFormatted(): string {
    const file = this.selectedFile();
    if (!file) return '';

    const mb = file.size / 1024 / 1024;
    return mb >= 1
      ? `${mb.toFixed(2)} MB`
      : `${(file.size / 1024).toFixed(0)} KB`;
  }

  // ══════════════════════════════════════════════════════════
  // Submit
  // ══════════════════════════════════════════════════════════

  submit(): void {
    // Marcar todos los campos como touched para mostrar errores
    this.form.markAllAsTouched();

    if (!this.isFormValid) return;

    const v = this.form.getRawValue(); // getRawValue incluye disabled fields

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

    this.facade.createContract(payload).subscribe({
    next: (res) => {
      this.dialogRef.close(res.data);
    }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}