import { useState, useCallback } from 'react';

/**
 * Custom hook for managing a fixed-size buffer of log entries.
 * @param {number} maxLogs Maximum number of logs to keep in memory.
 * @returns {object} { logs, log, clearLogs }
 */
export const useLogger = (maxLogs = 200) => {
  const [logs, setLogs] = useState([]);

  /**
   * Adds a new log entry to the state.
   * @param {string} message The log message.
   * @param {'info' | 'error' | 'debug' | 'success'} type The log type.
   */
  const log = useCallback((message, type = 'info') => {
    const newLog = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      message,
      type,
    };

    setLogs((prevLogs) => {
      const updatedLogs = [...prevLogs, newLog];
      // Keep only the last maxLogs entries
      if (updatedLogs.length > maxLogs) {
        return updatedLogs.slice(-maxLogs);
      }
      return updatedLogs;
    });
  }, [maxLogs]);

  /**
   * Clears all logs from the state.
   */
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return { logs, log, clearLogs };
};
