// animal-detail.component.ts
import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, forkJoin } from 'rxjs';

import { PageHeaderComponent }    from '../../../../../shared/components/page-header/page-header.component';
import { KpiCardComponent }       from '../../../../../shared/components/display/kpi-card/kpi-card.component';
import { BadgeComponent }         from '../../../../../shared/components/display/badge/badge.component';
import { LoaderComponent }        from '../../../../../shared/components/loader/loader.component';
import { EmptyStateComponent }    from '../../../../../shared/components/empty-state/empty-state.component';

import { CattleService} from '../../../services/cattle.service';
import { AnimalDetail, AnimalSummary, WeightHistoryItem, BulkImportResult, BulkWeightResult, ANIMAL_STATUS_LABELS, ANIMAL_STATUS_COLORS, ANIMAL_CATEGORY_LABELS, SEX_LABELS } from '../../../models/cattle.model';

type Tab = 'info' | 'weights' | 'health' | 'movements';

@Component({
  selector: 'app-animal-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    PageHeaderComponent, KpiCardComponent,
    LoaderComponent, EmptyStateComponent,
  ],
  templateUrl: './animal-detail.component.html',
  styleUrl: './animal-detail.component.scss',
})
export class AnimalDetailComponent implements OnInit, OnDestroy {
  private route    = inject(ActivatedRoute);
  private svc      = inject(CattleService);
  private snack    = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  animalId = this.route.snapshot.paramMap.get('id')!;

  // ── State ─────────────────────────────────────────────────────────────────
  animal        = signal<AnimalDetail | null>(null);
  summary       = signal<AnimalSummary | null>(null);
  weightHistory = signal<WeightHistoryItem[]>([]);
  loading       = signal(true);
  activeTab     = signal<Tab>('info');

  // ── Bulk weight upload ────────────────────────────────────────────────────
  uploading    = signal(false);
  uploadResult = signal<BulkWeightResult | null>(null);

  // ── Display ───────────────────────────────────────────────────────────────
  statusLabels   = ANIMAL_STATUS_LABELS;
  statusColors   = ANIMAL_STATUS_COLORS;
  categoryLabels = ANIMAL_CATEGORY_LABELS;
  sexLabels      = SEX_LABELS;

  // ── Computed ──────────────────────────────────────────────────────────────
  pageTitle = computed(() => this.animal()?.tag_number ?? 'Cargando...');

  pageSubtitle = computed(() => {
    const a = this.animal();
    if (!a) return '';
    const parts = [a.breed?.name, a.category ? (this.categoryLabels[a.category as keyof typeof this.categoryLabels] ?? a.category) : null].filter(Boolean);
    return parts.join(' · ');
  });

  ngOnInit(): void {
    forkJoin({
      animal:  this.svc.getAnimal(this.animalId),
      summary: this.svc.getAnimalSummary(this.animalId),
      weights: this.svc.getWeightHistory(this.animalId),
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ animal, summary, weights }) => {
        if (animal.success)  this.animal.set(animal.data);
        if (summary.success) this.summary.set(summary.data);
        if (weights.success) this.weightHistory.set(weights.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snack.open('Error al cargar el animal', 'Cerrar', { duration: 3500 });
      },
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  pricePerKg: number | null = null;

  // ── Bulk weight from file ─────────────────────────────────────────────────

  
  // ── Helpers ───────────────────────────────────────────────────────────────
  formatDate(d?: string | null): string {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatWeight(v?: number | null): string {
    if (v == null) return '—';
    return `${v.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;
  }

  formatCurrency(v?: number | null): string {
    if (v == null) return '—';
    return v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  }

  parseFloat = parseFloat; // exponer al template
}