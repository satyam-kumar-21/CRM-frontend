import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function maskSensitiveValue(value?: string | null) {
  const normalized = value?.trim();
  if (!normalized) return '—';

  if (normalized.length <= 4) {
    const visible = normalized.slice(0, 1);
    const hidden = '*'.repeat(Math.max(3, normalized.length));
    return `${visible}${hidden}${normalized.slice(-1)}`;
  }

  const start = normalized.slice(0, 2);
  const end = normalized.slice(-2);
  const hidden = '*'.repeat(Math.max(4, normalized.length - 4));
  return `${start}${hidden}${end}`;
}