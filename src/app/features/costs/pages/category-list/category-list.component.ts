import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';

import { PageHeaderComponent }   from '../../../../shared/components/page-header/page-header.component';
import { LoaderComponent }        from '../../../../shared/components/loader/loader.component';
import { EmptyStateComponent }    from '../../../../shared/components/empty-state/empty-state.component';
import { BadgeComponent }         from '../../../../shared/components/display/badge/badge.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

import { CategoryService } from '../../services/category.service';
import { CategoryTree, Category } from '../../models/cost.model';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    PageHeaderComponent, LoaderComponent, EmptyStateComponent, BadgeComponent,
  ],
  templateUrl: './category-list.component.html',
  styleUrl:    './category-list.component.scss',
})
export class CategoryListComponent implements OnInit {
  private svc      = inject(CategoryService);
  private dialog   = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  tree         = signal<CategoryTree[]>([]);
  flatList     = signal<Category[]>([]);
  loading      = signal(false);
  viewMode     = signal<'tree' | 'list'>('tree');
  searchTerm   = '';
  expandedIds  = new Set<number>();

  ngOnInit(): void { this.loadTree(); this.loadList(); }

  private loadTree(): void {
    this.svc.getTree().subscribe({
      next: (r) => {
        if (r.success) {
          this.tree.set(r.data);
          // Auto-expand level-0 nodes
          r.data.forEach(n => this.expandedIds.add(n.id));
        }
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); },
    });
  }

  private loadList(): void {
    this.svc.getAll().subscribe({
      next: (r) => { if (r.success) this.flatList.set(r.data); },
    });
  }

  reload(): void { this.loading.set(true); this.loadTree(); this.loadList(); }

  toggle(id: number): void {
    if (this.expandedIds.has(id)) this.expandedIds.delete(id);
    else this.expandedIds.add(id);
  }

  isExpanded(id: number): boolean { return this.expandedIds.has(id); }

  expandAll(): void  { this.flatList().forEach(c => this.expandedIds.add(c.id)); }
  collapseAll(): void { this.expandedIds.clear(); }

  get filteredList(): Category[] {
    if (!this.searchTerm.trim()) return this.flatList();
    const q = this.searchTerm.toLowerCase();
    return this.flatList().filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.description ?? '').toLowerCase().includes(q)
    );
  }

  confirmDelete(cat: Category): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title:       'Eliminar Categoría',
        message:     `¿Eliminar la categoría "${cat.name}" (${cat.code})? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        type:        'danger',
      },
    }).afterClosed().subscribe(ok => {
      if (ok) this.deleteCategory(cat.id);
    });
  }

  private deleteCategory(id: number): void {
    this.svc.delete(id).subscribe({
      next: () => { this.snackBar.open('Categoría eliminada', 'Cerrar', { duration: 3000 }); this.reload(); },
      error: (err) => { this.snackBar.open(err?.error?.message || 'No se puede eliminar', 'Cerrar', { duration: 4000 }); },
    });
  }

  levelLabel(level: number): string {
    return ['Raíz', 'Grupo', 'Subgrupo', 'Detalle'][level] ?? `Nivel ${level}`;
  }

  levelColor(level: number): 'blue' | 'purple' | 'yellow' | 'secondary' {
    return (['blue', 'purple', 'yellow', 'secondary'] as const)[level] ?? 'secondary';
  }
}