import { Platform } from 'react-native';

export const C = {
  bg: '#0e0e0e',
  surface: '#131313',
  surfaceHigh: '#20201f',
  primary: '#52fd2e',
  onPrimary: '#0e5b00',
  muted: '#adaaaa',
  outline: '#484847',
  error: '#ff7351',
  errorContainer: '#b92902',
  warn: '#eba300',
  warnContainer: '#7f5600',

  // Text
  text: '#ffffff',

  // Opacity variants
  primaryFaint: 'rgba(82,253,46,0.1)',
  mutedFaint: 'rgba(173,170,170,0.05)',
  outlineFaint: 'rgba(72,72,71,0.3)',
  overlay: 'rgba(0,0,0,0.5)',
  overlayDark: 'rgba(0,0,0,0.7)',
};

export const MONO = Platform.OS === 'ios' ? 'Menlo' : 'monospace';
