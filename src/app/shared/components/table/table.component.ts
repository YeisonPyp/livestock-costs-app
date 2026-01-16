import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
}

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  column: string;
  direction: SortDirection;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnInit, OnChanges {
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
    compact: false
  };
  @Input() emptyMessage = 'No hay datos disponibles';
  @Input() loadingMessage = 'Cargando datos...';
  
  @Output() rowClick = new EventEmitter<any>();
  @Output() sort = new EventEmitter<SortState>();
  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() pageChange = new EventEmitter<number>();

  // State
  searchTerm = '';
  currentPage = 1;
  sortState: SortState = { column: '', direction: null };
  selectedRows: Set<any> = new Set();
  allSelected = false;

  // Computed
  filteredData: any[] = [];
  paginatedData: any[] = [];
  totalPages = 1;
  
  ngOnInit(): void {
    this.applyDefaultConfig();
    this.updateFilteredData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['config']) {
      this.updateFilteredData();
    }
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
      ...this.config
    };
  }

  updateFilteredData(): void {
    let result = [...this.data];

    // Apply search
    if (this.searchTerm && this.config.searchable) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(row => 
        this.columns.some(col => {
          const value = row[col.key];
          return value?.toString().toLowerCase().includes(term);
        })
      );
    }

    this.filteredData = result;
    this.updatePagination();
  }

  updatePagination(): void {
    if (!this.config.paginated) {
      this.paginatedData = this.filteredData;
      return;
    }

    const pageSize = this.config.pageSize || 10;
    this.totalPages = Math.ceil(this.filteredData.length / pageSize);
    
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    const startIndex = (this.currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    this.paginatedData = this.filteredData.slice(startIndex, endIndex);
  }

  onSearch(): void {
    this.currentPage = 1;
    this.updateFilteredData();
  }

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

    this.applySorting();
    this.sort.emit(this.sortState);
  }

  applySorting(): void {
    if (!this.sortState.direction || !this.sortState.column) {
      this.updateFilteredData();
      return;
    }

    this.filteredData.sort((a, b) => {
      const aVal = a[this.sortState.column];
      const bVal = b[this.sortState.column];
      
      let comparison = 0;
      if (aVal > bVal) comparison = 1;
      if (aVal < bVal) comparison = -1;
      
      return this.sortState.direction === 'asc' ? comparison : -comparison;
    });

    this.updatePagination();
  }

  onRowClick(row: any, event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('.table-actions') || target.closest('.checkbox-cell')) {
      return;
    }
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

  updateAllSelectedState(): void {
    this.allSelected = this.paginatedData.length > 0 && 
                       this.paginatedData.every(row => this.selectedRows.has(row));
  }

  isRowSelected(row: any): boolean {
    return this.selectedRows.has(row);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
    this.pageChange.emit(page);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  formatCellValue(column: TableColumn, value: any): string {
    if (column.format) {
      return column.format(value);
    }

    switch (column.type) {
      case 'currency':
        return new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP'
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
    if (column.badgeColor) {
      return column.badgeColor(value);
    }
    return 'default';
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    
    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
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
    }
    
    return pages;
  }

  get showingFrom(): number {
    if (this.filteredData.length === 0) return 0;
    return ((this.currentPage - 1) * (this.config.pageSize || 10)) + 1;
  }

  get showingTo(): number {
    const to = this.currentPage * (this.config.pageSize || 10);
    return Math.min(to, this.filteredData.length);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.onSearch();
  }
}