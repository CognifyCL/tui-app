import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MD3DarkTheme } from 'react-native-paper';

export const kineticColors = {
  primary: '#52fd2e',
  onPrimary: '#0e5b00',
  primaryContainer: '#34e507',
  background: '#0e0e0e',
  surface: '#0e0e0e',
  surfaceContainer: '#1a1a1a',
  surfaceContainerLow: '#131313',
  surfaceContainerHigh: '#20201f',
  surfaceContainerHighest: '#262626',
  onBackground: '#ffffff',
  onSurface: '#ffffff',
  onSurfaceVariant: '#adaaaa',
  outline: '#767575',
  outlineVariant: '#484847',
  error: '#ff7351',
  errorContainer: '#b92902',
};

export const kineticTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: kineticColors.primary,
    onPrimary: kineticColors.onPrimary,
    primaryContainer: kineticColors.primaryContainer,
    background: kineticColors.background,
    surface: kineticColors.surface,
    onBackground: kineticColors.onBackground,
    onSurface: kineticColors.onSurface,
    onSurfaceVariant: kineticColors.onSurfaceVariant,
    outline: kineticColors.outline,
    outlineVariant: kineticColors.outlineVariant,
    error: kineticColors.error,
    errorContainer: kineticColors.errorContainer,
    surfaceVariant: kineticColors.surfaceContainerHighest,
  },
};

export const ThemeContext = createContext();

const STORAGE_KEYS = {
  DARK_MODE: '@cognifycl/dark_mode',
  LOG_LEVEL: '@cognifycl/log_level',
  FONT_SIZE: '@cognifycl/font_size',
};

export const LOG_LEVELS = ['DEBUG', 'INFO', 'WARN', 'ERROR'];

const LOG_LEVEL_PRIORITY = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [logLevel, setLogLevelState] = useState('DEBUG');
  const [fontSize, setFontSizeState] = useState(12);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [darkModeValue, logLevelValue, fontSizeValue] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.DARK_MODE),
          AsyncStorage.getItem(STORAGE_KEYS.LOG_LEVEL),
          AsyncStorage.getItem(STORAGE_KEYS.FONT_SIZE),
        ]);

        if (darkModeValue !== null) {
          setIsDarkMode(JSON.parse(darkModeValue));
        }
        if (logLevelValue !== null && LOG_LEVELS.includes(logLevelValue)) {
          setLogLevelState(logLevelValue);
        }
        if (fontSizeValue !== null) {
          const parsed = parseInt(fontSizeValue, 10);
          if (!isNaN(parsed)) setFontSizeState(parsed);
        }
      } catch (e) {
        // Silently fall back to defaults
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  const toggleDarkMode = useCallback(async () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DARK_MODE, JSON.stringify(next));
    } catch (e) {
      // ignore persist error
    }
  }, [isDarkMode]);

  const setLogLevel = useCallback(async (level) => {
    if (!LOG_LEVELS.includes(level)) return;
    setLogLevelState(level);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LOG_LEVEL, level);
    } catch (e) {
      // ignore persist error
    }
  }, []);

  const setFontSize = useCallback(async (size) => {
    setFontSizeState(size);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FONT_SIZE, String(size));
    } catch (e) {
      // ignore persist error
    }
  }, []);

  const isLogAllowed = useCallback((type) => {
    // Map useLogger types to LOG_LEVEL_PRIORITY keys
    const typeMap = {
      debug: 'DEBUG',
      info: 'INFO',
      success: 'INFO', // success is informational
      warn: 'WARN',
      warning: 'WARN',
      error: 'ERROR',
    };
    const normalized = typeMap[type?.toLowerCase()] ?? 'INFO';
    return (LOG_LEVEL_PRIORITY[normalized] ?? 1) >= (LOG_LEVEL_PRIORITY[logLevel] ?? 0);
  }, [logLevel]);

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleDarkMode,
        logLevel,
        setLogLevel,
        isLogAllowed,
        fontSize,
        setFontSize,
        isLoaded,
        themeStorageKeys: STORAGE_KEYS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);
