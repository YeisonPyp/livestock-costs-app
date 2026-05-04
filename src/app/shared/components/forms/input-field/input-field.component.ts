import {
  Component, Input, forwardRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor, NG_VALUE_ACCESSOR,
  AbstractControl, ValidationErrors
} from '@angular/forms';

let nextId = 0;

@Component({
  selector: 'app-input-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './input-field.component.html',
  styleUrl: './input-field.component.scss',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => InputFieldComponent),
    multi: true
  }]
})
export class InputFieldComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type:
    | 'text'
    | 'email'
    | 'password'
    | 'number'
    | 'tel'
    | 'url'
    | 'date'
    | 'datetime-local'
    | 'time'
    | 'search'
    = 'text';
  @Input() hint = '';
  @Input() prefix = '';
  @Input() suffix = '';
  @Input() prefixIcon = '';
  @Input() suffixIcon = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() maxLength?: number;
  @Input() autocomplete = 'off';
  @Input() control?: AbstractControl | null;
  @Input() min?: string | number;
  @Input() max?: string | number;
  @Input() step?: number | string;

  // ✅ NUEVO: Cantidad de decimales permitidos (null = sin restricción)
  @Input() decimals?: number | null = null;

  readonly inputId = `input-${++nextId}`;
  value: any = '';
  touched = false;
  showPassword = false;

  private onChange: (v: any) => void = () => {};
  private onTouched: () => void = () => {};

  // ═══════════════════════════════════════════════════════════════
  // Control Value Accessor
  // ═══════════════════════════════════════════════════════════════

  writeValue(val: any): void {
    this.value = val ?? '';
  }

  registerOnChange(fn: (v: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
  }

  // ═══════════════════════════════════════════════════════════════
  // Eventos
  // ═══════════════════════════════════════════════════════════════

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const rawValue = input.value;

    if (this.type === 'number') {
      this.handleNumberInput(input, rawValue);
    } else {
      this.value = rawValue;
      this.onChange(this.value);
    }
  }

  onBlur(): void {
    this.touched = true;
    this.onTouched();

    // ✅ Formatear al salir del campo (si tiene decimales configurados)
    if (this.type === 'number' && this.decimals != null && this.value !== '' && this.value != null) {
      const formatted = parseFloat(this.value).toFixed(this.decimals);
      this.value = Number(formatted);
      this.onChange(this.value);
    }
  }

  onFocus(): void {}

  // ═══════════════════════════════════════════════════════════════
  // Lógica de números con decimales
  // ═══════════════════════════════════════════════════════════════

  /**
   * Maneja el input numérico:
   * - Si decimals está definido, restringe los decimales permitidos
   * - Evita que el usuario escriba más decimales de los permitidos
   * - Convierte el string a número para el FormControl
   */
  private handleNumberInput(input: HTMLInputElement, rawValue: string): void {
    // Campo vacío
    if (rawValue === '' || rawValue === '-') {
      this.value = rawValue === '' ? null : rawValue;
      this.onChange(this.value);
      return;
    }

    // ✅ Si tiene restricción de decimales, truncar el exceso
    if (this.decimals != null) {
      const restricted = this.restrictDecimals(rawValue, this.decimals);

      // Si truncamos, corregir el input visualmente
      if (restricted !== rawValue) {
        input.value = restricted;
      }

      this.value = restricted === '' ? null : Number(restricted);
    } else {
      this.value = rawValue === '' ? null : Number(rawValue);
    }

    this.onChange(this.value);
  }

  /**
   * Restringe la cantidad de decimales en un string numérico.
   * 
   * Ejemplos con decimals=2:
   *   "123.456" → "123.45"
   *   "123."    → "123."   (permite el punto mientras escribe)
   *   "123"     → "123"
   */
  private restrictDecimals(value: string, maxDecimals: number): string {
    // Si no tiene punto decimal, devolver tal cual
    if (!value.includes('.')) {
      return value;
    }

    const [integerPart, decimalPart] = value.split('.');

    // Si decimals = 0, no permitir punto
    if (maxDecimals === 0) {
      return integerPart;
    }

    // Truncar decimales al máximo permitido
    const truncated = decimalPart.substring(0, maxDecimals);

    return `${integerPart}.${truncated}`;
  }

  // ═══════════════════════════════════════════════════════════════
  // Computed Step (para el atributo step del HTML)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Calcula el step automáticamente si no se proporcionó uno.
   * 
   * Ejemplos:
   *   decimals=2 → step="0.01"
   *   decimals=0 → step="1"
   *   decimals=3 → step="0.001"
   *   sin decimals y sin step → null (browser default)
   */
  get computedStep(): string | number | null {
    // Si el usuario pasó step explícito, usarlo
    if (this.step != null) {
      return this.step;
    }

    // Si tiene decimals configurado, calcular step automático
    if (this.type === 'number' && this.decimals != null) {
      if (this.decimals === 0) return '1';
      return (1 / Math.pow(10, this.decimals)).toString();
    }

    return null;
  }

  // ═══════════════════════════════════════════════════════════════
  // Password toggle
  // ═══════════════════════════════════════════════════════════════

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  get currentType(): string {
    return this.type === 'password' && this.showPassword ? 'text' : this.type;
  }

  // ═══════════════════════════════════════════════════════════════
  // Errores
  // ═══════════════════════════════════════════════════════════════

  get hasError(): boolean {
    if (!this.control) return false;
    return this.control.invalid && (this.control.touched || this.control.dirty);
  }

  get errorMessage(): string {
    if (!this.control?.errors) return '';
    const errors: ValidationErrors = this.control.errors;

    if (errors['required'])  return 'Este campo es obligatorio.';
    if (errors['email'])     return 'Ingresa un correo válido.';
    if (errors['minlength']) return `Mínimo ${errors['minlength'].requiredLength} caracteres.`;
    if (errors['maxlength']) return `Máximo ${errors['maxlength'].requiredLength} caracteres.`;
    if (errors['min'])       return `El valor mínimo es ${errors['min'].min}.`;
    if (errors['max'])       return `El valor máximo es ${errors['max'].max}.`;
    if (errors['pattern'])   return 'El formato no es válido.';

    return 'Campo inválido.';
  }
}