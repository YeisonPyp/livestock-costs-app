import { Component, Input, forwardRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, AbstractControl } from '@angular/forms';

let nextId = 0;

@Component({
  selector: 'app-currency-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './currency-input.component.html',
  styleUrl: './currency-input.component.scss',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => CurrencyInputComponent),
    multi: true
  }]
})
export class CurrencyInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '0';
  @Input() currency = 'COP';
  @Input() locale = 'es-CO';
  @Input() hint = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() control?: AbstractControl | null;
  @Input() min?: number;
  @Input() max?: number;

  readonly inputId = `currency-${++nextId}`;
  displayValue = '';
  numericValue: number | null = null;

  private onChange: (v: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: number | null): void {
    this.numericValue = val;
    this.displayValue = val != null ? this.format(val) : '';
  }
  registerOnChange(fn: (v: number | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled = d; }

  onInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value.replace(/[^\d,.-]/g, '').replace(',', '.');
    const numeric = parseFloat(raw);
    this.numericValue = isNaN(numeric) ? null : numeric;
    this.onChange(this.numericValue);
  }

  onBlur(): void {
    this.onTouched();
    this.displayValue = this.numericValue != null ? this.format(this.numericValue) : '';
  }

  onFocus(event: Event): void {
    (event.target as HTMLInputElement).value = this.numericValue?.toString() ?? '';
  }

  private format(value: number): string {
    return new Intl.NumberFormat(this.locale, {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  get hasError(): boolean {
    if (!this.control) return false;
    return this.control.invalid && (this.control.touched || this.control.dirty);
  }

  get errorMessage(): string {
    const errors = this.control?.errors;
    if (!errors) return '';
    if (errors['required']) return 'Este campo es obligatorio.';
    if (errors['min'])      return `El valor mínimo es ${this.format(errors['min'].min)}.`;
    if (errors['max'])      return `El valor máximo es ${this.format(errors['max'].max)}.`;
    return 'Valor inválido.';
  }

  get currencySymbol(): string {
    return new Intl.NumberFormat(this.locale, { style: 'currency', currency: this.currency })
      .formatToParts(0)
      .find(p => p.type === 'currency')?.value ?? this.currency;
  }
}