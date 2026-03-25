import React, { createContext, useState, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolveHost } from '../utils/url';
import { useLogger } from '../hooks/useLogger';

export const TerminalContext = createContext();

const STORAGE_KEYS = {
  RECENT_HOSTS: '@cognifycl/recent_hosts',
};

const RECONNECT_MAX_ATTEMPTS = 10;
const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 30000;

export const TerminalProvider = ({ children }) => {
  const [ws, setWs] = useState(null);
  const [status, setStatus] = useState('Disconnected');
  const [serverIp, setServerIp] = useState('');
  const [sessionName, setSessionName] = useState('default');
  const [sessions, setSessions] = useState([]);
  const [windows, setWindows] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recentHosts, setRecentHosts] = useState([]);
  const { log, logs, clearLogs } = useLogger();

  const listeners = useRef([]);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectParamsRef = useRef(null); // { ip, session }
  const manualDisconnectRef = useRef(false);

  const addListener = (callback) => {
    listeners.current.push(callback);
    return () => {
      listeners.current = listeners.current.filter(l => l !== callback);
    };
  };

  const notifyListeners = (data) => {
    listeners.current.forEach(callback => callback(data));
  };

  const loadHosts = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_HOSTS);
      if (data) {
        const hosts = JSON.parse(data);
        const sorted = hosts.sort((a, b) => b.lastUsed - a.lastUsed);
        setRecentHosts(sorted);
        if (sorted.length > 0 && !serverIp) {
          setServerIp(sorted[0].ip);
        }
      }
    } catch (error) {
      log(`Error loading hosts: ${error.message}`, 'error');
    }
  };

  const saveHost = async (ip) => {
    try {
      const existing = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_HOSTS);
      let hosts = existing ? JSON.parse(existing) : [];
      
      const index = hosts.findIndex(h => h.ip === ip);
      if (index !== -1) {
        hosts[index].lastUsed = Date.now();
      } else {
        hosts.push({ ip, lastUsed: Date.now() });
      }

      const sorted = hosts.sort((a, b) => b.lastUsed - a.lastUsed).slice(0, 10);
      setRecentHosts(sorted);
      await AsyncStorage.setItem(STORAGE_KEYS.RECENT_HOSTS, JSON.stringify(sorted));
    } catch (error) {
      log(`Error saving host: ${error.message}`, 'error');
    }
  };

  useEffect(() => {
    loadHosts();
  }, []);

  const cancelReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const connectWebSocket = (ip, session) => {
    const { wsUrl } = resolveHost(ip);
    log(`Connecting to ${wsUrl} (session: ${session})...`, 'info');

    try {
      const socket = new WebSocket(`${wsUrl}?session=${session}`);

      socket.onopen = () => {
        reconnectAttemptRef.current = 0;
        setStatus(`Connected: ${session}`);
        setWs(socket);
        setServerIp(ip);
        setSessionName(session);
        saveHost(ip);
        log(`WebSocket Connected to ${wsUrl}`, 'success');
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'tmux-windows') {
            setWindows(msg.data);
            return;
          }
        } catch (e) {
          // Not JSON or missing type, treat as raw PTY data
        }
        notifyListeners(event.data);
      };

      socket.onerror = (e) => {
        setStatus(`Error: Check Host/Port`);
        log(`WebSocket Error: Check if server is running on ${wsUrl}`, 'error');
      };

      socket.onclose = () => {
        setWs(null);
        setWindows([]);

        if (manualDisconnectRef.current) {
          setStatus('Disconnected');
          log('WebSocket Disconnected', 'info');
          return;
        }

        const attempt = reconnectAttemptRef.current + 1;
        if (attempt > RECONNECT_MAX_ATTEMPTS) {
          setStatus('Disconnected');
          log('WebSocket Disconnected — max reconnect attempts reached', 'error');
          return;
        }

        reconnectAttemptRef.current = attempt;
        const delay = Math.min(
          RECONNECT_BASE_DELAY_MS * Math.pow(2, attempt - 1),
          RECONNECT_MAX_DELAY_MS
        );
        setStatus(`Reconnecting (${attempt}/${RECONNECT_MAX_ATTEMPTS})...`);
        log(`WebSocket closed — reconnecting in ${delay / 1000}s (attempt ${attempt}/${RECONNECT_MAX_ATTEMPTS})`, 'info');

        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = null;
          const params = reconnectParamsRef.current;
          if (params && !manualDisconnectRef.current) {
            connectWebSocket(params.ip, params.session);
          }
        }, delay);
      };
    } catch (error) {
      log(`Connection failed: ${error.message}`, 'error');
      setStatus('Connection Failed');
    }
  };

  const connect = (ip, session) => {
    cancelReconnect();
    manualDisconnectRef.current = false;
    reconnectAttemptRef.current = 0;
    reconnectParamsRef.current = { ip, session };

    if (ws) ws.close();

    setStatus('Connecting...');
    connectWebSocket(ip, session);
  };

  const disconnect = () => {
    cancelReconnect();
    manualDisconnectRef.current = true;
    reconnectAttemptRef.current = 0;
    if (ws) {
      ws.close();
      setWs(null);
      setWindows([]);
      setStatus('Disconnected');
    }
  };

  useEffect(() => {
    return () => {
      cancelReconnect();
    };
  }, []);

  const sendInput = (content) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'input', content }));
    }
  };

  const sendResize = (cols, rows) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'resize', cols, rows }));
    }
  };

  const runTmuxCommand = (cmd) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'tmux-cmd', cmd }));
    }
  };

  return (
    <TerminalContext.Provider value={{
      ws, status, serverIp, sessionName, sessions, windows, isRefreshing, recentHosts,
      setServerIp, setSessionName, setSessions, setIsRefreshing,
      connect, disconnect, sendInput, sendResize, runTmuxCommand, addListener,
      logs, clearLogs
    }}>
      {children}
    </TerminalContext.Provider>
  );
};
