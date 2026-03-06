import { Component, HostListener, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-layout-shell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './layout-shell.component.html',
  styleUrl: './layout-shell.component.scss'
})
export class LayoutShellComponent implements OnInit {
  sidebarCollapsed = false;
  isMobile = false;

  private readonly MOBILE_BREAKPOINT = 768;
  private readonly STORAGE_KEY = 'sidebar_collapsed';

  ngOnInit(): void {
    this.checkViewport();
    if (!this.isMobile) {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      this.sidebarCollapsed = saved === 'true';
    }
  }

  @HostListener('window:resize')
  checkViewport(): void {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < this.MOBILE_BREAKPOINT;
    if (!wasMobile && this.isMobile) this.sidebarCollapsed = true;
    if (wasMobile && !this.isMobile) this.sidebarCollapsed = false;
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    if (!this.isMobile) {
      localStorage.setItem(this.STORAGE_KEY, String(this.sidebarCollapsed));
    }
  }

  collapseSidebar(): void {
    this.sidebarCollapsed = true;
  }
}