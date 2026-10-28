import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as supabase from './lib/supabaseStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ARB_DB_FILE lets tests run against a throw-away copy instead of the real database.
const DB_FILE = process.env.ARB_DB_FILE || path.join(__dirname, 'data', 'db.json');

// With SUPABASE_URL + SUPABASE_SERVICE_KEY set, data lives in Supabase and this process keeps a
// working copy in memory; otherwise the local JSON file is the database (tests always use the file).
const useSupabase = () => supabase.supabaseConfigured() && !process.env.ARB_DB_FILE;
let memory = null;       // JSON string of the current database (Supabase mode)
let synced = {};         // collection -> JSON string last saved to Supabase
let pending = null;      // debounce timer
let writing = Promise.resolve();

export function storageMode() {
  return useSupabase() ? 'supabase' : 'file';
}

/** False while the Supabase copy is still loading (or cannot be reached); the file is always ready. */
export function dbReady() {
  return !useSupabase() || memory !== null;
}

/** Loads the database before the server starts. Seeds Supabase from db.json on the very first run. */
export async function initDb() {
  if (!useSupabase()) return 'file';
  let data = await supabase.loadAll();
  if (!data) {
    data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    console.log(`Supabase is empty - uploading ${path.basename(DB_FILE)} (${Object.keys(data).length} collections)...`);
    await supabase.upsert(data);
  }
  memory = JSON.stringify(data);
  synced = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, JSON.stringify(v)]));
  return 'supabase';
}

export function getDb() {
  if (useSupabase()) {
    if (memory === null) throw new Error('Database not loaded yet (initDb was not awaited).');
    return JSON.parse(memory); // a fresh copy each call, exactly like reading the file
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database file:', err);
    throw err;
  }
}

export function saveDb(data) {
  if (useSupabase()) {
    memory = JSON.stringify(data);
    scheduleSync();
    return true;
  }
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing database file:', err);
    throw err;
  }
}

function scheduleSync() {
  clearTimeout(pending);
  pending = setTimeout(() => { pending = null; flushDb(); }, 250);
}

/** Sends changed collections to Supabase. Writes run one at a time, in order. */
export function flushDb() {
  if (!useSupabase() || memory === null) return Promise.resolve();
  clearTimeout(pending);
  pending = null;
  writing = writing.then(async () => {
    const data = JSON.parse(memory);
    const changed = {};
    for (const [k, v] of Object.entries(data)) {
      const s = JSON.stringify(v);
      if (synced[k] !== s) changed[k] = v;
    }
    const removed = Object.keys(synced).filter(k => !(k in data));
    if (!Object.keys(changed).length && !removed.length) return;
    try {
      await supabase.upsert(changed);
      await supabase.removeKeys(removed);
      for (const k of Object.keys(changed)) synced[k] = JSON.stringify(changed[k]);
      for (const k of removed) delete synced[k];
    } catch (err) {
      console.error('Saving to Supabase failed, will retry:', err.message);
      setTimeout(scheduleSync, 5000);
    }
  });
  return writing;
}

export function logActivity({ adminId = 'ARB-ADMIN-001', action, target, details, ipAddress = '127.0.0.1', device = 'Desktop Chrome' }) {
  const db = getDb();
  if (!db.activityLogs) db.activityLogs = [];

  const newLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    adminId,
    action,
    target,
    details: details || '',
    timestamp: new Date().toISOString(),
    ipAddress,
    device
  };

  db.activityLogs.unshift(newLog);
  saveDb(db);
  return newLog;
}
