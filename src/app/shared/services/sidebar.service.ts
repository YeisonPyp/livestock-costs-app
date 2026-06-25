// src/app/services/sidebar.service.ts
import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  private breakpointObserver = inject(BreakpointObserver);

  // ── Estado privado ────────────────────────────────────────────────
  private readonly _isCollapsed = signal<boolean>(false);
  private readonly _isMobile = signal<boolean>(false);
  private readonly _isMobileSidebarOpen = signal<boolean>(false);

  // ── Señales públicas (readonly) ───────────────────────────────────
  readonly isCollapsed = this._isCollapsed.asReadonly();
  readonly isMobile = this._isMobile.asReadonly();
  readonly isMobileSidebarOpen = this._isMobileSidebarOpen.asReadonly();

  // ── Computed ──────────────────────────────────────────────────────

  /**
   * Muestra el overlay oscuro detrás del sidebar en mobile
   */
  readonly showOverlay = computed(
    () => this._isMobile() && this._isMobileSidebarOpen()
  );

  /**
   * Ancho actual del sidebar según el estado
   * Útil para ajustar el margin-left del contenido principal
   */
  readonly sidebarWidth = computed<number>(() => {
    // En mobile el sidebar está fuera del flujo del documento (position: fixed)
    // por eso no ocupa espacio en el layout
    if (this._isMobile()) return 0;
    return this._isCollapsed() ? 80 : 280;
  });

  /**
   * Clase CSS para el contenido principal basada en el estado del sidebar
   */
  readonly mainContentClass = computed<string>(() => {
    if (this._isMobile()) return 'content-mobile';
    if (this._isCollapsed()) return 'content-collapsed';
    return 'content-expanded';
  });

  /**
   * Indica si el sidebar está VISIBLE en pantalla
   * En desktop siempre visible, en mobile solo cuando está abierto
   */
  readonly isSidebarVisible = computed<boolean>(() => {
    if (!this._isMobile()) return true;
    return this._isMobileSidebarOpen();
  });

  constructor() {
    // ✅ Detectar cambios de viewport usando CDK BreakpointObserver
    // Más confiable que window.innerWidth porque usa Media Queries reales
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait, '(max-width: 767px)'])
      .pipe(takeUntilDestroyed())
      .subscribe((result) => {
        const isMobileView = result.matches;
        this._isMobile.set(isMobileView);

        // Cerrar sidebar mobile al pasar a desktop
        if (!isMobileView) {
          this._isMobileSidebarOpen.set(false);
        }
      });

    // ✅ Efecto: Controlar el scroll del body cuando el sidebar mobile está abierto
    // Previene que el fondo se pueda hacer scroll cuando el menú está abierto
    effect(() => {
      if (typeof document !== 'undefined') {
        if (this._isMobile() && this._isMobileSidebarOpen()) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      }
    });
  }

  // ── Métodos públicos ──────────────────────────────────────────────

  /**
   * Toggle principal - comportamiento diferente según el dispositivo
   * Mobile: abre/cierra el drawer
   * Desktop: colapsa/expande el sidebar
   */
  toggleSidebar(): void {
    if (this._isMobile()) {
      this._isMobileSidebarOpen.update((open) => !open);
    } else {
      this._isCollapsed.update((collapsed) => !collapsed);
    }
  }

  /**
   * Abre el sidebar en mobile
   */
  openMobileSidebar(): void {
    if (this._isMobile()) {
      this._isMobileSidebarOpen.set(true);
    }
  }

  /**
   * Cierra el sidebar en mobile
   * Se llama al hacer click en un ítem del menú o en el overlay
   */
  closeMobileSidebar(): void {
    this._isMobileSidebarOpen.set(false);
  }

  /**
   * Fuerza el estado colapsado (útil para preferencias guardadas)
   */
  setCollapsed(collapsed: boolean): void {
    if (!this._isMobile()) {
      this._isCollapsed.set(collapsed);
    }
  }

  /**
   * Fuerza el estado mobile (útil para testing)
   */
  setMobile(isMobile: boolean): void {
    this._isMobile.set(isMobile);
    if (!isMobile) {
      this._isMobileSidebarOpen.set(false);
    }
  }
}