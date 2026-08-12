const BUSINESS_TIMEZONE = 'Asia/Kolkata';

export function getBusinessDateString(value: Date | string = new Date()): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(d.getTime())) return '';

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(d);
  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  const day = Number(parts.find((p) => p.type === 'day')?.value);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value || '0');

  const localDate = new Date(Date.UTC(year, month - 1, day));
  if (hour < 12) {
    localDate.setUTCDate(localDate.getUTCDate() - 1);
  }
  const bYear = localDate.getUTCFullYear();
  const bMonth = String(localDate.getUTCMonth() + 1).padStart(2, '0');
  const bDay = String(localDate.getUTCDate()).padStart(2, '0');
  return `${bYear}-${bMonth}-${bDay}`;
}

export function getBusinessMonthString(value: Date | string = new Date()): string {
  const dateStr = getBusinessDateString(value);
  return dateStr.slice(0, 7);
}

export function getBusinessMonthEndString(month: string): string {
  const [year, monthNumber] = normalizeBusinessDateString(month).slice(0, 7).split('-').map(Number);
  if (!year || !monthNumber) return '';
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return `${year}-${String(monthNumber).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

export function normalizeBusinessDateString(value?: string): string {
  if (!value) return '';
  // If value is a full ISO date string, convert to Business Date string
  if (value.includes('T') || value.length > 10) {
    return getBusinessDateString(value);
  }
  return value.trim().slice(0, 10);
}

export type BusinessDateFilters = { employee?: string; customer?: string; month: string; from: string; to: string };

export function matchesBusinessDateFilters(value: string | undefined, filters: BusinessDateFilters): boolean {
  if (!value) return !filters.month && !filters.from && !filters.to;
  const itemBusinessDate = normalizeBusinessDateString(value);
  return (!filters.month || itemBusinessDate.startsWith(filters.month))
    && (!filters.from || itemBusinessDate >= filters.from)
    && (!filters.to || itemBusinessDate <= filters.to);
}
