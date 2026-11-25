import type { ChangeEvent } from 'react';
import { CategoryMeta, ExpenseBucket } from '../types/finance';

export const CATEGORY_CATALOG: CategoryMeta[] = [
  // Gastos - Necesidades (50%)
  { name: 'Vivienda', type: 'expense', defaultBucket: 'needs', color: '#facc15' },
  { name: 'Alimentación', type: 'expense', defaultBucket: 'needs', color: '#fbbf24' },
  { name: 'Transporte', type: 'expense', defaultBucket: 'needs', color: '#818cf8' },
  { name: 'Servicios', type: 'expense', defaultBucket: 'needs', color: '#2dd4bf' },
  { name: 'Salud', type: 'expense', defaultBucket: 'needs', color: '#fb7185' },
  { name: 'Educación', type: 'expense', defaultBucket: 'needs', color: '#60a5fa' },

  // Gastos - Deseos (30%)
  { name: 'Ocio', type: 'expense', defaultBucket: 'wants', color: '#fbbf24' },
  { name: 'Restaurantes', type: 'expense', defaultBucket: 'wants', color: '#ef4444' },
  { name: 'Compras', type: 'expense', defaultBucket: 'wants', color: '#c084fc' },
  { name: 'Suscripciones', type: 'expense', defaultBucket: 'wants', color: '#fb923c' },
  { name: 'Viajes', type: 'expense', defaultBucket: 'wants', color: '#a78bfa' },
  { name: 'Otros Gastos', type: 'expense', defaultBucket: 'wants', color: '#c9a27a' },

  // Ingresos
  { name: 'Salario', type: 'income', color: '#fbbf24' },
  { name: 'Honorarios', type: 'income', color: '#facc15' },
  { name: 'Extras', type: 'income', color: '#2dd4bf' },
  { name: 'Rendimientos', type: 'income', color: '#38bdf8' },

  // Transferencias
  { name: 'Aporte a Meta', type: 'transfer', color: '#facc15' },
];

export function getDefaultBucketForCategory(category: string): ExpenseBucket {
  const found = CATEGORY_CATALOG.find((c) => c.name === category);
  return found?.defaultBucket ?? 'wants';
}

export function getCategoryColor(category: string): string {
  const found = CATEGORY_CATALOG.find((c) => c.name === category);
  return found?.color ?? '#64748b';
}

export function formatCurrency(value: number): string {
  const rounded = Math.round(value);
  const absFormatted = new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.abs(rounded));
  return rounded < 0 ? `-$${absFormatted}` : `$${absFormatted}`;
}

export function formatGroupedNumberInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10);
  if (Number.isNaN(num)) return '';
  return new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0,
  }).format(num);
}

export function parseGroupedNumber(formatted: string): number {
  const digits = formatted.replace(/\D/g, '');
  if (!digits) return 0;
  const parsed = parseInt(digits, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Keeps the caret at the same digit while regrouping thousands on each keystroke. */
export function formatGroupedNumberInputPreservingCaret(
  raw: string,
  caret: number
): { value: string; caret: number } {
  const digitsBeforeCaret = raw.slice(0, caret).replace(/\D/g, '').length;
  const value = formatGroupedNumberInput(raw);
  if (digitsBeforeCaret === 0) return { value, caret: 0 };

  let seen = 0;
  for (let i = 0; i < value.length; i += 1) {
    if (/\d/.test(value[i])) {
      seen += 1;
      if (seen === digitsBeforeCaret) return { value, caret: i + 1 };
    }
  }
  return { value, caret: value.length };
}

/** onChange handler for grouped number inputs that preserves the caret position. */
export function handleGroupedNumberChange(
  event: ChangeEvent<HTMLInputElement>,
  setValue: (value: string) => void
): void {
  const input = event.currentTarget;
  const caret = input.selectionStart ?? input.value.length;
  const result = formatGroupedNumberInputPreservingCaret(input.value, caret);
  setValue(result.value);
  requestAnimationFrame(() => input.setSelectionRange(result.caret, result.caret));
}

const SHORT_MONTHS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

const FULL_MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export function formatMonthShort(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const idx = parseInt(month, 10) - 1;
  if (!Number.isInteger(idx) || idx < 0 || idx > 11 || !year) return monthKey;
  return `${SHORT_MONTHS[idx]} ${year.slice(2)}`;
}

export function formatMonthLong(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const idx = parseInt(month, 10) - 1;
  if (!Number.isInteger(idx) || idx < 0 || idx > 11 || !year) return monthKey;
  return `${FULL_MONTHS[idx]} ${year}`;
}

export function formatDateSpanish(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  const idx = parseInt(month, 10) - 1;
  const dayNumber = parseInt(day, 10);
  if (!Number.isInteger(idx) || idx < 0 || idx > 11 || !Number.isInteger(dayNumber)) {
    return dateStr;
  }
  return `${dayNumber} ${SHORT_MONTHS[idx]} ${year}`;
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentMonthKey(): string {
  return getTodayISO().slice(0, 7);
}
