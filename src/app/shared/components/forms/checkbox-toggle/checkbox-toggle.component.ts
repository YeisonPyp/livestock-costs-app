import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-checkbox-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkbox-toggle.component.html',
  styleUrl: './checkbox-toggle.component.scss',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => CheckboxToggleComponent),
    multi: true
  }]
})
export class CheckboxToggleComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() description = '';
  @Input() mode: 'checkbox' | 'toggle' = 'checkbox';
  @Input() disabled = false;
  @Input() indeterminate = false;

  @Output() checkedChange = new EventEmitter<boolean>();

  checked = false;

  private onChange: (v: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(v: boolean): void { this.checked = !!v; }
  registerOnChange(fn: (v: boolean) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled = d; }

  onToggle(event: Event): void {
    if (this.disabled) return;
    this.checked = (event.target as HTMLInputElement).checked;
    this.onChange(this.checked);
    this.onTouched();
    this.checkedChange.emit(this.checked);
  }
}