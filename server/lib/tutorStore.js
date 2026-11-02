// Saved AI-tutor answers, kept outside the main database: every request reads the whole main
// database, so thousands of explanations there would slow the entire site down. Here each answer is
// its own small record - one file next to the database file, or one row in Supabase - plus a small
// in-memory cache of recent answers.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import * as supabase from './supabaseStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const useSupabase = () => supabase.supabaseConfigured() && !process.env.ARB_DB_FILE;
const dir = () => `${process.env.ARB_DB_FILE || path.join(__dirname, '..', 'data', 'db.json')}.tutor`;
const id = (key) => crypto.createHash('sha1').update(key).digest('hex');

const MAX_MEMORY = 300;
const memory = new Map(); // key -> record, most recently used last

function remember(key, record) {
  memory.delete(key);
  memory.set(key, record);
  if (memory.size > MAX_MEMORY) memory.delete(memory.keys().next().value);
}

/** The saved record ({ text, model, createdAt }) for `key`, or null. */
export async function getAnswer(key) {
  if (memory.has(key)) { const r = memory.get(key); remember(key, r); return r; }
  let record = null;
  if (useSupabase()) {
    record = await supabase.getRow(`${supabase.TUTOR_PREFIX}${id(key)}`);
  } else {
    try { record = JSON.parse(await fs.promises.readFile(path.join(dir(), `${id(key)}.json`), 'utf-8')); } catch { record = null; }
  }
  if (record?.text) remember(key, record);
  return record?.text ? record : null;
}

export async function saveAnswer(key, record) {
  remember(key, record);
  if (useSupabase()) {
    await supabase.upsert({ [`${supabase.TUTOR_PREFIX}${id(key)}`]: { key, ...record } });
  } else {
    await fs.promises.mkdir(dir(), { recursive: true });
    await fs.promises.writeFile(path.join(dir(), `${id(key)}.json`), JSON.stringify({ key, ...record }), 'utf-8');
  }
}

/** Tests: forget the in-memory copies. */
export function clearTutorMemory() { memory.clear(); }
