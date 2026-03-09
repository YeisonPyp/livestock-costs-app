import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { PageHeaderComponent }   from '../../../../../shared/components/page-header/page-header.component';
import { KpiCardComponent }       from '../../../../../shared/components/display/kpi-card/kpi-card.component';
import { BadgeComponent }         from '../../../../../shared/components/display/badge/badge.component';
import { LoaderComponent }        from '../../../../../shared/components/loader/loader.component';
import { EmptyStateComponent }    from '../../../../../shared/components/empty-state/empty-state.component';
import { DropdownMenuComponent }  from '../../../../../shared/components/display/dropdown-menu/dropdown-menu.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';

import { CattleService } from '../../services/cattle.service';
import {
  Animal, Breed, Color, Lot,
  AnimalFilters, AnimalStatus,
  ANIMAL_STATUS_LABELS, ANIMAL_STATUS_COLORS, SEX_LABELS,
} from '../../models/cattle.model';

@Component({
  selector: 'app-animal-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    PageHeaderComponent, KpiCardComponent, BadgeComponent,
    LoaderComponent, EmptyStateComponent, DropdownMenuComponent,
  ],
  templateUrl: './animal-list.component.html',
  styleUrl:    './animal-list.component.scss',
})
export class AnimalListComponent implements OnInit {
  private svc    = inject(CattleService);
  private dialog = inject(MatDialog);
  private snack  = inject(MatSnackBar);

  animals     = signal<Animal[]>([]);
  breeds      = signal<Breed[]>([]);
  colors      = signal<Color[]>([]);
  lots        = signal<Lot[]>([]);
  pagination  = signal<any>(null);
  loading     = signal(true);

  // Filters
  search$     = new Subject<string>();
  searchTerm  = '';
  breedFilter: number | '' = '';
  sexFilter:   '' | 'M' | 'F' = '';
  statusFilter: AnimalStatus | '' = 'active';
  lotFilter:   number | '' = '';
  ordering     = '-entry_date';
  currentPage  = 1;
  pageSize     = 25;

  // Bulk selection
  selectedIds = signal<Set<number>>(new Set());
  selectAll   = false;

  statusLabels = ANIMAL_STATUS_LABELS;
  statusColors = ANIMAL_STATUS_COLORS;
  sexLabels    = SEX_LABELS;

  kpis = computed(() => {
    const all = this.animals();
    return {
      total:    this.pagination()?.count ?? all.length,
      male:     all.filter(a => a.sex === 'M').length,
      female:   all.filter(a => a.sex === 'F').length,
      avgWeight: all.length ? +(all.reduce((s, a) => s + (a.current_weight ?? 0), 0) / all.length).toFixed(1) : 0,
    };
  });

  ngOnInit(): void {
    this.svc.getBreeds().subscribe({ next: (r) => { if (r.success) this.breeds.set(r.data); } });
    this.svc.getLots().subscribe({ next: (r) => { if (r.success) this.lots.set(r.data); } });
    this.load();

    this.search$.pipe(debounceTime(350), distinctUntilChanged()).subscribe(() => {
      this.currentPage = 1;
      this.load();
    });
  }

  load(page = this.currentPage): void {
    this.loading.set(true);
    this.currentPage = page;

    const f: AnimalFilters = { page, page_size: this.pageSize, ordering: this.ordering };
    if (this.searchTerm)  f.search = this.searchTerm;
    if (this.breedFilter) f.breed  = +this.breedFilter;
    if (this.sexFilter)   f.sex    = this.sexFilter;
    if (this.statusFilter) f.status = this.statusFilter as AnimalStatus;
    if (this.lotFilter)   f.lot    = +this.lotFilter;

    this.svc.getAnimals(f).subscribe({
      next: (r) => {
        if (r.success) { this.animals.set(r.data); this.pagination.set(r.pagination ?? null); }
        this.loading.set(false);
        this.selectedIds.set(new Set());
        this.selectAll = false;
      },
      error: () => this.loading.set(false),
    });
  }

  onFilter(): void { this.currentPage = 1; this.load(); }

  clearFilters(): void {
    this.searchTerm = ''; this.breedFilter = ''; this.sexFilter = '';
    this.statusFilter = 'active'; this.lotFilter = ''; this.ordering = '-entry_date';
    this.onFilter();
  }

  sortBy(field: string): void {
    this.ordering = this.ordering === field ? `-${field}` : field;
    this.load();
  }

  sortIcon(f: string): string {
    if (this.ordering === f)  return '↑';
    if (this.ordering === `-${f}`) return '↓';
    return '↕';
  }

  // ── Bulk selection ─────────────────────────────────────────────────────────
  toggleSelect(id: number): void {
    const s = new Set(this.selectedIds());
    s.has(id) ? s.delete(id) : s.add(id);
    this.selectedIds.set(s);
  }

  toggleAll(): void {
    this.selectAll = !this.selectAll;
    this.selectedIds.set(this.selectAll ? new Set(this.animals().map(a => a.id)) : new Set());
  }

  // ── Bulk lot change ────────────────────────────────────────────────────────
  openBulkLotChange(): void {
    // Simple prompt via snackbar – in production wire up a proper dialog
    const lotId = prompt('Ingresa el ID del lote destino:');
    if (!lotId || isNaN(+lotId)) return;
    this.svc.bulkChangeLot([...this.selectedIds()], +lotId).subscribe({
      next: (r) => { this.snack.open(r.message || 'Animales movidos', 'Cerrar', { duration: 3000 }); this.load(); },
      error: (e) => this.snack.open(e?.error?.message || 'Error', 'Cerrar', { duration: 3500 }),
    });
  }

  get hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.breedFilter || this.sexFilter || this.lotFilter || this.statusFilter !== 'active');
  }

  formatDate(d?: string | null): string {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}