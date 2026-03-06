import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DropdownItem {
  label: string;
  icon?: string;
  badge?: string | number;
  color?: 'danger' | 'warning' | 'success';
  disabled?: boolean;
  divider?: boolean;
  action?: () => void;
}

@Component({
  selector: 'app-dropdown-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dropdown-menu.component.html',
  styleUrl: './dropdown-menu.component.scss'
})
export class DropdownMenuComponent {
  @Input() items: DropdownItem[] = [];
  @Input() align: 'left' | 'right' = 'right';
  @Output() itemSelected = new EventEmitter<DropdownItem>();

  isOpen = false;

  toggle(): void { this.isOpen = !this.isOpen; }
  close(): void  { this.isOpen = false; }

  onItemClick(item: DropdownItem): void {
    if (item.disabled) return;
    item.action?.();
    this.itemSelected.emit(item);
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