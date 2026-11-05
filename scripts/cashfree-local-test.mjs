// Tries Cashfree test payments on this computer: npm run cashfree:test
// Asks for the TEST App ID and Secret Key, checks them, and starts the site at http://localhost:5055 on a
// throwaway copy of the data: no Supabase and no real emails, so live data is not touched.
// The keys stay in memory and are never saved. Stop it with Ctrl + C.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = '5055';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: Boolean(process.stdin.isTTY) });
const echo = rl._writeToOutput.bind(rl);
let muted = false;
rl._writeToOutput = (text) => { if (!muted) echo(text); };
const lines = rl[Symbol.asyncIterator]();
async function ask(question, { hidden = false } = {}) {
  process.stdout.write(question);
  muted = hidden;
  const { value } = await lines.next();
  muted = false;
  if (hidden) process.stdout.write('\n');
  return value || '';
}
// Some terminals add invisible paste codes around pasted text; keep only key characters.
const clean = (text) => String(text).replace(/\[20[01]~/g, '').replace(/[^A-Za-z0-9_.-]/g, '');

function stop(message) {
  console.error(`!! ${message}`);
  process.exitCode = 1;
}

async function main() {
  console.log('Cashfree Dashboard: turn on Test mode, then Developers > API Keys.\n');
  const appId = clean(await ask('Test App ID, then Enter: '));
  const secret = clean(await ask('Test Secret Key (nothing shows while pasting), then Enter: ', { hidden: true }));
  rl.close();
  if (!appId || !secret) return stop('The App ID or Secret Key is empty.');

  console.log('==> Checking the keys with Cashfree (test mode)');
  // asking for an order that does not exist: 404 means the keys work, 401 means they do not
  let status = 0;
  try {
    const res = await fetch('https://sandbox.cashfree.com/pg/orders/codelekho_key_check', {
      headers: { 'x-client-id': appId, 'x-client-secret': secret, 'x-api-version': '2023-08-01' },
      signal: AbortSignal.timeout(20000)
    });
    status = res.status;
    await res.text();
  } catch { /* reported below */ }
  if (status === 0 || status === 401 || status === 403) return stop(`Cashfree did not accept these keys (answer ${status || 'no connection'}). Use the TEST keys, not the live ones.`);
  console.log('   keys accepted');

  console.log('==> Building the site');
  if (spawnSync('npm run build', { cwd: root, shell: true, stdio: 'ignore' }).status !== 0) return stop('The site did not build. Run: npm run build');

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codelekho-pay-test-'));
  const dbFile = path.join(dir, 'db.json');
  fs.copyFileSync(path.join(root, 'server', 'data', 'db.json'), dbFile);

  const server = spawn(process.execPath, ['server/index.js'], {
    cwd: root,
    stdio: 'ignore',
    env: {
      ...process.env,
      PORT,
      PUBLIC_SITE_URL: `http://localhost:${PORT}`,
      ARB_DB_FILE: dbFile,
      ARB_OUTBOX_DIR: path.join(dir, 'outbox'),
      NODE_ENV: 'development',
      // blank values win over .env: this run must not reach live data or send real email
      SUPABASE_URL: '', SUPABASE_SERVICE_KEY: '', SMTP_HOST: '', SMTP_USER: '', SMTP_PASS: '', BREVO_API_KEY: '',
      PAID_COURSES: 'on', COURSE_PRICE: '', INTERVIEW_PRICE: '', INTERVIEW_LOCK: '',
      CASHFREE_APP_ID: appId, CASHFREE_SECRET_KEY: secret, CASHFREE_ENV: 'sandbox'
    }
  });

  process.on('SIGINT', () => server.kill());
  server.on('exit', (code) => {
    console.log('Test site stopped.');
    if (code) process.exitCode = 1;
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
  });

  console.log(`\n==> Test site is running: http://localhost:${PORT}`);
  console.log('   Test UPI ID: testsuccess@gocash (paid)  or  testfailure@gocash (failed)');
  console.log('   Test card: 4706 1312 1121 2123, expiry 03/2028, CVV 123, name Test, OTP 111000');
  console.log('   Press Ctrl + C here to stop.');
}

await main();
