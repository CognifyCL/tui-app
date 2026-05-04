import { useState, useEffect } from 'react';
import { useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { resolveHost } from '../utils/url';

export function useQRScanner({ visible, onScanned }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible) {
      setScanned(false);
      if (!permission || !permission.granted) {
        requestPermission();
      }
    }
  }, [visible, permission]);

  const handleBarCodeScanned = ({ data }) => {
    if (scanned || !data) return;
    setScanned(true);

    try {
      const { httpUrl, token, id } = resolveHost(data);

      if (httpUrl && token) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onScanned({ url: httpUrl, token, id: id || 'Remote Proxy' });
      } else {
        const payload = JSON.parse(data);
        if (payload.url && payload.token) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onScanned({
            url: payload.url,
            token: payload.token,
            id: payload.id || 'Remote Proxy',
          });
        } else {
          throw new Error('Invalid QR payload');
        }
      }
    } catch (e) {
      console.error('[QR] Failed to parse data:', data, e);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setScanned(false);
    }
  };

  return {
    permission,
    requestPermission,
    scanned,
    handleBarCodeScanned,
  };
}
