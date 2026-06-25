import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarMenuComponent } from '../../shared/components/navigation/sidebar-menu/sidebar-menu.component';
import { NavbarComponent } from '../../shared/components/navigation/navbar/navbar.component';
import { SidebarService } from '../../shared/services/sidebar.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarMenuComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  readonly sidebarService = inject(SidebarService);
}