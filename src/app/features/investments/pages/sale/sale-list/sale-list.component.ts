import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { SaleFacade } from '../../../facades/sale.facade';
import { PageHeaderComponent } from '../../../../../shared/components/navigation/page-header/page-header.component';
import { LoaderComponent } from '../../../../../shared/components/feedback/loader/loader.component';
import { EmptyStateComponent } from '../../../../../shared/components/feedback/empty-state/empty-state.component';
import { BadgeComponent } from '../../../../../shared/components/ui/badge/badge.component';
import { AmountDisplayComponent } from '../../../../../shared/components/data-display/amount-display/amount-display.component';
import { SaleCreateDrawerComponent } from '../../../components/sale-create-drawer/sale-create-drawer.component';
import { SaleStatsComponent } from '../../../components/sale-stats/sale-stats.component';
import {
  TableComponent,
  TableColumn,
  TableConfig,
  PaginationParams,
} from '../../../../../shared/components/data-display/table/table.component';
import { ExportReportModalComponent } from '../../../../../shared/components/overlays/export-report-modal/export-report-modal.component';
import {
  ExportReportPayload,
  ExportReportConfig,
} from '../../../../../shared/components/overlays/export-report-modal/export-report-modal.types';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-sale-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SaleFacade],
  imports: [
    RouterLink,
    PageHeaderComponent,
    LoaderComponent,
    EmptyStateComponent,
    BadgeComponent,
    AmountDisplayComponent,
    SaleCreateDrawerComponent,
    SaleStatsComponent,
    TableComponent,
    ExportReportModalComponent,
  ],
  templateUrl: './sale-list.component.html',
  styleUrl: './sale-list.component.scss',
})
export class SaleListComponent implements OnInit {
  readonly facade = inject(SaleFacade);

  // ── Search debounce ───────────────────────────────────────────────────
  private search$ = new Subject<string>();

  // ── Table config ──────────────────────────────────────────────────────
  tableConfig: TableConfig = {
    searchable: false,
    paginated: true,
    serverPagination: true,
    pageSize: 10,
    striped: true,
    hover: true,
  };

  columns: TableColumn[] = [
    { key: 'saleDate', label: 'Fecha', sortable: true, type: 'date' },
    { key: 'description', label: 'Descripción' },
    { key: 'buyerName', label: 'Comprador' },
    {
      key: 'totalHeads',
      label: 'Cabezas',
      type: 'number',
      align: 'center',
    },
    {
      key: 'totalWeight',
      label: 'Peso (kg)',
      type: 'number',
      align: 'center',
    },
    {
      key: 'pricePerKg',
      label: '$/kg',
      type: 'currency',
      align: 'center',
    },
    {
      key: 'netAmount',
      label: 'Monto Neto',
      type: 'currency',
      align: 'right',
    },
  ];

  // ── Export config ─────────────────────────────────────────────────────
  showExport = this.facade.showDrawer; // reutilizar signal pattern
  showExportModal = false;

  readonly exportConfig: ExportReportConfig = {
    title: 'Exportar Reporte de Ventas',
    subtitle: 'Seleccione el rango de fechas o exporte toda la información.',
    showExcel: true,
    showPdf: true,
    allDataLabel: 'Traer toda la información',
  };

  // ── Lifecycle ─────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.facade.loadInitialData();

    this.search$
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((term) => {
        this.facade.applySearch(term);
      });
  }

  // ── Filter events ─────────────────────────────────────────────────────

  onSearchChange(value: string): void {
    this.search$.next(value);
  }

  onStatusFilterChange(value: '' | 'false' | 'true'): void {
    this.facade.applyFilter(value);
  }

  clearFilters(): void {
    this.facade.clearFilters();
  }

  // ── Table events ──────────────────────────────────────────────────────

  onPaginationParamsChange(params: PaginationParams): void {
    if (params.page) {
      this.facade.goToPage(params.page);
    }
  }

  onRowClick(sale: any): void {
    this.facade.navigateToDetail(sale.id);
  }

  // ── Export ────────────────────────────────────────────────────────────

  onExport(payload: ExportReportPayload): void {
    console.log('Export ventas:', payload);
    // TODO: implementar servicio de exportación
  }
}