// table.component.ts

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  TemplateRef,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import {
  TableColumn,
  TableConfig,
  SortState,
  SortDirection,
  PaginationParams,
  ExportEvent,
  DEFAULT_TABLE_CONFIG,
} from './table.types';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
})
export class TableComponent implements OnInit, OnChanges, OnDestroy {
  
  // ══════════════════════════════════════════════════════════════════════════════
  // INPUTS
  // ══════════════════════════════════════════════════════════════════════════════
  
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() loading = false;
  @Input() hasActions = false;
  @Input() actionsTemplate?: TemplateRef<{ $implicit: any }>;
  @Input() config: TableConfig = {};
  @Input() emptyMessage = 'No hay datos disponibles';
  @Input() emptyIcon: 'table' | 'search' | 'filter' = 'table';
  @Input() loadingMessage = 'Cargando datos...';
  
  // Paginación servidor
  @Input() totalItems = 0;
  @Input() serverTotalPages = 1;
  
  // ══════════════════════════════════════════════════════════════════════════════
  // OUTPUTS
  // ══════════════════════════════════════════════════════════════════════════════
  
  @Output() rowClick = new EventEmitter<any>();
  @Output() sort = new EventEmitter<SortState>();
  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() paginationParamsChange = new EventEmitter<PaginationParams>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() exportData = new EventEmitter<ExportEvent>();
  
  // ══════════════════════════════════════════════════════════════════════════════
  // STATE
  // ══════════════════════════════════════════════════════════════════════════════
  
  searchTerm = '';
  currentPage = 1;
  sortState: SortState = { column: '', direction: null };
  selectedRows = new Set<any>();
  allSelected = false;
  
  // Computed data
  filteredData: any[] = [];
  paginatedData: any[] = [];
  totalPages = 1;
  
  // Resolved config (with defaults applied)
  cfg!: Required<TableConfig>;
  
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  
  // ══════════════════════════════════════════════════════════════════════════════
  // COMPUTED
  // ══════════════════════════════════════════════════════════════════════════════
  
  get visibleColumns(): TableColumn[] {
    return this.columns.filter(c => c.visible !== false);
  }
  
  get totalColspan(): number {
    let count = this.visibleColumns.length;
    if (this.cfg.selectable) count++;
    if (this.hasActions) count++;
    return count;
  }
  
  get showingFrom(): number {
    if (this.displayedTotal === 0) return 0;
    return (this.currentPage - 1) * this.cfg.pageSize + 1;
  }
  
  get showingTo(): number {
    const to = this.currentPage * this.cfg.pageSize;
    return Math.min(to, this.displayedTotal);
  }
  
  get displayedTotal(): number {
    return this.cfg.serverPagination
      ? this.totalItems
      : this.filteredData.length;
  }
  
  get showHeader(): boolean {
    return this.cfg.searchable || this.cfg.exportable || true;
  }
  
  get showFooter(): boolean {
    return this.cfg.paginated && !this.loading && this.displayedTotal > 0;
  }
  
  get hasSelectedRows(): boolean {
    return this.selectedRows.size > 0;
  }
  
  get selectedCount(): number {
    return this.selectedRows.size;
  }
  
  get showExportExcel(): boolean {
    return this.cfg.exportable && this.cfg.exportFormats.includes('excel');
  }
  
  get showExportPdf(): boolean {
    return this.cfg.exportable && this.cfg.exportFormats.includes('pdf');
  }
  
  // ══════════════════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ══════════════════════════════════════════════════════════════════════════════
  
  ngOnInit(): void {
    this.resolveConfig();
    this.setupSearchDebounce();
    this.updateData();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config']) {
      this.resolveConfig();
    }
    
    if (changes['data']) {
      this.updateData();
    }
    
    if (changes['serverTotalPages'] && this.cfg?.serverPagination) {
      this.totalPages = this.serverTotalPages;
      if (this.currentPage > this.totalPages) {
        this.currentPage = 1;
      }
    }
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  // ══════════════════════════════════════════════════════════════════════════════
  // CONFIG
  // ══════════════════════════════════════════════════════════════════════════════
  
  private resolveConfig(): void {
    this.cfg = { ...DEFAULT_TABLE_CONFIG, ...this.config } as Required<TableConfig>;
  }
  
  // ══════════════════════════════════════════════════════════════════════════════
  // SEARCH
  // ══════════════════════════════════════════════════════════════════════════════
  
  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(term => {
        if (this.cfg.serverPagination) {
          this.currentPage = 1;
          this.emitPaginationParams();
          this.searchChange.emit(term);
        } else {
          this.currentPage = 1;
          this.updateFilteredData();
        }
      });
  }
  
  onSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }
  
  clearSearch(): void {
    this.searchTerm = '';
    this.onSearch();
  }
  
  // ══════════════════════════════════════════════════════════════════════════════
  // DATA
  // ══════════════════════════════════════════════════════════════════════════════
  
  private updateData(): void {
    if (this.cfg?.serverPagination) {
      this.paginatedData = [...this.data];
      this.filteredData = [...this.data];
      this.totalPages = this.serverTotalPages;
    } else {
      this.updateFilteredData();
    }
  }
  
  private updateFilteredData(): void {
    let result = [...this.data];
    
    // Búsqueda local
    if (this.searchTerm && this.cfg.searchable) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(row =>
        this.visibleColumns.some(col => {
          const value = this.resolveNestedKey(row, col.key);
          return value?.toString().toLowerCase().includes(term);
        })
      );
    }
    
    // Ordenamiento local
    if (this.sortState.direction && this.sortState.column) {
      result.sort((a, b) => {
        const aVal = this.resolveNestedKey(a, this.sortState.column);
        const bVal = this.resolveNestedKey(b, this.sortState.column);
        let cmp = 0;
        
        if (aVal == null && bVal == null) cmp = 0;
        else if (aVal == null) cmp = -1;
        else if (bVal == null) cmp = 1;
        else if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
        else cmp = String(aVal).localeCompare(String(bVal), 'es', { numeric: true });
        
        return this.sortState.direction === 'asc' ? cmp : -cmp;
      });
    }
    
    this.filteredData = result;
    this.updatePaginationLocal();
  }
  
  private updatePaginationLocal(): void {
    if (!this.cfg.paginated) {
      this.paginatedData = this.filteredData;
      this.totalPages = 1;
      return;
    }
    
    const pageSize = this.cfg.pageSize;
    this.totalPages = Math.max(1, Math.ceil(this.filteredData.length / pageSize));
    
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    if (this.currentPage < 1) this.currentPage = 1;
    
    const start = (this.currentPage - 1) * pageSize;
    this.paginatedData = this.filteredData.slice(start, start + pageSize);
  }
  
  /**
   * Resuelve claves anidadas tipo 'investment.investor.code'
   */
  private resolveNestedKey(obj: any, key: string): any {
    return key.split('.').reduce((o, k) => o?.[k], obj);
  }
  
  // ══════════════════════════════════════════════════════════════════════════════
  // SORT
  // ══════════════════════════════════════════════════════════════════════════════
  
  onSortColumn(column: TableColumn): void {
    if (!column.sortable) return;
    
    if (this.sortState.column === column.key) {
      // Ciclo: asc → desc → null
      if (this.sortState.direction === 'asc') this.sortState.direction = 'desc';
      else if (this.sortState.direction === 'desc') {
        this.sortState.direction = null;
        this.sortState.column = '';
      } else {
        this.sortState.direction = 'asc';
      }
    } else {
      this.sortState.column = column.key;
      this.sortState.direction = 'asc';
    }
    
    if (this.cfg.serverPagination) {
      this.currentPage = 1;
      this.emitPaginationParams();
    } else {
      this.updateFilteredData();
    }
    
    this.sort.emit({ ...this.sortState });
  }
  
  // ══════════════════════════════════════════════════════════════════════════════
  // SELECTION
  // ══════════════════════════════════════════════════════════════════════════════
  
  onRowClick(row: any, event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('.table-actions') || target.closest('.checkbox-cell') || target.closest('a'))
      return;
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
      this.paginatedData.forEach(row => this.selectedRows.add(row));
    }
    this.updateAllSelectedState();
    this.selectionChange.emit(Array.from(this.selectedRows));
  }
  
  private updateAllSelectedState(): void {
    this.allSelected =
      this.paginatedData.length > 0 &&
      this.paginatedData.every(row => this.selectedRows.has(row));
  }
  
  isRowSelected(row: any): boolean {
    return this.selectedRows.has(row);
  }
  
  clearSelection(): void {
    this.selectedRows.clear();
    this.allSelected = false;
    this.selectionChange.emit([]);
  }
  
  // ══════════════════════════════════════════════════════════════════════════════
  // PAGINATION
  // ══════════════════════════════════════════════════════════════════════════════
  
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    
    if (this.cfg.serverPagination) {
      this.emitPaginationParams();
    } else {
      this.updatePaginationLocal();
    }
    
    this.pageChange.emit(page);
  }
  
  nextPage(): void { this.goToPage(this.currentPage + 1); }
  previousPage(): void { this.goToPage(this.currentPage - 1); }
  firstPage(): void { this.goToPage(1); }
  lastPage(): void { this.goToPage(this.totalPages); }
  
  onPageSizeChange(newSize: number): void {
    this.cfg.pageSize = newSize;
    this.currentPage = 1;
    
    if (this.cfg.serverPagination) {
      this.emitPaginationParams();
    } else {
      this.updatePaginationLocal();
    }
    
    this.pageSizeChange.emit(newSize);
  }
  
  private emitPaginationParams(): void {
    const params: PaginationParams = {
      page: this.currentPage,
      page_size: this.cfg.pageSize,
    };
    if (this.searchTerm) params.search = this.searchTerm;
    if (this.sortState.direction && this.sortState.column) {
      params.sort_by = this.sortState.column;
      params.sort_direction = this.sortState.direction;
    }
    this.paginationParamsChange.emit(params);
  }
  
  getPageNumbers(): (number | null)[] {
    const pages: (number | null)[] = [];
    const total = this.totalPages;
    const current = this.currentPage;
    const maxVisible = 5;
    
    if (total <= maxVisible + 2) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else if (current <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push(null); // ellipsis
      pages.push(total);
    } else if (current >= total - 2) {
      pages.push(1);
      pages.push(null);
      for (let i = total - 3; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push(null);
      for (let i = current - 1; i <= current + 1; i++) pages.push(i);
      pages.push(null);
      pages.push(total);
    }
    
    return pages;
  }
  
  // ══════════════════════════════════════════════════════════════════════════════
  // EXPORT
  // ══════════════════════════════════════════════════════════════════════════════
  
  onExport(format: 'excel' | 'pdf'): void {
    this.exportData.emit({
      format,
      columns: this.visibleColumns,
      data: this.cfg.serverPagination ? this.data : this.filteredData,
      fileName: this.cfg.exportFileName,
      filters: {
        search: this.searchTerm || undefined,
        sort: this.sortState.direction ? { ...this.sortState } : undefined,
      },
      isServerPaginated: this.cfg.serverPagination,
    });
  }
  
  // ══════════════════════════════════════════════════════════════════════════════
  // FORMATTERS
  // ══════════════════════════════════════════════════════════════════════════════
  
  formatCellValue(column: TableColumn, value: any, row?: any): string {
    if (column.format) return column.format(value, row);
    
    switch (column.type) {
      case 'currency':
        return new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          maximumFractionDigits: 0,
        }).format(value || 0);
      
      case 'number':
        return new Intl.NumberFormat('es-CO').format(value || 0);
      
      case 'date':
        if (!value) return '—';
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
          const [y, m, d] = value.split('-').map(Number);
          return new Date(y, m - 1, d).toLocaleDateString('es-CO');
        }
        return new Date(value).toLocaleDateString('es-CO');
      
      default:
        return value?.toString() || '—';
    }
  }
  
  getBadgeColor(column: TableColumn, value: any, row?: any): string {
    if (column.badgeColor) return column.badgeColor(value, row);
    return 'default';
  }
  
  getCellClass(column: TableColumn, value: any, row?: any): string {
    if (typeof column.cellClass === 'function') return column.cellClass(value, row);
    return column.cellClass || '';
  }
  
  getCellValue(row: any, key: string): any {
    return this.resolveNestedKey(row, key);
  }
}