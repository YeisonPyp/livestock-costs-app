import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface DropdownItem {
  label: string;
  icon?: string;
  badge?: string | number;
  color?: 'danger' | 'warning' | 'success';
  disabled?: boolean;
  divider?: boolean;
  action?: string | (() => void);           // ← Acepta string o función
  routerLink?: (string | number)[];         // ← Añadido
  danger?: boolean;                         // ← Añadido
}

@Component({
  selector: 'app-dropdown-menu',
  standalone: true,
  imports: [CommonModule, RouterLink],      // ← Añadir RouterLink
  templateUrl: './dropdown-menu.component.html',
  styleUrl: './dropdown-menu.component.scss'
})
export class DropdownMenuComponent {
  @Input() items: DropdownItem[] = [];
  @Input() align: 'left' | 'right' = 'right';
  @Output() action = new EventEmitter<string | DropdownItem>(); // ← Cambiar nombre

  isOpen = false;

  toggle(): void { this.isOpen = !this.isOpen; }
  close(): void  { this.isOpen = false; }

  onItemClick(item: DropdownItem): void {
    if (item.disabled) return;
    
    // Si tiene action string, emitir el string
    if (typeof item.action === 'string') {
      this.action.emit(item.action);
    } 
    // Si tiene función, ejecutarla
    else if (typeof item.action === 'function') {
      item.action();
    }
    
    this.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.close(); }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    const el = event.target as HTMLElement;
    if (!el.closest('app-dropdown-menu')) this.close();
  }
}