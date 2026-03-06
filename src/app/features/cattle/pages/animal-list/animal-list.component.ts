import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { StatsCardComponent } from '../../../../shared/components/stats-card/stats-card.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

import { CattleService } from '../../services/cattle.service';
import { FarmService } from '../../../farms/services/farm.service';
import {
  Animal,
  Breed,
  Lot,
  ANIMAL_STATUS,
  ANIMAL_CATEGORIES,
  ANIMAL_GENDER,
} from '../../models/cattle.model';
import { Farm } from '../../../farms/models/farm.model';
import { formatNumber, formatCurrency } from '../../../../core/utils/helpers';

@Component({
  selector: 'app-animal-list',
  imports: [CommonModule, RouterLink, FormsModule, MatMenuModule, PageHeaderComponent, LoaderComponent, EmptyStateComponent, StatsCardComponent],
  templateUrl: './animal-list.component.html',
  styleUrl: './animal-list.component.scss'
})
export class AnimalListComponent implements OnInit {
  private cattleService = inject(CattleService);
  private farmService = inject(FarmService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  animals = signal<Animal[]>([]);
  farms = signal<Farm[]>([]);
  lots = signal<Lot[]>([]);
  loading = signal(true);
  currentPage = signal(1);
  totalPages = signal(1);
  totalCount = signal(0);
  selectedAnimals = signal<string[]>([]);
  
  viewMode: 'grid' | 'table' = 'grid';
  
  filters = {
    search: '',
    farm: '',
    lot: '',
    status: 'active',
    category: '',
    gender: '',
    breed: '',
  };
  
  statusOptions = ANIMAL_STATUS;
  categoryOptions = ANIMAL_CATEGORIES;
  genderOptions = ANIMAL_GENDER;
  
  stats = signal({
    totalAnimals: 0,
    totalWeight: 0,
    totalValue: 0,
    avgWeight: 0,
  });

  formatNumber = formatNumber;
  formatCurrency = formatCurrency;

  ngOnInit(): void {
    this.loadFarms();
    this.loadLots();
    this.loadAnimals();
  }

  loadFarms(): void {
    this.farmService.getAll({ status: 'active' }).subscribe({
      next: (response) => {
        if (response.success) {
          this.farms.set(response.data);
        }
      }
    });
  }

  loadLots(): void {
    this.cattleService.getLots({ status: 'active' }).subscribe({
      next: (response) => {
        if (response.success) {
          this.lots.set(response.data.results);
        }
      }
    });
  }

  loadAnimals(): void {
    this.loading.set(true);
    
    const params: Record<string, any> = {
      page: this.currentPage(),
    };
    
    if (this.filters.search) params['search'] = this.filters.search;
    if (this.filters.farm) params['farm'] = this.filters.farm;
    if (this.filters.lot) params['lot'] = this.filters.lot;
    if (this.filters.status) params['status'] = this.filters.status;
    if (this.filters.category) params['category'] = this.filters.category;
    if (this.filters.gender) params['gender'] = this.filters.gender;

    this.cattleService.getAnimals(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.animals.set(response.data.results);
          this.totalCount.set(response.data.count);
          this.totalPages.set(Math.ceil(response.data.count / 20));
          this.calculateStats(response.data.results);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error al cargar los animales', 'Cerrar', { duration: 3000 });
      }
    });
  }

  calculateStats(animals: Animal[]): void {
    const totalWeight = animals.reduce((sum, a) => sum + (a.current_weight || 0), 0);
    const totalValue = animals.reduce((sum, a) => sum + (a.current_value || 0), 0);
    
    this.stats.set({
      totalAnimals: animals.length,
      totalWeight,
      totalValue,
      avgWeight: animals.length > 0 ? totalWeight / animals.length : 0,
    });
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadAnimals();
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      farm: '',
      lot: '',
      status: 'active',
      category: '',
      gender: '',
      breed: '',
    };
    this.loadAnimals();
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadAnimals();
  }

  // Selection methods
  isSelected(id: string): boolean {
    return this.selectedAnimals().includes(id);
  }

  toggleSelection(id: string): void {
    const current = this.selectedAnimals();
    if (current.includes(id)) {
      this.selectedAnimals.set(current.filter(i => i !== id));
    } else {
      this.selectedAnimals.set([...current, id]);
    }
  }

  toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selectedAnimals.set([]);
    } else {
      this.selectedAnimals.set(this.animals().map(a => a.id));
    }
  }

  allSelected(): boolean {
    return this.animals().length > 0 && 
           this.selectedAnimals().length === this.animals().length;
  }

  clearSelection(): void {
    this.selectedAnimals.set([]);
  }

  // Labels
  getStatusLabel(status: string): string {
    return ANIMAL_STATUS.find(s => s.value === status)?.label || status;
  }

  getCategoryLabel(category: string): string {
    return ANIMAL_CATEGORIES.find(c => c.value === category)?.label || category;
  }

  getGenderLabel(gender: string): string {
    return ANIMAL_GENDER.find(g => g.value === gender)?.label || gender;
  }

  // Dialogs
  openWeightDialog(animal: Animal): void {
    // TODO: Implement weight dialog
    console.log('Open weight dialog for:', animal.tag_number);
  }

  openHealthDialog(animal: Animal): void {
    // TODO: Implement health event dialog
    console.log('Open health dialog for:', animal.tag_number);
  }

  openLotChangeDialog(animal: Animal): void {
    // TODO: Implement lot change dialog
    console.log('Open lot change dialog for:', animal.tag_number);
  }

  openBulkWeightDialog(): void {
    // TODO: Implement bulk weight dialog
    console.log('Open bulk weight dialog for:', this.selectedAnimals());
  }

  openBulkHealthDialog(): void {
    // TODO: Implement bulk health dialog
    console.log('Open bulk health dialog');
  }

  openBulkLotChangeDialog(): void {
    // TODO: Implement bulk lot change dialog
    console.log('Open bulk lot change dialog for:', this.selectedAnimals());
  }

  confirmRecordDeath(animal: Animal): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Registrar Muerte',
        message: `¿Está seguro de registrar la muerte del animal "${animal.tag_number}"?`,
        confirmText: 'Registrar',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.recordDeath(animal);
      }
    });
  }

  private recordDeath(animal: Animal): void {
    const today = new Date().toISOString().split('T')[0];
    
    this.cattleService.recordDeath(animal.id, { death_date: today }).subscribe({
      next: () => {
        this.snackBar.open('Muerte registrada exitosamente', 'Cerrar', { duration: 3000 });
        this.loadAnimals();
      },
      error: () => {
        this.snackBar.open('Error al registrar la muerte', 'Cerrar', { duration: 3000 });
      }
    });
  }
}