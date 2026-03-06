import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';

import { InputFieldComponent } from '../../../../shared/components/forms/input-field/input-field.component';
import { SelectFieldComponent, SelectOption } from '../../../../shared/components/forms/select-field/select-field.component';
import { CurrencyInputComponent } from '../../../../shared/components/forms/currency-input/currency-input.component';
import { CheckboxToggleComponent } from '../../../../shared/components/forms/checkbox-toggle/checkbox-toggle.component';
import { AlertComponent } from '../../../../shared/components/display/alert/alert.component';

import { FarmService } from '../../services/farm.service';
import { Employee, EMPLOYEE_ROLES } from '../../models/farm.model';

export interface EmployeeDialogData {
  farmId: string;
  employee?: Employee;   // present = edit mode
  terminate?: boolean;   // true = terminate mode
}

@Component({
  selector: 'app-employee-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    InputFieldComponent,
    SelectFieldComponent,
    CurrencyInputComponent,
    CheckboxToggleComponent,
    AlertComponent,
  ],
  templateUrl: './employee-form-dialog.component.html',
  styleUrl: './employee-form-dialog.component.scss',
})
export class EmployeeFormDialogComponent implements OnInit {
  private fb        = inject(FormBuilder);
  private farmSvc   = inject(FarmService);
  private snackBar  = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<EmployeeFormDialogComponent>);
  data              = inject<EmployeeDialogData>(MAT_DIALOG_DATA);

  employeeForm!: FormGroup;
  terminateForm!: FormGroup;
  saving = false;

  // ── Options ────────────────────────────────────────────────────────────────
  roleOptions: SelectOption[] = EMPLOYEE_ROLES.map(r => ({ label: r.label, value: r.value }));

  salaryFrequencyOptions: SelectOption[] = [
    { label: 'Diario',     value: 'daily'     },
    { label: 'Semanal',    value: 'weekly'    },
    { label: 'Quincenal',  value: 'biweekly'  },
    { label: 'Mensual',    value: 'monthly'   },
  ];

  // ── Computed ───────────────────────────────────────────────────────────────
  get isTerminate(): boolean { return !!this.data.terminate; }

  get dialogTitle(): string {
    if (this.isTerminate) return 'Retirar Empleado';
    return this.data.employee ? 'Editar Empleado' : 'Nuevo Empleado';
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.buildEmployeeForm();
    this.buildTerminateForm();

    if (this.data.employee && !this.isTerminate) {
      this.employeeForm.patchValue(this.data.employee);
    }
  }

  // ── Form builders ──────────────────────────────────────────────────────────
  private buildEmployeeForm(): void {
    this.employeeForm = this.fb.group({
      person:                    ['', Validators.required],
      role:                      ['general', Validators.required],
      job_title:                 [''],
      hire_date:                 [this.today(), Validators.required],
      salary:                    [null],
      salary_frequency:          ['monthly'],
      emergency_contact_name:    [''],
      emergency_contact_phone:   [''],
      lives_on_farm:             [false],
      housing_location:          [''],
    });
  }

  private buildTerminateForm(): void {
    this.terminateForm = this.fb.group({
      termination_date: [this.today(), Validators.required],
      reason:           [''],
    });
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.isTerminate) {
      this.submitTerminate();
    } else {
      this.submitEmployee();
    }
  }

  private submitEmployee(): void {
    if (this.employeeForm.invalid) { this.employeeForm.markAllAsTouched(); return; }

    this.saving = true;
    const payload = {
      ...this.employeeForm.value,
      farm: this.data.farmId,
    };

    const req$ = this.data.employee
      ? this.farmSvc.updateEmployee(this.data.employee.id, payload)
      : this.farmSvc.createEmployee(payload);

    req$.subscribe({
      next: (res) => {
        this.saving = false;
        this.snackBar.open(
          this.data.employee ? 'Empleado actualizado' : 'Empleado agregado',
          'Cerrar', { duration: 3000 }
        );
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.saving = false;
        const msg = err?.error?.message || 'Error al guardar el empleado';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      },
    });
  }

  private submitTerminate(): void {
    if (this.terminateForm.invalid) { this.terminateForm.markAllAsTouched(); return; }
    if (!this.data.employee) return;

    this.saving = true;
    this.farmSvc.terminateEmployee(this.data.employee.id, this.terminateForm.value).subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open('Empleado retirado exitosamente', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.saving = false;
        const msg = err?.error?.message || 'Error al retirar el empleado';
        this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
      },
    });
  }

  onCancel(): void { this.dialogRef.close(false); }

  // ── Helpers ────────────────────────────────────────────────────────────────
  private today(): string {
    return new Date().toISOString().split('T')[0];
  }
}