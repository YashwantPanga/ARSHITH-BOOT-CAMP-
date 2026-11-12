import 'dotenv/config';
import app from './app.js';
import { initDb, flushDb, storageMode } from './db.js';
import { smtpConfigured, warmUpMailer } from './lib/mailer.js';
import { applyAdminSettings } from './lib/adminSetup.js';
import { getDb, saveDb } from './db.js';
import { runJobs } from './lib/referrals.js';
import { sweep as campusSweep } from './lib/campus.js';

const PORT = process.env.PORT || 5000;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Answer straight away; until the database has loaded, API calls get a clear 503 "starting up"
// (see dbReady in app.js) instead of the site being down. If Supabase cannot be reached - a
// network problem or a wrong URL / key - keep retrying instead of crashing and restarting.
async function connectDb() {
  for (let attempt = 1; ; attempt++) {
    try {
      return await initDb();
    } catch (err) {
      const wait = Math.min(60, attempt * 5);
      console.error(`[db] Supabase error (attempt ${attempt}): ${err.message} - retrying in ${wait}s. Check SUPABASE_URL and SUPABASE_SERVICE_KEY in .env (bash scripts/db-status.sh).`);
      await sleep(wait * 1000);
    }
  }
}

app.listen(PORT, async () => {
  const mode = await connectDb();
  for (const change of applyAdminSettings()) console.log(`[admin] ${change}`);
  console.log(`=================================================`);
  console.log(` CodeLekho Secure Backend API Running     `);
  console.log(` Port: http://localhost:${PORT}                   `);
  console.log(` Health: http://localhost:${PORT}/api/health     `);
  console.log(` Database: ${mode === 'supabase' ? 'Supabase' : 'local file (server/data/db.json)'}`);
  console.log(` Email: ${smtpConfigured() ? `SMTP (${process.env.SMTP_USER})` : 'not configured - saved to server/data/outbox'}`);
  console.log(`=================================================`);
  warmUpMailer().then(ok => ok && console.log('[mail] Connected to SMTP server'));
  // Refer & Earn: move commissions past their 7-day hold to the available balance and flag payouts
  // past their deadline. Idempotent, so running it often (or after a restart) is safe.
  const referralJob = () => {
    try {
      const db = getDb();
      const { released, overdue } = runJobs(db);
      // Campus Rewards: give back voucher uses held by payments that never finished
      const campus = campusSweep(db);
      if (released || overdue || campus) { saveDb(db); if (released || overdue) console.log(`[referrals] released ${released}, overdue ${overdue}`); }
    } catch (err) { console.error('[referrals] job failed:', err.message); }
  };
  referralJob();
  setInterval(referralJob, 15 * 60 * 1000).unref();
});

// Make sure the last changes reach Supabase before the process exits.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => {
    if (storageMode() === 'supabase') await flushDb().catch(() => {});
    process.exit(0);
  });
}
