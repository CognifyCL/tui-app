import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import { useTerminal } from './useTerminal';
import { resolveHost } from '../utils/url';

export function useDeepLinks() {
  const { addHost, setServerIp } = useTerminal();
  const lastProcessedUrl = useRef(null);

  useEffect(() => {
    const handleUrl = (url) => {
      // Prevent infinite loops if the same URL is triggered multiple times
      if (!url || url === lastProcessedUrl.current) return;
      
      // Basic check to see if it's our scheme or a magic link
      if (!url.includes('kinetic://') && !url.includes('tui-app://') && !url.includes('#token=')) return;

      lastProcessedUrl.current = url;
      
      const { httpUrl, token, id } = resolveHost(url);
      if (httpUrl) {
        const cleanIp = httpUrl.replace(/^https?:\/\//, '');
        addHost({ name: id || 'Remote Proxy', ip: cleanIp, token });
        setServerIp(cleanIp);
        console.log('[DEEP_LINK] Applied:', cleanIp);
      }
    };

    // Handle initial URL (app cold start)
    Linking.getInitialURL().then(url => {
      if (url) handleUrl(url);
    });

    // Handle incoming URLs (app in background/foreground)
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, [addHost, setServerIp]);
}
