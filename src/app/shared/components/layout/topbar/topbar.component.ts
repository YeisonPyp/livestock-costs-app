import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent implements OnInit {
  @Input() userName = '';
  @Input() userRole = '';
  @Input() userAvatar = '';
  @Input() notificationCount = 0;
  @Input() showNotifications = true;
  @Input() showSearch = false;
  @Input() showUser = true;
  @Input() searchPlaceholder = 'Buscar...';
  @Input() compact = false;

  @Output() searchChange = new EventEmitter<string>();
  @Output() notificationsClick = new EventEmitter<void>();
  @Output() userClick = new EventEmitter<void>();

  searchValue = '';

  ngOnInit(): void {}

  get initials(): string {
    return this.userName
      .split(' ')
      .slice(0, 2)
      .map(w => w[0]?.toUpperCase() ?? '')
      .join('');
  }

  onSearch(): void {
    this.searchChange.emit(this.searchValue);
  }
}