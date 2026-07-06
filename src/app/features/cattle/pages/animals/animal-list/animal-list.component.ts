// animal-list.component.ts

import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, map } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { CattleService } from '../../../services/cattle.service';
import {
  AnimalFilters,
  AnimalListItem,
  ANIMAL_STATUS_LABELS,
  ANIMAL_STATUS_COLORS,
  ANIMAL_CATEGORY_LABELS,
  SEX_LABELS,
  AnimalDetail,
} from '../../../models/cattle.model';

import { ExportService, ExportConfig } from '../../../../../core/services/export.service';
import { NotificationService } from '../../../../../core/services/notification.service';

import { TableComponent } from '../../../../../shared/components/data-display/table/table.component';
import { TableColumn, PaginationParams, ExportEvent } from '../../../../../shared/components/data-display/table/table.types';
import { PageHeaderComponent } from '../../../../../shared/components/navigation/page-header/page-header.component';
import { KpiCardComponent } from '../../../../../shared/components/data-display/kpi-card/kpi-card.component';
import { BadgeColor } from '../../../../../shared/components/ui/badge/badge.component';
import { AnimalBulkImportComponent } from '../animal-bulk-import/animal-bulk-import.component';
import { WeightBulkImportComponent } from '../../weights/weight-bulk-import/weight-bulk-import.component';
import { AnimalEditComponent } from '../animal-edit/animal-edit.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/feedback/confirm-dialog/confirm-dialog.component';

@Component({
  selector:    'app-animal-list',
  standalone:  true,
  imports: [
    CommonModule,
    AnimalEditComponent,
    RouterLink,
    FormsModule,
    TableComponent,
    PageHeaderComponent,
    KpiCardComponent,
    AnimalBulkImportComponent,
    WeightBulkImportComponent,
  ],
  templateUrl: './animal-list.component.html',
  styleUrl:    './animal-list.component.scss',
})
export class AnimalListComponent implements OnInit, OnDestroy {
  private svc           = inject(CattleService);
  private notify        = inject(NotificationService);
  private router        = inject(Router);
  private dialog        = inject(MatDialog);
  private exportService = inject(ExportService);
  private destroy$      = new Subject<void>();

  // ══════════════════════════════════════════════════════════════════
  // STATE
  // ══════════════════════════════════════════════════════════════════

  animals    = signal<AnimalListItem[]>([]);
  breeds     = signal<any[]>([]);
  owners     = signal<any[]>([]);
  pagination = signal<any>(null);
  loading    = signal(true);
  exporting  = signal(false);   // ✅ NUEVO: estado de exportación

  showBulkImport   = signal(false);
  showWeightImport = signal(false);

  // ══════════════════════════════════════════════════════════════════
  // FILTERS
  // ══════════════════════════════════════════════════════════════════

  statusFilter = 'active';
  sexFilter: '' | 'M' | 'F' = '';
  breedFilter  = '';
  ownerFilter  = '';

  private currentPage = 1;
  private pageSize    = 15;
  private searchTerm  = '';
  private ordering    = '-entry_date';

  // ══════════════════════════════════════════════════════════════════
  // LABELS
  // ══════════════════════════════════════════════════════════════════

  private statusLabels   = ANIMAL_STATUS_LABELS;
  private statusColors   = ANIMAL_STATUS_COLORS as Record<string, BadgeColor>;
  private categoryLabels = ANIMAL_CATEGORY_LABELS;

  // ══════════════════════════════════════════════════════════════════
  // TABLE COLUMNS
  // ══════════════════════════════════════════════════════════════════

  columns: TableColumn[] = [
    {
      key: 'tag_number',
      label: 'Arete',
      sortable: true,
      width: '110px',
      cellClass: 'cell-tag',
    },
    {
      key: 'name',
      label: 'Nombre',
      format: (v) => v || '—',
    },
    {
      key: 'breed_name',
      label: 'Raza',
      format: (v) => v || '—',
    },
    {
      key: 'category',
      label: 'Categoría',
      format: (v) => this.getCategoryLabel(v),
    },
    {
      key: 'gender',
      label: 'Sexo',
      type: 'badge',
      align: 'center',
      width: '90px',
      format: (v) => (v === 'M' ? 'Macho' : 'Hembra'),
      badgeColor: (v) => (v === 'M' ? 'info' : 'warning'),
    },
    {
      key: 'lot_code',
      label: 'Lote',
      format: (v) => v || '—',
    },
    {
      key: 'current_weight',
      label: 'Peso',
      sortable: true,
      align: 'right',
      width: '100px',
      format: (v) => this.formatWeight(v),
      cellClass: 'cell-weight',
    },
    {
      key: 'weight_gain',
      label: 'Ganancia',
      align: 'right',
      width: '100px',
      format: (v) => (v ? `+${this.formatWeight(v)}` : '—'),
      cellClass: (v) => {
        if (!v) return 'cell-muted';
        return parseFloat(v) > 0 ? 'cell-gain-positive' : 'cell-muted';
      },
    },
    {
      key: 'daily_gain',
      label: 'GMD',
      align: 'right',
      width: '90px',
      format: (v) => {
        if (!v) return '—';
        const n = parseFloat(v);
        return isNaN(n) ? '—' : `${n.toFixed(2)} kg/d`;
      },
      cellClass: 'cell-gmd',
    },
    {
      key: 'entry_date',
      label: 'Ingreso',
      sortable: true,
      type: 'date',
      width: '110px',
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'badge',
      align: 'center',
      width: '100px',
      format: (v) => this.getStatusLabel(v),
      badgeColor: (v) => this.getStatusColor(v),
    },
  ];

  // ══════════════════════════════════════════════════════════════════
  // KPIs
  // ══════════════════════════════════════════════════════════════════

  kpis = computed(() => {
    const list   = this.animals();
    const total  = this.pagination()?.count ?? list.length;
    const male   = list.filter((a) => a.gender === 'M').length;
    const female = list.filter((a) => a.gender === 'F').length;
    const weights = list
      .map((a) => parseFloat(a.current_weight ?? '0'))
      .filter((w) => w > 0);
    const avgWeight = weights.length
      ? +(weights.reduce((s, w) => s + w, 0) / weights.length).toFixed(1)
      : 0;

    return { total, male, female, avgWeight };
  });

  // ══════════════════════════════════════════════════════════════════
  // COMPUTED
  // ══════════════════════════════════════════════════════════════════

  get totalPages(): number {
    return this.pagination()?.total_pages ?? 1;
  }

  get totalCount(): number {
    return this.pagination()?.count ?? this.animals().length;
  }

  get hasActiveFilters(): boolean {
    return !!(
      this.sexFilter ||
      this.breedFilter ||
      this.ownerFilter ||
      this.statusFilter !== 'active'
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ══════════════════════════════════════════════════════════════════

  ngOnInit(): void {
    this.svc
      .getBreeds()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: (r) => r.success && this.breeds.set(r.data) });

    this.svc
      .getOwners()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: (r) => r.success && this.owners.set(r.data) });

    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ══════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ══════════════════════════════════════════════════════════════════

  load(): void {
    this.loading.set(true);

    const filters = this.buildCurrentFilters({
      page:      this.currentPage,
      page_size: this.pageSize,
    });

    this.svc
      .getAnimals(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (r) => {
          if (r.success) {
            this.animals.set(r.data);
            this.pagination.set(r.pagination ?? null);
          }
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.notify.error('Error al cargar animales');
        },
      });
  }

  /**
   * ✅ NUEVO: Construye los filtros actuales sin paginación
   * Reutilizado por load() y por onExport()
   */
  private buildCurrentFilters(overrides: Partial<AnimalFilters> = {}): AnimalFilters {
    const filters: AnimalFilters = {
      ordering: this.ordering,
      ...overrides,
    };

    if (this.searchTerm)          filters.search = this.searchTerm;
    if (this.sexFilter)           filters.gender = this.sexFilter;
    if (this.statusFilter)        filters.status = this.statusFilter as any;
    if (this.breedFilter)         filters.breed  = this.breedFilter;
    if (this.ownerFilter)         filters.owner  = this.ownerFilter;

    return filters;
  }

  // ══════════════════════════════════════════════════════════════════
  // TABLE EVENTS
  // ══════════════════════════════════════════════════════════════════

  onParamsChange(params: PaginationParams): void {
    this.currentPage = params.page ?? 1;
    this.pageSize    = params.page_size ?? 15;
    this.searchTerm  = params.search ?? '';

    if (params.sort_by && params.sort_direction) {
      this.ordering =
        params.sort_direction === 'desc'
          ? `-${params.sort_by}`
          : params.sort_by;
    }

    this.load();
  }

  onAnimalClick(animal: AnimalListItem): void {
    this.router.navigate(['/cattle/animals', animal.id]);
  }

  // ══════════════════════════════════════════════════════════════════
  // FILTERS
  // ══════════════════════════════════════════════════════════════════

  onFilter(): void {
    this.currentPage = 1;
    this.load();
  }

  clearFilters(): void {
    this.statusFilter = 'active';
    this.sexFilter    = '';
    this.breedFilter  = '';
    this.ownerFilter  = '';
    this.onFilter();
  }

  // ══════════════════════════════════════════════════════════════════
  // ✅ EXPORT - Ahora obtiene TODOS los registros
  // ══════════════════════════════════════════════════════════════════

  async onExport(event: ExportEvent): Promise<void> {
    if (this.exporting()) return;

    // ── 1. Construir filtros activos para mostrar en el reporte ──
    const activeFilters: Record<string, string> = {};

    if (this.statusFilter && this.statusFilter !== 'active') {
      activeFilters['Estado'] = this.getStatusLabel(this.statusFilter);
    }
    if (this.statusFilter === 'active') {
      activeFilters['Estado'] = 'Activos';
    }
    if (this.sexFilter) {
      activeFilters['Sexo'] = this.sexFilter === 'M' ? 'Machos' : 'Hembras';
    }
    if (this.breedFilter) {
      const breed = this.breeds().find((b) => b.id === this.breedFilter);
      activeFilters['Raza'] = breed?.name ?? this.breedFilter;
    }
    if (this.ownerFilter) {
      const owner = this.owners().find((o) => o.id === this.ownerFilter);
      activeFilters['Propietario'] = owner?.name ?? this.ownerFilter;
    }
    if (event.filters?.search) {
      activeFilters['Búsqueda'] = event.filters.search;
    }
    if (event.filters?.sort) {
      activeFilters['Ordenado por'] =
        `${event.filters.sort.column} (${event.filters.sort.direction})`;
    }

    // ── 2. Configuración del reporte ─────────────────────────────
    const config: Partial<ExportConfig> = {
      fileName:    event.fileName ?? 'inventario-ganado',
      title:       'Inventario de Ganado',
      subtitle:    'Módulo de Ganado — Control de animales y pesajes',
      companyName: 'Ganadería Veracruz Y.P',
      generatedBy: 'Admin', // TODO: obtener del AuthService
      filters:     activeFilters,
      orientation: 'landscape',
    };

    // ── 3. Ejecutar exportación ──────────────────────────────────
    this.exporting.set(true);
    this.notify.info('Obteniendo todos los registros para exportar...');

    try {
      // ✅ Si es paginación de servidor, usamos fetcher con paginate=false
      if (event.isServerPaginated) {
        await this.exportService.export(
          event.format,
          event.columns,
          [],   // data vacía (el fetcher la obtendrá)
          config,
          // ✅ FETCHER: obtiene TODOS los registros sin paginación
          () => this.svc.getAnimals({
            ...this.buildCurrentFilters(),
            paginate: false,
          } as any).pipe(
            map((res) => res.data ?? [])
          )
        );
      } else {
        // Paginación local: usar los datos ya cargados
        await this.exportService.export(
          event.format,
          event.columns,
          event.data,
          config
        );
      }

      this.notify.success(
        `${event.format === 'excel' ? 'Excel' : 'PDF'} descargado correctamente`
      );
    } catch (err) {
      console.error('Error al exportar:', err);
      this.notify.error('Error al exportar los datos');
    } finally {
      this.exporting.set(false);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // MODALS
  // ══════════════════════════════════════════════════════════════════

  onImportSuccess(_count: number): void {
    this.load();
  }

  onWeightImportSuccess(_count: number): void {
    this.load();
  }

  editingAnimalId = signal<string | null>(null);

  openEditModal(animalId: string): void {
    this.editingAnimalId.set(animalId);
  }

  onEditSaved(): void {
    this.editingAnimalId.set(null);
    this.load();
  }

  onEditClosed(): void {
    this.editingAnimalId.set(null);
  }

  confirmDelete(animal: AnimalDetail): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title:       'Eliminar Animal',
          message:     `¿Deseas eliminar el registro "${animal.tag_number}"? Esta acción no se puede deshacer.`,
          confirmText: 'Eliminar',
          type:        'danger',
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) this.deleteAnimal(animal.id);
      });
  }

  private deleteAnimal(id: string): void {
    this.svc.deleteAnimal(id).subscribe({
      next: () => {
        this.notify.success('Registro eliminado');
        this.load();
      },
      error: (err) => {
        this.notify.error(err?.error?.message || 'Error al eliminar');
      },
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════════════

  getCategoryLabel(category?: string | null): string {
    if (!category) return '—';
    const key = category.trim().toLowerCase() as keyof typeof this.categoryLabels;
    return this.categoryLabels[key] ?? category;
  }

  getStatusLabel(status?: string | null): string {
    if (!status) return 'Sin estado';
    const key = status.trim().toLowerCase() as keyof typeof this.statusLabels;
    return this.statusLabels[key] ?? status;
  }

  getStatusColor(status?: string | null): string {
    if (!status) return 'default';
    const key = status.trim().toLowerCase() as keyof typeof this.statusColors;
    return this.statusColors[key] ?? 'default';
  }

  formatWeight(w?: string | number | null): string {
    if (w == null) return '—';
    const n = typeof w === 'string' ? parseFloat(w) : w;
    return isNaN(n)
      ? '—'
      : `${n.toLocaleString('es-CO', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })} kg`;
  }
}