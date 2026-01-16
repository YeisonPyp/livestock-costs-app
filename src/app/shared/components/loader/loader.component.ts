import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../core/services/loading.service';
import { Subscription } from 'rxjs';

export type LoaderType = 'spinner' | 'dots' | 'pulse' | 'bars' | 'circular' | 'dual-ring' | 'logo';
export type LoaderSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss']
})
export class LoaderComponent implements OnInit, OnDestroy {
  @Input() type: LoaderType = 'pulse';
  @Input() size: LoaderSize = 'md';
  @Input() message = 'Cargando...';
  @Input() showMessage = true;
  @Input() overlay = true;
  @Input() transparent = false;

  isLoading = false;
  private subscription?: Subscription;

  constructor(public loadingService: LoadingService) {}

  ngOnInit(): void {
    this.subscription = this.loadingService.loading$.subscribe(
      loading => {
        this.isLoading = loading;
        
        // Prevent body scroll when loading
        if (this.overlay) {
          if (loading) {
            document.body.style.overflow = 'hidden';
          } else {
            document.body.style.overflow = '';
          }
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    document.body.style.overflow = '';
  }

  get loaderClasses(): string {
    return `loader-${this.type} loader-${this.size}`;
  }
}