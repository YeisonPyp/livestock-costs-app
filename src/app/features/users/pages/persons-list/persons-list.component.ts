// src/features/users/pages/persons-list/persons-list.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  Subject,
  takeUntil,
  debounceTime,
  distinctUntilChanged,
} from 'rxjs';

import { PersonService } from '../../services/person.service';
import { CatalogService } from '../../services/catalog.service';
import {
  Person,
  PersonCreatePayload,
  PersonFilterParams,
  PersonStats,
  DocumentType,
  BulkActionType,
} from '../../models/user.model';
import { PersonFormComponent } from '../person-form/person-form.component';
import { UserStatusBadgeComponent } from '../../components/user-status-badge/user-status-badge.component';
import { ModalComponent } from '../../../../shared/components/overlays/modal/modal.component';

@Component({
  selector: 'app-persons-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PersonFormComponent,
    UserStatusBadgeComponent,
    ModalComponent,
  ],
  templateUrl: './persons-list.component.html',
  styleUrl: './persons-list.component.scss',
})
export class PersonsListComponent implements OnInit, OnDestroy {
  private personService  = inject(PersonService);
  private catalogService = inject(CatalogService);
  private destroy$       = new Subject<void>();
  private search$        = new Subject<string>();

  // ── Data ──────────────────────────────────────────────────────────
  persons       = signal<Person[]>([]);
  stats         = signal<PersonStats | null>(null);
  documentTypes = signal<DocumentType[]>([]);

  // ── Pagination ────────────────────────────────────────────────────
  currentPage  = signal(1);
  pageSize     = signal(15);
  totalCount   = signal(0);
  totalPages   = computed(() => Math.ceil(this.totalCount() / this.pageSize()));
  hasPrev      = computed(() => this.currentPage() > 1);
  hasNext      = computed(() => this.currentPage() < this.totalPages());

  // ── Filters ───────────────────────────────────────────────────────
  searchQuery    = signal('');
  filterDocType  = signal('');
  filterPersonType = signal('');
  filterActive   = signal('');
  sortField      = signal('-created_at');

  // ── UI State ──────────────────────────────────────────────────────
  loading       = signal(false);
  loadingStats  = signal(false);
  submitting    = signal(false);
  error         = signal<string | null>(null);

  // ── Selection ─────────────────────────────────────────────────────
  selectedIds   = signal<Set<string>>(new Set());
  allSelected   = computed(
    () =>
      this.persons().length > 0 &&
      this.persons().every((p) => this.selectedIds().has(p.id))
  );
  hasSelection  = computed(() => this.selectedIds().size > 0);
  selectionCount = computed(() => this.selectedIds().size);

  // ── Modals ────────────────────────────────────────────────────────
  showCreateModal  = signal(false);
  showEditModal    = signal(false);
  showDeleteModal  = signal(false);
  editingPerson    = signal<Person | null>(null);
  deletingPerson   = signal<Person | null>(null);

  // ── Computed ──────────────────────────────────────────────────────
  pageRange = computed(() => {
    const current = this.currentPage();
    const total   = this.totalPages();
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end   = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  ngOnInit(): void {
    this.loadCatalogs();
    this.loadStats();
    this.loadPersons();
    this.initSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data Loading ──────────────────────────────────────────────────

  private loadCatalogs(): void {
    this.catalogService
      .getDocumentTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => this.documentTypes.set(res.data ?? []),
      });
  }

  private loadStats(): void {
    this.loadingStats.set(true);
    this.personService
      .getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.stats.set(res.data ?? null);
          this.loadingStats.set(false);
        },
        error: () => this.loadingStats.set(false),
      });
  }

  loadPersons(): void {
    this.loading.set(true);
    this.error.set(null);

    const params: PersonFilterParams = {
      page:         this.currentPage(),
      page_size:    this.pageSize(),
      ordering:     this.sortField(),
    };

    if (this.searchQuery())      params.search      = this.searchQuery();
    if (this.filterDocType())    params.document_type = this.filterDocType();
    if (this.filterPersonType()) params.person_type   = this.filterPersonType() as 'N' | 'J';
    if (this.filterActive() !== '') params.is_active  = this.filterActive() === 'true';

    this.personService
      .getAll(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.persons.set(res.data ?? []);
          // Si el backend retorna paginación
          if ((res as any).count !== undefined) {
            this.totalCount.set((res as any).count);
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message ?? 'Error al cargar personas');
          this.loading.set(false);
        },
      });
  }

  private initSearch(): void {
    this.search$
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadPersons();
      });
  }

  // ── Search & Filter ───────────────────────────────────────────────

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.search$.next(value);
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadPersons();
  }

  onSortChange(field: string): void {
    const current = this.sortField();
    if (current === field) {
      this.sortField.set(`-${field}`);
    } else if (current === `-${field}`) {
      this.sortField.set(field);
    } else {
      this.sortField.set(field);
    }
    this.loadPersons();
  }

  getSortIcon(field: string): 'asc' | 'desc' | 'none' {
    const current = this.sortField();
    if (current === field)      return 'asc';
    if (current === `-${field}`) return 'desc';
    return 'none';
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.filterDocType.set('');
    this.filterPersonType.set('');
    this.filterActive.set('');
    this.sortField.set('-created_at');
    this.currentPage.set(1);
    this.loadPersons();
  }

  // ── Pagination ────────────────────────────────────────────────────

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadPersons();
  }

  // ── Selection ─────────────────────────────────────────────────────

  toggleAll(): void {
    if (this.allSelected()) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(this.persons().map((p) => p.id)));
    }
  }

  togglePerson(id: string): void {
    this.selectedIds.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  // ── CRUD Operations ───────────────────────────────────────────────

  openCreateModal(): void {
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
    this.submitting.set(false);
  }

  onCreatePerson(data: Partial<Person>): void {
    this.submitting.set(true);
    this.personService
      .create(data as PersonCreatePayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.closeCreateModal();
          this.loadPersons();
          this.loadStats();
        },
        error: () => this.submitting.set(false),
      });
  }

  openEditModal(person: Person): void {
    this.editingPerson.set(person);
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editingPerson.set(null);
    this.submitting.set(false);
  }

  onEditPerson(data: Partial<Person>): void {
    const person = this.editingPerson();
    if (!person) return;

    this.submitting.set(true);
    this.personService
      .patch(person.id, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.closeEditModal();
          this.loadPersons();
        },
        error: () => this.submitting.set(false),
      });
  }

  openDeleteModal(person: Person): void {
    this.deletingPerson.set(person);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.deletingPerson.set(null);
  }

  confirmDelete(): void {
    const person = this.deletingPerson();
    if (!person) return;

    this.submitting.set(true);
    this.personService
      .delete(person.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.closeDeleteModal();
          this.loadPersons();
          this.loadStats();
        },
        error: () => this.submitting.set(false),
      });
  }

  // ── Bulk Actions ──────────────────────────────────────────────────

  bulkAction(action: BulkActionType): void {
    const ids = Array.from(this.selectedIds());
    if (!ids.length) return;

    this.personService
      .bulkAction({ action, ids })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.clearSelection();
          this.loadPersons();
          this.loadStats();
        },
      });
  }

  // ── Helpers ───────────────────────────────────────────────────────

  getInitials(person: Person): string {
    if (person.person_type === 'J') {
      return (person.legal_name?.[0] ?? 'E').toUpperCase();
    }
    const f = person.first_name?.[0] ?? '';
    const l = person.last_name?.[0] ?? '';
    return `${f}${l}`.toUpperCase() || '?';
  }

  getDisplayName(person: Person): string {
    return (
      person.full_name ??
      (person.person_type === 'J'
        ? person.legal_name ?? ''
        : `${person.first_name} ${person.last_name}`)
    );
  }

  formatDate(date?: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}