import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

import { LoaderComponent } from '../../../../../shared/components/loader/loader.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { BadgeComponent } from '../../../../../shared/components/display/badge/badge.component';

import { CattleService } from '../../../../cattle/services/cattle.service';
import {
  AnimalListItem,
  AnimalFilters,
  ANIMAL_STATUS_LABELS,
  ANIMAL_STATUS_COLORS,
  GENDER_LABELS,
} from '../../../../cattle/models/cattle.model';

export interface AnimalSelection extends AnimalListItem {
  selected?: boolean;
  quantity?: number;
}

@Component({
  selector: 'app-animal-selection-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoaderComponent,
    EmptyStateComponent,
    BadgeComponent,
  ],
  templateUrl: './animal-selection-modal.component.html',
  styleUrl: './animal-selection-modal.component.scss',
})
export class AnimalSelectionModalComponent implements OnInit {
  private svc = inject(CattleService);
  private dialogRef = inject(MatDialogRef<AnimalSelectionModalComponent>);

  animals = signal<AnimalSelection[]>([]);
  loading = signal(true);

  // Filters
  searchTerm = '';
  statusFilter = 'active';
  lotFilter = '';
  genderFilter = '';

  // Pagination
  currentPage = 1;
  pageSize = 25;

  statusLabels = ANIMAL_STATUS_LABELS;
  statusColors = ANIMAL_STATUS_COLORS;
  genderLabels = GENDER_LABELS;

  // Computed: filtered and selected animals
  selectedAnimals = computed(() => {
    return this.animals().filter(a => a.selected);
  });

  selectedCount = computed(() => this.selectedAnimals().length);

  selectedWeight = computed(() => {
    return this.selectedAnimals().reduce((sum, a) => {
      const weight = a.current_weight ? parseFloat(a.current_weight) : 0;
      return sum + weight;
    }, 0);
  });

  selectAll = false;

  ngOnInit(): void {
    this.loadAnimals();
  }

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
          const animalsWithSelection = r.data.map(a => ({
            ...a,
            selected: false,
            quantity: 1,
          }));
          this.animals.set(animalsWithSelection);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleAnimalSelection(animal: AnimalSelection): void {
    const animals = this.animals().map(a => {
      if (a.id === animal.id) {
        return { ...a, selected: !a.selected };
      }
      return a;
    });
    this.animals.set(animals);
  }

  toggleAllSelection(): void {
    this.selectAll = !this.selectAll;
    const animals = this.animals().map(a => ({
      ...a,
      selected: this.selectAll,
    }));
    this.animals.set(animals);
  }

  updateQuantity(animal: AnimalSelection, quantity: number): void {
    const animals = this.animals().map(a => {
      if (a.id === animal.id) {
        return { ...a, quantity: Math.max(1, quantity) };
      }
      return a;
    });
    this.animals.set(animals);
  }

  confirmSelection(): void {
    const selected = this.selectedAnimals();
    if (selected.length === 0) {
      alert('Por favor selecciona al menos un animal');
      return;
    }

    this.dialogRef.close({
      animals: selected,
      totalHeads: selected.length,
      totalWeight: this.selectedWeight(),
    });
  }

  cancelSelection(): void {
    this.dialogRef.close(null);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'active';
    this.lotFilter = '';
    this.genderFilter = '';
    this.currentPage = 1;
    this.loadAnimals();
  }

  formatDate(d?: string | null): string {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  getSelectedCount(): number {
    return this.selectedAnimals().length;
  }

  getSelectedWeight(): number {
    return Math.round(this.selectedWeight() * 100) / 100;
  }
}