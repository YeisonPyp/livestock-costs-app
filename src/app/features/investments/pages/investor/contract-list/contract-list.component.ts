// modules/investments/pages/contract-list/contract-list.component.ts

import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, debounceTime, takeUntil, finalize } from 'rxjs';

import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { LoaderComponent } from '../../../../../shared/components/loader/loader.component';
import { BadgeComponent } from '../../../../../shared/components/display/badge/badge.component';
import { EmptyStateComponent } from '../../../../../shared/components/empty-state/empty-state.component';
import { AlertComponent } from '../../../../../shared/components/display/alert/alert.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';

import { ContractService, ContractFilters } from '../../../services/contract.service';
import { InvestorService } from '../../../services';
import {
  ContractListItem,
  CONTRACT_STATUS_OPTIONS,
  CONTRACT_TYPE_OPTIONS,
  getStatusColor,
  getTypeColor,
} from '../../../models/contract.model';
import { Investor } from '../../../models/investment.model';

type ViewMode = 'all' | 'active' | 'expiring' | 'expired';

@Component({
  selector: 'app-contract-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    PageHeaderComponent,
    LoaderComponent,
    BadgeComponent,
    EmptyStateComponent,
    AlertComponent,
  ],
  templateUrl: './contract-list.component.html',
  styleUrl: './contract-list.component.scss',
})
export class ContractListComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private contractService = inject(ContractService);
  private investorService = inject(InvestorService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // Estado
  loading = signal(true);
  contracts = signal<ContractListItem[]>([]);
  investors = signal<Investor[]>([]);
  viewMode = signal<ViewMode>('all');
  investorFilter = signal<string | null>(null);

  // Filtros
  filterForm = new FormGroup({
    search: new FormControl(''),
    status: new FormControl(''),
    contract_type: new FormControl(''),
    investor: new FormControl(''),
  });

  // Constantes para el template
  statusOptions = CONTRACT_STATUS_OPTIONS;
  typeOptions = CONTRACT_TYPE_OPTIONS;
  getStatusColor = getStatusColor;
  getTypeColor = getTypeColor;

  // Cleanup
  private destroy$ = new Subject<void>();

  // Computed
  filteredContracts = computed(() => {
    const list = this.contracts();
    const search = this.filterForm.value.search?.toLowerCase() ?? '';
    
    if (!search) return list;
    
    return list.filter(c =>
      c.contract_number.toLowerCase().includes(search) ||
      c.investor_name.toLowerCase().includes(search) ||
      c.investor_code.toLowerCase().includes(search)
    );
  });

  pageTitle = computed(() => {
    const investor = this.investorFilter();
    if (investor) {
      const inv = this.investors().find(i => i.id === investor);
      return inv ? `Contratos de ${inv.full_name}` : 'Contratos';
    }
    return 'Contratos de Inversionistas';
  });

  // Stats
  stats = computed(() => {
    const list = this.contracts();
    return {
      total: list.length,
      active: list.filter(c => c.status === 'active').length,
      expiring: list.filter(c => c.expires_soon).length,
      expired: list.filter(c => c.status === 'expired').length,
    };
  });

  ngOnInit(): void {
    // Verificar si viene de un inversionista específico
    const investorId = this.route.snapshot.queryParamMap.get('investor');
    if (investorId) {
      this.investorFilter.set(investorId);
      this.filterForm.patchValue({ investor: investorId });
    }

    this.loadInvestors();
    this.loadContracts();
    this.setupFilterListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInvestors(): void {
    this.investorService.getAll({ is_active: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.investors.set(res.data);
          }
        },
      });
  }

  private loadContracts(): void {
    this.loading.set(true);

    const filters: ContractFilters = {};
    const formValue = this.filterForm.value;

    if (formValue.status) filters.status = formValue.status;
    if (formValue.contract_type) filters.contract_type = formValue.contract_type;
    if (formValue.investor) filters.investor = formValue.investor;

    // Determinar qué endpoint usar según el modo de vista
    let request$;
    switch (this.viewMode()) {
      case 'active':
        request$ = this.contractService.getActiveContracts();
        break;
      case 'expiring':
        request$ = this.contractService.getExpiringContracts(30);
        break;
      case 'expired':
        request$ = this.contractService.getExpiredContracts();
        break;
      default:
        request$ = this.contractService.getContracts(filters);
    }

    request$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.contracts.set(res.data);
          }
        },
        error: () => {
          this.snackBar.open('Error al cargar contratos', 'Cerrar', { duration: 3000 });
        },
      });
  }

  private setupFilterListener(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.viewMode.set('all');
        this.loadContracts();
      });
  }

  // ────────────────────────────────────────────
  // ACCIONES
  // ────────────────────────────────────────────

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
    this.filterForm.reset();
    this.loadContracts();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.investorFilter.set(null);
    this.viewMode.set('all');
    this.loadContracts();
    
    // Limpiar query params
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
    });
  }

  viewContract(contract: ContractListItem): void {
    this.router.navigate(['/investments/contracts', contract.id]);
  }

  createContract(): void {
    const investorId = this.investorFilter();
    if (investorId) {
      this.router.navigate(['/investments/contracts/new'], {
        queryParams: { investor: investorId },
      });
    } else {
      this.router.navigate(['/investments/contracts/new']);
    }
  }

  downloadContract(contract: ContractListItem, event: Event): void {
    event.stopPropagation();
    
    this.contractService.downloadContract(contract.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${contract.contract_number}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.snackBar.open('Error al descargar el contrato', 'Cerrar', { duration: 3000 });
      },
    });
  }

  refresh(): void {
    this.loadContracts();
  }
}