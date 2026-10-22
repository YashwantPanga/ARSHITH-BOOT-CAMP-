// Downloads the live Supabase database into a local JSON file (default: backups/db-<date>.json).
// Usage: npm run db:backup [-- output.json]
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { supabaseConfigured, loadAll } from '../server/lib/supabaseStore.js';

if (!supabaseConfigured()) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env first.');
  process.exit(1);
}
const data = await loadAll();
if (!data) { console.error('Supabase has no data yet.'); process.exit(1); }
const out = process.argv[2] || path.join('backups', `db-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`);
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
fs.writeFileSync(out, JSON.stringify(data, null, 2));
console.log(`Saved ${Object.keys(data).length} collections to ${out}`);
