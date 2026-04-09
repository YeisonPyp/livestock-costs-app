import { 
  Component, 
  OnInit, 
  OnDestroy,
  inject, 
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { 
  ReactiveFormsModule, 
  FormBuilder, 
  FormGroup, 
  Validators,
  AbstractControl,
} from '@angular/forms';
import { 
  Subject, 
  takeUntil, 
  finalize, 
  forkJoin,
  switchMap,
  of,
  catchError,
} from 'rxjs';

// ═══════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { LoaderComponent } from '../../../../../shared/components/loader/loader.component';
import { KpiCardComponent } from '../../../../../shared/components/display/kpi-card/kpi-card.component';
import { BadgeComponent } from '../../../../../shared/components/display/badge/badge.component';
import { AmountDisplayComponent } from '../../../../../shared/components/bills/amount-display/amount-display.component';
import { AlertComponent } from '../../../../../shared/components/display/alert/alert.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { ModalComponent } from '../../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';

// ═══════════════════════════════════════════════════════════════════════════
// MODULE IMPORTS
// ═══════════════════════════════════════════════════════════════════════════
import { 
  InvestmentService,
  CattleOwnershipService,
  MovementSearchParams,
} from '../../../services';

import { 
  Investment,
  InvestmentDetail,
  InvestmentMovement,
  InvestmentDashboard,
  CattleOwnership,
  ClosureStatus,
  ContributePayload,
  WithdrawPayload,
  InvestmentStatus,
  MovementType,
  CattleOwnershipStatus,
  INVESTMENT_STATUS,
  MOVEMENT_TYPE,
  MOVEMENT_TYPE_OPTIONS,
  CATTLE_OWNERSHIP_STATUS_OPTIONS,
  getInvestmentStatusConfig,
  getMovementTypeConfig,
  getCattleOwnershipStatusConfig,
  formatPercentage,
  isCredit,
} from '../../../models/investment.model';
import { formatCurrency, parseDecimal } from '../../../../../core/utils/helpers';

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS LOCALES
// ═══════════════════════════════════════════════════════════════════════════

type PanelType = 'contribute' | 'withdraw' | null;
type TabIndex = 0 | 1 | 2; // Overview, Movements, Cattle

interface MovementFilter {
  type: MovementType | '';
  dateFrom: string;
  dateTo: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════════════

@Component({
  selector: 'app-investment-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTabsModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    LoaderComponent,
    KpiCardComponent,
    BadgeComponent,
    AmountDisplayComponent,
    AlertComponent,
    EmptyStateComponent,
    ModalComponent,
    ButtonComponent,
  ],
  templateUrl: './investment-detail.component.html',
  styleUrl: './investment-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvestmentDetailComponent implements OnInit, OnDestroy {

  // ═══════════════════════════════════════════════════════════════════════════
  // INYECCIONES
  // ═══════════════════════════════════════════════════════════════════════════
  
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly investmentService = inject(InvestmentService);
  private readonly cattleOwnershipService = inject(CattleOwnershipService);
  private readonly snackBar = inject(MatSnackBar);

  // ═══════════════════════════════════════════════════════════════════════════
  // SIGNALS DE ESTADO
  // ═══════════════════════════════════════════════════════════════════════════
  
  /** ID de la inversión */
  readonly investmentId = signal<string | null>(null);
  
  /** Datos de la inversión */
  readonly investment = signal<InvestmentDetail | null>(null);
  
  /** Dashboard con métricas */
  readonly dashboard = signal<InvestmentDashboard | null>(null);
  
  /** Movimientos */
  readonly movements = signal<InvestmentMovement[]>([]);
  
  /** Propiedad de ganado */
  readonly cattle = signal<CattleOwnership[]>([]);
  
  /** Estado de cierre */
  readonly closureStatus = signal<ClosureStatus | null>(null);

  /** Estados de carga */
  readonly isLoading = signal(true);
  readonly isLoadingMovements = signal(false);
  readonly isLoadingCattle = signal(false);
  readonly isLoadingClosure = signal(false);
  readonly isSubmitting = signal(false);
  readonly isClosing = signal(false);
  
  /** Error */
  readonly hasError = signal(false);
  readonly errorMessage = signal<string>('');

  /** Tab activo */
  readonly activeTab = signal<TabIndex>(0);

  /** Panel de aporte/retiro */
  readonly activePanel = signal<PanelType>(null);
  
  /** Modal de confirmación de cierre */
  readonly isCloseModalOpen = signal(false);

  /** Filtros de movimientos */
  readonly movementFilter = signal<MovementFilter>({
    type: '',
    dateFrom: '',
    dateTo: '',
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SUBJECTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  private readonly destroy$ = new Subject<void>();

  // ═══════════════════════════════════════════════════════════════════════════
  // FORMULARIO
  // ═══════════════════════════════════════════════════════════════════════════
  
  readonly panelForm: FormGroup = this.fb.group({
    amount: [null, [Validators.required, Validators.min(0.01)]],
    effective_date: [''],
    description: [''],
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTANTES PARA TEMPLATE
  // ═══════════════════════════════════════════════════════════════════════════
  
  readonly movementTypeOptions = [
    { value: '', label: 'Todos los tipos' },
    ...MOVEMENT_TYPE_OPTIONS.map(opt => ({
      value: opt.value,
      label: opt.label,
    })),
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED
  // ═══════════════════════════════════════════════════════════════════════════
  
  /** Indica si la inversión está activa */
  readonly isActive = computed(() => {
    return this.investment()?.status === 'active';
  });

  /** Indica si puede recibir aportes */
  readonly canContribute = computed(() => this.isActive());

  /** Indica si puede procesar retiros */
  readonly canWithdraw = computed(() => {
    const inv = this.investment();
    if (!inv || inv.status !== 'active') return false;
    return this.parseDecimal(inv.current_capital) > 0;
  });

  /** Indica si puede cerrarse */
  readonly canClose = computed(() => {
    const status = this.closureStatus();
    return status?.can_close ?? false;
  });

  /** Razones que bloquean el cierre */
  readonly closureBlocking = computed(() => {
    return this.closureStatus()?.blocking ?? [];
  });

  /** Resumen de cierre */
  readonly closureSummary = computed(() => {
    return this.closureStatus()?.summary ?? null;
  });

  /** Título del panel */
  readonly panelTitle = computed(() => {
    const type = this.activePanel();
    if (type === 'contribute') return 'Registrar Aporte';
    if (type === 'withdraw') return 'Procesar Retiro';
    return '';
  });

  /** Capital disponible para retiro */
  readonly availableForWithdraw = computed(() => {
    const inv = this.investment();
    if (!inv) return 0;
    return this.parseDecimal(inv.current_capital);
  });

  /** Ganado activo */
  readonly activeCattle = computed(() => {
    return this.cattle().filter(c => c.status === 'active');
  });

  /** Ganado vendido */
  readonly soldCattle = computed(() => {
    return this.cattle().filter(c => c.status === 'sold');
  });

  /** Total de movimientos filtrados */
  readonly filteredMovementsCount = computed(() => this.movements().length);

  // ═══════════════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════════════════════

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (!id) {
      this.handleError('ID de inversión no válido');
      return;
    }

    this.investmentId.set(id);
    this.loadInitialData(id);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Carga inicial de todos los datos.
   */
  private loadInitialData(id: string): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    // Cargar inversión y dashboard en paralelo
    forkJoin({
      investment: this.investmentService.getById(id).pipe(
        catchError(err => {
          console.error('Error loading investment:', err);
          return of({ success: false, data: null });
        })
      ),
      dashboard: this.investmentService.getDashboard(id).pipe(
        catchError(err => {
          console.error('Error loading dashboard:', err);
          return of({ success: false, data: null });
        })
      ),
    })
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading.set(false)),
    )
    .subscribe({
      next: ({ investment, dashboard }) => {
        if (investment.success && investment.data) {
          this.investment.set(investment.data);
          
          // Cargar datos secundarios
          this.loadMovements();
          this.loadCattle();
          this.loadClosureStatus();
        } else {
          this.handleError('No se encontró la inversión');
        }

        if (dashboard.success && dashboard.data) {
          this.dashboard.set(dashboard.data);
        }
      },
      error: (err) => {
        console.error('Error in initial load:', err);
        this.handleError('Error al cargar la inversión');
      },
    });
  }

  /**
   * Carga los movimientos con filtros opcionales.
   */
  loadMovements(): void {
    const id = this.investmentId();
    if (!id) return;

    this.isLoadingMovements.set(true);

    const { type, dateFrom, dateTo } = this.movementFilter();
    const params: MovementSearchParams = {};

    if (type) params.type = type;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;

    this.investmentService
      .getMovements(id, params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingMovements.set(false)),
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.movements.set(res.data ?? []);
          }
        },
        error: (err) => {
          console.error('Error loading movements:', err);
          this.showError('Error al cargar los movimientos');
        },
      });
  }

  /**
   * Carga la propiedad de ganado.
   */
  loadCattle(): void {
    const id = this.investmentId();
    if (!id) return;

    this.isLoadingCattle.set(true);

    this.cattleOwnershipService
      .getByInvestment(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingCattle.set(false)),
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.cattle.set(res.data ?? []);
          }
        },
        error: (err) => {
          console.error('Error loading cattle:', err);
          this.showError('Error al cargar el ganado');
        },
      });
  }

  /**
   * Carga el estado de cierre.
   */
  loadClosureStatus(): void {
    const id = this.investmentId();
    if (!id) return;

    this.isLoadingClosure.set(true);

    this.investmentService
      .getClosureStatus(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingClosure.set(false)),
      )
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.closureStatus.set(res.data);
          }
        },
        error: (err) => {
          console.error('Error loading closure status:', err);
        },
      });
  }

  /**
   * Recarga todos los datos.
   */
  refreshAll(): void {
    const id = this.investmentId();
    if (id) {
      this.loadInitialData(id);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TABS
  // ═══════════════════════════════════════════════════════════════════════════

  onTabChange(index: number): void {
    this.activeTab.set(index as TabIndex);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FILTROS DE MOVIMIENTOS
  // ═══════════════════════════════════════════════════════════════════════════

  onMovementTypeFilter(type: string): void {
    this.movementFilter.update(f => ({ ...f, type: type as MovementType | '' }));
    this.loadMovements();
  }

  onMovementDateFilter(field: 'dateFrom' | 'dateTo', value: string): void {
    this.movementFilter.update(f => ({ ...f, [field]: value }));
    this.loadMovements();
  }

  clearMovementFilters(): void {
    this.movementFilter.set({ type: '', dateFrom: '', dateTo: '' });
    this.loadMovements();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PANEL APORTE/RETIRO
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Abre el panel de aporte o retiro.
   */
  openPanel(type: 'contribute' | 'withdraw'): void {
    // Validar que se puede realizar la acción
    if (type === 'contribute' && !this.canContribute()) {
      this.showError('No se pueden realizar aportes a esta inversión');
      return;
    }

    if (type === 'withdraw' && !this.canWithdraw()) {
      this.showError('No hay saldo disponible para retirar');
      return;
    }

    // Resetear formulario con valores por defecto
    this.panelForm.reset({
      amount: null,
      effective_date: this.getTodayDate(),
      description: type === 'contribute' ? 'Aporte de capital' : 'Retiro de capital',
    });

    // Agregar validación de máximo para retiros
    if (type === 'withdraw') {
      this.panelForm.get('amount')?.setValidators([
        Validators.required,
        Validators.min(0.01),
        Validators.max(this.availableForWithdraw()),
      ]);
      this.panelForm.get('amount')?.updateValueAndValidity();
    } else {
      this.panelForm.get('amount')?.setValidators([
        Validators.required,
        Validators.min(0.01),
      ]);
      this.panelForm.get('amount')?.updateValueAndValidity();
    }

    this.activePanel.set(type);
  }

  /**
   * Cierra el panel.
   */
  closePanel(): void {
    this.activePanel.set(null);
    this.panelForm.reset();
  }

  /**
   * Envía el formulario del panel.
   */
  submitPanel(): void {
    if (this.panelForm.invalid) {
      this.panelForm.markAllAsTouched();
      return;
    }

    const id = this.investmentId();
    const type = this.activePanel();
    
    if (!id || !type) return;

    this.isSubmitting.set(true);

    const payload: ContributePayload | WithdrawPayload = {
      amount: this.panelForm.value.amount,
      effective_date: this.panelForm.value.effective_date || undefined,
      description: this.panelForm.value.description || undefined,
    };

    const request$ = type === 'contribute'
      ? this.investmentService.contribute(id, payload)
      : this.investmentService.withdraw(id, payload);

    request$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            const message = type === 'contribute' 
              ? 'Aporte registrado exitosamente' 
              : 'Retiro procesado exitosamente';
            this.showSuccess(message);
            this.closePanel();
            this.refreshAll();
          } else {
            this.showError(res.message ?? 'Error al procesar la operación');
          }
        },
        error: (err) => {
          const message = this.extractErrorMessage(err);
          this.showError(message);
        },
      });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CIERRE DE INVERSIÓN
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Abre el modal de confirmación de cierre.
   */
  openCloseModal(): void {
    if (!this.canClose()) {
      this.showError('Esta inversión no puede cerrarse aún');
      return;
    }
    this.isCloseModalOpen.set(true);
  }

  /**
   * Cierra el modal de cierre.
   */
  closeCloseModal(): void {
    this.isCloseModalOpen.set(false);
  }

  /**
   * Confirma el cierre de la inversión.
   */
  confirmClose(): void {
    const id = this.investmentId();
    if (!id) return;

    this.isClosing.set(true);

    this.investmentService
      .close(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isClosing.set(false)),
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.showSuccess('Inversión cerrada exitosamente');
            this.closeCloseModal();
            this.refreshAll();
          } else {
            this.showError(res.message ?? 'Error al cerrar la inversión');
          }
        },
        error: (err) => {
          const message = this.extractErrorMessage(err);
          this.showError(message);
        },
      });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS PARA TEMPLATE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Formatea moneda.
   */
  formatCurrency = formatCurrency;
  parseDecimal = parseDecimal;


  /**
   * Formatea porcentaje.
   */
  formatPercentage(value: number | string): string {
    return formatPercentage(value);
  }

  /**
   * Formatea fecha.
   */
  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  /**
   * Formatea fecha y hora.
   */
  formatDateTime(dateStr: string): string {
    if (!dateStr) return '—';
    
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  }

  /**
   * Obtiene color del badge de estado de inversión.
   */
  getStatusColor(status: string): 'success' | 'secondary' | 'warning' {
    const config = getInvestmentStatusConfig(status as InvestmentStatus);
    
    switch (config?.color) {
      case 'success':
      case 'warning':
      default:
        return 'secondary';
    }
  }

  /**
   * Obtiene label del estado de inversión.
   */
  getStatusLabel(status: string): string {
    const config = getInvestmentStatusConfig(status as InvestmentStatus);
    return config?.label ?? status;
  }

  /**
   * Indica si un movimiento es crédito.
   */
  isMovementCredit(type: string): boolean {
    return isCredit(type as MovementType);
  }

  /**
   * Obtiene el label de un tipo de movimiento.
   */
  getMovementLabel(type: string): string {
    const config = getMovementTypeConfig(type as MovementType);
    return config?.label ?? type;
  }

  /**
   * Obtiene el color de un tipo de movimiento.
   */
  getMovementColor(type: string): 'success' | 'danger' | 'warning' | 'info' | 'secondary' {
    const config = getMovementTypeConfig(type as MovementType);
    
    switch (config?.color) {
      case 'success':
        return 'success';
      case 'danger':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'secondary';
    }
  }

  /**
   * Obtiene el icono de un tipo de movimiento.
   */
  getMovementIcon(type: string): string {
    const config = getMovementTypeConfig(type as MovementType);
    return config?.icon ?? 'cash';
  }

  /**
   * Obtiene color del badge de estado de ganado.
   */
  getCattleStatusColor(status: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    const config = getCattleOwnershipStatusConfig(status as CattleOwnershipStatus);
    
    switch (config?.color) {
      case 'success':
        return 'success';
      case 'info':
        return 'info';
      case 'warning':
        return 'warning';
      case 'danger':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  /**
   * Obtiene label del estado de ganado.
   */
  getCattleStatusLabel(status: string): string {
    const config = getCattleOwnershipStatusConfig(status as CattleOwnershipStatus);
    return config?.label ?? status;
  }

  /**
   * Clase CSS para ROI.
   */
  getRoiClass(roi: number | string): string {
    const value = this.parseDecimal(roi);
    if (value > 0) return 'text-success';
    if (value < 0) return 'text-danger';
    return 'text-muted';
  }

  /**
   * Formatea ROI con signo.
   */
  formatRoi(roi: number | string): string {
    const value = this.parseDecimal(roi);
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  }

  /**
   * Track function para movimientos.
   */
  trackMovementById(_index: number, item: InvestmentMovement): string {
    return item.id;
  }

  /**
   * Track function para ganado.
   */
  trackCattleById(_index: number, item: CattleOwnership): string {
    return item.id;
  }

  /**
   * Verifica si el campo del formulario tiene error.
   */
  // hasFieldError(fieldName: string, errorType: string): boolean {
  //   const control = this.panelForm.get(fieldName);
  //   return control?.hasError(errorType) && control?.touched;
  // }

  /**
   * Obtiene el mensaje de error del campo amount.
   */
  getAmountError(): string {
    const control = this.panelForm.get('amount');
    
    if (control?.hasError('required')) {
      return 'El monto es requerido';
    }
    if (control?.hasError('min')) {
      return 'El monto debe ser mayor a 0';
    }
    if (control?.hasError('max')) {
      return `El monto máximo es ${this.formatCurrency(this.availableForWithdraw())}`;
    }
    
    return '';
  }

  /**
   * Navega de vuelta al listado.
   */
  goBack(): void {
    this.router.navigate(['/investments']);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTODOS PRIVADOS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Obtiene la fecha de hoy en formato YYYY-MM-DD.
   */
  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Maneja un error general.
   */
  private handleError(message: string): void {
    this.hasError.set(true);
    this.errorMessage.set(message);
    this.isLoading.set(false);
  }

  /**
   * Extrae mensaje de error.
   */
  private extractErrorMessage(err: any): string {
    if (err?.error?.message) return err.error.message;
    if (err?.error?.detail) return err.error.detail;
    if (err?.error?.error) return err.error.error;
    if (err?.message) return err.message;
    return 'Error al procesar la solicitud';
  }

  /**
   * Muestra notificación de éxito.
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['snackbar-success'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  /**
   * Muestra notificación de error.
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['snackbar-error'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}