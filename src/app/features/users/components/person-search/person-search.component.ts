// src/features/users/components/person-search/person-search.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  signal,
  computed,
  inject,
  input,
  ElementRef,
  HostListener,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  of,
  takeUntil,
  catchError,
  tap,
  filter,
} from 'rxjs';

import { PersonService }  from '../../services/person.service';
import { CatalogService } from '../../services/catalog.service';
import {
  PersonSimple,
  PersonCreatePayload,
  DocumentType,
} from '../../models/user.model';
import { PersonFormComponent }  from '../../pages/person-form/person-form.component';
import { ModalComponent }       from '../../../../shared/components/overlays/modal/modal.component';

// ─── Tipos ────────────────────────────────────────────────────────
interface PersonTypeOption {
  value: '' | 'N' | 'J';
  label: string;
}

const PERSON_TYPES: PersonTypeOption[] = [
  { value: '',  label: 'Todos'    },
  { value: 'N', label: 'Natural'  },
  { value: 'J', label: 'Jurídica' },
];

const MIN_QUERY_LENGTH = 2;

@Component({
  selector: 'app-person-search',
  standalone: true,
  imports: [CommonModule, FormsModule, PersonFormComponent, ModalComponent],
  templateUrl: './person-search.component.html',
  styleUrls:  ['./person-search.component.scss'],
})
export class PersonSearchComponent implements OnInit, OnDestroy {

  // ── Inputs configurables ──────────────────────────────────────────
  /** Placeholder del campo de búsqueda */
  placeholder = input<string>('Buscar por nombre, documento o correo…');

  /** Muestra o no los filtros de documento/tipo */
  showFilters = input<boolean>(true);

  /** Deshabilita toda interacción */
  disabled = input<boolean>(false);

  /** Label visible encima del campo */
  label = input<string>('');

  /** Texto de hint debajo del campo */
  hint = input<string>('');

  /** Persona preseleccionada (para modo edición) */
  initialPerson = input<PersonSimple | null>(null);

  // ── Outputs ───────────────────────────────────────────────────────
  @Output() personSelected = new EventEmitter<PersonSimple>();
  @Output() personCleared  = new EventEmitter<void>();

  // ── Refs ──────────────────────────────────────────────────────────
  private host = inject(ElementRef);

  // ── Services ──────────────────────────────────────────────────────
  private personService  = inject(PersonService);
  private catalogService = inject(CatalogService);
  private destroy$       = new Subject<void>();
  private search$        = new Subject<string>();

  // ── Search state ──────────────────────────────────────────────────
  query          = signal('');
  results        = signal<PersonSimple[]>([]);
  loading        = signal(false);
  loadingCatalog = signal(true);
  error          = signal<string | null>(null);
  hasSearched    = signal(false);
  isDropdownOpen = signal(false);
  focusedIndex   = signal(-1);

  // ── Filters ───────────────────────────────────────────────────────
  filterDocType    = signal('');
  filterPersonType = signal<'' | 'N' | 'J'>('');
  documentTypes    = signal<DocumentType[]>([]);
  readonly personTypes = PERSON_TYPES;

  // ── Selected person ───────────────────────────────────────────────
  selectedPerson = signal<PersonSimple | null>(null);

  // ── Modal state ───────────────────────────────────────────────────
  isCreateModalOpen = signal(false);
  isSubmitting      = signal(false);

  // ── Computed ──────────────────────────────────────────────────────
  displayName = computed(() => this.selectedPerson()?.full_name ?? '');

  isEmpty = computed(
    () =>
      this.hasSearched() &&
      !this.loading() &&
      !this.error() &&
      this.results().length === 0 &&
      this.query().trim().length >= MIN_QUERY_LENGTH
  );

  isBelowMinLength = computed(
    () =>
      this.hasSearched() &&
      !this.loading() &&
      this.query().trim().length > 0 &&
      this.query().trim().length < MIN_QUERY_LENGTH
  );

  hasResults = computed(() => this.results().length > 0);

  showDropdown = computed(
    () =>
      this.isDropdownOpen() &&
      !this.selectedPerson() &&
      (this.hasResults() || this.isEmpty() || this.loading() || !!this.error())
  );

  // ── Lifecycle ─────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadCatalogs();
    this.initSearch();

    // Si hay una persona inicial (modo edición), precargarla
    const initial = this.initialPerson();
    if (initial) {
      this.selectedPerson.set(initial);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Click outside para cerrar el dropdown ─────────────────────────
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  // ── Keyboard navigation ───────────────────────────────────────────
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.showDropdown()) return;

    const items = this.results();
    const current = this.focusedIndex();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusedIndex.set(Math.min(current + 1, items.length - 1));
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.focusedIndex.set(Math.max(current - 1, -1));
        break;

      case 'Enter':
        event.preventDefault();
        if (current >= 0 && current < items.length) {
          this.selectPerson(items[current]);
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.closeDropdown();
        break;

      case 'Tab':
        this.closeDropdown();
        break;
    }
  }

  // ── Private ───────────────────────────────────────────────────────

  private loadCatalogs(): void {
    this.catalogService
      .getDocumentTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const list = Array.isArray(res.data) ? res.data : [];
          this.documentTypes.set(list.filter((d) => d.is_active));
          this.loadingCatalog.set(false);
        },
        error: () => this.loadingCatalog.set(false),
      });
  }

  private initSearch(): void {
    this.search$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        tap((q) => {
          if (q.trim().length >= MIN_QUERY_LENGTH) {
            this.loading.set(true);
            this.error.set(null);
            this.hasSearched.set(true);
            this.isDropdownOpen.set(true);
            this.focusedIndex.set(-1);
          }
        }),
        filter((q) => q.trim().length >= MIN_QUERY_LENGTH),
        switchMap((q) => {
          return this.personService
            .search({
              q,
              document_type: this.filterDocType() || undefined,
              person_type:   this.filterPersonType() || undefined,
            })
            .pipe(
              catchError((err) => {
                this.error.set(
                  err?.error?.message ??
                  err?.error?.errors?.q?.[0] ??
                  'Error al buscar personas'
                );
                return of(null);
              })
            );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        this.loading.set(false);
        if (res?.data) {
          this.results.set(res.data);
        } else if (res !== null) {
          this.results.set([]);
        }
      });
  }

  private closeDropdown(): void {
    this.isDropdownOpen.set(false);
    this.focusedIndex.set(-1);
  }

  // ── Search actions ────────────────────────────────────────────────

  onQueryChange(value: string): void {
    this.query.set(value);

    if (!value.trim()) {
      this.hasSearched.set(false);
      this.results.set([]);
      this.error.set(null);
      this.closeDropdown();
      return;
    }

    if (value.trim().length < MIN_QUERY_LENGTH) {
      this.hasSearched.set(true);
      this.isDropdownOpen.set(true);
      this.results.set([]);
      return;
    }

    this.search$.next(value);
  }

  onInputFocus(): void {
    // Re-abrir dropdown si ya había resultados
    if (this.query().trim().length >= MIN_QUERY_LENGTH && this.hasSearched()) {
      this.isDropdownOpen.set(true);
    }
  }

  onFilterChange(): void {
    if (this.query().trim().length >= MIN_QUERY_LENGTH) {
      this.loading.set(true);
      this.search$.next(this.query());
    }
  }

  clearQuery(): void {
    this.query.set('');
    this.results.set([]);
    this.hasSearched.set(false);
    this.error.set(null);
    this.closeDropdown();
  }

  selectPerson(person: PersonSimple): void {
    this.selectedPerson.set(person);
    this.personSelected.emit(person);
    this.query.set('');
    this.results.set([]);
    this.hasSearched.set(false);
    this.error.set(null);
    this.closeDropdown();
  }

  clearSelection(): void {
    this.selectedPerson.set(null);
    this.personCleared.emit();
    this.query.set('');
    this.results.set([]);
    this.hasSearched.set(false);
    this.error.set(null);
    this.closeDropdown();
  }

  onSpaceKey(event: Event, person: PersonSimple): void {
    event.preventDefault();
    this.selectPerson(person);
  }

  // ── Modal ─────────────────────────────────────────────────────────

  openCreateModal(): void {
    this.isCreateModalOpen.set(true);
    this.closeDropdown();
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
    this.isSubmitting.set(false);
  }

  onCreatePerson(data: Partial<PersonCreatePayload>): void {
    this.isSubmitting.set(true);
    this.personService
      .create(data as PersonCreatePayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          if (res.data) {
            const p = res.data;
            const simple: PersonSimple = {
              id:             p.id,
              document_type:  p.document_type,
              document_number: p.document_number,
              full_name:      p.full_name ?? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim(),
              email:          p.email,
              phone_number:   p.phone_number,
            };
            this.selectPerson(simple);
            this.closeCreateModal();
          }
        },
        error: () => this.isSubmitting.set(false),
      });
  }

  // ── Helpers ───────────────────────────────────────────────────────

  getInitial(p: PersonSimple): string {
    return (p.full_name?.[0] ?? '?').toUpperCase();
  }

  getResultCount(): string {
    const n = this.results().length;
    return `${n} resultado${n !== 1 ? 's' : ''}`;
  }

  isAtLimit(): boolean {
    return this.results().length === 50;
  }

  isFocused(index: number): boolean {
    return this.focusedIndex() === index;
  }

  /**
   * Resalta el texto buscado dentro de un string
   * Retorna partes: [{ text, highlight }]
   */
  highlightMatch(text: string): Array<{ text: string; highlight: boolean }> {
    const q = this.query().trim();
    if (!q || !text) return [{ text, highlight: false }];

    const parts: Array<{ text: string; highlight: boolean }> = [];
    const regex  = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ text: text.slice(lastIndex, match.index), highlight: false });
      }
      parts.push({ text: match[0], highlight: true });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push({ text: text.slice(lastIndex), highlight: false });
    }

    return parts.length ? parts : [{ text, highlight: false }];
  }
}