import 'dotenv/config';
import app from './app.js';
import { initDb, flushDb, storageMode } from './db.js';
import { smtpConfigured, warmUpMailer } from './lib/mailer.js';
import { applyAdminSettings } from './lib/adminSetup.js';

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
  console.log(` Arshith Bootcamp Secure Backend API Running     `);
  console.log(` Port: http://localhost:${PORT}                   `);
  console.log(` Health: http://localhost:${PORT}/api/health     `);
  console.log(` Database: ${mode === 'supabase' ? 'Supabase' : 'local file (server/data/db.json)'}`);
  console.log(` Email: ${smtpConfigured() ? `SMTP (${process.env.SMTP_USER})` : 'not configured - saved to server/data/outbox'}`);
  console.log(`=================================================`);
  warmUpMailer().then(ok => ok && console.log('[mail] Connected to SMTP server'));
});

// Make sure the last changes reach Supabase before the process exits.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => {
    if (storageMode() === 'supabase') await flushDb().catch(() => {});
    process.exit(0);
  });
}
