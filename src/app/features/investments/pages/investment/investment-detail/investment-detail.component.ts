// investment-detail.component.ts

import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject
} from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule } from '@angular/forms';

import { InvestmentFacade } from '../../../facades/investment.facade';
import { CapitalOperationPanelComponent } from '../../../components/capital-operation-panel/capital-operation-panel.component';
import { CloseInvestmentDialogComponent } from '../../../components/close-investment-dialog/close-investment-dialog.component';

import { PageHeaderComponent }    from '../../../../../shared/components/navigation/page-header/page-header.component';
import { LoaderComponent }        from '../../../../../shared/components/feedback/loader/loader.component';
import { EmptyStateComponent }    from '../../../../../shared/components/feedback/empty-state/empty-state.component';
import { AlertComponent }         from '../../../../../shared/components/feedback/alert/alert.component';
import { BadgeComponent }         from '../../../../../shared/components/ui/badge/badge.component';
import { KpiCardComponent }       from '../../../../../shared/components/data-display/kpi-card/kpi-card.component';
import { AmountDisplayComponent } from '../../../../../shared/components/data-display/amount-display/amount-display.component';
import { ButtonComponent }        from '../../../../../shared/components/ui/button/button.component';
import { ModalComponent }         from '../../../../../shared/components/overlays/modal/modal.component';
import { TableComponent }         from '../../../../../shared/components/data-display/table/table.component';
import { TableColumn, ExportEvent } from '../../../../../shared/components/data-display/table/table.types';

import { InvestmentMovementType } from '../../../models/enums';
import type { ContributionPayload, WithdrawalPayload } from '../../../models/investment.model';
import { SafeDatePipe } from '../../../../../shared/pipes/safe-date.pipe';

@Component({
  selector: 'app-investment-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [InvestmentFacade],
  imports: [
    RouterLink, MatTabsModule, FormsModule,
    PageHeaderComponent, LoaderComponent, EmptyStateComponent,
    AlertComponent, BadgeComponent, KpiCardComponent,
    AmountDisplayComponent, ButtonComponent, ModalComponent,
    CapitalOperationPanelComponent, CloseInvestmentDialogComponent,
    TableComponent,
    SafeDatePipe,
  ],
  templateUrl: './investment-detail.component.html',
  styleUrl: './investment-detail.component.scss',
})
export class InvestmentDetailComponent implements OnInit, OnDestroy {
  readonly facade = inject(InvestmentFacade);
  private  route  = inject(ActivatedRoute);

  // ══════════════════════════════════════════════════════════════════════════
  // MOVEMENT TYPE OPTIONS
  // ══════════════════════════════════════════════════════════════════════════

  readonly movementTypeOptions = [
    { value: '',                                  label: 'Todos los tipos'  },
    { value: InvestmentMovementType.CONTRIBUTION, label: 'Aporte'           },
    { value: InvestmentMovementType.WITHDRAWAL,   label: 'Retiro'           },
    { value: InvestmentMovementType.SALE_PROFIT,  label: 'Ganancia venta'   },
    { value: InvestmentMovementType.SALE_LOSS,    label: 'Pérdida venta'    },
    { value: InvestmentMovementType.COST_SHARE,   label: 'Costos'           },
    { value: InvestmentMovementType.ADJUSTMENT,   label: 'Ajuste'           },
  ];

  // ══════════════════════════════════════════════════════════════════════════
  // COLUMNAS: MOVIMIENTOS
  // ══════════════════════════════════════════════════════════════════════════

  movementColumns: TableColumn[] = [
    {
      key: 'effectiveDate',
      label: 'Fecha',
      width: '110px',
      type: 'date',
    },
    {
      key: 'movementTypeDisplay',
      label: 'Tipo',
      width: '140px',
      type: 'badge',
      format: (v) => v ?? '—',
      badgeColor: (_v, row) => row?.isCredit ? 'success' : 'danger',
    },
    {
      key: 'description',
      label: 'Descripción',
      format: (v) => v || '—',
    },
    {
      key: 'amount',
      label: 'Monto',
      align: 'right',
      width: '140px',
      type: 'currency',
      cellClass: (_v, row) => row?.isCredit ? 'cell-income' : 'cell-expense',
    },
    {
      key: 'balanceAfter',
      label: 'Saldo',
      align: 'right',
      width: '140px',
      type: 'currency',
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
      width: '140px',
      type: 'currency',
    },
    {
      key: 'currentValue',
      label: 'Valor Actual',
      align: 'right',
      width: '140px',
      type: 'currency',
    },
    {
      key: 'weightGain',
      label: 'Ganancia Peso',
      align: 'right',
      width: '120px',
      format: (v) => {
        if (!v) return '—';
        const n = parseFloat(v);
        return isNaN(n) ? '—' : `${n.toFixed(1)} kg`;
      },
      cellClass: (_v, row) => {
        const val = parseFloat(row?.weightGain ?? '0');
        return val > 0 ? 'cell-gain-positive' : '';
      },
    },
    {
      key: 'status',
      label: 'Estado',
      align: 'center',
      width: '100px',
      type: 'badge',
      format: (v) => v ?? '—',
      badgeColor: (v) => {
        if (v === 'active') return 'success';
        if (v === 'sold')   return 'info';
        return 'default';
      },
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
  // EVENTS
  // ══════════════════════════════════════════════════════════════════════════

  onContribute(payload: ContributionPayload): void {
    this.facade.submitContribute(payload);
  }

  onWithdraw(payload: WithdrawalPayload): void {
    this.facade.submitWithdraw(payload);
  }

  onExportMovements(event: ExportEvent): void {
    console.log('Export movimientos:', event.format);
    // TODO: implementar exportación real
  }

  onExportCattle(event: ExportEvent): void {
    console.log('Export ganado:', event.format);
    // TODO: implementar exportación real
  }
}