import {
  Component, Input, forwardRef, HostBinding, OnInit
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
  @Input() type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' = 'text';
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
  /** Pass the FormControl for automatic error display */
  @Input() control?: AbstractControl | null;

  readonly inputId = `input-${++nextId}`;
  value = '';
  touched = false;
  showPassword = false;

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: string): void { this.value = val ?? ''; }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.disabled = disabled; }

  onInput(event: Event): void {
    this.value = (event.target as HTMLInputElement).value;
    this.onChange(this.value);
  }

  onBlur(): void { this.touched = true; this.onTouched(); }
  onFocus(): void {}

  togglePassword(): void { this.showPassword = !this.showPassword; }

  get currentType(): string {
    return this.type === 'password' && this.showPassword ? 'text' : this.type;
  }

  get hasError(): boolean {
    if (!this.control) return false;
    return this.control.invalid && (this.control.touched || this.control.dirty);
  }

  get errorMessage(): string {
    if (!this.control?.errors) return '';
    const errors: ValidationErrors = this.control.errors;
    if (errors['required'])   return 'Este campo es obligatorio.';
    if (errors['email'])      return 'Ingresa un correo válido.';
    if (errors['minlength'])  return `Mínimo ${errors['minlength'].requiredLength} caracteres.`;
    if (errors['maxlength'])  return `Máximo ${errors['maxlength'].requiredLength} caracteres.`;
    if (errors['min'])        return `El valor mínimo es ${errors['min'].min}.`;
    if (errors['max'])        return `El valor máximo es ${errors['max'].max}.`;
    if (errors['pattern'])    return 'El formato no es válido.';
    return 'Campo inválido.';
  }
}