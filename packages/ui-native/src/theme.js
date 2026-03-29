import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStorage } from '@saintrocky/storage';
import { createNativeStorage } from '@saintrocky/storage/native';
import { getTokens } from '@saintrocky/design-tokens';

const THEME_STORAGE_KEY = 'theme-preference';
const themeStorage = createStorage(createNativeStorage({ storage: AsyncStorage }));

const ThemeContext = createContext(null);

function buildTheme(mode) {
  const tokens = getTokens(mode);
  return {
    mode: tokens.colorScheme,
    colors: {
      background: tokens.colors.background,
      foreground: tokens.colors.foreground,
      muted: tokens.colors.muted,
      card: tokens.colors.card,
      border: tokens.colors.border,
      borderStrong: tokens.colors.borderStrong,
      inputBackground: tokens.colors.input,
      primary: tokens.colors.primary,
      primaryText: tokens.colors.primaryText,
      error: tokens.colors.error
    },
    shell: {
      background: tokens.shell.background,
      backgroundSoft: tokens.shell.backgroundSoft,
      panel: tokens.shell.panel,
      border: tokens.shell.border,
      text: tokens.shell.text,
      textMuted: tokens.shell.textMuted,
      accent: tokens.shell.accent,
      accentStrong: tokens.shell.accentStrong
    },
    desktop: {
      backgroundStart: tokens.desktop.backgroundStart,
      backgroundEnd: tokens.desktop.backgroundEnd,
      surface: tokens.desktop.surface,
      surfaceStrong: tokens.desktop.surfaceStrong,
      sidebarSurface: tokens.desktop.sidebarSurface,
      border: tokens.desktop.border,
      text: tokens.desktop.text,
      textMuted: tokens.desktop.textMuted,
      kicker: tokens.desktop.kicker
    }
  };
}

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreference] = useState(null);

  useEffect(() => {
    let cancelled = false;
    themeStorage
      .get(THEME_STORAGE_KEY)
      .then((stored) => {
        if (cancelled) return;
        if (stored === 'light' || stored === 'dark') {
          setThemePreference(stored);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const effectiveMode = themePreference || systemScheme || 'light';
  const theme = useMemo(() => buildTheme(effectiveMode), [effectiveMode]);

  const setTheme = async (nextMode) => {
    const normalized = nextMode === 'dark' ? 'dark' : 'light';
    setThemePreference(normalized);
    try {
      await themeStorage.set(THEME_STORAGE_KEY, normalized);
    } catch {}
  };

  const toggleTheme = async () => {
    await setTheme(theme.mode === 'dark' ? 'light' : 'dark');
  };

  const value = useMemo(
    () => ({
      theme,
      themePreference,
      setTheme,
      toggleTheme
    }),
    [theme, themePreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export function createNavigationTheme(theme) {
  return {
    dark: theme.mode === 'dark',
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.card,
      text: theme.colors.foreground,
      border: theme.colors.border,
      notification: theme.colors.primary
    }
  };
}

