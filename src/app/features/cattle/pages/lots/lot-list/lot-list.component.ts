import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CattleService } from '../../../services/cattle.service';
import {
  Lot, LotStatus, LotType,
  LOT_STATUS_LABELS, LOT_STATUS_COLORS, LOT_TYPE_LABELS,
} from '../../../models/cattle.model';
import { PageHeaderComponent } from '../../../../../shared/components/navigation/page-header/page-header.component';
import { LoaderComponent } from '../../../../../shared/components/feedback/loader/loader.component';
import { KpiCardComponent } from '../../../../../shared/components/data-display/kpi-card/kpi-card.component';
import { EmptyStateComponent } from '../../../../../shared/components/feedback/empty-state/empty-state.component';
import { BadgeComponent } from '../../../../../shared/components/ui/badge/badge.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/feedback/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-lot-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    PageHeaderComponent, KpiCardComponent, BadgeComponent,
    LoaderComponent, EmptyStateComponent,
  ],
  templateUrl: './lot-list.component.html',
  styleUrl:    './lot-list.component.scss',
})
export class LotListComponent implements OnInit {
  private svc    = inject(CattleService);
  private dialog = inject(MatDialog);
  private snack  = inject(MatSnackBar);

  lots         = signal<Lot[]>([]);
  loading      = signal(true);
  searchTerm   = '';
  statusFilter: LotStatus | '' = '';
  typeFilter:   LotType | ''   = '';

  filtered = computed(() => {
    let list = this.lots();
    if (this.statusFilter) list = list.filter(l => l.status === this.statusFilter);
    if (this.typeFilter)   list = list.filter(l => l.lot_type === this.typeFilter);
    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(l => l.name.toLowerCase().includes(q) || l.code.toLowerCase().includes(q));
    }
    return list;
  });

  kpis = computed(() => ({
    total:   this.lots().length,
    active:  this.lots().filter(l => l.status === 'active').length,
    closed:  this.lots().filter(l => l.status === 'closed').length,
    animals: this.lots().reduce((s, l) => s + (l.current_head_count ?? 0), 0),
  }));

  statusLabels = LOT_STATUS_LABELS;
  statusColors = LOT_STATUS_COLORS;
  typeLabels   = LOT_TYPE_LABELS;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getLots().subscribe({
      next: (r) => { if (r.success) this.lots.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  confirmClose(lot: Lot): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title:       'Cerrar Lote',
        message:     `¿Cerrar el lote "${lot.name}"? Esta acción no se puede deshacer.`,
        confirmText: 'Cerrar Lote',
        type:        'warning',
      },
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.svc.closeLot(lot.id).subscribe({
        next: (r) => { this.snack.open(r.message || 'Lote cerrado', 'Cerrar', { duration: 3000 }); this.load(); },
        error: (e) => this.snack.open(e?.error?.message || 'Error al cerrar', 'Cerrar', { duration: 3500 }),
      });
    });
  }

  formatDate(d?: string | null): string {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}