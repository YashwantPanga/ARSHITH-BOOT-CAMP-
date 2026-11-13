#!/usr/bin/env bash
# Moves the live site to a new domain in one go. Run on the VPS as root:
#   cd /var/www/arshithcamp && git pull && bash scripts/switch-domain.sh codelekho.com
# Add --remove-old to also delete the old domain's HTTPS certificate from this server:
#   bash scripts/switch-domain.sh codelekho.com --remove-old
#
#  1. checks that the new domain's DNS already points to this server (changes nothing if not)
#  2. backs up the Nginx site file and rewrites it for the new domain only
#  3. gets a free HTTPS certificate for the new domain (certbot)
#  4. sets PUBLIC_SITE_URL in .env (used in emails, payment links, certificate QR codes) and restarts the app
#  5. checks the site answers on the new domain
# Student data lives in Supabase and is not touched. .env and the Nginx file are backed up first.
set -uo pipefail
cd "$(dirname "$0")/.."
DIR="$(pwd)"
APP=bootcamp
OLD="${OLD_DOMAIN:-arshithbootcamp.com}"
NEW="${1:-}"
REMOVE_OLD=0; [ "${2:-}" = "--remove-old" ] && REMOVE_OLD=1
ok()   { echo "  [ok]   $*"; }
warn() { echo "  [warn] $*"; }
fail() { echo "  [FAIL] $*"; }

NEW="${NEW#https://}"; NEW="${NEW#http://}"; NEW="${NEW%%/*}"; NEW="${NEW#www.}"
if [ -z "$NEW" ]; then echo "Usage: bash scripts/switch-domain.sh codelekho.com [--remove-old]"; exit 1; fi
if [ ! -f .env ]; then fail ".env is missing in $DIR - nothing was changed"; exit 1; fi
STAMP="$(date +%Y%m%d-%H%M%S)"
CERT_EMAIL="$(grep -E '^ADMIN_EMAIL=' .env | cut -d= -f2- | tr -d ' \r')"; CERT_EMAIL="${CERT_EMAIL:-bootcamp@arshithgroup.com}"

echo "==> Moving the site to $NEW (old domain: $OLD)"

echo "==> DNS"
SERVER_IP="$(curl -fsS --max-time 10 https://api.ipify.org || true)"
DNS_IP="$(getent ahostsv4 "$NEW" | awk '{print $1}' | head -1 || true)"
WWW_IP="$(getent ahostsv4 "www.$NEW" | awk '{print $1}' | head -1 || true)"
if [ -z "$SERVER_IP" ] || [ "$DNS_IP" != "$SERVER_IP" ]; then
  fail "$NEW points to '${DNS_IP:-nothing}', this server is '${SERVER_IP:-unknown}'. Nothing was changed."
  echo "         Add an A record for @ (and www) pointing to $SERVER_IP, wait 10-30 minutes, run this again."
  exit 1
fi
ok "$NEW points to this server ($SERVER_IP)"
WITH_WWW=1
if [ "$WWW_IP" != "$SERVER_IP" ]; then WITH_WWW=0; warn "www.$NEW does not point here yet - setting up $NEW only (run again later to add www)"; fi

echo "==> Nginx"
PORT="$(grep -E '^PORT=' .env | cut -d= -f2 | tr -d ' \r' || true)"; PORT="${PORT:-5000}"
F="$(grep -rlE "server_name[^;]*(${OLD//./\\.}|${NEW//./\\.})" /etc/nginx/sites-enabled/ 2>/dev/null | head -1)"
[ -z "$F" ] && F=/etc/nginx/sites-enabled/$APP
[ -e "$F" ] && F="$(readlink -f "$F")"
if [ -f "$F" ]; then
  cp "$F" "/root/nginx-$(basename "$F")-backup-$STAMP.conf"
  P="$(grep -oE 'proxy_pass[[:space:]]+http://(127\.0\.0\.1|localhost):[0-9]+' "$F" | grep -oE '[0-9]+$' | head -1)"
  [ -n "$P" ] && PORT="$P"
  ok "backed up $F to /root/nginx-$(basename "$F")-backup-$STAMP.conf"
fi
NAMES="$NEW"; [ "$WITH_WWW" = 1 ] && NAMES="$NEW www.$NEW"
cat > "$F" <<EOF
server {
  listen 80;
  server_name $NAMES;
  client_max_body_size 12m;
  location / {
    proxy_pass http://127.0.0.1:$PORT;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
  }
}
EOF
ln -sf "$F" "/etc/nginx/sites-enabled/$(basename "$F")" 2>/dev/null || true
if ! nginx -t >/tmp/nginx-test.log 2>&1; then
  fail "Nginx rejected the new file - putting the old one back"; tail -5 /tmp/nginx-test.log
  [ -f "/root/nginx-$(basename "$F")-backup-$STAMP.conf" ] && cp "/root/nginx-$(basename "$F")-backup-$STAMP.conf" "$F"
  nginx -t >/dev/null 2>&1 && systemctl reload nginx; exit 1
fi
systemctl reload nginx
ok "Nginx now serves $NAMES -> port $PORT"
OTHER="$(grep -rlE "server_name[^;]*${OLD//./\\.}" /etc/nginx/sites-enabled/ 2>/dev/null || true)"
[ -n "$OTHER" ] && warn "another Nginx file still mentions $OLD: $OTHER"

echo "==> HTTPS"
command -v certbot >/dev/null || apt-get install -y certbot python3-certbot-nginx >/dev/null
DOMS=(-d "$NEW"); [ "$WITH_WWW" = 1 ] && DOMS+=(-d "www.$NEW")
if certbot --nginx "${DOMS[@]}" --non-interactive --agree-tos -m "$CERT_EMAIL" --redirect >/tmp/certbot.log 2>&1; then
  ok "HTTPS certificate installed for $NEW"
  SCHEME=https
else
  warn "certificate failed - the site works on http://$NEW for now. Last lines:"; tail -5 /tmp/certbot.log
  SCHEME=http
fi

echo "==> App settings (.env)"
cp .env ".env.backup-$STAMP"
if grep -qE '^PUBLIC_SITE_URL=' .env; then sed -i "s#^PUBLIC_SITE_URL=.*#PUBLIC_SITE_URL=https://$NEW#" .env
else echo "PUBLIC_SITE_URL=https://$NEW" >> .env; fi
ok "PUBLIC_SITE_URL=https://$NEW"
if pm2 describe "$APP" >/dev/null 2>&1; then pm2 restart "$APP" --update-env >/dev/null
else pm2 start server/index.js --name "$APP" --cwd "$DIR" --update-env >/dev/null; fi
pm2 save >/dev/null 2>&1 || true
ok "app restarted"

echo "==> Checking $SCHEME://$NEW"
UP=0
for _ in $(seq 1 15); do
  sleep 2
  curl -fsS --max-time 10 "$SCHEME://$NEW/api/health" >/dev/null 2>&1 && { UP=1; break; }
done
if [ "$UP" = 1 ]; then ok "site answers on $SCHEME://$NEW"; else fail "no answer from $SCHEME://$NEW/api/health - send this screen to your developer"; fi

if [ "$REMOVE_OLD" = 1 ]; then
  echo "==> Old domain"
  if certbot certificates 2>/dev/null | grep -q "Certificate Name: $OLD"; then
    certbot delete --cert-name "$OLD" --non-interactive >/dev/null 2>&1 && ok "deleted the $OLD certificate"
  else ok "no $OLD certificate on this server"; fi
fi

echo
echo "==> Done on the server. Still to do in your accounts:"
echo "    - Cashfree > Developers > Whitelisting: add $NEW"
echo "    - Cashfree > Developers > Webhooks: https://$NEW/api/payments/webhook"
echo "    - DNS of $OLD: delete the A records for @ and www so the old domain stops"
[ "$UP" = 1 ] || exit 1
