import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  ContentChild,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'number' | 'date' | 'currency' | 'badge' | 'custom';
  width?: string;
  align?: 'left' | 'center' | 'right';
  format?: (value: any) => string;
  badgeColor?: (value: any) => string;
}

export interface TableConfig {
  selectable?: boolean;
  searchable?: boolean;
  paginated?: boolean;
  pageSize?: number;
  striped?: boolean;
  hover?: boolean;
  bordered?: boolean;
  compact?: boolean;
  serverPagination?: boolean;
}

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  column: string;
  direction: SortDirection;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_direction?: SortDirection;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
})
export class TableComponent implements OnInit, OnChanges, OnDestroy {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() loading = false;
  @Input() hasActions = false;
  @Input() config: TableConfig = {
    selectable: false,
    searchable: true,
    paginated: true,
    pageSize: 10,
    striped: true,
    hover: true,
    bordered: false,
    compact: false,
    serverPagination: false,
  };
  @Input() emptyMessage = 'No hay datos disponibles';
  @Input() loadingMessage = 'Cargando datos...';

  // ── Paginación servidor ──────────────────────────────────────────────────────
  // Estos inputs se vinculan directamente con la respuesta del backend:
  // pagination.count  → totalItems
  // pagination.total_pages → serverTotalPages
  // pagination.current_page → se puede usar para sincronizar currentPage
  @Input() totalItems = 0;
  @Input() serverTotalPages = 1; // <-- renombrado para no colisionar con la prop interna

  // ── Outputs ─────────────────────────────────────────────────────────────────
  @Output() rowClick = new EventEmitter<any>();
  @Output() sort = new EventEmitter<SortState>();
  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() paginationParamsChange = new EventEmitter<PaginationParams>();
  @Output() searchChange = new EventEmitter<string>();

  /**
   * SOLUCIÓN ACCIONES:
   * En lugar de usar ng-content (que solo se proyecta una vez),
   * el padre provee un TemplateRef con la fila como contexto implícito.
   *
   * Uso en el padre:
   *   <app-table [hasActions]="true" [actionsTemplate]="myActions" ...>
   *   </app-table>
   *
   *   <ng-template #myActions let-row>
   *     <button (click)="edit(row)">Editar</button>
   *     <button (click)="delete(row)">Eliminar</button>
   *   </ng-template>
   */
  @Input() actionsTemplate?: TemplateRef<{ $implicit: any }>;

  // State
  searchTerm = '';
  currentPage = 1;
  sortState: SortState = { column: '', direction: null };
  selectedRows: Set<any> = new Set();
  allSelected = false;

  // Computed
  filteredData: any[] = [];
  paginatedData: any[] = [];

  /**
   * totalPages es SIEMPRE una propiedad interna calculada/delegada.
   * - serverPagination=true  → refleja serverTotalPages (del backend)
   * - serverPagination=false → calculado localmente
   */
  totalPages = 1;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.applyDefaultConfig();
    this.setupSearchDebounce();
    this.updateData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Cuando el backend devuelve nuevos datos o nueva paginación
    if (changes['data']) {
      this.updateData();
    }

    // FIX PAGINACIÓN: sincronizar totalPages desde el backend
    if (changes['serverTotalPages'] && this.config?.serverPagination) {
      this.totalPages = this.serverTotalPages;
      // Si la página actual excede el nuevo total (p.ej. tras búsqueda), resetear
      if (this.currentPage > this.totalPages) {
        this.currentPage = 1;
      }
    }

    if (changes['config']) {
      this.applyDefaultConfig();
      this.updateData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Setup ────────────────────────────────────────────────────────────────────

  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term) => {
        if (this.config.serverPagination) {
          this.currentPage = 1;
          this.emitPaginationParams();
          this.searchChange.emit(term);
        } else {
          this.onSearchLocal();
        }
      });
  }

  applyDefaultConfig(): void {
    this.config = {
      selectable: false,
      searchable: true,
      paginated: true,
      pageSize: 10,
      striped: true,
      hover: true,
      bordered: false,
      compact: false,
      serverPagination: false,
      ...this.config,
    };
  }

  // ── Data ─────────────────────────────────────────────────────────────────────

  private updateData(): void {
    if (this.config.serverPagination) {
      // Con paginación servidor: los datos ya vienen filtrados/paginados
      this.paginatedData = [...this.data];
      this.filteredData = [...this.data];
      // FIX: usar el total de páginas del servidor, no calcularlo localmente
      this.totalPages = this.serverTotalPages;
    } else {
      this.updateFilteredData();
    }
  }

  updateFilteredData(): void {
    let result = [...this.data];

    if (this.searchTerm && this.config.searchable) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter((row) =>
        this.columns.some((col) => {
          const value = row[col.key];
          return value?.toString().toLowerCase().includes(term);
        })
      );
    }

    // Aplicar ordenamiento local
    if (this.sortState.direction && this.sortState.column) {
      result.sort((a, b) => {
        const aVal = a[this.sortState.column];
        const bVal = b[this.sortState.column];
        let comparison = 0;
        if (aVal > bVal) comparison = 1;
        if (aVal < bVal) comparison = -1;
        return this.sortState.direction === 'asc' ? comparison : -comparison;
      });
    }

    this.filteredData = result;
    this.updatePaginationLocal();
  }

  private updatePaginationLocal(): void {
    if (!this.config.paginated) {
      this.paginatedData = this.filteredData;
      this.totalPages = 1;
      return;
    }

    const pageSize = this.config.pageSize || 10;
    // FIX: solo sobreescribir totalPages en modo cliente
    this.totalPages = Math.max(1, Math.ceil(this.filteredData.length / pageSize));

    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    const startIndex = (this.currentPage - 1) * pageSize;
    this.paginatedData = this.filteredData.slice(startIndex, startIndex + pageSize);
  }

  // ── Search ───────────────────────────────────────────────────────────────────

  onSearch(): void {
    // Disparar debounce (maneja ambos modos internamente)
    this.searchSubject.next(this.searchTerm);
  }

  private onSearchLocal(): void {
    this.currentPage = 1;
    this.updateFilteredData();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.onSearch();
  }

  // ── Sort ─────────────────────────────────────────────────────────────────────

  onSortColumn(column: TableColumn): void {
    if (!column.sortable) return;

    if (this.sortState.column === column.key) {
      if (this.sortState.direction === 'asc') {
        this.sortState.direction = 'desc';
      } else if (this.sortState.direction === 'desc') {
        this.sortState.direction = null;
        this.sortState.column = '';
      } else {
        this.sortState.direction = 'asc';
      }
    } else {
      this.sortState.column = column.key;
      this.sortState.direction = 'asc';
    }

    if (this.config.serverPagination) {
      this.currentPage = 1;
      this.emitPaginationParams();
    } else {
      this.updateFilteredData();
    }

    this.sort.emit({ ...this.sortState });
  }

  // ── Row interaction ───────────────────────────────────────────────────────────

  onRowClick(row: any, event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('.table-actions') || target.closest('.checkbox-cell')) return;
    this.rowClick.emit(row);
  }

  toggleRowSelection(row: any, event: Event): void {
    event.stopPropagation();
    if (this.selectedRows.has(row)) {
      this.selectedRows.delete(row);
    } else {
      this.selectedRows.add(row);
    }
    this.updateAllSelectedState();
    this.selectionChange.emit(Array.from(this.selectedRows));
  }

  toggleAllRows(): void {
    if (this.allSelected) {
      this.selectedRows.clear();
    } else {
      this.paginatedData.forEach((row) => this.selectedRows.add(row));
    }
    this.updateAllSelectedState();
    this.selectionChange.emit(Array.from(this.selectedRows));
  }

  private updateAllSelectedState(): void {
    this.allSelected =
      this.paginatedData.length > 0 &&
      this.paginatedData.every((row) => this.selectedRows.has(row));
  }

  isRowSelected(row: any): boolean {
    return this.selectedRows.has(row);
  }

  // ── Pagination ────────────────────────────────────────────────────────────────

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;

    if (this.config.serverPagination) {
      this.emitPaginationParams();
    } else {
      this.updatePaginationLocal();
    }

    this.pageChange.emit(page);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  private emitPaginationParams(): void {
    const params: PaginationParams = {
      page: this.currentPage,
      page_size: this.config.pageSize || 10,
    };
    if (this.searchTerm) params.search = this.searchTerm;
    if (this.sortState.direction && this.sortState.column) {
      params.sort_by = this.sortState.column;
      params.sort_direction = this.sortState.direction;
    }
    this.paginationParamsChange.emit(params);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;

    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    } else if (this.currentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push(-1);
      pages.push(this.totalPages);
    } else if (this.currentPage >= this.totalPages - 2) {
      pages.push(1);
      pages.push(-1);
      for (let i = this.totalPages - 3; i <= this.totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push(-1);
      for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) pages.push(i);
      pages.push(-1);
      pages.push(this.totalPages);
    }

    return pages;
  }

  // ── Getters ───────────────────────────────────────────────────────────────────

  get showingFrom(): number {
    if (this.displayedTotal === 0) return 0;
    return (this.currentPage - 1) * (this.config.pageSize || 10) + 1;
  }

  get showingTo(): number {
    const to = this.currentPage * (this.config.pageSize || 10);
    return Math.min(to, this.displayedTotal);
  }

  get displayedTotal(): number {
    return this.config.serverPagination ? this.totalItems : this.filteredData.length;
  }

  // ── Format ────────────────────────────────────────────────────────────────────

  formatCellValue(column: TableColumn, value: any): string {
    if (column.format) return column.format(value);

    switch (column.type) {
      case 'currency':
        return new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
        }).format(value || 0);
      case 'number':
        return new Intl.NumberFormat('es-CO').format(value || 0);
      case 'date':
        return value ? new Date(value).toLocaleDateString('es-CO') : '-';
      default:
        return value?.toString() || '-';
    }
  }

  getBadgeColor(column: TableColumn, value: any): string {
    if (column.badgeColor) return column.badgeColor(value);
    return 'default';
  }
}