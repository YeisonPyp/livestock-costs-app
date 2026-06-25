// investor-detail.component.ts

import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog } from '@angular/material/dialog';

import { InvestorFacade } from '../../../facades/investor.facade';
import {
  ContractDialogData,
  CreateContractDialogComponent,
} from '../../../components/create-contract-dialog/create-contract-dialog.component';

import { PageHeaderComponent }    from '../../../../../shared/components/navigation/page-header/page-header.component';
import { LoaderComponent }        from '../../../../../shared/components/feedback/loader/loader.component';
import { KpiCardComponent }       from '../../../../../shared/components/data-display/kpi-card/kpi-card.component';
import { BadgeComponent }         from '../../../../../shared/components/ui/badge/badge.component';
import { AvatarComponent }        from '../../../../../shared/components/ui/avatar/avatar.component';
import { AmountDisplayComponent } from '../../../../../shared/components/data-display/amount-display/amount-display.component';
import { AlertComponent }         from '../../../../../shared/components/feedback/alert/alert.component';
import { EmptyStateComponent }    from '../../../../../shared/components/feedback/empty-state/empty-state.component';
import { TableComponent }         from '../../../../../shared/components/data-display/table/table.component';
import { TableColumn, ExportEvent } from '../../../../../shared/components/data-display/table/table.types';

import { formatCurrency, parseDecimal } from '../../../../../core/utils/helpers';

@Component({
  selector: 'app-investor-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [InvestorFacade],
  imports: [
    RouterLink,
    MatTabsModule,
    PageHeaderComponent,
    LoaderComponent,
    KpiCardComponent,
    BadgeComponent,
    AvatarComponent,
    AmountDisplayComponent,
    AlertComponent,
    EmptyStateComponent,
    TableComponent,
  ],
  templateUrl: './investor-detail.component.html',
  styleUrl: './investor-detail.component.scss',
})
export class InvestorDetailComponent implements OnInit, OnDestroy {
  readonly facade = inject(InvestorFacade);
  private route   = inject(ActivatedRoute);
  private dialog  = inject(MatDialog);

  formatCurrency = formatCurrency;
  parseDecimal   = parseDecimal;

  // ══════════════════════════════════════════════════════════════════════════
  // COLUMNAS: INVERSIONES
  // ══════════════════════════════════════════════════════════════════════════

  investmentColumns: TableColumn[] = [
    {
      key: 'startDate',
      label: 'Inicio',
      type: 'date',
      width: '110px',
      sortable: true,
    },
    {
      key: 'initialCapital',
      label: 'Capital Inicial',
      align: 'right',
      width: '150px',
      sortable: true,
      type: 'currency',
    },
    {
      key: 'currentCapital',
      label: 'Capital por Invertir',
      align: 'right',
      width: '150px',
      type: 'currency',
    },
    {
      key: 'totalProfits',
      label: 'Ganancias',
      align: 'right',
      width: '140px',
      type: 'currency',
      cellClass: (_v, row) => {
        const n = parseDecimal(row?.totalProfits ?? 0);
        return n >= 0 ? 'cell-income' : 'cell-expense';
      },
    },
    {
      key: 'roi',
      label: 'ROI',
      align: 'right',
      width: '90px',
      sortable: true,
      format: (v) => {
        const n = parseDecimal(v ?? 0);
        return `${n.toFixed(1)}%`;
      },
      cellClass: (_v, row) => {
        const n = parseDecimal(row?.roi ?? 0);
        return n > 0 ? 'cell-income' : n < 0 ? 'cell-expense' : '';
      },
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'badge',
      align: 'center',
      width: '100px',
      format: (v) => v ?? '—',
      badgeColor: (v) => (v === 'active' ? 'success' : 'default'),
    },
  ];

  // ══════════════════════════════════════════════════════════════════════════
  // COLUMNAS: GANADO
  // ══════════════════════════════════════════════════════════════════════════

  cattleColumns: TableColumn[] = [
    {
      key: 'ownershipType',
      label: 'Tipo',
      width: '100px',
      format: (v) => v ?? '—',
    },
    {
      key: 'animal',
      label: 'Animal / Lote',
      sortable: true,
      format: (_v, row) => row?.animal ?? row?.lot ?? '—',
    },
    {
      key: 'quantity',
      label: 'Cantidad',
      align: 'center',
      width: '90px',
      type: 'number',
    },
    {
      key: 'purchaseValue',
      label: 'Valor Compra',
      align: 'right',
      width: '150px',
      sortable: true,
      type: 'currency',
    },
    {
      key: 'currentValue',
      label: 'Valor Actual',
      align: 'right',
      width: '150px',
      type: 'currency',
    },
    {
      key: 'weightGain',
      label: 'Ganancia Peso',
      align: 'right',
      width: '120px',
      format: (v) => {
        if (!v) return '—';
        const n = parseFloat(String(v));
        return isNaN(n) ? '—' : `${n.toFixed(1)} kg`;
      },
      cellClass: (_v, row) => {
        const n = parseFloat(String(row?.weightGain ?? '0'));
        return n > 0 ? 'cell-gain-positive' : '';
      },
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'badge',
      align: 'center',
      width: '100px',
      format: (v) => v ?? '—',
      badgeColor: (v) => {
        if (v === 'active') return 'success';
        if (v === 'sold')   return 'info';
        return 'default';
      },
    },
  ];

  // ══════════════════════════════════════════════════════════════════════════
  // COLUMNAS: DECISIONES
  // ══════════════════════════════════════════════════════════════════════════

  decisionColumns: TableColumn[] = [
    {
      key: 'id',
      label: 'Venta',
      width: '200px',
      format: (v) => v ? String(v).slice(0, 8).toUpperCase() : '—',
    },
    {
      key: 'investorAmount',
      label: 'Monto',
      align: 'right',
      width: '140px',
      type: 'currency',
      cellClass: 'cell-income',
    },
    {
      key: 'profitLoss',
      label: 'Ganancia / Pérdida',
      align: 'right',
      width: '150px',
      type: 'currency',
      cellClass: (_v, row) => {
        const n = parseDecimal(row?.profitLoss ?? 0);
        return n >= 0 ? 'cell-income' : 'cell-expense';
      },
    },
    {
      key: 'decisionTypeDisplay',
      label: 'Decisión',
      type: 'badge',
      align: 'center',
      width: '140px',
      format: (v) => v ?? '—',
      badgeColor: (_v, row) =>
        this.facade.decisionBadgeColor(row?.decisionType),
    },
    {
      key: 'decisionDeadline',
      label: 'Límite',
      width: '110px',
      type: 'date',
      format: (v) => v ?? '—',
    },
  ];

  // ══════════════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ══════════════════════════════════════════════════════════════════════════

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.facade.loadDetail(id);
  }

  ngOnDestroy(): void {
    this.facade.resetDetail();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ══════════════════════════════════════════════════════════════════════════

  openCreateContractDialog(): void {
    const investor = this.facade.detail();
    if (!investor) return;

    this.dialog
      .open(CreateContractDialogComponent, {
        width: '640px',
        data: { investor } as ContractDialogData,
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.facade.loadDetail(investor.id);
      });
  }

  onExportInvestments(event: ExportEvent): void {
    console.log('Export inversiones:', event.format);
    // TODO: implementar exportación real
  }

  onExportCattle(event: ExportEvent): void {
    console.log('Export ganado:', event.format);
    // TODO: implementar exportación real
  }

  onExportDecisions(event: ExportEvent): void {
    console.log('Export decisiones:', event.format);
    // TODO: implementar exportación real
  }

  onInvestmentRowClick(inv: any): void {
    this.facade.goToInvestment?.(inv.id);
  }

  onDecisionRowClick(decision: any): void {
    this.facade.goToDecision?.(decision.id);
  }
}