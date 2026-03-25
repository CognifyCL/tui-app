import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

const STORAGE_KEYS = {
  DARK_MODE: '@cognifycl/dark_mode',
  LOG_LEVEL: '@cognifycl/log_level',
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
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [darkModeValue, logLevelValue] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.DARK_MODE),
          AsyncStorage.getItem(STORAGE_KEYS.LOG_LEVEL),
        ]);

        if (darkModeValue !== null) {
          setIsDarkMode(JSON.parse(darkModeValue));
        }
        if (logLevelValue !== null && LOG_LEVELS.includes(logLevelValue)) {
          setLogLevelState(logLevelValue);
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
        isLoaded,
        themeStorageKeys: STORAGE_KEYS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);
