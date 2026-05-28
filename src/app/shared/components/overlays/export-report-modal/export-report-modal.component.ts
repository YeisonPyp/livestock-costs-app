import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import {
  ExportFormat,
  ExportReportConfig,
  ExportReportPayload,
  DEFAULT_EXPORT_CONFIG,
} from './export-report-modal.types';

@Component({
  selector: 'app-export-report-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './export-report-modal.component.html',
  styleUrls: ['./export-report-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportReportModalComponent implements OnInit {
  // ── Inputs ──────────────────────────────────────────────────────────
  /** Controla la visibilidad del modal */
  isOpen = input.required<boolean>();

  /** Configuración personalizada */
  config = input<ExportReportConfig>({});

  // ── Outputs ─────────────────────────────────────────────────────────
  /** Emite cuando el usuario confirma la exportación */
  exportRequest = output<ExportReportPayload>();

  /** Emite cuando el modal se cierra (cancelar, backdrop, escape) */
  closed = output<void>();

  // ── Internals ───────────────────────────────────────────────────────
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);

  form!: FormGroup;
  isAnimating = signal(false);
  shouldRender = signal(false);

  /** Configuración mergeada con defaults */
  mergedConfig = computed<Required<ExportReportConfig>>(() => {
    const cfg = this.config();
    return {
      title: cfg.title ?? DEFAULT_EXPORT_CONFIG.title!,
      subtitle: cfg.subtitle ?? DEFAULT_EXPORT_CONFIG.subtitle!,
      showExcel: cfg.showExcel ?? DEFAULT_EXPORT_CONFIG.showExcel!,
      showPdf: cfg.showPdf ?? DEFAULT_EXPORT_CONFIG.showPdf!,
      allDataLabel: cfg.allDataLabel ?? DEFAULT_EXPORT_CONFIG.allDataLabel!,
      minDate: cfg.minDate ?? DEFAULT_EXPORT_CONFIG.minDate ?? '',
      maxDate: cfg.maxDate ?? this.todayISO,
    };
  });

  /** Fecha de hoy en formato YYYY-MM-DD */
  get todayISO(): string {
    return new Date().toISOString().split('T')[0];
  }

  constructor() {
    // Efecto para controlar apertura/cierre con animación
    effect(() => {
      const open = this.isOpen();
      if (open) {
        this.shouldRender.set(true);
        // Forzar un frame para que la animación funcione
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            this.isAnimating.set(true);
          });
        });
        this.lockBodyScroll(true);
      } else {
        this.isAnimating.set(false);
        // Esperar a que termine la animación antes de dejar de renderizar
        setTimeout(() => {
          this.shouldRender.set(false);
        }, 300);
        this.lockBodyScroll(false);
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
  }

  // ── Form Setup ──────────────────────────────────────────────────────
  private initForm(): void {
    this.form = this.fb.group(
      {
        allData: [false],
        startDate: ['', [Validators.required]],
        endDate: ['', [Validators.required]],
      },
      {
        validators: [this.dateRangeValidator],
      }
    );

    // Reaccionar al cambio del checkbox "allData"
    this.form.get('allData')!.valueChanges.subscribe((allData: boolean) => {
      const startDateCtrl = this.form.get('startDate')!;
      const endDateCtrl = this.form.get('endDate')!;

      if (allData) {
        startDateCtrl.setValue('');
        endDateCtrl.setValue('');
        startDateCtrl.disable();
        endDateCtrl.disable();
        startDateCtrl.clearValidators();
        endDateCtrl.clearValidators();
      } else {
        startDateCtrl.enable();
        endDateCtrl.enable();
        startDateCtrl.setValidators([Validators.required]);
        endDateCtrl.setValidators([Validators.required]);
      }

      startDateCtrl.updateValueAndValidity();
      endDateCtrl.updateValueAndValidity();
    });
  }

  /** Validador cruzado: startDate no puede ser mayor a endDate */
  private dateRangeValidator(group: AbstractControl): ValidationErrors | null {
    const start = group.get('startDate')?.value;
    const end = group.get('endDate')?.value;

    if (!start || !end) return null;

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (startDate > endDate) {
      return { dateRangeInvalid: true };
    }

    return null;
  }

  // ── Public API ──────────────────────────────────────────────────────

  /** Verifica si el form está listo para exportar */
  get canExport(): boolean {
    const allData = this.form.get('allData')!.value;
    if (allData) return true;
    return this.form.valid;
  }

  /** Helper para mostrar errores de campo individual */
  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  /** Helper para saber si hay error de rango */
  get hasDateRangeError(): boolean {
    return (
      this.form.hasError('dateRangeInvalid') &&
      !!(this.form.get('startDate')?.dirty || this.form.get('startDate')?.touched) &&
      !!(this.form.get('endDate')?.dirty || this.form.get('endDate')?.touched)
    );
  }

  /** Exportar en el formato indicado */
  onExport(format: ExportFormat): void {
    if (!this.canExport) {
      this.form.markAllAsTouched();
      return;
    }

    const allData = this.form.get('allData')!.value as boolean;
    const rawValues = this.form.getRawValue();

    const payload: ExportReportPayload = {
      format,
      allData,
      startDate: allData ? null : rawValues.startDate,
      endDate: allData ? null : rawValues.endDate,
    };

    this.exportRequest.emit(payload);
    this.close();
  }

  /** Cerrar el modal */
  close(): void {
    this.resetForm();
    this.closed.emit();
  }

  /** Click en el backdrop */
  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close();
    }
  }

  /** Listener de tecla Escape */
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close();
    }
  }

  // ── Privados ────────────────────────────────────────────────────────
  private resetForm(): void {
    this.form.reset({ allData: false, startDate: '', endDate: '' });
    this.form.get('startDate')!.enable();
    this.form.get('endDate')!.enable();
    this.form.get('startDate')!.setValidators([Validators.required]);
    this.form.get('endDate')!.setValidators([Validators.required]);
    this.form.get('startDate')!.updateValueAndValidity();
    this.form.get('endDate')!.updateValueAndValidity();
  }

  private lockBodyScroll(lock: boolean): void {
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = lock ? 'hidden' : '';
    }
  }
}