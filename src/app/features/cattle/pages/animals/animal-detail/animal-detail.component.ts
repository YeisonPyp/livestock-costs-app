import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { KpiCardComponent } from '../../../../../shared/components/display/kpi-card/kpi-card.component';
import { BadgeComponent } from '../../../../../shared/components/display/badge/badge.component';
import { AmountDisplayComponent } from '../../../../../shared/components/bills/amount-display/amount-display.component';
import { LoaderComponent } from '../../../../../shared/components/loader/loader.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AlertComponent } from '../../../../../shared/components/display/alert/alert.component';

import { CattleService } from '../../../services/cattle.service';
import {
  AnimalSummary,
  WeightRecord,
  HealthEvent,
  ANIMAL_STATUS_LABELS,
  ANIMAL_STATUS_COLORS,
  HEALTH_EVENT_LABELS,
  HEALTH_EVENT_COLORS,
  SEX_LABELS,
} from '../../../models/cattle.model';

type Tab = 'info' | 'weights' | 'health';

@Component({
  selector: 'app-animal-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    PageHeaderComponent,
    KpiCardComponent,
    BadgeComponent,
    AmountDisplayComponent,
    LoaderComponent,
    EmptyStateComponent,
    AlertComponent,
  ],
  templateUrl: './animal-detail.component.html',
  styleUrl: './animal-detail.component.scss',
})
export class AnimalDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private svc = inject(CattleService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  animalId = +this.route.snapshot.paramMap.get('id')!;
  summary = signal<AnimalSummary | null>(null);
  loading = signal(true);
  activeTab = signal<Tab>('info');

  // Weight form
  showWeightForm = signal(false);
  savingWeight = signal(false);
  weightError = signal('');
  weightForm = this.fb.group({
    weight: [null as number | null, [Validators.required, Validators.min(1)]],
    date: [new Date().toISOString().split('T')[0], [Validators.required]],
    notes: [''],
  });

  statusLabels = ANIMAL_STATUS_LABELS;
  statusColors = ANIMAL_STATUS_COLORS;
  healthEventLabels = HEALTH_EVENT_LABELS;
  healthEventColors = HEALTH_EVENT_COLORS;
  sexLabels = SEX_LABELS;

  ngOnInit(): void {
    this.svc.getAnimalSummary(this.animalId).subscribe({
      next: (r) => {
        if (r.success) this.summary.set(r.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ── Weight registration ────────────────────────────────────────────────────
  submitWeight(): void {
    if (this.weightForm.invalid) {
      this.weightForm.markAllAsTouched();
      return;
    }
    this.savingWeight.set(true);
    this.weightError.set('');

    const v = this.weightForm.value;
    this.svc
      .recordWeight(this.animalId, {
        weight: +v.weight!,
        date: v.date!,
        notes: v.notes ?? '',
      })
      .subscribe({
        next: (r) => {
          this.snack.open(r.message || 'Peso registrado', 'Cerrar', {
            duration: 3000,
          });
          this.showWeightForm.set(false);
          // Refresh summary
          this.svc.getAnimalSummary(this.animalId).subscribe({
            next: (s) => {
              if (s.success) this.summary.set(s.data);
            },
          });
        },
        error: (e) => {
          this.weightError.set(e?.error?.message || 'Error al guardar');
          this.savingWeight.set(false);
        },
      });
  }

  // ── Record death ───────────────────────────────────────────────────────────
  confirmDeath(): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Registrar Muerte',
          message: '¿Registrar la muerte de este animal?',
          confirmText: 'Confirmar',
          type: 'danger',
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) return;
        const date = new Date().toISOString().split('T')[0];
        this.svc.recordDeath(this.animalId, { date }).subscribe({
          next: () => {
            this.snack.open('Muerte registrada', 'Cerrar', { duration: 3000 });
            this.ngOnInit();
          },
          error: (e) =>
            this.snack.open(e?.error?.message || 'Error', 'Cerrar', {
              duration: 3500,
            }),
        });
      });
  }

  formatDate(d?: string | null): string {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  get animal() {
    return this.summary()?.animal;
  }
  get weights(): WeightRecord[] {
    return this.summary()?.weight_history ?? [];
  }
  get healthEvents(): HealthEvent[] {
    return this.summary()?.health_events ?? [];
  }
}
