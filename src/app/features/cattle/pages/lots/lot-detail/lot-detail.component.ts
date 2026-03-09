import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PageHeaderComponent }    from '../../../../../shared/components/page-header/page-header.component';
import { KpiCardComponent }        from '../../../../../shared/components/display/kpi-card/kpi-card.component';
import { BadgeComponent }          from '../../../../../shared/components/display/badge/badge.component';
import { AmountDisplayComponent }  from '../../../../../shared/components/bills/amount-display/amount-display.component';
import { LoaderComponent }         from '../../../../../shared/components/loader/loader.component';
import { EmptyStateComponent }     from '../../../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent }  from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';

import { CattleService } from '../../../services/cattle.service';
import { Lot, LotSummary, Animal, ANIMAL_STATUS_LABELS, ANIMAL_STATUS_COLORS } from '../../../models/cattle.model';

type Tab = 'summary' | 'animals';

@Component({
  selector: 'app-lot-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    PageHeaderComponent, KpiCardComponent, BadgeComponent,
    AmountDisplayComponent, LoaderComponent, EmptyStateComponent,
  ],
  templateUrl: './lot-detail.component.html',
  styleUrl:    './lot-detail.component.scss',
})
export class LotDetailComponent implements OnInit {
  private route  = inject(ActivatedRoute);
  private svc    = inject(CattleService);
  private dialog = inject(MatDialog);
  private snack  = inject(MatSnackBar);

  lotId   = +this.route.snapshot.paramMap.get('id')!;
  lot     = signal<Lot | null>(null);
  summary = signal<LotSummary | null>(null);
  animals = signal<Animal[]>([]);

  loading        = signal(true);
  loadingAnimals = signal(false);
  activeTab      = signal<Tab>('summary');

  statusLabels = ANIMAL_STATUS_LABELS;
  statusColors = ANIMAL_STATUS_COLORS;

  searchAnimal = '';

  ngOnInit(): void {
    this.svc.getLotById(this.lotId).subscribe({
      next: (r) => { if (r.success) this.lot.set(r.data); },
    });

    this.svc.getLotSummary(this.lotId).subscribe({
      next: (r) => { if (r.success) this.summary.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
    if (tab === 'animals' && this.animals().length === 0) this.loadAnimals();
  }

  loadAnimals(): void {
    this.loadingAnimals.set(true);
    this.svc.getLotAnimals(this.lotId).subscribe({
      next: (r) => { if (r.success) this.animals.set(r.data); this.loadingAnimals.set(false); },
      error: () => this.loadingAnimals.set(false),
    });
  }

  get filteredAnimals(): Animal[] {
    const q = this.searchAnimal.toLowerCase();
    return q
      ? this.animals().filter(a => a.tag.toLowerCase().includes(q) || (a.name ?? '').toLowerCase().includes(q))
      : this.animals();
  }

  confirmClose(): void {
    const lot = this.lot();
    if (!lot) return;
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Cerrar Lote', message: `¿Cerrar el lote "${lot.name}"?`, confirmText: 'Cerrar', type: 'warning' },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.svc.closeLot(this.lotId).subscribe({
        next: (r) => { if (r.success) { this.lot.set(r.data); this.snack.open('Lote cerrado', 'Cerrar', { duration: 3000 }); } },
        error: (e) => this.snack.open(e?.error?.message || 'Error al cerrar', 'Cerrar', { duration: 3500 }),
      });
    });
  }

  formatDate(d?: string | null): string {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}