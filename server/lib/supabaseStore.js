// Optional Supabase (Postgres) storage for the app database.
// The whole database stays one JSON document; each top-level collection (students, certificates, ...)
// is one row of the `app_state` table, so no route has to change. Uses Supabase's REST API directly.

const TABLE = 'app_state';

export function supabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
}

function headers(extra = {}) {
  const key = process.env.SUPABASE_SERVICE_KEY;
  const h = { apikey: key, 'Content-Type': 'application/json', ...extra };
  // Legacy service_role keys are JWTs and also go in Authorization; new sb_secret_ keys only need apikey.
  if (key.startsWith('eyJ')) h.Authorization = `Bearer ${key}`;
  return h;
}

const endpoint = (query = '') => `${process.env.SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/${TABLE}${query}`;

async function check(res, what) {
  // A web page instead of data: SUPABASE_URL is not the project's API address (e.g. the dashboard link)
  if (/text\/html/i.test(res.headers.get('content-type') || '')) {
    throw new Error(`SUPABASE_URL does not point to a Supabase project API - it should look like https://<project-id>.supabase.co (not the supabase.com/dashboard link).`);
  }
  if (res.ok) return res;
  const body = await res.text().catch(() => '');
  if (res.status === 401 || res.status === 403 || /invalid api key|Invalid API key|apikey/i.test(body)) {
    throw new Error(`Supabase did not accept SUPABASE_SERVICE_KEY (${res.status}) - the key is wrong or was deleted. Create a secret key in Supabase > Project Settings > API Keys and run: bash scripts/set-supabase.sh ask`);
  }
  if (res.status === 404 || /relation .* does not exist|Could not find the table/i.test(body)) {
    throw new Error(`Supabase table "${TABLE}" is missing. Run supabase/setup.sql in the Supabase SQL Editor first.`);
  }
  throw new Error(`Supabase ${what} failed (${res.status}): ${body.slice(0, 300)}`);
}

/** Reads every collection. Returns null when the table is empty (first run). */
export async function loadAll() {
  const res = await check(await fetch(endpoint('?select=key,data'), { headers: headers() }), 'read');
  const rows = await res.json();
  if (!rows.length) return null;
  return Object.fromEntries(rows.map(r => [r.key, r.data]));
}

/** Inserts or updates the given collections ({ key: data }). */
export async function upsert(collections) {
  const rows = Object.entries(collections).map(([key, data]) => ({ key, data, updated_at: new Date().toISOString() }));
  if (!rows.length) return;
  await check(await fetch(endpoint('?on_conflict=key'), {
    method: 'POST',
    headers: headers({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify(rows)
  }), 'save');
}

export async function removeKeys(keys) {
  if (!keys.length) return;
  const list = keys.map(k => `"${k.replace(/"/g, '')}"`).join(',');
  await check(await fetch(endpoint(`?key=in.(${encodeURIComponent(list)})`), { method: 'DELETE', headers: headers() }), 'delete');
}
