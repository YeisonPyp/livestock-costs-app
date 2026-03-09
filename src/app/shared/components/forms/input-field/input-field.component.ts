// input-field.component.ts
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
  @Input() type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' = 'text';
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
  @Input() min?: string; // Para date input: YYYY-MM-DD
  @Input() max?: string; // Para date input: YYYY-MM-DD

  readonly inputId = `input-${++nextId}`;
  value = '';
  touched = false;
  showPassword = false;
  isFocused = false;
  showDatePicker = false;
  currentMonth = new Date();
  selectedDate: Date | null = null;
  weeks: (number | null)[][] = [];

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: string): void { 
    this.value = val ?? '';
    if (val && this.type === 'date') {
      this.selectedDate = new Date(val + 'T00:00:00');
      this.currentMonth = new Date(this.selectedDate);
    }
  }

  registerOnChange(fn: (v: string) => void): void { 
    this.onChange = fn; 
  }

  registerOnTouched(fn: () => void): void { 
    this.onTouched = fn; 
  }

  setDisabledState(disabled: boolean): void { 
    this.disabled = disabled; 
  }

  onInput(event: Event): void {
    this.value = (event.target as HTMLInputElement).value;
    this.onChange(this.value);

    // Actualizar fecha seleccionada si es date input
    if (this.type === 'date' && this.value) {
      this.selectedDate = new Date(this.value + 'T00:00:00');
      this.currentMonth = new Date(this.selectedDate);
      this.generateCalendar();
    }
  }

  onBlur(): void { 
    this.touched = true;
    this.isFocused = false;
    this.onTouched(); 
    this.showDatePicker = false;
  }

  onFocus(): void {
    this.isFocused = true;
    if (this.type === 'date') {
      this.showDatePicker = true;
      this.generateCalendar();
    }
  }

  togglePassword(): void { 
    this.showPassword = !this.showPassword; 
  }

  // Date picker methods
  generateCalendar(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    this.weeks = [];
    let week: (number | null)[] = new Array(startingDayOfWeek).fill(null);

    for (let day = 1; day <= daysInMonth; day++) {
      week.push(day);
      if (week.length === 7) {
        this.weeks.push(week);
        week = [];
      }
    }

    if (week.length > 0) {
      week.push(...new Array(7 - week.length).fill(null));
      this.weeks.push(week);
    }
  }

  previousMonth(): void {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() - 1
    );
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() + 1
    );
    this.generateCalendar();
  }

  selectDate(day: number | null): void {
    if (day === null) return;

    const date = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth(),
      day
    );

    // Validar min/max
    if (this.min) {
      const minDate = new Date(this.min + 'T00:00:00');
      if (date < minDate) return;
    }
    if (this.max) {
      const maxDate = new Date(this.max + 'T00:00:00');
      if (date > maxDate) return;
    }

    this.selectedDate = date;
    this.value = this.formatDateToInput(date);
    this.onChange(this.value);
    this.showDatePicker = false;
  }

  isDateDisabled(day: number | null): boolean {
    if (day === null) return false;

    const date = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth(),
      day
    );

    if (this.min) {
      const minDate = new Date(this.min + 'T00:00:00');
      if (date < minDate) return true;
    }
    if (this.max) {
      const maxDate = new Date(this.max + 'T00:00:00');
      if (date > maxDate) return true;
    }

    return false;
  }

  isDateSelected(day: number | null): boolean {
    if (!day || !this.selectedDate) return false;
    return (
      day === this.selectedDate.getDate() &&
      this.currentMonth.getMonth() === this.selectedDate.getMonth() &&
      this.currentMonth.getFullYear() === this.selectedDate.getFullYear()
    );
  }

  isToday(day: number | null): boolean {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      this.currentMonth.getMonth() === today.getMonth() &&
      this.currentMonth.getFullYear() === today.getFullYear()
    );
  }

  formatDateToInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDateDisplay(dateString: string): string {
    const date = new Date(dateString + 'T00:00:00');
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    };
    return date.toLocaleDateString('es-ES', options);
  }

  getMonthYear(): string {
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      year: 'numeric'
    };
    return this.currentMonth
      .toLocaleDateString('es-ES', options)
      .replace(/^\w/, c => c.toUpperCase());
  }

  getDayNames(): string[] {
    return ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
  }

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

  get characterCount(): string {
    return `${this.value.length}/${this.maxLength}`;
  }

  get isNearLimit(): boolean {
    return this.maxLength ? this.value.length > this.maxLength * 0.8 : false;
  }
}