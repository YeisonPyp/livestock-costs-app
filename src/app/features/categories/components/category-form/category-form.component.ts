import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Category } from '../../models/category.interface';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent],
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.scss']
})
export class CategoryFormComponent implements OnInit {
  @Input() category: Category | null = null;
  @Input() categories: Category[] = [];
  @Input() isSubmitting = false;
  
  @Output() save = new EventEmitter<Partial<Category>>();
  @Output() cancel = new EventEmitter<void>();

  categoryForm: FormGroup;
  isEditMode = false;

  constructor(private fb: FormBuilder) {
    this.categoryForm = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(20)]],
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(255)]],
      parent: [null],
      level: [1, [Validators.required, Validators.min(1)]],
      is_movement: [false]
    });
  }

  ngOnInit(): void {
    if (this.category) {
      this.isEditMode = true;
      this.categoryForm.patchValue({
        code: this.category.code,
        name: this.category.name,
        description: this.category.description || '',
        parent: this.category.parent,
        level: this.category.level,
        is_movement: this.category.is_movement
      });
    }

    // Listener para calcular nivel automáticamente
    this.categoryForm.get('parent')?.valueChanges.subscribe(parentId => {
      if (parentId) {
        const parentCategory = this.categories.find(c => c.id === Number(parentId));
        if (parentCategory) {
          this.categoryForm.patchValue({
            level: parentCategory.level + 1
          }, { emitEvent: false });
        }
      } else {
        this.categoryForm.patchValue({
          level: 1
        }, { emitEvent: false });
      }
    });
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const formValue = this.categoryForm.value;
    const categoryData: Partial<Category> = {
      code: formValue.code,
      name: formValue.name,
      description: formValue.description || '',
      parent: formValue.parent ? Number(formValue.parent) : null,
      level: formValue.level,
      is_movement: formValue.is_movement
    };

    this.save.emit(categoryData);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  get availableParentCategories(): Category[] {
    if (!this.isEditMode) {
      return this.categories;
    }
    // En modo edición, excluir la categoría actual y sus hijos
    return this.categories.filter(c => c.id !== this.category?.id);
  }

  // Getters para validación
  get code() {
    return this.categoryForm.get('code');
  }

  get name() {
    return this.categoryForm.get('name');
  }

  get description() {
    return this.categoryForm.get('description');
  }

  get parent() {
    return this.categoryForm.get('parent');
  }

  get level() {
    return this.categoryForm.get('level');
  }

  get is_movement() {
    return this.categoryForm.get('is_movement');
  }

  hasError(field: string, error: string): boolean {
    const control = this.categoryForm.get(field);
    return !!(control && control.hasError(error) && control.touched);
  }
}