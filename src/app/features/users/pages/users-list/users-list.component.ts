// src/features/users/pages/users-list/users-list.component.ts
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
import {
  Subject,
  takeUntil,
  debounceTime,
  distinctUntilChanged,
} from 'rxjs';

import { UserService } from '../../services/user.service';
import {
  UserList,
  User,
  UserCreatePayload,
  UserFilterParams,
  UserStats,
  SetPasswordPayload,
} from '../../models/user.model';
import { UserStatusBadgeComponent } from '../../components/user-status-badge/user-status-badge.component';
import { ModalComponent } from '../../../../shared/components/overlays/modal/modal.component';
import { UUID } from '../../../../core/models/api-response.model';
import { UserFormComponent } from '../user-form/user-form.component';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UserStatusBadgeComponent,
    ModalComponent,
    UserFormComponent,
  ],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.scss',
})
export class UsersListComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private destroy$    = new Subject<void>();
  private search$     = new Subject<string>();

  // ── Data ──────────────────────────────────────────────────────────
  users       = signal<UserList[]>([]);
  stats       = signal<UserStats | null>(null);

  // ── Pagination ────────────────────────────────────────────────────
  currentPage = signal(1);
  pageSize    = signal(15);
  totalCount  = signal(0);
  totalPages  = computed(() => Math.ceil(this.totalCount() / this.pageSize()));
  hasPrev     = computed(() => this.currentPage() > 1);
  hasNext     = computed(() => this.currentPage() < this.totalPages());

  pageRange = computed(() => {
    const current = this.currentPage();
    const total   = this.totalPages();
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end   = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  // ── Filters ───────────────────────────────────────────────────────
  searchQuery      = signal('');
  filterActive     = signal('');
  filterVerified   = signal('');
  filterStaff      = signal('');
  sortField        = signal('-created_at');

  // ── UI State ──────────────────────────────────────────────────────
  loading      = signal(false);
  submitting   = signal(false);
  error        = signal<string | null>(null);

  // ── Selection ─────────────────────────────────────────────────────
  selectedIds  = signal<Set<UUID>>(new Set());
  allSelected  = computed(
    () =>
      this.users().length > 0 &&
      this.users().every((u) => this.selectedIds().has(u.id))
  );
  hasSelection  = computed(() => this.selectedIds().size > 0);
  selectionCount = computed(() => this.selectedIds().size);

  // ── Modals ────────────────────────────────────────────────────────
  showCreateModal   = signal(false);
  showDetailModal   = signal(false);
  showPasswordModal = signal(false);
  showDeleteModal   = signal(false);
  selectedUser      = signal<UserList | null>(null);
  userDetail        = signal<User | null>(null);

  // Password modal state
  newPassword        = signal('');
  newPasswordConfirm = signal('');
  passwordError      = signal('');

  ngOnInit(): void {
    this.loadStats();
    this.loadUsers();
    this.initSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data Loading ──────────────────────────────────────────────────

  private loadStats(): void {
    this.userService
      .getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => this.stats.set(res.data ?? null),
      });
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    const params: UserFilterParams = {
      page:      this.currentPage(),
      page_size: this.pageSize(),
      ordering:  this.sortField(),
    };

    if (this.searchQuery())    params.search      = this.searchQuery();
    if (this.filterActive() !== '')   params.is_active   = this.filterActive() === 'true';
    if (this.filterVerified() !== '') params.is_verified = this.filterVerified() === 'true';
    if (this.filterStaff() !== '')    params.is_staff    = this.filterStaff() === 'true';

    this.userService
      .getAll(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.users.set(res.data ?? []);
          if ((res as any).count !== undefined) {
            this.totalCount.set((res as any).count);
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message ?? 'Error al cargar usuarios');
          this.loading.set(false);
        },
      });
  }

  private initSearch(): void {
    this.search$
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadUsers();
      });
  }

  // ── Search & Filters ──────────────────────────────────────────────

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.search$.next(value);
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadUsers();
  }

  onSortChange(field: string): void {
    const current = this.sortField();
    this.sortField.set(current === field ? `-${field}` : field);
    this.loadUsers();
  }

  getSortIcon(field: string): 'asc' | 'desc' | 'none' {
    const c = this.sortField();
    if (c === field)      return 'asc';
    if (c === `-${field}`) return 'desc';
    return 'none';
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.filterActive.set('');
    this.filterVerified.set('');
    this.filterStaff.set('');
    this.sortField.set('-created_at');
    this.currentPage.set(1);
    this.loadUsers();
  }

  // ── Pagination ────────────────────────────────────────────────────

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadUsers();
  }

  // ── Selection ─────────────────────────────────────────────────────

  toggleAll(): void {
    if (this.allSelected()) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(this.users().map((u) => u.id)));
    }
  }

  toggleUser(id: UUID): void {
    this.selectedIds.update((set) => {
      const n = new Set(set);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  isSelected(id: UUID): boolean {
    return this.selectedIds().has(id);
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  // ── CRUD ──────────────────────────────────────────────────────────

  openCreateModal(): void {
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
    this.submitting.set(false);
  }

  onCreateUser(data: UserCreatePayload): void {
    this.submitting.set(true);
    this.userService
      .create(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.closeCreateModal();
          this.loadUsers();
          this.loadStats();
        },
        error: () => this.submitting.set(false),
      });
  }

  openDeleteModal(user: UserList): void {
    this.selectedUser.set(user);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.selectedUser.set(null);
  }

  confirmDelete(): void {
    const user = this.selectedUser();
    if (!user) return;
    this.submitting.set(true);
    this.userService
      .delete(user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.closeDeleteModal();
          this.loadUsers();
          this.loadStats();
        },
        error: () => this.submitting.set(false),
      });
  }

  // ── Admin Actions ─────────────────────────────────────────────────

  toggleActive(user: UserList): void {
    const action$ = user.is_active
      ? this.userService.deactivate(user.id)
      : this.userService.activate(user.id);

    action$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.loadUsers(),
    });
  }

  toggleVerify(user: UserList): void {
    const action$ = user.is_verified
      ? this.userService.unverify(user.id)
      : this.userService.verify(user.id);

    action$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.loadUsers(),
    });
  }

  openPasswordModal(user: UserList): void {
    this.selectedUser.set(user);
    this.newPassword.set('');
    this.newPasswordConfirm.set('');
    this.passwordError.set('');
    this.showPasswordModal.set(true);
  }

  closePasswordModal(): void {
    this.showPasswordModal.set(false);
    this.selectedUser.set(null);
  }

  confirmSetPassword(): void {
    const user = this.selectedUser();
    if (!user) return;

    if (this.newPassword() !== this.newPasswordConfirm()) {
      this.passwordError.set('Las contraseñas no coinciden');
      return;
    }
    if (this.newPassword().length < 8) {
      this.passwordError.set('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    this.submitting.set(true);
    this.passwordError.set('');

    const payload: SetPasswordPayload = {
      new_password:         this.newPassword(),
      new_password_confirm: this.newPasswordConfirm(),
    };

    this.userService
      .setPassword(user.id, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.closePasswordModal();
        },
        error: (err) => {
          this.passwordError.set(err?.error?.message ?? 'Error al cambiar contraseña');
          this.submitting.set(false);
        },
      });
  }

  // ── Bulk ──────────────────────────────────────────────────────────

  bulkVerify(): void {
    const ids = Array.from(this.selectedIds());
    this.userService
      .bulkVerify(ids)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.clearSelection();
          this.loadUsers();
        },
      });
  }

  bulkAction(action: 'activate' | 'deactivate' | 'delete'): void {
    const ids = Array.from(this.selectedIds());
    this.userService
      .bulkAction({ action, ids })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.clearSelection();
          this.loadUsers();
          this.loadStats();
        },
      });
  }

  // ── Helpers ───────────────────────────────────────────────────────

  getInitials(user: UserList): string {
    const name = user.full_name ?? user.username;
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  formatDate(date?: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  formatLastLogin(date?: string): string {
    if (!date) return 'Nunca';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 7)  return `Hace ${days} días`;
    return this.formatDate(date);
  }
}