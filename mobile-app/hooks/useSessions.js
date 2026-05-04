import { useCallback } from 'react';
import { useTerminal } from './useTerminal';
import { resolveHost, BYPASS_HEADERS } from '../utils/url';
import * as Haptics from 'expo-haptics';

export function useSessions() {
  const {
    serverIp,
    recentHosts,
    sessions,
    setSessions,
    isRefreshing,
    setIsRefreshing,
    log,
  } = useTerminal();

  const fetchSessions = useCallback(async (overrideIp, overrideToken) => {
    const targetIp = overrideIp || serverIp;
    if (!targetIp) {
      log('No host configured', 'error');
      return;
    }

    const { httpUrl } = resolveHost(targetIp);
    const token = overrideToken || recentHosts.find(h => h.ip === targetIp)?.token || '';

    setIsRefreshing(true);
    const urlWithToken = `${httpUrl}/sessions${token ? `?token=${token}` : ''}`;

    const headers = {
      ...BYPASS_HEADERS,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };

    log(`Fetching sessions from ${httpUrl}...`, 'info');

    try {
      const response = await fetch(urlWithToken, { headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setSessions(data);
      log(`Fetched ${data.length} sessions`, 'success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      log(`Fetch error: ${error.message}`, 'error');
      setSessions([]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsRefreshing(false);
    }
  }, [serverIp, recentHosts, log, setSessions, setIsRefreshing]);

  return { sessions, isRefreshing, fetchSessions };
}
