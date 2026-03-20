import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  signal,
  computed,
  inject,
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
} from 'rxjs';

import { PersonService } from '../../services/person.service';
import { CatalogService } from '../../services/catalog.service';
import { PersonSimple, DocumentType, SearchFilters } from '../../models/user.model';

interface PersonTypeOption {
  value: '' | 'N' | 'J';
  label: string;
}

const PERSON_TYPES: PersonTypeOption[] = [
  { value: '',  label: 'Todos'    },
  { value: 'N', label: 'Natural'  },
  { value: 'J', label: 'Jurídica' },
];

@Component({
  selector: 'app-person-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './person-search.component.html',
  styleUrls: ['./person-search.component.scss'],
})
export class PersonSearchComponent implements OnInit, OnDestroy {
  // Emite PersonSimple al padre — si el padre necesita el objeto completo
  // puede llamar a PersonService.getById(person.id)
  @Output() personSelected = new EventEmitter<PersonSimple>();

  private personService  = inject(PersonService);
  private catalogService = inject(CatalogService);
  private destroy$       = new Subject<void>();
  private search$        = new Subject<string>();

  // ── State ──────────────────────────────────────────────────────────────────
  query          = signal('');
  filters        = signal<SearchFilters>({ document_type: '', person_type: '' });
  results        = signal<PersonSimple[]>([]);
  loading        = signal(false);
  loadingCatalog = signal(true);
  error          = signal<string | null>(null);
  hasSearched    = signal(false);
  selectedPerson = signal<PersonSimple | null>(null);
  documentTypes  = signal<DocumentType[]>([]);

  // ── Derived ────────────────────────────────────────────────────────────────
  displayName = computed(() => this.selectedPerson()?.full_name ?? '');

  isEmpty = computed(
    () => this.hasSearched() && !this.loading() && !this.error() && this.results().length === 0
  );

  readonly personTypes = PERSON_TYPES;

  // ── Getters/setters para [(ngModel)] sin lógica en el template ────────────
  get selectedDocType(): string {
    return this.filters().document_type;
  }
  set selectedDocType(value: string) {
    this.filters.update(f => ({ ...f, document_type: value }));
    this.onFilterChange();
  }

  get selectedPersonType(): string {
    return this.filters().person_type;
  }
  set selectedPersonType(value: string) {
    this.filters.update(f => ({ ...f, person_type: value }));
    this.onFilterChange();
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadCatalogs();
    this.initSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Private ────────────────────────────────────────────────────────────────
  private loadCatalogs(): void {
    this.catalogService
      .getDocumentTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const list = Array.isArray(res.data) ? res.data : [];
          this.documentTypes.set(list.filter(d => d.is_active));
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
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
          this.hasSearched.set(true);
        }),
        switchMap((q) => {
          if (!q.trim()) {
            this.loading.set(false);
            this.hasSearched.set(false);
            this.results.set([]);
            return of(null);
          }
          const f = this.filters();
          return this.personService
            .search({
              q,
              document_type: f.document_type || undefined,
              person_type:   (f.person_type as 'N' | 'J') || undefined,
            })
            .pipe(
              catchError((err) => {
                this.error.set(
                  err?.error?.message ??
                  err?.error?.errors?.q?.[0] ??
                  'Error al buscar personas.'
                );
                return of(null);
              })
            );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        this.loading.set(false);
        if (res?.success) this.results.set(res.data ?? []);
      });
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  onQueryChange(value: string): void {
    this.query.set(value);
    this.search$.next(value);
  }

  onFilterChange(): void {
    if (this.query().trim()) this.search$.next(this.query());
  }

  selectPerson(person: PersonSimple): void {
    this.selectedPerson.set(person);
    this.personSelected.emit(person);
    this.results.set([]);
    this.hasSearched.set(false);
    this.query.set('');
  }

  clearSelection(): void {
    this.selectedPerson.set(null);
    this.query.set('');
    this.results.set([]);
    this.hasSearched.set(false);
    this.error.set(null);
  }

  onSpaceKey(event: Event, person: PersonSimple): void {
    event.preventDefault();
    this.selectPerson(person);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  getInitial(p: PersonSimple): string {
    // Usa person_type si el backend lo incluye, si no asume Natural
    if (p.person_type === 'J') {
      return (p.full_name?.[0] ?? 'J').toUpperCase();
    }
    return (p.full_name?.[0] ?? '?').toUpperCase();
  }

  getResultCount(): string {
    const n = this.results().length;
    return `${n} resultado${n !== 1 ? 's' : ''}`;
  }

  isAtLimit(): boolean {
    return this.results().length === 50;
  }
}