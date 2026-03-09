import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import { FormCardComponent }   from '../../../../../shared/components/forms/form-card/form-card.component';
import { AlertComponent }      from '../../../../../shared/components/display/alert/alert.component';

import { CattleService } from '../../../services/cattle.service';

@Component({
  selector: 'app-bulk-animals',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, FormCardComponent, AlertComponent],
  templateUrl: './bulk-animals.component.html',
  styleUrl:    './bulk-animals.component.scss',
})
export class BulkAnimalsComponent {
  private svc    = inject(CattleService);
  private router = inject(Router);
  private snack  = inject(MatSnackBar);

  file     = signal<File | null>(null);
  saving   = signal(false);
  error    = signal('');
  result   = signal<{ count: number } | null>(null);

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.file.set(input.files?.[0] ?? null);
    this.result.set(null);
    this.error.set('');
  }

  submit(): void {
    const f = this.file();
    if (!f) { this.error.set('Selecciona un archivo'); return; }
    this.saving.set(true);
    this.error.set('');

    this.svc.createAnimalsBulkFile(f).subscribe({
      next: (r) => {
        this.result.set(r.data);
        this.snack.open(r.message || `${r.data?.count} animales creados`, 'Cerrar', { duration: 4000 });
        this.saving.set(false);
      },
      error: (e: any) => { this.error.set(e?.error?.message || 'Error al procesar el archivo'); this.saving.set(false); },
    });
  }
}