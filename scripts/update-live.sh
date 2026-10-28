#!/usr/bin/env bash
# Safe update of the live site. Run on the VPS as root:
#   cd /var/www/arshithcamp && git checkout -q main && git checkout -- package-lock.json && git pull && bash scripts/update-live.sh
#
#  - backs up .env, fills in JWT_SECRET when it is empty, warns about missing payment keys
#  - installs and builds into dist-new first; the running site keeps working if the build fails
#  - restarts the pm2 app "bootcamp" and checks that the site answers
#  - if the new version does not start, puts the previous code and build back and restarts again
# It never deletes data: student data lives in Supabase; .env is only appended to.
set -uo pipefail
cd "$(dirname "$0")/.."
APP=bootcamp
PORT="$(grep -E '^PORT=' .env 2>/dev/null | cut -d= -f2 | tr -d ' \r' || true)"; PORT="${PORT:-5000}"
PREV="$(git rev-parse --verify -q ORIG_HEAD || git rev-parse HEAD)"
NOW="$(git rev-parse --short HEAD)"
ok()   { echo "  [ok]   $*"; }
warn() { echo "  [warn] $*"; }
fail() { echo "  [FAIL] $*"; }

echo "==> Updating to $NOW (previous version: $(git rev-parse --short "$PREV"))"

echo "==> Settings (.env)"
if [ ! -f .env ]; then fail ".env is missing - nothing was changed"; exit 1; fi
cp .env ".env.backup-$(date +%Y%m%d-%H%M%S)"
sed -i 's/\r$//' .env                                   # Windows line endings break some values
if ! grep -qE '^JWT_SECRET=.+' .env; then
  sed -i '/^JWT_SECRET=$/d' .env
  echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env
  ok "JWT_SECRET created (students stay signed in across restarts from now on)"
else ok "JWT_SECRET is set"; fi
has() { grep -qE "^$1=.+" .env; }
has SUPABASE_URL && has SUPABASE_SERVICE_KEY && ok "Supabase settings present" || warn "Supabase settings missing - the site would use the local file instead of Supabase"
has SMTP_HOST && has SMTP_USER && has SMTP_PASS && ok "Email settings present" || warn "Email settings incomplete - verification codes will not be sent"
has RAZORPAY_KEY_ID && has RAZORPAY_KEY_SECRET && ok "Razorpay keys present (online payment on)" || warn "No Razorpay keys - paid courses show 'contact us' instead of the Pay button"
if grep -qE '^COURSE_PRICE=' .env; then warn "COURSE_PRICE is set to $(grep -E '^COURSE_PRICE=' .env | cut -d= -f2) - remove that line unless you mean it"; fi

echo "==> Installing packages"
if ! npm ci --no-audit --no-fund >/tmp/arb-npm.log 2>&1; then
  fail "npm ci failed - the running site was not touched. Last lines:"; tail -15 /tmp/arb-npm.log; exit 1
fi
ok "packages installed"

echo "==> Building into dist-new (the live site keeps running meanwhile)"
rm -rf dist-new
if ! npx vite build --outDir dist-new --emptyOutDir >/tmp/arb-build.log 2>&1 || [ ! -f dist-new/index.html ]; then
  fail "build failed - the running site was not touched. Last lines:"; tail -15 /tmp/arb-build.log; rm -rf dist-new; exit 1
fi
rm -rf dist-old; [ -d dist ] && mv dist dist-old; mv dist-new dist
ok "new build in place (previous build kept in dist-old)"

healthy() {
  for _ in $(seq 1 30); do
    sleep 2
    curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1 \
      && curl -fsS "http://127.0.0.1:$PORT/api/courses" 2>/dev/null | grep -q '"success":true' \
      && curl -fsS "http://127.0.0.1:$PORT/" 2>/dev/null | grep -q '<div id="root"' && return 0
  done
  return 1
}

echo "==> Restarting the site"
if pm2 describe "$APP" >/dev/null 2>&1; then pm2 restart "$APP" --update-env >/dev/null
else pm2 start server/index.js --name "$APP" --cwd "$(pwd)" --update-env >/dev/null; fi
pm2 save >/dev/null 2>&1 || true

if healthy; then
  ok "site is up on port $PORT"
  pm2 logs "$APP" --lines 40 --nostream 2>/dev/null | grep -E "Database:|Connected to SMTP|SMTP login failed|JWT_SECRET is not set" | tail -4 | sed 's/^/         /'
  echo "==> Done. Open https://arshithbootcamp.com and press Ctrl+F5."
  exit 0
fi

fail "the new version did not start - rolling back to $(git rev-parse --short "$PREV")"
pm2 logs "$APP" --lines 25 --nostream 2>/dev/null | tail -25
if git -c advice.detachedHead=false checkout -q "$PREV" && npm ci --no-audit --no-fund >/tmp/arb-npm.log 2>&1; then
  [ -d dist-old ] && { rm -rf dist; mv dist-old dist; }
  pm2 restart "$APP" --update-env >/dev/null
  if healthy; then warn "previous version restored and running. Send the error lines above to your developer."
  else fail "previous version did not start either - send the error lines above to your developer."; fi
else
  fail "could not restore the previous code automatically - send this screen to your developer."
fi
exit 1
