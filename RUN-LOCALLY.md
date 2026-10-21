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
