// Removes all student data so the site starts fresh, keeping courses, the question bank, the admin
// login and site settings. A backup of everything is written to backups/ first.
//   Stop the server first, then run:  node scripts/reset-student-data.mjs --yes
// Clears: learners, students, enrollments, quiz attempts, final exam attempts and sessions,
// certificates, project submissions and activity logs - in Supabase (when configured) and in
// server/data/db.json (the local fallback that Supabase is seeded from).
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { supabaseConfigured, loadAll, upsert } from '../server/lib/supabaseStore.js';

const EMPTY = {
  learners: {}, students: [], learnerEnrollments: {}, quizAttempts: [], finalTestAttempts: [],
  finalTestActiveSessions: {}, certificates: [], projectSubmissions: [], activityLogs: []
};

if (!process.argv.includes('--yes')) {
  console.log('This deletes ALL students and their records (a backup is saved first).');
  console.log('Stop the server, then run:  node scripts/reset-student-data.mjs --yes');
  process.exit(1);
}

const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
fs.mkdirSync('backups', { recursive: true });
const count = (v) => (Array.isArray(v) ? v.length : v && typeof v === 'object' ? Object.keys(v).length : 0);

if (supabaseConfigured()) {
  const before = await loadAll();
  if (before) {
    const file = path.join('backups', `db-before-reset-${stamp}.json`);
    fs.writeFileSync(file, JSON.stringify(before, null, 2));
    console.log(`Backup of Supabase saved to ${file}`);
  }
  await upsert(EMPTY);
  const after = await loadAll();
  console.log('Supabase now:', Object.keys(EMPTY).map(k => `${k}=${count(after?.[k])}`).join(' '));
} else {
  console.log('Supabase is not configured - only the local file is reset.');
}

const dbFile = path.join('server', 'data', 'db.json');
const db = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
fs.writeFileSync(path.join('backups', `db-json-before-reset-${stamp}.json`), JSON.stringify(db, null, 2));
for (const [k, v] of Object.entries(EMPTY)) db[k] = v;
fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
console.log('db.json now:', Object.keys(EMPTY).map(k => `${k}=${count(db[k])}`).join(' '));
console.log('Done. Courses, questions and the admin login were kept. Start the server again and register fresh.');
