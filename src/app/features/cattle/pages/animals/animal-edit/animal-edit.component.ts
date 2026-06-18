// components/animal-edit/animal-edit.component.ts

import {
  Component,
  inject,
  signal,
  computed,
  input,
  output,
  OnInit,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CattleService } from '../../../services/cattle.service';
import {
  AnimalDetail,
  EditAnimalPayload,
  EditableFields,
} from '../../../models/cattle.model';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../../../../shared/components/feedback/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';

interface FormField {
  key: keyof EditAnimalPayload;
  label: string;
  type: 'text' | 'number' | 'date';
  placeholder: string;
  prefix?: string;
  suffix?: string;
  hint?: string;
  required?: boolean;
  group: 'identification' | 'weight' | 'dates';
}

@Component({
  selector: 'app-animal-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './animal-edit.component.html',
  styleUrl: './animal-edit.component.scss',
})
export class AnimalEditComponent implements OnInit {
  private svc   = inject(CattleService);
  private notify = inject(NotificationService); 
  private readonly dialog = inject(MatDialog);

  // ══════════════════════════════════════════════════════════════════════════
  // INPUTS / OUTPUTS
  // ══════════════════════════════════════════════════════════════════════════

  /** ID del animal a editar */
  animalId = input.required<string>();

  /** Se emite al guardar exitosamente */
  saved = output<AnimalDetail>();

  /** Se emite al cerrar el modal */
  close = output<void>();

  // ══════════════════════════════════════════════════════════════════════════
  // STATE
  // ══════════════════════════════════════════════════════════════════════════

  loading      = signal(true);
  saving       = signal(false);
  animal       = signal<AnimalDetail | null>(null);
  loadError    = signal<string | null>(null);

  // Form values — cada campo del formulario
  formValues = signal<Record<string, string>>({});

  // Snapshot de valores originales para detectar cambios
  originalValues: Record<string, string> = {};

  // ══════════════════════════════════════════════════════════════════════════
  // FORM FIELD DEFINITIONS
  // ══════════════════════════════════════════════════════════════════════════

  readonly formFields: FormField[] = [
    // Identificación
    {
      key: 'tag_number',
      label: 'Número de Arete',
      type: 'text',
      placeholder: 'Ej: B-055',
      hint: 'Identificador único del animal',
      required: true,
      group: 'identification',
    },

    // Económicos
    {
      key: 'purchase_price',
      label: 'Precio de Compra',
      type: 'number',
      placeholder: 'Ej: 1400',
      prefix: '$',
      suffix: 'COP',
      group: 'identification',
    },
    {
      key: 'entry_weight',
      label: 'Peso de Ingreso',
      type: 'number',
      placeholder: 'Ej: 320',
      suffix: 'kg',
      group: 'identification',
    },

    // Fechas
    {
      key: 'entry_date',
      label: 'Fecha de Ingreso',
      type: 'date',
      placeholder: '',
      group: 'dates',
    },
    {
      key: 'birth_date',
      label: 'Fecha de Nacimiento',
      type: 'date',
      placeholder: '',
      group: 'dates',
    },

    // Peso actual
    {
      key: 'weight',
      label: 'Peso Actual',
      type: 'number',
      placeholder: 'Ej: 410',
      suffix: 'kg',
      required: true,
      group: 'weight',
    },
    {
      key: 'price_per_kg',
      label: 'Precio por kg',
      type: 'number',
      placeholder: 'Ej: 5000',
      prefix: '$',
      suffix: 'COP/kg',
      group: 'weight',
    },
    {
      key: 'weight_record_date',
      label: 'Fecha del Pesaje',
      type: 'date',
      placeholder: '',
      group: 'weight',
    },
  ];

  // ══════════════════════════════════════════════════════════════════════════
  // COMPUTED
  // ══════════════════════════════════════════════════════════════════════════

  changedFieldKeys = computed(() => Object.keys(this.changedFields()));
  changedFieldCount = computed(() => this.changedFieldKeys().length);

  getFieldLabel(key: string): string {
    return this.formFields.find(f => f.key === key)?.label ?? key;
  }

  /** Obtiene el valor original de un campo */
  getOriginalValue(key: string): string {
    return this.originalValues[key] || '(vacío)';
  }

  getChangedValue(key: string): string {
    return (this.changedFields() as Record<string, string>)[key] ?? '';
  }

  editable = computed<EditableFields | null>(() => {
    return this.animal()?.editable_fields ?? null;
  });

  restrictionMessage = computed(() => {
    return this.editable()?.restriction_reason ?? null;
  });

  weightRecordCount = computed(() => {
    return this.editable()?.weight_record_count ?? 0;
  });

  /** Campos agrupados para el template */
  identificationFields = computed(() =>
    this.formFields.filter((f) => f.group === 'identification')
  );

  dateFields = computed(() =>
    this.formFields.filter((f) => f.group === 'dates')
  );

  weightFields = computed(() =>
    this.formFields.filter((f) => f.group === 'weight')
  );

  /** Solo los campos que realmente cambiaron */
  changedFields = computed(() => {
    const current = this.formValues();
    const changed: Partial<EditAnimalPayload> = {};

    for (const field of this.formFields) {
      const key = field.key;
      if (!this.isFieldEditable(key)) continue;

      const originalVal = this.originalValues[key] ?? '';
      const currentVal  = current[key] ?? '';

      if (currentVal !== originalVal && currentVal !== '') {
        (changed as any)[key] = currentVal;
      }
    }

    return changed;
  });

  hasChanges = computed(() => {
    return Object.keys(this.changedFields()).length > 0;
  });

  canSave = computed(() => {
    return this.hasChanges() && !this.saving() && this.isFormValid();
  });

  /** Info del animal para el header */
  animalInfo = computed(() => {
    const a = this.animal();
    if (!a) return null;
    return {
      tagNumber: a.tag_number,
      name: a.name || null,
      breed: a.breed?.name ?? '—',
      gender: a.gender === 'M' ? 'Macho' : 'Hembra',
      status: a.status,
      currentWeight: a.current_weight,
      category: a.category,
    };
  });

  // ══════════════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ══════════════════════════════════════════════════════════════════════════

  ngOnInit(): void {
    this.loadAnimal();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ══════════════════════════════════════════════════════════════════════════
  loadAnimal(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.svc.getAnimal(this.animalId()).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.animal.set(res.data);
          this.initFormValues(res.data);
        } else {
          this.loadError.set('No se pudo cargar el animal.');
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.loadError.set(
          err?.error?.message ?? 'Error al cargar el animal.'
        );
      },
    });
  }

  private initFormValues(animal: AnimalDetail): void {
    const latest = animal.latest_weight_record;

    const values: Record<string, string> = {
      tag_number:         animal.tag_number ?? '',
      purchase_price:     animal.purchase_price ?? '',
      entry_weight:       animal.entry_weight ?? '',
      entry_date:         animal.entry_date ?? '',
      birth_date:         animal.birth_date ?? '',
      weight:             latest?.weight ?? animal.current_weight ?? '',
      price_per_kg:       latest?.price_per_kg ?? '',
      weight_record_date: latest?.record_date ?? this.todayStr(),
    };

    this.formValues.set(values);
    this.originalValues = { ...values };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FIELD HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  isFieldEditable(key: string): boolean {
    const editable = this.editable();
    if (!editable) return false;
    return (editable as any)[key] === true;
  }

  isFieldDisabled(key: string): boolean {
    return !this.isFieldEditable(key);
  }

  getFieldTooltip(key: string): string | null {
    if (this.isFieldEditable(key)) return null;
    return this.restrictionMessage() ?? 'Este campo no es editable.';
  }

  onFieldChange(key: string, value: string): void {
    this.formValues.update((v) => ({ ...v, [key]: value }));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VALIDATION
  // ══════════════════════════════════════════════════════════════════════════

  private isFormValid(): boolean {
    const values = this.formValues();

    // tag_number requerido
    if (this.isFieldEditable('tag_number') && !values['tag_number']?.trim()) {
      return false;
    }

    // weight: si se cambió, debe ser > 0
    if (this.isFieldEditable('weight') && values['weight']) {
      const w = parseFloat(values['weight']);
      if (isNaN(w) || w <= 0) return false;
    }

    // price_per_kg: si se escribió, debe ser > 0
    if (values['price_per_kg']) {
      const p = parseFloat(values['price_per_kg']);
      if (isNaN(p) || p <= 0) return false;
    }

    return true;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SAVE
  // ══════════════════════════════════════════════════════════════════════════

  onSave(): void {
    const payload = this.changedFields();

    if (Object.keys(payload).length === 0) {
      this.notify.info('No hay cambios para guardar.');
      return;
    }

    this.saving.set(true);

    this.svc.updateAnimal(this.animalId(), payload).subscribe({
      next: (res) => {
        this.saving.set(false);

        if (res.success && res.data) {
          this.notify.success('✅ Animal actualizado correctamente.');
          this.saved.emit(res.data);
          this.close.emit();
        } else {
          this.notify.error(
            res.errors ? Object.values(res.errors).flat().join(', ') : 'Error al actualizar.'
          );
        }
      },
      error: (err) => {
        this.saving.set(false);

        // Manejar errores de validación del backend
        const errors = err?.error?.errors;
        if (errors && typeof errors === 'object') {
          const messages = Object.entries(errors)
            .map(([field, msgs]: [string, any]) => {
              const fieldLabel =
                this.formFields.find((f) => f.key === field)?.label ?? field;
              const msgText = Array.isArray(msgs) ? msgs.join(', ') : msgs;
              return `${fieldLabel}: ${msgText}`;
            })
            .join('\n');

          this.notify.error(messages);
        } else {
          this.notify.error(
            err?.error?.message ?? 'Error al actualizar el animal.', err.message
          );
        }
      },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ══════════════════════════════════════════════════════════════════════════
onCancel(): void {
  if (!this.hasChanges()) {
    this.close.emit();
    return;
  }
  
  this.dialog
    .open(ConfirmDialogComponent, {
      data: {
        title: '¿Salir sin guardar?',
        message: 'Existen cambios pendientes. Si continúas, estos cambios se perderán.',
        confirmText: 'Salir',
        cancelText: 'Cancelar',
        type: 'warning',
      },
      panelClass: 'confirm-dialog-on-top',
    })
    .afterClosed()
    .subscribe((result) => {      
      if (result === true || result === 'confirm' || result === 'ok') {
        this.close.emit();
      }
    });
}

  onReset(): void {
    this.formValues.set({ ...this.originalValues });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  private todayStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  formatWeight(w?: string | null): string {
    if (!w) return '—';
    const n = parseFloat(w);
    return isNaN(n)
      ? '—'
      : `${n.toLocaleString('es-CO', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })} kg`;
  }

  formatCurrency(v?: string | null): string {
    if (!v) return '—';
    const n = parseFloat(v);
    return isNaN(n)
      ? '—'
      : n.toLocaleString('es-CO', {
          style: 'currency',
          currency: 'COP',
          maximumFractionDigits: 0,
        });
  }
}