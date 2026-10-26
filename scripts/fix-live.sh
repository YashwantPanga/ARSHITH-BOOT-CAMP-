#!/usr/bin/env bash
# Puts the live site on the latest code in /var/www/arshithcamp and switches email to Brevo.
# Run on the VPS as root:  cd /var/www/arshithcamp && git pull && bash scripts/fix-live.sh
#  - keeps the live settings (database, secrets) from the old copy in /var/www/bootcamp/.env
#  - sets the Brevo SMTP lines, the admin email and the public address; asks for the two secrets
#  - builds, replaces the old pm2 apps with one app running this folder, checks it, sends a test email
set -euo pipefail

NEW=/var/www/arshithcamp
OLD=/var/www/bootcamp
SITE=https://arshithbootcamp.com
cd "$NEW"

echo "==> Code: $(git log --oneline -1)"

echo "==> Settings"
if [ -f .env ]; then cp .env ".env.backup-$(date +%Y%m%d-%H%M%S)"; fi
if [ -f "$OLD/.env" ]; then
  cp "$OLD/.env" .env           # the settings the live site already runs with
elif [ ! -f .env ]; then
  cp .env.example .env
fi

# set KEY=VALUE in .env (value taken literally)
setv() {
  if grep -q "^$1=" .env; then
    K="$1" V="$2" awk 'BEGIN { k = ENVIRON["K"]; v = ENVIRON["V"] } index($0, k "=") == 1 { print k "=" v; next } { print }' .env > .env.tmp && mv .env.tmp .env
  else
    printf '%s=%s\n' "$1" "$2" >> .env
  fi
}

setv SMTP_HOST smtp-relay.brevo.com
setv SMTP_PORT 587
setv SMTP_SECURE false
setv SMTP_USER bfa1d3001@smtp-brevo.com
setv MAIL_FROM 'Arshith Bootcamp <bootcamp@arshithgroup.com>'
setv PUBLIC_SITE_URL "$SITE"
setv ADMIN_EMAIL bootcamp@arshithgroup.com

echo
read -rsp "Paste the Brevo SMTP key (the SMTP_PASS line from the .env on your PC), then Enter: " SMTP_KEY; echo
if [ -n "$SMTP_KEY" ]; then setv SMTP_PASS "$SMTP_KEY"; echo "   received ${#SMTP_KEY} characters"; else echo "   nothing pasted - keeping the current value"; fi
read -rsp "Type the admin password for bootcamp@arshithgroup.com, then Enter: " ADMIN_PW; echo
if [ -n "$ADMIN_PW" ]; then setv ADMIN_PASSWORD "$ADMIN_PW"; echo "   received ${#ADMIN_PW} characters"; else echo "   nothing typed - keeping the current value"; fi
unset SMTP_KEY ADMIN_PW
chmod 600 .env

for k in SMTP_PASS ADMIN_PASSWORD; do
  grep -q "^$k=." .env || echo "!! $k is empty - run this again and enter it when asked."
done
grep -q "^SUPABASE_URL=." .env && echo "   data: Supabase" || echo "   data: file on this server (server/data/db.json) - no Supabase settings, as before"
PORT="$(grep -E '^PORT=' .env | cut -d= -f2 | tr -d ' ' || true)"; PORT="${PORT:-5000}"

echo "==> Build"
npm ci
npm run build

echo "==> App (one pm2 app, running this folder, on port $PORT)"
pm2 delete arshith-api >/dev/null 2>&1 || true
pm2 delete bootcamp >/dev/null 2>&1 || true
pm2 start server/index.js --name bootcamp --cwd "$NEW" --update-env
pm2 save
sleep 4

echo "==> Checks"
curl -fsS "http://127.0.0.1:$PORT/api/health" && echo
code="$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' -d '{}' "http://127.0.0.1:$PORT/api/admin/login")"
[ "$code" = 404 ] && echo "Latest code is live." || echo "!! Unexpected answer ($code): the old code may still be running - send a screenshot."
pm2 logs bootcamp --lines 12 --nostream | grep -iE "mail|admin|error" || true

echo
read -rp "Send a test email to (your address, or Enter to skip): " TO
if [ -n "$TO" ]; then node scripts/test-email.mjs "$TO" || true; fi
echo
echo "Done. Open $SITE"
