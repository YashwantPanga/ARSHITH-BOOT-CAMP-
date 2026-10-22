# Arshith Bootcamp – run locally

Requires Node.js 18+.

## One command (recommended)
```
npm install
npm run app
```
Open **http://localhost:5000** — the API and the built website are served from the same port.
On Windows you can simply double-click `START-WINDOWS.bat`.

## Developer mode (hot reload)
Terminal 1: `npm run server`  (API on http://localhost:5000)
Terminal 2: `npm run dev`     (site on http://localhost:3000)

## Notes
- The proctored final assessment needs a webcam and a desktop browser (Chrome / Edge / Firefox).
  Camera access works on `localhost` and on HTTPS sites.
- Do not run `server/seed.js`: it regenerates `server/data/db.json` from the old data
  (answer keys would go back to being almost always option B).

## What's new in this build
- **Palette**: Forest Green #013A2B · Evergreen #0C2D26 · Warm Ivory #FBF8F1 · Soft Cream #F8F5EE · Sage #426557 · Charcoal Brown #302B25
  (defined once in `tailwind.config.js`; fonts: Fraunces + Inter + JetBrains Mono).
- **Student accounts are stored on the server** (`/api/learners/register`, `/api/learners/login`) with hashed passwords,
  a unique registration number per account and a generated learner ID (ARB-STU-XXXXXX). Old browser-only accounts are
  migrated automatically the first time they log in.
- **Certificates** carry a QR code (bottom-right corner) that opens `/verify/<certificate-id>`. The verify page accepts
  a typed ID, a live camera scan, or an uploaded photo of the QR. Name and reg. no. on the certificate come from the
  server account, not from the browser.
  Note: a QR generated while running on `localhost` points at `localhost`, so phones can only open it once the site
  is deployed on a real domain.
- **Practice Lab**: every code example has a "Try it" button. Python runs in the browser (Pyodide), SQL runs on SQLite
  (sql.js) with sample tables, HTML/CSS/JS render in a sandboxed preview. These load from CDNs, so an internet
  connection is needed the first time.
- **Module reader**: concept-map diagram per module, learning-flow diagram, syntax-highlighted code with line numbers.
- **Contact form** now saves messages to `db.json` (`contactMessages`).

## Quality checks (added with the content/diagram/practice overhaul)
```
npm test                    # Vitest: 54 tests (schema, normaliser, grading, API/auth, components, exercises)
npm run validate:content    # inventories all modules -> reports/content-validation.md
npm run validate:links      # also checks every reference URL -> reports/link-check.md
npm run verify:exercises    # runs every solution/worked example and compares real output
npm run report:content-diff # proves original module text, code and quizzes are unchanged
```
- `npm run verify:exercises` and the exercise test need Python 3 with NumPy, pandas and Matplotlib
  for the AI modules; items are reported as SKIPPED (not passed) when a runtime is missing.
- Learners now sign in with a server-issued token. Anyone signed in before this update is asked to
  sign in once more.
- Practice code runs in the learner's browser only (Python in a Web Worker via Pyodide, SQL via
  sql.js, JavaScript in a sandboxed iframe). Nothing learners type is executed on the server.
- Set `JWT_SECRET` in the environment for any real deployment (a development default is used otherwise).

## Final assessment lock and certificate QR codes
- The final assessment unlocks only when a learner has passed every module quiz **and** submitted a
  GitHub repository link (https://github.com/owner/repo) for every mini project of their course.
  This is enforced by the server; submissions are stored in `db.json` (`projectSubmissions`) and
  appear in the admin portal.
- Certificate QR codes encode the site's public address. When you run the site on your computer the
  QR uses its local-network address (e.g. http://192.168.1.21:5000), so a phone on the same Wi-Fi can
  open it. For a real deployment set `PUBLIC_SITE_URL`, e.g. `PUBLIC_SITE_URL=https://learn.example.com`.

## Email verification, forgot password and course-completion email

- **Sign-up** now sends a 6-digit code (and a one-click link) to the learner's email. The account can't sign in until the email is verified. Accounts created before this change keep working without verification.
- **Forgot password?** on the sign-in page emails a reset code/link (valid 30 minutes, 5 attempts). After a reset, all older sessions are signed out and a "password changed" notice is emailed.
- **Course completion:** when a learner passes the final assessment, they get a congratulations email with their grade, certificate ID, certificate link and public verify link (sent once per certificate).

### Turning on real email
1. Copy `.env.example` to `.env` in the project folder.
2. Fill in `SMTP_USER`, `SMTP_PASS` and `MAIL_FROM`. For Gmail, turn on 2-Step Verification and create an App Password at https://myaccount.google.com/apppasswords — use that 16-character password as `SMTP_PASS`.
3. Set `PUBLIC_SITE_URL` to the address learners open (so links in emails work on their phones), then restart the server.

Until SMTP is configured, emails are saved as HTML files in `server/data/outbox/` and the code is shown on screen for testing (never in production, `NODE_ENV=production`).
