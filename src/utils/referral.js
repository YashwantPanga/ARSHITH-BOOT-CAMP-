// Remembers which referral link a visitor came from (for 30 days), and gives each browser an
// anonymous id so link clicks are counted once per visitor. Storage can be blocked (private mode),
// so every access is guarded and the site works without it.
const REF_KEY = 'cl_ref';
const VID_KEY = 'cl_vid';
const DAY = 24 * 60 * 60 * 1000;

const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } };

export function visitorId() {
  let id = read(VID_KEY);
  if (!id) {
    id = `v_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
    write(VID_KEY, id);
  }
  return id;
}

/** The last referral link opened (the latest link wins), if it is still within the window. */
export function storedReferral(days = 30) {
  try {
    const v = JSON.parse(read(REF_KEY) || 'null');
    if (!v?.code || Date.now() - v.at > days * DAY) return null;
    return v;
  } catch { return null; }
}

export function rememberReferral(code, referrerName = '') {
  write(REF_KEY, JSON.stringify({ code: String(code).toUpperCase(), referrerName, at: Date.now() }));
}

export function forgetReferral() {
  try { localStorage.removeItem(REF_KEY); } catch { /* ignore */ }
}

export const rupees = (paise, dp = 2) => `₹${(Number(paise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;
