import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../features/auth/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="bg-blue-600 text-white shadow-lg">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-8">
            <h1 class="text-xl font-bold">Sistema Ganadero</h1>
            <div class="hidden md:flex space-x-4">
              <a routerLink="/dashboard" routerLinkActive="bg-blue-700" class="px-3 py-2 rounded-md hover:bg-blue-700 transition-colors">
                Dashboard
              </a>
              <a routerLink="/categories" routerLinkActive="bg-blue-700" class="px-3 py-2 rounded-md hover:bg-blue-700 transition-colors">
                Categorías
              </a>
              <a routerLink="/costs" routerLinkActive="bg-blue-700" class="px-3 py-2 rounded-md hover:bg-blue-700 transition-colors">
                Costos
              </a>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            @if (authService.currentUser$ | async; as user) {
              <span class="text-sm">{{ user.full_name }}</span>
              <button
                (click)="logout()"
                class="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-md transition-colors"
              >
                Cerrar Sesión
              </button>
            }
          </div>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent {
  constructor(public authService: AuthService) {}

  logout(): void {
    this.authService.logout();
  }
}
