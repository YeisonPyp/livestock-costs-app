import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss'
})
export class AuthLayoutComponent {
  @Input() title = 'Bienvenido';
  @Input() subtitle = '';
  @Input() brandTitle = '';
  @Input() brandSubtitle = '';
}