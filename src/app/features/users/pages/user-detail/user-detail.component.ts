// src/features/users/pages/user-detail/user-detail.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { UserService } from '../../services/user.service';
import { User, SetPasswordPayload } from '../../models/user.model';
import { UserStatusBadgeComponent } from '../../components/user-status-badge/user-status-badge.component';
import { ModalComponent } from '../../../../shared/components/overlays/modal/modal.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    UserStatusBadgeComponent,
    ModalComponent,
  ],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.scss',
})
export class UserDetailComponent implements OnInit, OnDestroy {
  private route       = inject(ActivatedRoute);
  private router      = inject(Router);
  private userService = inject(UserService);
  private destroy$    = new Subject<void>();

  // ── State ─────────────────────────────────────────────────────────
  user          = signal<User | null>(null);
  loading       = signal(true);
  actionLoading = signal<string | null>(null);
  error         = signal<string | null>(null);

  // Password modal
  showPasswordModal    = signal(false);
  newPassword          = signal('');
  newPasswordConfirm   = signal('');
  passwordError        = signal('');
  showPwd              = signal(false);
  showPwdConfirm       = signal(false);

  // Delete modal
  showDeleteModal = signal(false);
  submitting      = signal(false);

  // ── Computed ──────────────────────────────────────────────────────
  initials = computed(() => {
    const u = this.user();
    if (!u) return '?';
    const name = u.full_name ?? u.username;
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  });

  statusLabel = computed(() => {
    const u = this.user();
    if (!u) return '';
    const parts: string[] = [];
    if (u.is_active)    parts.push('Activo');
    else                parts.push('Inactivo');
    if (u.is_verified)  parts.push('Verificado');
    if (u.is_staff)     parts.push('Staff');
    if (u.is_superuser) parts.push('Super Admin');
    if (u.is_locked)    parts.push('Bloqueado');
    return parts.join(' · ');
  });

  // ── Lifecycle ─────────────────────────────────────────────────────

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadUser(id);
    } else {
      this.error.set('ID de usuario no encontrado');
      this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data ──────────────────────────────────────────────────────────

  private loadUser(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.userService
      .getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.user.set(res.data ?? null);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message ?? 'Error al cargar el usuario');
          this.loading.set(false);
        },
      });
  }

  // ── Actions ───────────────────────────────────────────────────────

  toggleActive(): void {
    const u = this.user();
    if (!u) return;
    this.actionLoading.set('active');

    const action$ = u.is_active
      ? this.userService.deactivate(u.id)
      : this.userService.activate(u.id);

    action$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.user.set(res.data ?? null);
        this.actionLoading.set(null);
      },
      error: () => this.actionLoading.set(null),
    });
  }

  toggleVerify(): void {
    const u = this.user();
    if (!u) return;
    this.actionLoading.set('verify');

    const action$ = u.is_verified
      ? this.userService.unverify(u.id)
      : this.userService.verify(u.id);

    action$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.user.set(res.data ?? null);
        this.actionLoading.set(null);
      },
      error: () => this.actionLoading.set(null),
    });
  }

  unlock(): void {
    const u = this.user();
    if (!u) return;
    this.actionLoading.set('unlock');

    this.userService.unlock(u.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.user.set(res.data ?? null);
          this.actionLoading.set(null);
        },
        error: () => this.actionLoading.set(null),
      });
  }

  // ── Password Modal ────────────────────────────────────────────────

  openPasswordModal(): void {
    this.newPassword.set('');
    this.newPasswordConfirm.set('');
    this.passwordError.set('');
    this.showPasswordModal.set(true);
  }

  closePasswordModal(): void {
    this.showPasswordModal.set(false);
  }

  confirmSetPassword(): void {
    if (this.newPassword() !== this.newPasswordConfirm()) {
      this.passwordError.set('Las contraseñas no coinciden');
      return;
    }
    if (this.newPassword().length < 8) {
      this.passwordError.set('Mínimo 8 caracteres');
      return;
    }

    const u = this.user();
    if (!u) return;

    this.submitting.set(true);
    const payload: SetPasswordPayload = {
      new_password:         this.newPassword(),
      new_password_confirm: this.newPasswordConfirm(),
    };

    this.userService.setPassword(u.id, payload)
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

  // ── Delete ────────────────────────────────────────────────────────

  openDeleteModal(): void {
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
  }

  confirmDelete(): void {
    const u = this.user();
    if (!u) return;
    this.submitting.set(true);

    this.userService.delete(u.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.router.navigate(['/users/users']);
        },
        error: () => this.submitting.set(false),
      });
  }

  // ── Helpers ───────────────────────────────────────────────────────

  goBack(): void {
    this.router.navigate(['/users/users']);
  }

  formatDate(date?: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  formatDateShort(date?: string): string {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  formatLocation(city?: string, country?: string): string {
    return [city, country].filter((v) => !!v).join(', ');
  }

  isActionLoading(action: string): boolean {
    return this.actionLoading() === action;
  }

  toggleShowPwd(): void {
    this.showPwd.update((v) => !v);
  }

  toggleShowPwdConfirm(): void {
    this.showPwdConfirm.update((v) => !v);
  }
}