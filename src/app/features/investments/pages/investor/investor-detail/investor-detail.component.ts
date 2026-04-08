// investor-detail.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PageHeaderComponent }   from '../../../../../shared/components/page-header/page-header.component';
import { LoaderComponent }        from '../../../../../shared/components/loader/loader.component';
import { KpiCardComponent }       from '../../../../../shared/components/display/kpi-card/kpi-card.component';
import { BadgeComponent }         from '../../../../../shared/components/display/badge/badge.component';
import { AvatarComponent }        from '../../../../../shared/components/display/avatar/avatar.component';
import { AmountDisplayComponent } from '../../../../../shared/components/bills/amount-display/amount-display.component';
import { AlertComponent }         from '../../../../../shared/components/display/alert/alert.component';
import { EmptyStateComponent }    from '../../../../../shared/components/empty-state/empty-state.component';

import { InvestmentService } from '../../../services/investment.service';
import {
  Investor, InvestorSummary, Investment, CattleOwnership, SaleDecision,
  MOVEMENT_TYPES, SALE_DECISION_TYPES,
} from '../../../models/investment.model';
import { formatCurrency } from '../../../../../core/utils/helpers';
import { CreateContractDialogComponent } from '../../../components/create-contract-dialog/create-contract-dialog.component';

@Component({
  selector: 'app-investor-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatTabsModule, PageHeaderComponent, LoaderComponent, KpiCardComponent, BadgeComponent, AvatarComponent, AmountDisplayComponent, AlertComponent, EmptyStateComponent],
  templateUrl: './investor-detail.component.html',
  styleUrl: './investor-detail.component.scss',
})
export class InvestorDetailComponent implements OnInit {
  private route    = inject(ActivatedRoute);
  private svc      = inject(InvestmentService);
  private dialog   = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  investor    = signal<Investor | null>(null);
  summary     = signal<InvestorSummary | null>(null);
  investments = signal<Investment[]>([]);
  cattle      = signal<CattleOwnership[]>([]);
  decisions   = signal<SaleDecision[]>([]);
  loading     = signal(true);

  formatCurrency = formatCurrency;
  router: any;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadAll(id);
  }

  private loadAll(id: string): void {
    this.loading.set(true);
    this.svc.getInvestor(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.investor.set(res.data);
          this.svc.getInvestorSummary(id).subscribe(r => { if (r.success) this.summary.set(r.data); });
          this.svc.getInvestments({ investor: id }).subscribe(r => { if (r.success) this.investments.set(r.data); });
          this.svc.getCattleOwnerships({ 'investment__investor': id }).subscribe(r => { if (r.success) this.cattle.set(r.data); });
          this.svc.getSaleDecisionsList({ 'investment__investor': id, is_processed: false }).subscribe(r => { if (r.success) this.decisions.set(r.data); });
        }
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.snackBar.open('Error al cargar el inversionista', 'Cerrar', { duration: 3000 }); },
    });
  }

  movementColor(type: string): string {
    return MOVEMENT_TYPES.find(m => m.value === type)?.color ?? 'secondary';
  }

  decisionBadgeColor(type: string): 'success' | 'danger' | 'warning' | 'secondary' {
    const map: Record<string, any> = { reinvest: 'success', withdraw: 'danger', partial: 'warning', pending: 'secondary' };
    return map[type] ?? 'secondary';
  }

  // En investor-detail.component.ts - agregar estos métodos

goToContracts(): void {
  const investor = this.investor();
  if (investor) {
    this.router.navigate(['/investments/contracts'], {
      queryParams: { investor: investor.id },
    });
  }
}

createContract(): void {
  const investor = this.investor();
  if (!investor) return;

  const dialogRef = this.dialog.open(CreateContractDialogComponent, {
    width: '600px',
    data: { investor },
  });

  dialogRef.afterClosed().subscribe((result) => {
    if (result) {
      // Recargar datos para actualizar el estado del contrato
      this.loading.set(true);
    }
  });
}
}