// facades/reports.facade.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import { forkJoin, finalize } from 'rxjs';

import { InvestmentReportsService } from '../services/reports.service';
import { NotificationService }      from '../../../core/services/notification.service';

import type { ParticipationReport, CattleOwnerReport } from '../models';
import { parseDecimal } from '../../../core/utils/helpers';

export interface ReportTotals {
  totalCapital: number;
  totalProfits: number;
  totalCattle:  number;
  avgRoi:       number;
}

@Injectable()
export class ReportsFacade {
  private readonly reportsSvc = inject(InvestmentReportsService);
  private readonly notify     = inject(NotificationService);

  readonly participation  = signal<ParticipationReport[]>([]);
  readonly cattleOwners   = signal<CattleOwnerReport[]>([]);
  readonly loading        = signal(true);

  readonly totals = computed<ReportTotals>(() => {
    const data = this.participation();
    const totalCapital = data.reduce((s, r) => s + parseDecimal(r.totalCapital), 0);
    return {
      totalCapital,
      totalProfits: data.reduce((s, r) => s + parseDecimal(r.participationPercentage), 0),
      totalCattle:  0, // viene de cattleOwners
      avgRoi:       data.length
        ? data.reduce((s, r) => s + parseDecimal(r.participationPercentage), 0) / data.length
        : 0,
    };
  });

  loadAll(): void {
    this.loading.set(true);
    forkJoin({
      participation: this.reportsSvc.getParticipationReport(),
      cattle:        this.reportsSvc.getCattleOwnersReport(),
    }).pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ participation, cattle }) => {
          this.participation.set(participation.data);
          this.cattleOwners.set(cattle.data);
        },
        error: () => this.notify.error('Error al cargar reportes'),
      });
  }

  participationPct(capital: string | number): number {
    const total = this.totals().totalCapital;
    return total > 0 ? (parseDecimal(capital) / total) * 100 : 0;
  }
}