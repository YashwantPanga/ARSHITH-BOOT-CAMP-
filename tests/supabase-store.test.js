import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Supabase mode, against an in-memory stand-in for Supabase's REST API (no network, no real project).
const table = new Map();
const calls = [];

function fakeFetch(url, opts = {}) {
  const u = new URL(url);
  const method = opts.method || 'GET';
  calls.push({ method, url: u.pathname + u.search, apikey: opts.headers?.apikey });
  if (!u.pathname.endsWith('/rest/v1/app_state')) return Promise.resolve(new Response('{}', { status: 404 }));
  if (method === 'GET') return Promise.resolve(new Response(JSON.stringify([...table].map(([key, data]) => ({ key, data }))), { status: 200 }));
  if (method === 'POST') {
    for (const r of JSON.parse(opts.body)) table.set(r.key, structuredClone(r.data));
    return Promise.resolve(new Response(null, { status: 201 }));
  }
  if (method === 'DELETE') {
    const list = decodeURIComponent(u.searchParams.get('key')).replace(/^in\.\(|\)$/g, '').split(',').map(s => s.replace(/"/g, ''));
    list.forEach(k => table.delete(k));
    return Promise.resolve(new Response(null, { status: 204 }));
  }
  return Promise.resolve(new Response(null, { status: 405 }));
}

let db;
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'server', 'data', 'db.json'), 'utf8'));

beforeAll(async () => {
  delete process.env.ARB_DB_FILE;
  process.env.SUPABASE_URL = 'https://example-project.supabase.co/';
  process.env.SUPABASE_SERVICE_KEY = 'sb_secret_test_only';
  vi.stubGlobal('fetch', fakeFetch);
  db = await import('../server/db.js');
});
afterAll(() => {
  vi.unstubAllGlobals();
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_KEY;
});

describe('Supabase storage', () => {
  it('uploads db.json on the first run when Supabase is empty', async () => {
    expect(await db.initDb()).toBe('supabase');
    expect(db.storageMode()).toBe('supabase');
    expect([...table.keys()].sort()).toEqual(Object.keys(seed).sort());
    expect(table.get('students')).toEqual(seed.students);
    expect(calls.every(c => c.apikey === 'sb_secret_test_only')).toBe(true);
  });

  it('returns independent copies, like reading the file', () => {
    const a = db.getDb();
    a.students.push({ id: 'not-saved' });
    expect(db.getDb().students.some(s => s.id === 'not-saved')).toBe(false);
  });

  it('saves only the collections that changed', async () => {
    calls.length = 0;
    const d = db.getDb();
    d.activityLogs.unshift({ id: 'log-supabase-test', action: 'TEST' });
    db.saveDb(d);
    await db.flushDb();
    const posts = calls.filter(c => c.method === 'POST');
    expect(posts.length).toBe(1);
    expect(table.get('activityLogs')[0].id).toBe('log-supabase-test');
    expect(table.get('questionBank')).toEqual(seed.questionBank);
  });

  it('keeps data across restarts (loads from Supabase, does not re-seed)', async () => {
    calls.length = 0;
    await db.initDb();
    expect(calls.filter(c => c.method === 'POST').length).toBe(0);
    expect(db.getDb().activityLogs[0].id).toBe('log-supabase-test');
  });

  it('never touches the local db.json in Supabase mode', () => {
    const now = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'server', 'data', 'db.json'), 'utf8'));
    expect(now.activityLogs.some(l => l.id === 'log-supabase-test')).toBe(false);
  });

  it('explains how to fix a missing table', async () => {
    const store = await import('../server/lib/supabaseStore.js');
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('{"message":"Could not find the table \'public.app_state\'"}', { status: 404 })));
    await expect(store.loadAll()).rejects.toThrow(/supabase\/setup\.sql/);
    vi.stubGlobal('fetch', fakeFetch);
  });
});
