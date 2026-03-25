import { useState, useCallback } from 'react';

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
