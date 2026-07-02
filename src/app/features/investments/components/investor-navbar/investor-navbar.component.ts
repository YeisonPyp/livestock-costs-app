// src/features/investors/components/investor-navbar/investor-navbar.component.ts
import {
  Component,
  HostListener,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { AuthService } from '../../../../features/auth/services/auth.service';

@Component({
  selector: 'app-investor-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './investor-navbar.component.html',
  styleUrls: ['./investor-navbar.component.scss'],
})
export class InvestorNavbarComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  userMenuOpen = false;
  scrolled = false;

  ngOnInit(): void {
    // Cerrar dropdown al navegar
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.userMenuOpen = false;
      });
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.scrolled = window.scrollY > 20;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.inv-nav-user-container')) {
      this.userMenuOpen = false;
    }
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  logout(): void {
    this.authService.logout();
    this.userMenuOpen = false;
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
    this.userMenuOpen = false;
  }

  getRoleLabel(role: string): string {
    const roles: Record<string, string> = {
      admin:       'Administrador',
      investor:    'Inversionista',
      super_admin: 'Super Admin',
      user:        'Usuario',
    };
    return roles[role] ?? role;
  }

  getInitials(fullName: string): string {
    if (!fullName) return 'U';
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  }
}