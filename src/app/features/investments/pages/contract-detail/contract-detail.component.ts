// modules/investments/pages/contract-detail/contract-detail.component.ts

import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, finalize } from 'rxjs';

import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { BadgeComponent } from '../../../../shared/components/display/badge/badge.component';
import { AlertComponent } from '../../../../shared/components/display/alert/alert.component';
import { AmountDisplayComponent } from '../../../../shared/components/bills/amount-display/amount-display.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

import { ContractService } from '../../services/contract.service';
import { InvestorContract, getStatusColor, getTypeColor } from '../../models/contract.model';
import { CreateContractDialogComponent } from '../../components/create-contract-dialog/create-contract-dialog.component';
// import { TerminateContractDialogComponent } from '../../components/terminate-contract-dialog/terminate-contract-dialog.component';
// import { RenewContractDialogComponent } from '../../components/renew-contract-dialog/renew-contract-dialog.component';
// import { ActivateContractDialogComponent } from '../../components/activate-contract-dialog/activate-contract-dialog.component';

@Component({
  selector: 'app-contract-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PageHeaderComponent,
    LoaderComponent,
    BadgeComponent,
    AlertComponent,
    AmountDisplayComponent,
  ],
  templateUrl: './contract-detail.component.html',
  styleUrl: './contract-detail.component.scss',
})
export class ContractDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private contractService = inject(ContractService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // Estado
  loading = signal(true);
  actionLoading = signal(false);
  contract = signal<InvestorContract | null>(null);

  // Cleanup
  private destroy$ = new Subject<void>();

  // Helpers
  getStatusColor = getStatusColor;
  getTypeColor = getTypeColor;

  // Computed
  canActivate = computed(() => {
    const c = this.contract();
    return c && (c.status === 'draft' || c.status === 'pending_signature');
  });

  canTerminate = computed(() => {
    const c = this.contract();
    return c && c.status === 'active';
  });

  canRenew = computed(() => {
    const c = this.contract();
    return c && (c.status === 'active' || c.status === 'expired');
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadContract(id);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadContract(id: string): void {
    this.loading.set(true);

    this.contractService.getContract(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.contract.set(res.data);
          }
        },
        error: () => {
          this.snackBar.open('Error al cargar el contrato', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/investments/contracts']);
        },
      });
  }

  // ────────────────────────────────────────────
  // ACCIONES
  // ────────────────────────────────────────────

  downloadContract(): void {
    const contract = this.contract();
    if (!contract) return;

    this.contractService.downloadContract(contract.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${contract.contract_number}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Contrato descargado', 'Cerrar', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('Error al descargar el contrato', 'Cerrar', { duration: 3000 });
      },
    });
  }

  activateContract(): void {
    const contract = this.contract();
    if (!contract) return;

    const dialogRef = this.dialog.open(CreateContractDialogComponent, {
      width: '400px',
      data: { contract },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.actionLoading.set(true);
        this.contractService.activateContract(contract.id, result)
          .pipe(finalize(() => this.actionLoading.set(false)))
          .subscribe({
            next: (res) => {
              if (res.success) {
                this.contract.set(res.data);
                this.snackBar.open('Contrato activado exitosamente', 'Cerrar', { duration: 3000 });
              }
            },
            error: () => {
              this.snackBar.open('Error al activar el contrato', 'Cerrar', { duration: 3000 });
            },
          });
      }
    });
  }

  terminateContract(): void {
    const contract = this.contract();
    if (!contract) return;

    const dialogRef = this.dialog.open(CreateContractDialogComponent, {
      width: '500px',
      data: { contract },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.actionLoading.set(true);
        this.contractService.terminateContract(contract.id, result)
          .pipe(finalize(() => this.actionLoading.set(false)))
          .subscribe({
            next: (res) => {
              if (res.success) {
                this.contract.set(res.data);
                this.snackBar.open('Contrato terminado', 'Cerrar', { duration: 3000 });
              }
            },
            error: () => {
              this.snackBar.open('Error al terminar el contrato', 'Cerrar', { duration: 3000 });
            },
          });
      }
    });
  }

  renewContract(): void {
    const contract = this.contract();
    if (!contract) return;

    const dialogRef = this.dialog.open(CreateContractDialogComponent, {
      width: '600px',
      data: { contract },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.actionLoading.set(true);
        this.contractService.renewContract(contract.id, result)
          .pipe(finalize(() => this.actionLoading.set(false)))
          .subscribe({
            next: (res) => {
              if (res.success) {
                this.snackBar.open('Contrato renovado exitosamente', 'Cerrar', { duration: 3000 });
                // Navegar al nuevo contrato
                this.router.navigate(['/investments/contracts', res.data.id]);
              }
            },
            error: () => {
              this.snackBar.open('Error al renovar el contrato', 'Cerrar', { duration: 3000 });
            },
          });
      }
    });
  }

  goToInvestor(): void {
    const contract = this.contract();
    if (contract) {
      this.router.navigate(['/investments/investors', contract.investor]);
    }
  }

  goBack(): void {
    this.router.navigate(['/investments/contracts']);
  }
}