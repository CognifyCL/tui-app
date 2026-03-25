/**
 * Resolves a host/URL input into structured URLs.
 * @param {string} input - The host or URL input from the user.
 * @returns {{ httpUrl: string, wsUrl: string }}
 */
export function resolveHost(input) {
  if (!input) return { httpUrl: '', wsUrl: '' };

  let sanitized = input.trim();
  
  let protocol = 'http';
  let address = sanitized;

  // Match protocol if present
  const protocolMatch = sanitized.match(/^([a-z]+):\/\/(.*)$/i);
  if (protocolMatch) {
    protocol = protocolMatch[1].toLowerCase();
    address = protocolMatch[2];
  }

  // Remove trailing slashes and paths from address
  address = address.split('/')[0];

  // Detect if port is present
  // For hostnames/IPv4: contains a colon
  // For IPv6: contains a colon AFTER the closing bracket
  const hasPort = address.includes(':') && 
                  (!address.includes('[') || address.lastIndexOf(':') > address.lastIndexOf(']'));
  
  // Avoid adding port to raw IPv6 without brackets as it's ambiguous
  const isRawIPv6 = !address.includes('[') && (address.match(/:/g) || []).length > 1;

  if (!hasPort && !isRawIPv6) {
    address = `${address}:4000`;
  }

  const httpUrl = `${protocol}://${address}`;
  const wsProtocol = protocol === 'https' ? 'wss' : 'ws';
  const wsUrl = `${wsProtocol}://${address}`;

  return { httpUrl, wsUrl };
}
