import { Component, Input } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  providers: [CurrencyPipe, DecimalPipe, PercentPipe],
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.scss',
})
export class KpiCardComponent {
  @Input() label = '';
  @Input() value: number | string = 0;
  @Input() subtitle = ''; 
  @Input() format: 'currency' | 'number' | 'percent' | 'text' = 'number';
  @Input() currency = 'USD';
  @Input() icon?: string;
  @Input() trend?: number;
  @Input() trendLabel?: string;
  @Input() trendDescription = '';
  @Input() loading = false;
  @Input() decimals = 2;
  @Input() color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' = 'blue';

  constructor(
    private currencyPipe: CurrencyPipe,
    private decimalPipe: DecimalPipe,
    private percentPipe: PercentPipe,
  ) {}

  get formattedValue(): string {
    if (this.value === null || this.value === undefined) return '—';

    // Si el formato es text, devolver tal cual
    if (this.format === 'text') return String(this.value);

    // Convertir a número de forma segura
    const numValue = typeof this.value === 'string'
      ? parseFloat(this.value.replace(/[^0-9.-]/g, ''))
      : this.value;

    // Si no es un número válido, devolver como string
    if (isNaN(numValue)) return String(this.value);

    const formatDecimal = `1.${this.decimals}-${this.decimals}`;

    switch (this.format) {
      case 'currency':
        return this.currencyPipe.transform(
          numValue, this.currency, 'symbol', formatDecimal,
        ) ?? '';

      case 'percent':
        return this.percentPipe.transform(
          numValue / 100, formatDecimal,
        ) ?? '';

      case 'number':
      default:
        return this.decimalPipe.transform(numValue, formatDecimal) ?? '';
    }
  }

  /**
   * Retorna los datos del ícono para renderizar.
   * Ahora soporta múltiples elementos SVG (path, circle, line, etc.)
   */
  get iconElements(): SvgElement[] | null {
    return ICON_REGISTRY[this.icon ?? ''] ?? null;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ICON REGISTRY
// Cada ícono es un array de elementos SVG para renderizar correctamente
// íconos que tienen múltiples paths, circles, lines, etc.
// ═════════════════════════════════════════════════════════════════════════════

interface SvgElement {
  type: 'path' | 'circle' | 'line' | 'polyline' | 'rect' | 'polygon';
  attrs: Record<string, string | number>;
}

const p = (d: string): SvgElement => ({ type: 'path', attrs: { d } });
const circle = (cx: number, cy: number, r: number): SvgElement => ({
  type: 'circle', attrs: { cx, cy, r },
});
const line = (x1: number, y1: number, x2: number, y2: number): SvgElement => ({
  type: 'line', attrs: { x1, y1, x2, y2 },
});
const polyline = (points: string): SvgElement => ({
  type: 'polyline', attrs: { points },
});
const rect = (x: number, y: number, w: number, h: number, rx = 0): SvgElement => ({
  type: 'rect', attrs: { x, y, width: w, height: h, rx },
});

const ICON_REGISTRY: Record<string, SvgElement[]> = {
  'dollar-sign': [
    line(12, 1, 12, 23),
    p('M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'),
  ],

  'trending-up': [
    polyline('22 7 13.5 15.5 8.5 10.5 2 17'),
    polyline('16 7 22 7 22 13'),
  ],

  'trending-down': [
    polyline('22 17 13.5 8.5 8.5 13.5 2 7'),
    polyline('16 17 22 17 22 11'),
  ],

  'users': [
    p('M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'),
    circle(9, 7, 4),
    p('M23 21v-2a4 4 0 0 0-3-3.87'),
    p('M16 3.13a4 4 0 0 1 0 7.75'),
  ],

  'bar-chart': [
    line(12, 20, 12, 10),
    line(18, 20, 18, 4),
    line(6, 20, 6, 16),
  ],

  'bar-chart-2': [
    line(18, 20, 18, 10),
    line(12, 20, 12, 4),
    line(6, 20, 6, 16),
  ],

  'activity': [
    polyline('22 12 18 12 15 21 9 3 6 12 2 12'),
  ],

  'briefcase': [
    rect(2, 7, 20, 14, 2),
    p('M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16'),
  ],

  'package': [
    line(16.5, 9.4, 7.5, 4.21),
    p('M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'),
    polyline('3.27 6.96 12 12.01 20.73 6.96'),
    line(12, 22.08, 12, 12),
  ],

  'credit-card': [
    rect(1, 4, 22, 16, 2),
    line(1, 10, 23, 10),
  ],

  'clock': [
    circle(12, 12, 10),
    polyline('12 6 12 12 16 14'),
  ],

  'zap': [
    p('M13 2L3 14h9l-1 8 10-12h-9l1-8z'),
  ],

  'percent': [
    line(19, 5, 5, 19),
    circle(6.5, 6.5, 2.5),
    circle(17.5, 17.5, 2.5),
  ],

  'shopping-cart': [
    circle(9, 21, 1),
    circle(20, 21, 1),
    p('M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6'),
  ],

  'file-text': [
    p('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'),
    polyline('14 2 14 8 20 8'),
    line(16, 13, 8, 13),
    line(16, 17, 8, 17),
    polyline('10 9 9 9 8 9'),
  ],

  'layers': [
    ({ type: 'polygon', attrs: { points: '12 2 2 7 12 12 22 7 12 2' } }),
    polyline('2 17 12 22 22 17'),
    polyline('2 12 12 17 22 12'),
  ],

  'shield': [
    p('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'),
  ],

  'target': [
    circle(12, 12, 10),
    circle(12, 12, 6),
    circle(12, 12, 2),
  ],

  'award': [
    circle(12, 8, 7),
    polyline('8.21 13.89 7 23 12 20 17 23 15.79 13.88'),
  ],

  'pie-chart': [
    p('M21.21 15.89A10 10 0 1 1 8 2.83'),
    p('M22 12A10 10 0 0 0 12 2v10z'),
  ],

  'home': [
    p('M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'),
    polyline('9 22 9 12 15 12 15 22'),
  ],
};