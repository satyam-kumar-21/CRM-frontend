const BUSINESS_TIMEZONE = 'Asia/Kolkata';

export function getBusinessDateString(value: Date | string = new Date()) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function getBusinessMonthString(value: Date | string = new Date()) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
  }).format(date);
}

export function getBusinessMonthEndString(month: string) {
  const [year, monthNumber] = normalizeBusinessDateString(month).slice(0, 7).split('-').map(Number);
  if (!year || !monthNumber) return '';
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return `${year}-${String(monthNumber).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

export function normalizeBusinessDateString(value?: string) {
  return value?.trim().slice(0, 10) || '';
}

export type BusinessDateFilters = { employee?: string; customer?: string; month: string; from: string; to: string };

export function matchesBusinessDateFilters(value: string | undefined, filters: BusinessDateFilters) {
  if (!value) return !filters.month && !filters.from && !filters.to;
  const date = normalizeBusinessDateString(value);
  return (!filters.month || date.startsWith(filters.month))
    && (!filters.from || date >= filters.from)
    && (!filters.to || date <= filters.to);
}
