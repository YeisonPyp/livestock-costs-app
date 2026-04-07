import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'safeDate',
  standalone: true,
})
export class SafeDatePipe implements PipeTransform {
  transform(
    value: string | null | undefined,
    mode: 'date' | 'datetime' = 'date',
    style: 'short' | 'medium' | 'long' = 'medium'
  ): string {
    if (!value) return '-';

    let date: Date;

    // Caso 1: fecha simple YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      // Caso 2: fecha con hora
      // Normalizamos formato Django / PostgreSQL
      const normalized = value.replace(' ', 'T');
      date = new Date(normalized);
    }

    const options: Intl.DateTimeFormatOptions =
      mode === 'datetime'
        ? {
            dateStyle: style,
            timeStyle: 'short',
          }
        : {
            dateStyle: style,
          };

    return new Intl.DateTimeFormat('es-CO', options).format(date);
  }
}