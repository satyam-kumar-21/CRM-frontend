export type ThemeName = 'blue' | 'green' | 'pink' | 'purple' | 'orange';

export const THEME_OPTIONS: Array<{ value: ThemeName; label: string; emoji: string; bgColor: string; textColor: string; borderColor: string }> = [
  { value: 'blue', label: 'Blue (Default)', emoji: '🔵', bgColor: '#3b82f6', textColor: '#eff6ff', borderColor: '#3b82f6' },
  { value: 'green', label: 'Green', emoji: '🟢', bgColor: '#10b981', textColor: '#f0fdf4', borderColor: '#10b981' },
  { value: 'pink', label: 'Orange', emoji: '🟠 ', bgColor: '#f43f5e', textColor: '#fff5f7', borderColor: '#f43f5e' },
  { value: 'purple', label: 'Pink', emoji: '🩷', bgColor: '#a855f7', textColor: '#faf5ff', borderColor: '#a855f7' },
  { value: 'orange', label: 'Yellow', emoji: '🟡', bgColor: '#f97316', textColor: '#fff7ed', borderColor: '#f97316' },
];

const themeColorMap: Record<ThemeName, { primary: string; primaryHover: string; light: string; text: string; soft: string }> = {
  blue: { primary: '#3b82f6', primaryHover: '#2563eb', light: '#dbeafe', text: '#eff6ff', soft: 'rgba(59, 130, 246, 0.12)' },
  green: { primary: '#10b981', primaryHover: '#059669', light: '#d1fae5', text: '#f0fdf4', soft: 'rgba(16, 185, 129, 0.12)' },
  pink: { primary: '#f43f5e', primaryHover: '#e11d48', light: '#ffe4e8', text: '#fff5f7', soft: 'rgba(244, 63, 94, 0.12)' },
  purple: { primary: '#a855f7', primaryHover: '#9333ea', light: '#f3e8ff', text: '#faf5ff', soft: 'rgba(168, 85, 247, 0.12)' },
  orange: { primary: '#f97316', primaryHover: '#ea580c', light: '#fed7aa', text: '#fff7ed', soft: 'rgba(249, 115, 22, 0.12)' },
};

export function getStoredTheme(): ThemeName {
  if (typeof window === 'undefined') return 'blue';
  const saved = window.localStorage.getItem('crm-user-theme');
  return saved && ['blue', 'green', 'pink', 'purple', 'orange'].includes(saved) ? (saved as ThemeName) : 'blue';
}

export function getThemeColor(theme: ThemeName): string {
  return themeColorMap[theme]?.primary || '#3b82f6';
}

export function getThemeColors(theme: ThemeName) {
  return themeColorMap[theme] || themeColorMap.blue;
}

export function applyTheme(theme: ThemeName = 'blue') {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const colors = themeColorMap[theme];
  
  root.style.setProperty('--primary', colors.primary);
  root.style.setProperty('--primary-hover', colors.primaryHover);
  root.style.setProperty('--primary-light', colors.light);
  root.style.setProperty('--primary-text', colors.text);
  root.style.setProperty('--primary-soft', colors.soft);
  root.setAttribute('data-theme', theme);
  
  if (typeof window !== 'undefined') window.localStorage.setItem('crm-user-theme', theme);
}

export function isThemeValid(value: string | null | undefined): value is ThemeName {
  return !!value && ['blue', 'green', 'pink', 'purple', 'orange'].includes(value);
}
