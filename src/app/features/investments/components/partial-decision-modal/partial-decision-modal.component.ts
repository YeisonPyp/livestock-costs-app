// components/partial-decision-modal/partial-decision-modal.component.ts

import {
  Component, OnInit, ChangeDetectionStrategy,
  input, output, inject, signal, effect
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { formatCurrency } from '../../../../core/utils/helpers';

@Component({
  selector: 'app-partial-decision-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './partial-decision-modal.component.html',
  styleUrl:    './partial-decision-modal.component.scss',
})
export class PartialDecisionModalComponent implements OnInit {
  readonly totalAmount = input.required<number>();
  readonly submitted   = output<{ withdrawAmount: number }>();
  readonly cancelled   = output<void>();

  private fb = inject(FormBuilder);
  readonly fmt = formatCurrency;
  
  // Señales reactivas
  readonly calculatedReinvest = signal(0);
  readonly formattedWithdraw = signal('0'); // Controla el texto formateado en pantalla

  readonly form = this.fb.group({
    withdrawAmount: [0, [Validators.required, Validators.min(1)]]
  });

  constructor() {
    effect(() => {
      const maxAvailable = this.totalAmount();
      const withdrawCtrl = this.form.get('withdrawAmount');
      if (withdrawCtrl) {
        withdrawCtrl.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(maxAvailable)
        ]);
        withdrawCtrl.updateValueAndValidity();
      }
    });
  }

  ngOnInit(): void {
    this.calculatedReinvest.set(this.totalAmount());

    // Sincronizar el cálculo de la simulación de reinversión
    this.form.get('withdrawAmount')?.valueChanges.subscribe(v => {
      const withdraw = +(v ?? 0);
      const net = this.totalAmount();
      this.calculatedReinvest.set(Number(Math.max(0, net - withdraw).toFixed(2)));
    });
  }

  // ── 🎛️ GESTIÓN DE FORMATO E INTERACCIÓN DEL INPUT ──────────────────

  /**
   * Se ejecuta al escribir: limpia caracteres, actualiza el valor numérico
   * real en el Form y formatea visualmente con puntos.
   */
  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    // Eliminar todo lo que no sea un dígito numérico
    let rawValue = input.value.replace(/[^0-9]/g, '');

    if (rawValue === '') {
      this.form.get('withdrawAmount')?.setValue(0);
      this.formattedWithdraw.set('');
      input.value = '';
      return;
    }

    const numValue = parseInt(rawValue, 10);

    // Guardar el número entero real en el FormGroup para validaciones
    this.form.get('withdrawAmount')?.setValue(numValue);

    // Formatear visualmente con puntos de miles (localización alemana/colombiana usa puntos)
    const formatted = numValue.toLocaleString('de-DE');
    this.formattedWithdraw.set(formatted);
    input.value = formatted;
  }

  /**
   * Al hacer clic/enfocar, si el valor es 0, vacía el campo para escribir directamente.
   */
  onInputFocus(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    if (this.form.get('withdrawAmount')?.value === 0) {
      input.value = '';
      this.formattedWithdraw.set('');
    }
  }

  /**
   * Al perder el foco, si el campo quedó vacío, lo restablece visualmente a 0.
   */
  onInputBlur(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    if (input.value.trim() === '') {
      input.value = '0';
      this.formattedWithdraw.set('0');
      this.form.get('withdrawAmount')?.setValue(0);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    
    const withdraw = +(this.form.get('withdrawAmount')?.value ?? 0);
    this.submitted.emit({ withdrawAmount: withdraw });
  }
}