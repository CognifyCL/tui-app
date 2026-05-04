export const RECONNECT_MAX_ATTEMPTS = 10;
export const RECONNECT_BASE_DELAY_MS = 1000;
export const RECONNECT_MAX_DELAY_MS = 30000;
export const SYNC_INTERVAL_MS = 10000;

export const CONNECTION_STATUS = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  RECONNECTING: 'RECONNECTING',
  ERROR: 'ERROR',
};

export const STORAGE_KEYS = {
  RECENT_HOSTS: '@kinetic/recent_hosts',
  DARK_MODE: '@kinetic/dark_mode',
  LOG_LEVEL: '@kinetic/log_level',
  SNIPPETS: '@kinetic/snippets',
};
