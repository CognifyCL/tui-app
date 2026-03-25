import { useState, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Dev-console helper — zero overhead in production builds
// ---------------------------------------------------------------------------
const CONSOLE_METHOD = {
  DEBUG: 'debug',
  INFO:  'info',
  WARN:  'warn',
  ERROR: 'error',
};

// Level tags padded to the same width as ERROR (5 chars)
const LEVEL_TAG = {
  DEBUG: '[DEBUG]',
  INFO:  '[INFO] ',
  WARN:  '[WARN] ',
  ERROR: '[ERROR]',
};

/**
 * Emits a formatted line to the Expo / Metro terminal when __DEV__ is true.
 * Format: [TUI][LEVEL] HH:MM:SS.mmm  message  {data?}
 */
const devLog = (entryLevel, timestamp, message, data) => {
  if (!__DEV__) return;

  const d = new Date(timestamp);
  const hh  = String(d.getHours()).padStart(2, '0');
  const mm  = String(d.getMinutes()).padStart(2, '0');
  const ss  = String(d.getSeconds()).padStart(2, '0');
  const ms  = String(d.getMilliseconds()).padStart(3, '0');
  const time = `${hh}:${mm}:${ss}.${ms}`;

  const prefix = `[TUI]${LEVEL_TAG[entryLevel] ?? '[INFO] '} ${time}`;
  const method = CONSOLE_METHOD[entryLevel] ?? 'log';

  if (data !== undefined) {
    console[method](`${prefix}  ${message}`, data);
  } else {
    console[method](`${prefix}  ${message}`);
  }
};

const LOG_LEVEL_PRIORITY = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

/**
 * Maps useLogger `type` values to canonical level keys used for filtering.
 */
const TYPE_TO_LEVEL = {
  debug: 'DEBUG',
  info: 'INFO',
  success: 'INFO', // success is informational — always shown at INFO+
  warn: 'WARN',
  warning: 'WARN',
  error: 'ERROR',
};

/**
 * Custom hook for managing a fixed-size buffer of log entries.
 *
 * @param {number} maxLogs     Maximum number of logs to keep in memory.
 * @param {string} minLevel    Minimum log level to record: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'.
 *                             Entries below this level are silently dropped.
 *                             Defaults to 'DEBUG' (all logs recorded).
 * @returns {object} { logs, log, clearLogs }
 */
export const useLogger = (maxLogs = 200, minLevel = 'DEBUG') => {
  const [logs, setLogs] = useState([]);

  const minPriority = LOG_LEVEL_PRIORITY[minLevel] ?? 0;

  /**
   * Adds a new log entry if its level meets the minimum threshold.
   * @param {string} message The log message.
   * @param {'info' | 'error' | 'debug' | 'success' | 'warn'} type The log type.
   */
  const log = useCallback((message, type = 'info') => {
    const entryLevel = TYPE_TO_LEVEL[type?.toLowerCase()] ?? 'INFO';
    const entryPriority = LOG_LEVEL_PRIORITY[entryLevel] ?? 1;

    if (entryPriority < minPriority) return;

    const newLog = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      message,
      type,
    };

    devLog(entryLevel, newLog.timestamp, message);

    setLogs((prevLogs) => {
      const updatedLogs = [...prevLogs, newLog];
      if (updatedLogs.length > maxLogs) {
        return updatedLogs.slice(-maxLogs);
      }
      return updatedLogs;
    });
  }, [maxLogs, minPriority]);

  /**
   * Clears all logs from the state.
   */
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return { logs, log, clearLogs };
};
