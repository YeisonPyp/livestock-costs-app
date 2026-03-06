import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { StatsCardComponent } from '../../../../shared/components/stats-card/stats-card.component';

import { CattleService } from '../../services/cattle.service';
import {
  Animal,
  AnimalSummary,
  WeightRecord,
  HealthEvent,
  Movement,
  ANIMAL_STATUS,
  ANIMAL_CATEGORIES,
  ANIMAL_GENDER,
  HEALTH_EVENT_TYPES,
  MOVEMENT_TYPES,
} from '../../models/cattle.model';
import { formatNumber, formatCurrency, formatDate } from '../../../../core/utils/helpers';


@Component({
  selector: 'app-animal-detail',
  imports: [CommonModule, RouterLink, MatTabsModule, PageHeaderComponent, StatsCardComponent, LoaderComponent],
  templateUrl: './animal-detail.component.html',
  styleUrl: './animal-detail.component.scss'
})

export class AnimalDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private cattleService = inject(CattleService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  animal = signal<Animal | null>(null);
  summary = signal<AnimalSummary | null>(null);
  weightRecords = signal<WeightRecord[]>([]);
  healthEvents = signal<HealthEvent[]>([]);
  loading = signal(true);

  formatNumber = formatNumber;
  formatCurrency = formatCurrency;
  formatDate = formatDate;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadAnimal(id);
    }
  }

  private loadAnimal(id: string): void {
    this.loading.set(true);
    
    this.cattleService.getAnimalById(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.animal.set(response.data);
          this.loadSummary(id);
          this.loadWeightHistory(id);
          this.loadHealthEvents(id);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error al cargar el animal', 'Cerrar', { duration: 3000 });
      }
    });
  }

  private loadSummary(id: string): void {
    this.cattleService.getAnimalSummary(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.summary.set(response.data);
        }
      }
    });
  }

  private loadWeightHistory(id: string): void {
    this.cattleService.getAnimalWeightHistory(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.weightRecords.set(response.data);
        }
      }
    });
  }

  private loadHealthEvents(id: string): void {
    this.cattleService.getAnimalHealthEvents(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.healthEvents.set(response.data);
        }
      }
    });
  }

  getBreedName(): string {
    const animal = this.animal();
    if (!animal) return '';
    return animal.breed_name || '';
  }

  getStatusLabel(status: string): string {
    return ANIMAL_STATUS.find(s => s.value === status)?.label || status;
  }

  getCategoryLabel(category: string): string {
    return ANIMAL_CATEGORIES.find(c => c.value === category)?.label || category;
  }

  getGenderLabel(gender: string): string {
    return ANIMAL_GENDER.find(g => g.value === gender)?.label || gender;
  }

  getHealthEventTypeLabel(type: string): string {
    return HEALTH_EVENT_TYPES.find(t => t.value === type)?.label || type;
  }

  openWeightDialog(): void {
    // TODO: Implement weight dialog
    console.log('Open weight dialog');
  }

  openHealthDialog(): void {
    // TODO: Implement health dialog
    console.log('Open health dialog');
  }
}