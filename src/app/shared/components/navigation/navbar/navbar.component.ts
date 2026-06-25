// navbar.component.ts
import {
  Component,
  HostListener,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../../features/auth/services/auth.service';
import { SidebarService } from '../../../services/sidebar.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  // ✅ Inyección con inject() - estilo Angular 19
  readonly sidebarService = inject(SidebarService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  userMenuOpen = false;
  scrolled = false;

  ngOnInit(): void {
    // Cerrar menús al navegar
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
    // Cerrar dropdown de usuario si se hace click afuera
    if (!target.closest('.user-menu-container')) {
      this.userMenuOpen = false;
    }
  }

  // ✅ Delega al SidebarService
  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
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

  navigateToSettings(): void {
    this.router.navigate(['/settings']);
    this.userMenuOpen = false;
  }

  getRoleLabel(role: string): string {
    const roles: Record<string, string> = {
      admin: 'Administrador',
      investor: 'Inversionista',
      super_admin: 'Super Admin',
      user: 'Usuario',
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