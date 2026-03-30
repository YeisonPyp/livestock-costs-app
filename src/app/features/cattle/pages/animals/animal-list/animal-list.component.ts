// animal-list.component.ts
import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe, CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

import { PageHeaderComponent }  from '../../../../../shared/components/page-header/page-header.component';
import { KpiCardComponent }     from '../../../../../shared/components/display/kpi-card/kpi-card.component';
import { BadgeColor, BadgeComponent }       from '../../../../../shared/components/display/badge/badge.component';
import { LoaderComponent }      from '../../../../../shared/components/loader/loader.component';
import { EmptyStateComponent }  from '../../../../../shared/components/empty-state/empty-state.component';
import { DropdownMenuComponent} from '../../../../../shared/components/display/dropdown-menu/dropdown-menu.component';
import { AnimalBulkImportComponent } from '../animal-bulk-import/animal-bulk-import.component';

import { CattleService } from '../../../services/cattle.service';
import { 
  AnimalFilters, 
  AnimalListItem,
  AnimalDetail,
  ANIMAL_STATUS_LABELS, 
  ANIMAL_STATUS_COLORS, 
  ANIMAL_CATEGORY_LABELS, 
  SEX_LABELS 
} from '../../../models/cattle.model';
import { WeightBulkImportComponent } from '../../weights/weight-bulk-import/weight-bulk-import.component';
import { NotificationService } from '../../../../../core/services/notification.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-animal-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    PageHeaderComponent, KpiCardComponent, BadgeComponent,
    LoaderComponent, EmptyStateComponent, DropdownMenuComponent,
    DecimalPipe, AnimalBulkImportComponent, WeightBulkImportComponent,
  ],
  templateUrl: './animal-list.component.html',
  styleUrl: './animal-list.component.scss',
})
export class AnimalListComponent implements OnInit, OnDestroy {
  [x: string]: any;
  private svc     = inject(CattleService);
  private notSvc  = inject(NotificationService);
  private snack   = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  // ── State ─────────────────────────────────────────────────────────────────
  animals    = signal<AnimalListItem[]>([]);
  breeds     = signal<any[]>([]);
  lots       = signal<any[]>([]);
  pagination = signal<any>(null);
  loading    = signal(true);

  // ── Filters ───────────────────────────────────────────────────────────────
  search$      = new Subject<string>();
  searchTerm   = '';
  breedFilter  = '';
  sexFilter: '' | 'M' | 'F' = '';
  statusFilter = 'active';
  lotFilter    = '';
  ordering     = '-entry_date';
  currentPage  = 1;
  pageSize     = 10;


  // ── Display ───────────────────────────────────────────────────────────────
  statusLabels   = ANIMAL_STATUS_LABELS;
  statusColors: Record<string, BadgeColor> = ANIMAL_STATUS_COLORS as Record<string, BadgeColor>;
  categoryLabels = ANIMAL_CATEGORY_LABELS;
  sexLabels      = SEX_LABELS;

  // ── Cargues de documentos ─────────────────────────────────────────────────
  showBulkImport = signal(false);
  showWeightImport = signal(false);

  onImportSuccess(count: number) {
    console.log(`${count} animales importados`);
    this.load();
  }

  onWeightImportSuccess(count: number): void {
    console.log(`${count} pesajes registrados`);
    this.load();
  }

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

  getStatusColor(status?: string | null): BadgeColor  {
    if (!status) return 'gray';

    const key = status.trim().toLowerCase() as keyof typeof this.statusColors;
    return this.statusColors[key] ?? 'gray';
  }

  kpis = computed(() => {
    const list  = this.animals();
    const total = this.pagination()?.count ?? list.length;
    const male  = list.filter(a => a.gender === 'M').length;
    const female = list.filter(a => a.gender === 'F').length;
    const weights = list.map(a => parseFloat(a.current_weight ?? '0')).filter(w => w > 0);
    const avgWeight = weights.length
      ? +(weights.reduce((s, w) => s + w, 0) / weights.length).toFixed(1) : 0;
    return { total, male, female, avgWeight };
  });


  get hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.breedFilter || this.sexFilter || this.lotFilter || this.statusFilter !== 'active');
  }

  get pagesArray(): number[] {
    return Array.from({ length: this.pagination()?.total_pages ?? 0 }, (_, i) => i + 1);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.svc.getBreeds().pipe(takeUntil(this.destroy$)).subscribe({ 
      next: r => { if (r.success) this.breeds.set(r.data); } 
    });
    this.svc.getLots().pipe(takeUntil(this.destroy$)).subscribe({ 
      next: r => { if (r.success) this.lots.set(r.data); } 
    });

    this.search$.pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => { this.currentPage = 1; this.load(); });

    this.load();
  }

  ngOnDestroy(): void { 
    this.destroy$.next(); 
    this.destroy$.complete(); 
  }

  // ── Data ──────────────────────────────────────────────────────────────────
  load(page = this.currentPage): void {
    this.loading.set(true);
    this.currentPage = page;

    const filters: AnimalFilters = { page, page_size: this.pageSize, ordering: this.ordering };
    if (this.searchTerm)   filters.search = this.searchTerm;
    if (this.sexFilter)    filters.gender = this.sexFilter;
    if (this.statusFilter) filters.status = this.statusFilter as any;
    if (this.breedFilter)  filters.breed  = this.breedFilter;
    if (this.lotFilter)    filters.lot    = this.lotFilter;

    this.svc.getAnimals(filters).pipe(takeUntil(this.destroy$)).subscribe({
      next: r => {
        if (r.success) { 
          this.animals.set(r.data); 
          this.pagination.set(r.pagination ?? null); 
        }
        this.loading.set(false);
      },
      error: () => { 
        this.loading.set(false); 
        this.snack.open('Error al cargar animales', 'Cerrar', { duration: 3500 }); 
      },
    });
  }

  // ── Filters ───────────────────────────────────────────────────────────────
  onFilter(): void { 
    this.currentPage = 1; 
    this.load(); 
  }

  clearFilters(): void {
    this.searchTerm = ''; 
    this.breedFilter = ''; 
    this.sexFilter = '';
    this.statusFilter = 'active'; 
    this.lotFilter = ''; 
    this.ordering = '-entry_date';
    this.onFilter();
  }

  sortBy(field: string): void {
    this.ordering = this.ordering === field ? `-${field}` : field;
    this.load();
  }

  sortIcon(f: string): string {
    if (this.ordering === f) return '↑';
    if (this.ordering === `-${f}`) return '↓';
    return '↕';
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  formatDate(d?: string | null): string {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('es-CO', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  }

  formatWeight(w?: string | null): string {
    if (!w) return '—';
    const n = parseFloat(w);
    return isNaN(n) ? '—' : `${n.toLocaleString('es-CO', { 
      minimumFractionDigits: 1, 
      maximumFractionDigits: 1 
    })} kg`;
  }

  formatCurrency(v?: string | number | null): string {
    if (v == null) return '—';
    const n = typeof v === 'string' ? parseFloat(v) : v;
    return isNaN(n) ? '—' : n.toLocaleString('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      maximumFractionDigits: 0 
    });
  }
}