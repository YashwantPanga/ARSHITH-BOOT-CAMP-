#!/usr/bin/env bash
# Puts THIS folder's code live and makes sure nothing older is still answering visitors.
# Run on the VPS as root:
#   cd /var/www/arshithcamp && git checkout -q main && git checkout -- package-lock.json && git pull && bash scripts/go-live.sh
#
#  1. finds the port Nginx forwards arshithbootcamp.com to, and sets PORT in .env to match
#  2. stops pm2 apps that run an old copy of the site from another folder
#  3. frees that port if some other old process still holds it
#  4. runs scripts/update-live.sh (install, build, restart, health check, rollback on failure)
#  5. saves the pm2 setup so the site starts again after a reboot
#  6. checks the public site really serves this version
# Student data lives in Supabase and is not touched; .env is backed up before any change.
set -uo pipefail
cd "$(dirname "$0")/.."
DIR="$(pwd)"
SITE="https://arshithbootcamp.com"
ok()   { echo "  [ok]   $*"; }
warn() { echo "  [warn] $*"; }
fail() { echo "  [FAIL] $*"; }

echo "==> Website folder: $DIR"

echo "==> Nginx"
NGPORT="$(grep -RhoE 'proxy_pass[[:space:]]+http://(127\.0\.0\.1|localhost):[0-9]+' /etc/nginx/sites-enabled/ 2>/dev/null | grep -oE '[0-9]+$' | sort | uniq -c | sort -rn | awk 'NR==1{print $2}')"
PORT="${NGPORT:-5000}"
if [ -n "$NGPORT" ]; then ok "Nginx forwards visitors to port $PORT"; else warn "no proxy_pass found in /etc/nginx/sites-enabled - using port 5000"; fi
ROOTS="$(grep -RhoE '^[[:space:]]*root[[:space:]]+[^;]+' /etc/nginx/sites-enabled/ 2>/dev/null | awk '{print $2}' | sort -u)"
for r in $ROOTS; do
  case "$r" in "$DIR"/*|/var/www/html|/usr/share/nginx/html) ;; *) warn "Nginx also serves files from $r (not this folder) - tell your developer" ;; esac
done

echo "==> Port setting (.env)"
cp .env ".env.backup-$(date +%Y%m%d-%H%M%S)"
if grep -qE '^PORT=' .env; then sed -i "s/^PORT=.*/PORT=$PORT/" .env; else echo "PORT=$PORT" >> .env; fi
ok "PORT=$PORT"

echo "==> Old copies of the site"
pm2 jlist 2>/dev/null | node -e '
  let s = ""; process.stdin.on("data", d => s += d).on("end", () => {
    let apps = []; try { apps = JSON.parse(s); } catch {}
    for (const a of apps) {
      const cwd = a.pm2_env && a.pm2_env.pm_cwd || "";
      // every copy of the site under /var/www that is not this folder, plus this folder\x27s app (restarted fresh below)
      if ((cwd.startsWith("/var/www") && cwd !== process.argv[1]) || a.name === "bootcamp") console.log(a.name + "\t" + cwd);
    }
  });' "$DIR" | while IFS=$'\t' read -r name cwd; do
  pm2 delete "$name" >/dev/null 2>&1 && ok "stopped pm2 app \"$name\" ($cwd)"
done
sleep 1
for pid in $(ss -ltnpH "sport = :$PORT" 2>/dev/null | grep -oE 'pid=[0-9]+' | cut -d= -f2 | sort -u); do
  if ps -p "$pid" -o comm= 2>/dev/null | grep -q node; then
    kill "$pid" 2>/dev/null && ok "stopped an old node process ($pid) that held port $PORT"
  else
    fail "port $PORT is used by $(ps -p "$pid" -o comm= 2>/dev/null) (not node) - nothing was changed. Send this screen to your developer."; exit 1
  fi
done
sleep 1

echo "==> Update"
bash scripts/update-live.sh || exit 1

echo "==> Start after reboot"
pm2 save >/dev/null 2>&1 && ok "pm2 app list saved"
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 && ok "pm2 starts automatically after a reboot" || warn "could not set pm2 to start on boot (run: pm2 startup)"

echo "==> Checking the live site ($SITE)"
sleep 2
PASS=1
if curl -fsS --max-time 30 "$SITE/api/courses" 2>/dev/null | grep -q '"heading":"What is Python?"'; then ok "new lessons are live"; else fail "the live site still shows the old lessons"; PASS=0; fi
code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 -X POST -H 'Content-Type: application/json' -d '{}' "$SITE/api/payments/order")"
if [ "$code" = "401" ]; then ok "payment feature is live"; else fail "payment feature answered $code (expected 401)"; PASS=0; fi
if [ "$PASS" = 1 ]; then
  echo "==> All done. Open $SITE and press Ctrl+F5."
else
  echo "==> The new version runs on this server but visitors still reach something else."
  echo "    Send this whole screen to your developer, plus the output of:  nginx -T | grep -nE 'server_name|proxy_pass|root'"
  exit 1
fi
