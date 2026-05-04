import React, { createContext, useState, useRef, useCallback } from 'react';
import { resolveHost, BYPASS_HEADERS } from '../utils/url';
import { useLogger } from '../hooks/useLogger';
import { useHosts } from '../hooks/useHosts';
import { useWS } from '../hooks/useWS';

export const TerminalContext = createContext();

export const TerminalProvider = ({ children }) => {
  const [serverIp, setServerIp] = useState('');
  const [sessionName, setSessionName] = useState('default');
  const [sessions, setSessions] = useState([]);
  const [windows, setWindows] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { log, logs, clearLogs } = useLogger(200);
  const { recentHosts, addHost, deleteHost, editHost } = useHosts();
  
  const listeners = useRef([]);
  const addListener = useCallback((callback) => {
    listeners.current.push(callback);
    return () => { listeners.current = listeners.current.filter(l => l !== callback); };
  }, []);

  const onData = useCallback((data) => {
    listeners.current.forEach(callback => callback(data));
  }, []);

  const { ws, status, connect: connectWS, disconnect, send, reconnectAttempt } = useWS(onData, setWindows, log);

  const connect = useCallback((ip, session) => {
    const host = recentHosts.find(h => h.ip === ip);
    const token = host?.token || '';
    const { wsUrl } = resolveHost(ip);
    
    const urlWithToken = `${wsUrl}?session=${session}${token ? `&token=${token}` : ''}`;
    const options = {
      headers: {
        ...BYPASS_HEADERS,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    setServerIp(ip);
    setSessionName(session);
    connectWS(urlWithToken, options);
  }, [recentHosts, connectWS]);

  const sendInput = (content) => send({ type: 'input', content });
  const sendResize = (cols, rows) => send({ type: 'resize', cols, rows });
  const runTmuxCommand = (cmd) => send({ type: 'tmux-cmd', cmd });

  return (
    <TerminalContext.Provider value={{
      ws, status, reconnectAttempt, serverIp, sessionName, sessions, windows, isRefreshing, recentHosts,
      setServerIp, setSessionName, setSessions, setIsRefreshing,
      connect, disconnect, sendInput, sendResize, runTmuxCommand, addListener,
      addHost, deleteHost, editHost,
      logs, clearLogs, log,
    }}>
      {children}
    </TerminalContext.Provider>
  );
};
