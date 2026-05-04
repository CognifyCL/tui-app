export const TUNNEL_DOMAINS = ['.loca.lt', '.trycloudflare.com'];

export const BYPASS_HEADERS = { 
  'Bypass-Tunnel-Reminder': 'true', 
  'bypass-tunnel-reminder': 'true' 
};

/**
 * Resolves a host/URL input into structured URLs and metadata.
 * Supports 'Magic Links' with fragments: https://host.com/#token=123&id=my-pc
 * @param {string} input - The host or URL input from the user.
 * @returns {{ httpUrl: string, wsUrl: string, token?: string, id?: string }}
 */
export function resolveHost(input) {
  if (!input) return { httpUrl: '', wsUrl: '' };

  let sanitized = input.trim();
  let token = undefined;
  let id = undefined;

  // Handle Magic Links (URL#token=...&id=...)
  if (sanitized.includes('#token=')) {
    const parts = sanitized.split('#');
    sanitized = parts[0];
    const fragment = parts[1];
    
    // Manual fragment parsing
    const params = fragment.split('&');
    params.forEach(p => {
      const [key, value] = p.split('=');
      if (key === 'token') token = value;
      if (key === 'id') id = value;
    });
  }
  
  let protocol = 'http';
  let address = sanitized;

  // Match protocol if present
  const protocolMatch = sanitized.match(/^([a-z]+):\/\/(.*)$/i);
  if (protocolMatch) {
    protocol = protocolMatch[1].toLowerCase();
    address = protocolMatch[2];
  }

  // Normalize custom scheme to standard protocols
  if (protocol === 'kinetic' || protocol === 'tui-app') {
    protocol = 'http';
  }

  // Remove trailing slashes and paths from address
  address = address.split('/')[0];

  // Detect if port is present
  const hasPort = address.includes(':') && 
                  (!address.includes('[') || address.lastIndexOf(':') > address.lastIndexOf(']'));
  
  const isRawIPv6 = !address.includes('[') && (address.match(/:/g) || []).length > 1;

  // Detect if it's a tunnel URL
  const isTunnel = TUNNEL_DOMAINS.some(domain => address.endsWith(domain));

  // Force HTTPS/WSS for tunnel domains
  if (isTunnel) {
    protocol = 'https';
  }

  if (!hasPort && !isRawIPv6 && !isTunnel) {
    address = `${address}:4000`;
  }

  const httpUrl = `${protocol}://${address}`;
  const wsProtocol = protocol === 'https' ? 'wss' : 'ws';
  const wsUrl = `${wsProtocol}://${address}`;

  return { httpUrl, wsUrl, token, id };
}
