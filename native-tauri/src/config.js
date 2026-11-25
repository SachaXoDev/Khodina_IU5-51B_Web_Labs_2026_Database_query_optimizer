export function lanOrigin(value, name, protocols = ['http:']) {
  const message = `${name} must be an ${protocols.length === 1 ? 'HTTP' : 'HTTP(S)'} origin with an RFC 1918 IPv4 address, e.g. http://192.168.1.23:3108 (no /api).`;
  let url;
  try {
    url = new URL(value?.trim());
  } catch {
    throw new Error(message);
  }
  // Check the original input against the canonical origin too, to reject credentials,
  // paths, queries, alternate IP representations, and accidental URL pattern syntax.
  if (!protocols.includes(url.protocol) || ![url.origin, `${url.origin}/`].includes(value.trim())) {
    throw new Error(message);
  }
  const octets = url.hostname.split('.');
  if (octets.length === 4 && octets.every((part) => /^\d{1,3}$/.test(part))) {
    const [a, b] = octets.map(Number);
    if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) return url;
  }
  throw new Error(message);
}

export function config(api, media) {
  const apiUrl = lanOrigin(api, 'VITE_API_URL');
  const mediaUrl = lanOrigin(media || `http://${apiUrl.hostname}:9000`, 'VITE_MEDIA_URL', ['http:', 'https:']);
  return { apiOrigin: apiUrl.origin, mediaOrigin: mediaUrl.origin };
}
