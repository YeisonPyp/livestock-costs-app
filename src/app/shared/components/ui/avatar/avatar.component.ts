import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

const COLORS = ['#2563eb','#7c3aed','#db2777','#059669','#d97706','#dc2626','#0891b2','#65a30d'];

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss'
})
export class AvatarComponent implements OnInit {
  @Input() name = '';
  @Input() src = '';
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() shape: 'circle' | 'rounded' = 'circle';
  @Input() status?: 'online' | 'offline' | 'busy' | 'away';

  imgError = false;
  bgColor = '';

  ngOnInit(): void {
    const index = this.name.charCodeAt(0) % COLORS.length;
    this.bgColor = COLORS[index];
  }

  get initials(): string {
    return this.name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
  }

  onImgError(): void { this.imgError = true; this.src = ''; }
}