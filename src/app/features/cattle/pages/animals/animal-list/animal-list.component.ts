// animal-list.component.ts

import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

import { CattleService } from '../../../services/cattle.service';
import {
  AnimalFilters,
  AnimalListItem,
  ANIMAL_STATUS_LABELS,
  ANIMAL_STATUS_COLORS,
  ANIMAL_CATEGORY_LABELS,
  SEX_LABELS,
} from '../../../models/cattle.model';

import { TableComponent } from '../../../../../shared/components/data-display/table/table.component';
import { TableColumn, PaginationParams, ExportEvent } from '../../../../../shared/components/data-display/table/table.types';
import { PageHeaderComponent } from '../../../../../shared/components/navigation/page-header/page-header.component';
import { KpiCardComponent } from '../../../../../shared/components/data-display/kpi-card/kpi-card.component';
import { DropdownMenuComponent } from '../../../../../shared/components/data-display/dropdown-menu/dropdown-menu.component';
import { BadgeColor } from '../../../../../shared/components/ui/badge/badge.component';
import { AnimalBulkImportComponent } from '../animal-bulk-import/animal-bulk-import.component';
import { WeightBulkImportComponent } from '../../weights/weight-bulk-import/weight-bulk-import.component';

@Component({
  selector: 'app-animal-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    TableComponent,
    PageHeaderComponent,
    KpiCardComponent,
    DropdownMenuComponent,
    AnimalBulkImportComponent,
    WeightBulkImportComponent,
  ],
  templateUrl: './animal-list.component.html',
  styleUrl: './animal-list.component.scss',
})
export class AnimalListComponent implements OnInit, OnDestroy {
  private svc    = inject(CattleService);
  private snack  = inject(MatSnackBar);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  // ══════════════════════════════════════════════════════════════════════════
  // STATE
  // ══════════════════════════════════════════════════════════════════════════

  animals    = signal<AnimalListItem[]>([]);
  breeds     = signal<any[]>([]);
  lots       = signal<any[]>([]);
  pagination = signal<any>(null);
  loading    = signal(true);

  // Modales
  showBulkImport   = signal(false);
  showWeightImport = signal(false);

  // ══════════════════════════════════════════════════════════════════════════
  // FILTERS (server-side)
  // ══════════════════════════════════════════════════════════════════════════

  statusFilter = 'active';
  sexFilter: '' | 'M' | 'F' = '';
  breedFilter  = '';
  lotFilter    = '';

  // Estos se actualizan desde app-table via paginationParamsChange
  private currentPage = 1;
  private pageSize    = 15;
  private searchTerm  = '';
  private ordering    = '-entry_date';

  // ══════════════════════════════════════════════════════════════════════════
  // LABELS / MAPS
  // ══════════════════════════════════════════════════════════════════════════

  private statusLabels   = ANIMAL_STATUS_LABELS;
  private statusColors   = ANIMAL_STATUS_COLORS as Record<string, BadgeColor>;
  private categoryLabels = ANIMAL_CATEGORY_LABELS;

  // ══════════════════════════════════════════════════════════════════════════
  // TABLE COLUMNS
  // ══════════════════════════════════════════════════════════════════════════

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

  // ══════════════════════════════════════════════════════════════════════════
  // KPIs
  // ══════════════════════════════════════════════════════════════════════════

  kpis = computed(() => {
    const list  = this.animals();
    const total = this.pagination()?.count ?? list.length;
    const male  = list.filter((a) => a.gender === 'M').length;
    const female = list.filter((a) => a.gender === 'F').length;
    const weights = list
      .map((a) => parseFloat(a.current_weight ?? '0'))
      .filter((w) => w > 0);
    const avgWeight = weights.length
      ? +(weights.reduce((s, w) => s + w, 0) / weights.length).toFixed(1)
      : 0;

    return { total, male, female, avgWeight };
  });

  // ══════════════════════════════════════════════════════════════════════════
  // COMPUTED
  // ══════════════════════════════════════════════════════════════════════════

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
      this.lotFilter ||
      this.statusFilter !== 'active'
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ══════════════════════════════════════════════════════════════════════════

  ngOnInit(): void {
    // Cargar catálogos
    this.svc
      .getBreeds()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: (r) => r.success && this.breeds.set(r.data) });

    this.svc
      .getLots()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: (r) => r.success && this.lots.set(r.data) });

    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ══════════════════════════════════════════════════════════════════════════

  load(): void {
    this.loading.set(true);

    const filters: AnimalFilters = {
      page: this.currentPage,
      page_size: this.pageSize,
      ordering: this.ordering,
    };

    if (this.searchTerm) filters.search = this.searchTerm;
    if (this.sexFilter) filters.gender = this.sexFilter;
    if (this.statusFilter) filters.status = this.statusFilter as any;
    if (this.breedFilter) filters.breed = this.breedFilter;
    if (this.lotFilter) filters.lot = this.lotFilter;

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
          this.snack.open('Error al cargar animales', 'Cerrar', {
            duration: 3500,
          });
        },
      });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TABLE EVENTS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Recibe todos los cambios de paginación/búsqueda/sort desde app-table.
   * Es el único punto de conexión tabla → backend.
   */
  onParamsChange(params: PaginationParams): void {
    this.currentPage = params.page ?? 1;
    this.pageSize = params.page_size ?? 15;
    this.searchTerm = params.search ?? '';

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

  // ══════════════════════════════════════════════════════════════════════════
  // FILTER EVENTS (selects fuera de la tabla)
  // ══════════════════════════════════════════════════════════════════════════

  onFilter(): void {
    this.currentPage = 1;
    this.load();
  }

  clearFilters(): void {
    this.statusFilter = 'active';
    this.sexFilter = '';
    this.breedFilter = '';
    this.lotFilter = '';
    this.onFilter();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // EXPORT
  // ══════════════════════════════════════════════════════════════════════════

  onExport(event: ExportEvent): void {
    // Aquí puedes llamar al backend para generar el archivo
    // o generar localmente con una librería como xlsx / pdfmake
    console.log('Export requested:', event.format, event);

    this.snack.open(
      `Descargando ${event.format.toUpperCase()}...`,
      'Cerrar',
      { duration: 3000 }
    );

    // TODO: implementar exportación real
    // if (event.format === 'excel') {
    //   this.exportService.toExcel(event.data, event.columns, event.fileName);
    // } else {
    //   this.exportService.toPdf(event.data, event.columns, event.fileName);
    // }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MODALS
  // ══════════════════════════════════════════════════════════════════════════

  onImportSuccess(_count: number): void {
    this.load();
  }

  onWeightImportSuccess(_count: number): void {
    this.load();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HELPERS / FORMATTERS
  // ══════════════════════════════════════════════════════════════════════════

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