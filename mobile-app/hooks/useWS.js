import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  RECONNECT_MAX_ATTEMPTS, 
  RECONNECT_BASE_DELAY_MS, 
  RECONNECT_MAX_DELAY_MS,
  CONNECTION_STATUS
} from '../config/constants';

export const useWS = (onData, onWindowsUpdate, log) => {
  const [ws, setWs] = useState(null);
  const [status, setStatus] = useState(CONNECTION_STATUS.DISCONNECTED);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const manualDisconnectRef = useRef(false);

  const connect = useCallback((url, options = {}) => {
    if (ws) ws.close();
    manualDisconnectRef.current = false;
    setStatus(CONNECTION_STATUS.CONNECTING);
    
    const socket = new WebSocket(url, null, options);

    socket.onopen = () => {
      reconnectAttemptRef.current = 0;
      setStatus(CONNECTION_STATUS.CONNECTED);
      setWs(socket);
      log('WebSocket Connected', 'success');
      socket.send(JSON.stringify({ type: 'get-windows' }));
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'tmux-windows') {
          onWindowsUpdate(msg.data);
          return;
        }
      } catch (e) {}
      onData(event.data);
    };

    socket.onerror = (e) => {
      setStatus(CONNECTION_STATUS.ERROR);
      log('WebSocket Error', 'error');
    };

    socket.onclose = (event) => {
      setWs(null);
      if (manualDisconnectRef.current) {
        setStatus(CONNECTION_STATUS.DISCONNECTED);
        return;
      }

      const attempt = reconnectAttemptRef.current + 1;
      if (attempt > RECONNECT_MAX_ATTEMPTS) {
        setStatus(CONNECTION_STATUS.DISCONNECTED);
        log('Max reconnect attempts reached', 'error');
        return;
      }

      reconnectAttemptRef.current = attempt;
      const delay = Math.min(
        RECONNECT_BASE_DELAY_MS * Math.pow(2, attempt - 1),
        RECONNECT_MAX_DELAY_MS
      );
      setStatus(CONNECTION_STATUS.RECONNECTING);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect(url, options);
      }, delay);
    };
  }, [ws, log, onData, onWindowsUpdate]);

  const disconnect = useCallback(() => {
    manualDisconnectRef.current = true;
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (ws) ws.close();
    setWs(null);
    setStatus(CONNECTION_STATUS.DISCONNECTED);
  }, [ws]);

  const send = useCallback((data) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }, [ws]);

  return { ws, status, connect, disconnect, send, reconnectAttempt: reconnectAttemptRef.current };
};
