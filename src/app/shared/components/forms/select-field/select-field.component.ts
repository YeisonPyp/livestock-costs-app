// select-field.component.ts
import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, AbstractControl, FormControl } from '@angular/forms';

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

let nextId = 0;

@Component({
  selector: 'app-select-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select-field.component.html',
  styleUrl: './select-field.component.scss',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SelectFieldComponent),
    multi: true
  }]
})
export class SelectFieldComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = 'Selecciona una opción';
  @Input() options: SelectOption[] = [];
  @Input() hint = '';
  @Input() required = false;
  @Input() control?: AbstractControl | null;
  @Input() hasError = false;                    // ← Input para error externo
  @Input() errorMessage = '';                   // ← Input para mensaje de error

  readonly inputId = `select-${++nextId}`;
  value: string | number = '';
  disabled = false;

  private onChangeFn: (v: string | number) => void = () => {};
  private onTouchedFn: () => void = () => {};

  writeValue(v: string | number): void { 
    this.value = v ?? ''; 
  }

  registerOnChange(fn: (v: string | number) => void): void { 
    this.onChangeFn = fn; 
  }

  registerOnTouched(fn: () => void): void { 
    this.onTouchedFn = fn; 
  }

  setDisabledState(d: boolean): void { 
    this.disabled = d; 
  }

  onChange(event: Event): void {
    this.value = (event.target as HTMLSelectElement).value;
    this.onChangeFn(this.value);
  }

  onBlur(): void {
    this.onTouchedFn();
  }
}