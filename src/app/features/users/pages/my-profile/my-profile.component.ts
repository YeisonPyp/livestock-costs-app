// src/features/profile/pages/my-profile/my-profile.component.ts
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
import { Subject, takeUntil } from 'rxjs';

import { ProfileService } from '../../services/profile.service';
import { PersonFormComponent } from '../../../users/pages/person-form/person-form.component';
import { UserStatusBadgeComponent } from '../../../users/components/user-status-badge/user-status-badge.component';
import { ModalComponent } from '../../../../shared/components/overlays/modal/modal.component';
import { User, Person, ChangePasswordPayload } from '../../../users/models/user.model';
import { NotificationService } from '../../../../core/services/notification.service';

type Tab = 'info' | 'security' | 'preferences';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PersonFormComponent,
    UserStatusBadgeComponent,
    ModalComponent,
  ],
  templateUrl: './my-profile.component.html',
  styleUrl: './my-profile.component.scss',
})
export class MyProfileComponent implements OnInit, OnDestroy {
  private profileService = inject(ProfileService);
  private notify = inject(NotificationService);
  private destroy$ = new Subject<void>();

  // ── State ─────────────────────────────────────────────────────
  user = signal<User | null>(null);
  loading = signal(true);
  submitting = signal(false);
  activeTab = signal<Tab>('info');
  uploadingAvatar = signal(false);

  // Password modal
  showPasswordModal = signal(false);
  oldPassword = signal('');
  newPassword = signal('');
  newPasswordConfirm = signal('');
  showOldPwd = signal(false);
  showNewPwd = signal(false);
  showConfirmPwd = signal(false);
  passwordError = signal('');

  // ── Computed ──────────────────────────────────────────────────
  initials = computed(() => {
    const u = this.user();
    if (!u) return '?';
    const name = u.full_name ?? u.username;
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  });

  personData = computed<Person | null>(() => {
    const u = this.user();
    return u?.person as any ?? null;
  });

  // ── Lifecycle ─────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data ──────────────────────────────────────────────────────
  loadProfile(): void {
    this.loading.set(true);
    this.profileService
      .getMe()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.user.set(res.data ?? null);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.notify.error('Error al cargar tu perfil');
        },
      });
  }

  // ── Tabs ──────────────────────────────────────────────────────
  setTab(tab: Tab): void {
    this.activeTab.set(tab);
  }

  // ── Update Person ─────────────────────────────────────────────
  onUpdatePerson(data: any): void {
    this.submitting.set(true);
    this.profileService
      .updateMyPerson(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.user.set(res.data ?? this.user());
          this.submitting.set(false);
          this.notify.success('Perfil actualizado correctamente');
        },
        error: (err) => {
          this.submitting.set(false);
          this.notify.error(
            err?.error?.message ?? 'Error al actualizar el perfil'
          );
        },
      });
  }

  // ── Avatar ────────────────────────────────────────────────────
  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Validaciones cliente
    if (file.size > 2 * 1024 * 1024) {
      this.notify.error('El archivo no puede superar los 2MB');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.notify.error('Solo se permiten imágenes JPG, PNG o WebP');
      return;
    }

    this.uploadingAvatar.set(true);
    this.profileService
      .uploadAvatar(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.user.set(res.data ?? this.user());
          this.uploadingAvatar.set(false);
          this.notify.success('Avatar actualizado');
          input.value = ''; // limpiar input
        },
        error: () => {
          this.uploadingAvatar.set(false);
          this.notify.error('Error al subir el avatar');
        },
      });
  }

  deleteAvatar(): void {
    if (!confirm('¿Eliminar tu foto de perfil?')) return;

    this.profileService
      .deleteAvatar()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.user.set(res.data ?? this.user());
          this.notify.success('Avatar eliminado');
        },
      });
  }

  // ── Password Modal ────────────────────────────────────────────
  openPasswordModal(): void {
    this.oldPassword.set('');
    this.newPassword.set('');
    this.newPasswordConfirm.set('');
    this.passwordError.set('');
    this.showPasswordModal.set(true);
  }

  closePasswordModal(): void {
    this.showPasswordModal.set(false);
  }

  confirmPasswordChange(): void {
    this.passwordError.set('');

    if (!this.oldPassword() || !this.newPassword()) {
      this.passwordError.set('Completa todos los campos');
      return;
    }
    if (this.newPassword() !== this.newPasswordConfirm()) {
      this.passwordError.set('Las contraseñas no coinciden');
      return;
    }
    if (this.newPassword().length < 8) {
      this.passwordError.set('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    const payload: ChangePasswordPayload = {
      old_password: this.oldPassword(),
      new_password: this.newPassword(),
      new_password_confirm: this.newPasswordConfirm(),
    };

    this.submitting.set(true);
    this.profileService
      .changePassword(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.closePasswordModal();
          this.notify.success('Contraseña actualizada correctamente');
        },
        error: (err) => {
          this.submitting.set(false);
          this.passwordError.set(
            err?.error?.message ?? 'Error al cambiar la contraseña'
          );
        },
      });
  }

  toggleOldPwd(): void { this.showOldPwd.update((v) => !v); }
  toggleNewPwd(): void { this.showNewPwd.update((v) => !v); }
  toggleConfirmPwd(): void { this.showConfirmPwd.update((v) => !v); }

  // ── Helpers ───────────────────────────────────────────────────
  formatDate(date?: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}