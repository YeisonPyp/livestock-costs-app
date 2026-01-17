import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Cost } from '../../models/cost.interface';
import { Category } from '../../../categories/models/category.interface';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-cost-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent],
  templateUrl: './cost-form.component.html',
  styleUrls: ['./cost-form.component.scss']
})
export class CostFormComponent implements OnInit {
  @Input() cost: Cost | null = null;
  @Input() categories: Category[] = [];
  @Input() isSubmitting = false;
  
  @Output() save = new EventEmitter<Partial<Cost>>();
  @Output() cancel = new EventEmitter<void>();

  costForm: FormGroup;
  isEditMode = false;
  maxDate: string;

  constructor(private fb: FormBuilder) {
    // Fecha máxima: hoy
    const today = new Date();
    this.maxDate = today.toISOString().split('T')[0];

    this.costForm = this.fb.group({
      category: [null, [Validators.required]],
      date_incurred: ['', [Validators.required]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      notes: ['', [Validators.maxLength(1000)]]
    });
  }

  ngOnInit(): void {
    if (this.cost) {
      this.isEditMode = true;
      this.costForm.patchValue({
        category: this.cost.category,
        date_incurred: this.cost.date_incurred,
        amount: this.cost.amount,
        description: this.cost.description,
        notes: this.cost.notes || ''
      });
    } else {
      // Si es nuevo, establecer fecha de hoy por defecto
      this.costForm.patchValue({
        date_incurred: this.maxDate
      });
    }
  }

  onSubmit(): void {
    if (this.costForm.invalid) {
      this.costForm.markAllAsTouched();
      return;
    }

    const formValue = this.costForm.value;
    const costData: Partial<Cost> = {
      category: Number(formValue.category),
      date_incurred: formValue.date_incurred,
      amount: Number(formValue.amount),
      description: formValue.description,
      notes: formValue.notes || ''
    };

    this.save.emit(costData);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  get movementCategories(): Category[] {
    return this.categories.filter(c => c.is_movement);
  }

  // Getters para validación
  get category() {
    return this.costForm.get('category');
  }

  get date_incurred() {
    return this.costForm.get('date_incurred');
  }

  get amount() {
    return this.costForm.get('amount');
  }

  get description() {
    return this.costForm.get('description');
  }

  get notes() {
    return this.costForm.get('notes');
  }

  hasError(field: string, error: string): boolean {
    const control = this.costForm.get(field);
    return !!(control && control.hasError(error) && control.touched);
  }

  formatCurrency(event: any): void {
    let value = event.target.value.replace(/[^\d.]/g, '');
    if (value) {
      const parts = value.split('.');
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
      }
      this.costForm.patchValue({ amount: value }, { emitEvent: false });
    }
  }
}