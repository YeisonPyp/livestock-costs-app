import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface NavItem {
  label: string;
  route: string;
  icon: string;         // SVG string or HTML
  badge?: string | number;
  badgeColor?: 'primary' | 'danger' | 'warning' | 'success';
  exact?: boolean;
}

export interface NavGroup {
  label?: string;       // section title, hidden when collapsed
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  @Input() navGroups: NavGroup[] = [];
  @Input() appName = 'App';
  @Input() collapsed = false;
}