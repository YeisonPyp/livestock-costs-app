// animal-selection-modal.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { CattleService } from '../../../cattle/services/cattle.service';
import {
  AnimalListItem,
  AnimalFilters,
  ANIMAL_STATUS_LABELS,
  ANIMAL_STATUS_COLORS,
  GENDER_LABELS,
} from '../../../cattle/models/cattle.model';
import { LoaderComponent } from '../../../../shared/components/feedback/loader/loader.component';
import { EmptyStateComponent } from '../../../../shared/components/feedback/empty-state/empty-state.component';

export interface AnimalSelection extends AnimalListItem {
  selected?: boolean;
}

@Component({
  selector: 'app-animal-selection-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoaderComponent,
    EmptyStateComponent,
    // BadgeComponent,
  ],
  templateUrl: './animal-selection-modal.component.html',
  styleUrl: './animal-selection-modal.component.scss',
})
export class AnimalSelectionModalComponent implements OnInit {
  private svc = inject(CattleService);
  private dialogRef = inject(MatDialogRef<AnimalSelectionModalComponent>);

  // ── Animales en la vista actual (página/filtro) ───────────────────────────
  animals = signal<AnimalSelection[]>([]);
  loading = signal(true);

  // ── 👇 CLAVE: Mapa persistente de animales seleccionados ──────────────────
  // Este Map persiste entre búsquedas/filtros
  selectedAnimalsMap = signal<Map<string, AnimalSelection>>(new Map());

  // ── Filters ───────────────────────────────────────────────────────────────
  searchTerm = '';
  statusFilter = 'active';
  lotFilter = '';
  genderFilter = '';

  // ── Search debounce ───────────────────────────────────────────────────────
  private searchSubject = new Subject<string>();

  // ── Pagination ────────────────────────────────────────────────────────────
  currentPage = 1;
  pageSize = 25;
  totalPages = 1;
  totalCount = 0;

  // ── Labels ────────────────────────────────────────────────────────────────
  statusLabels = ANIMAL_STATUS_LABELS;
  statusColors = ANIMAL_STATUS_COLORS;
  genderLabels = GENDER_LABELS;

  // ── Computed: animales seleccionados (desde el Map persistente) ───────────
  selectedAnimals = computed(() => {
    // Forzar reactividad cuando cambian los animales
    this.animals();
    return Array.from(this.selectedAnimalsMap().values());
  });

  selectedCount = computed(() => this.selectedAnimalsMap().size);

  selectedWeight = computed(() => {
    return this.selectedAnimals().reduce((sum, a) => {
      const weight = a.current_weight ? parseFloat(a.current_weight) : 0;
      return sum + weight;
    }, 0);
  });

  // ── Select all (solo para la página actual) ───────────────────────────────
  allCurrentPageSelected = computed(() => {
    const currentAnimals = this.animals();
    if (currentAnimals.length === 0) return false;
    return currentAnimals.every(a => this.selectedAnimalsMap().has(a.id));
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    // Configurar debounce para búsqueda
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadAnimals();
    });

    this.loadAnimals();
  }

  // ── Load Animals ──────────────────────────────────────────────────────────
  loadAnimals(): void {
    this.loading.set(true);

    const filters: AnimalFilters = {
      page: this.currentPage,
      page_size: this.pageSize,
      status: 'active',
    };

    if (this.searchTerm) filters.search = this.searchTerm;
    if (this.statusFilter) filters.status = this.statusFilter as any;
    if (this.lotFilter) filters.lot = this.lotFilter as any;
    if (this.genderFilter) filters.gender = this.genderFilter as any;

    this.svc.getAnimals(filters).subscribe({
      next: (r) => {
        if (r.success) {
          // 👇 Marcar como seleccionados los que ya están en el Map
          const animalsWithSelection = r.data.map(a => ({
            ...a,
            selected: this.selectedAnimalsMap().has(a.id),
          }));
          
          this.animals.set(animalsWithSelection);
          
          // Actualizar paginación
          if (r.pagination) {
            this.totalPages = r.pagination.total_pages || 1;
            this.totalCount = r.pagination.count || r.data.length;
          }
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ── Search with debounce ──────────────────────────────────────────────────
  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  // ── Filter change (sin debounce) ──────────────────────────────────────────
  onFilterChange(): void {
    this.currentPage = 1;
    this.loadAnimals();
  }

  // ── Toggle individual animal ──────────────────────────────────────────────
  toggleAnimalSelection(animal: AnimalSelection): void {
    const map = new Map(this.selectedAnimalsMap()); // ← copiar

    if (map.has(animal.id)) {
      map.delete(animal.id);
    } else {
      map.set(animal.id, { ...animal, selected: true });
    }

    this.selectedAnimalsMap.set(map); // ← esto dispara reactividad

    // actualizar UI
    this.animals.set(
      this.animals().map(a => ({
        ...a,
        selected: map.has(a.id),
      }))
    );
  }
  // ── Toggle all (solo página actual) ───────────────────────────────────────
  toggleAllCurrentPage(): void {
    const map = new Map(this.selectedAnimalsMap());
    const currentAnimals = this.animals();
    const allSelected = this.allCurrentPageSelected();

    if (allSelected) {
      currentAnimals.forEach(a => map.delete(a.id));
    } else {
      currentAnimals.forEach(a => {
        map.set(a.id, { ...a, selected: true });
      });
    }

    this.selectedAnimalsMap.set(map);

    this.animals.set(
      currentAnimals.map(a => ({
        ...a,
        selected: map.has(a.id),
      }))
    );
  }

  // ── Check if animal is selected ───────────────────────────────────────────
  isSelected(animalId: string): boolean {
    return this.selectedAnimalsMap().has(animalId);
  }

  // ── Remove from selection (desde el panel de resumen) ─────────────────────
  removeFromSelection(animalId: string): void {
    const map = new Map(this.selectedAnimalsMap());
    map.delete(animalId);
    this.selectedAnimalsMap.set(map);

    this.animals.set(
      this.animals().map(a => ({
        ...a,
        selected: map.has(a.id),
      }))
    );
  }

  // ── Clear all selection ───────────────────────────────────────────────────
  clearAllSelection(): void {
    this.selectedAnimalsMap.set(new Map());

    this.animals.set(
      this.animals().map(a => ({
        ...a,
        selected: false,
      }))
    );
  }
  // ── Confirm selection ─────────────────────────────────────────────────────
  confirmSelection(): void {
    const selected = Array.from(this.selectedAnimalsMap().values());
    
    if (selected.length === 0) {
      return;
    }

    this.dialogRef.close({
      animals: selected,
      totalHeads: selected.length,
      totalWeight: this.getSelectedWeight(),
    });
  }

  // ── Cancel ────────────────────────────────────────────────────────────────
  cancelSelection(): void {
    this.dialogRef.close(null);
  }

  // ── Clear filters ─────────────────────────────────────────────────────────
  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'active';
    this.lotFilter = '';
    this.genderFilter = '';
    this.currentPage = 1;
    this.loadAnimals();
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadAnimals();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  formatDate(d?: string | null): string {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatWeight(value?: string | number | null): string {
    if (value == null) return '—';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '—';
    return `${num.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;
  }

  getSelectedWeight(): number {
    return Math.round(this.selectedWeight() * 100) / 100;
  }

  get hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.statusFilter !== 'active' || this.genderFilter || this.lotFilter);
  }
}