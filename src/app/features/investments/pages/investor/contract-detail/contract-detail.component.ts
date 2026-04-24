// pages/investor/contract-detail/contract-detail.component.ts

import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SafeDatePipe } from '../../../../../shared/pipes/safe-date.pipe';
import { ContractFacade } from '../../../facades/contract.facade';

// Diálogos de acción (a crear en la siguiente fase)
import { ActivateContractDialogComponent }   from '../../../components/activate-contract-dialog/activate-contract-dialog.component';
import { TerminateContractDialogComponent }  from '../../../components/terminate-contract-dialog/terminate-contract-dialog.component';
import { RenewContractDialogComponent }      from '../../../components/renew-contract-dialog/renew-contract-dialog.component';

import { PageHeaderComponent }   from '../../../../../shared/components/navigation/page-header/page-header.component';
import { LoaderComponent }       from '../../../../../shared/components/feedback/loader/loader.component';
import { AlertComponent }        from '../../../../../shared/components/feedback/alert/alert.component';
import { BadgeColor, BadgeComponent }        from '../../../../../shared/components/ui/badge/badge.component';
import { CONTRACT_STATUS_DISPLAY, CONTRACT_TYPE_DISPLAY } from '../../../models/contract.model';
import { ContractStatus, ContractType } from '../../../models/enums';

@Component({
  selector: 'app-contract-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ContractFacade],
  imports: [
    RouterLink,
    PageHeaderComponent, LoaderComponent, AlertComponent, BadgeComponent,
    SafeDatePipe
],
  templateUrl: './contract-detail.component.html',
  styleUrl:    './contract-detail.component.scss',
})
export class ContractDetailComponent implements OnInit, OnDestroy {
  readonly facade = inject(ContractFacade);
  private  route  = inject(ActivatedRoute);
  private  dialog = inject(MatDialog);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.facade.loadContractDetail(id);
  }

  ngOnDestroy(): void {
    this.facade.resetDetail();
  }

  // ── Acciones con diálogos ──────────────────────────────────

  openActivate(): void {
    const c = this.facade.detail();
    if (!c) return;

    this.dialog.open(ActivateContractDialogComponent, { width: '400px' })
      .afterClosed()
      .subscribe(result => {
        if (result != null) this.facade.activateContract(c.id, result);
      });
  }

  openTerminate(): void {
    const c = this.facade.detail();
    if (!c) return;

    this.dialog.open(TerminateContractDialogComponent, { width: '500px' })
      .afterClosed()
      .subscribe(result => {
        if (result) this.facade.terminateContract(c.id, result);
      });
  }

  openRenew(): void {
    const c = this.facade.detail();
    if (!c) return;

    this.dialog.open(RenewContractDialogComponent, {
      width: '600px',
      data: { contract: c },
    }).afterClosed()
      .subscribe(result => {
        if (result) this.facade.renewContract(c.id, result);
      });
  }

  // ── UI helpers ────────────────────────────────────────────

  getStatusColor(status: ContractStatus): BadgeColor {
    return CONTRACT_STATUS_DISPLAY[status]?.color ?? 'gray';
  }

  getStatusLabel(status: ContractStatus): string {
    return CONTRACT_STATUS_DISPLAY[status]?.label ?? status;
  }

  getTypeColor(type: ContractType): BadgeColor {
    return CONTRACT_TYPE_DISPLAY[type]?.color ?? 'gray';
  }

  getTypeLabel(type: ContractType): string {
    return CONTRACT_TYPE_DISPLAY[type]?.label ?? type;
  }
}