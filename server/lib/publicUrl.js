import os from 'os';

// Public address used in links (emails) and certificate QR codes. "localhost" in a link or QR code
// cannot be opened from another device, so when the site runs on a computer we use its
// local-network address. Set PUBLIC_SITE_URL (e.g. https://learn.example.com) in production.

export function lanAddress() {
  const candidates = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const ni of list || []) {
      if (ni.family === 'IPv4' && !ni.internal) candidates.push(ni.address);
    }
  }
  const isPrivate = (ip) => /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip);
  return candidates.find(isPrivate) || candidates[0] || null;
}

/** { publicUrl, source } for an incoming request. */
export function publicBase(req) {
  const configured = (process.env.PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');
  if (configured) return { publicUrl: configured, source: 'PUBLIC_SITE_URL' };
  const host = String(req?.headers?.host || `localhost:${process.env.PORT || 5000}`);
  const port = host.includes(':') ? host.split(':').pop() : (process.env.PORT || 5000);
  const local = /^(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(host);
  const ip = local ? lanAddress() : null;
  return { publicUrl: ip ? `http://${ip}:${port}` : `${req?.protocol || 'http'}://${host}`, source: ip ? 'lan' : 'request' };
}
