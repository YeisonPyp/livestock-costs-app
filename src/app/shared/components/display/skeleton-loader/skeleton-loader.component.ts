import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton-loader.component.html',
  styleUrl: './skeleton-loader.component.scss'
})
export class SkeletonLoaderComponent {
  /** text | circle | rect */
  @Input() variant: 'text' | 'circle' | 'rect' = 'text';
  @Input() width = '100%';
  @Input() height = '';
  @Input() radius = '';
}