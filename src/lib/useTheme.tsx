'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { ThemeName } from './theme';
import { getStoredTheme, getThemeColors } from './theme';

interface ThemeContextType {
  theme: ThemeName;
  colors: ReturnType<typeof getThemeColors>;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>('blue');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(getStoredTheme());
    setMounted(true);
  }, []);

  if (!mounted) return <>{children}</>;

  return (
    <ThemeContext.Provider value={{ theme, colors: getThemeColors(theme), setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return { theme: getStoredTheme(), colors: getThemeColors(getStoredTheme()), setTheme: () => {} };
  }
  return context;
}

export function useThemeColor() {
  const { colors } = useTheme();
  return colors.primary;
}

export function useThemeStyles() {
  const { colors } = useTheme();
  return {
    backgroundColor: colors.primary,
    color: 'white',
    borderColor: colors.primary,
  };
}
