#!/usr/bin/env bash
# Installs or updates Arshith Bootcamp on an Ubuntu VPS (Hostinger), as root, in one go:
#   bash scripts/deploy-vps.sh arshithbootcamp.com
# First run: installs Node 20, git, Nginx, certbot and pm2, downloads the code to /var/www/bootcamp and
# stops so you can fill in .env. Run it again to build, start the app, set up Nginx and HTTPS.
# Later runs: pull the latest code, rebuild and restart.
set -euo pipefail

DOMAIN="${1:-arshithbootcamp.com}"
APP_DIR=/var/www/bootcamp
REPO=https://github.com/YashwantPanga/ARSHITH-BOOT-CAMP-.git
NAME=bootcamp
PORT=5000
CERT_EMAIL="${CERT_EMAIL:-bootcamp@arshithgroup.com}"

echo "==> Tools"
if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
apt-get install -y git nginx certbot python3-certbot-nginx >/dev/null
command -v pm2 >/dev/null || npm install -g pm2

echo "==> Code"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" pull --ff-only
else
  mkdir -p "$(dirname "$APP_DIR")"
  git clone "$REPO" "$APP_DIR"
fi
cd "$APP_DIR"

if [ ! -f .env ]; then
  cp .env.example .env
  echo
  echo ">>> Created $APP_DIR/.env from the example. Fill it in (Supabase, Brevo SMTP, JWT_SECRET,"
  echo ">>> ADMIN_EMAIL, ADMIN_PASSWORD, PUBLIC_SITE_URL=https://$DOMAIN):"
  echo ">>>   nano $APP_DIR/.env"
  echo ">>> then run this script again."
  exit 1
fi

echo "==> Build"
npm ci
npm run build

echo "==> App"
if pm2 describe "$NAME" >/dev/null 2>&1; then
  pm2 restart "$NAME" --update-env
else
  pm2 start server/index.js --name "$NAME" --cwd "$APP_DIR"
fi
pm2 save
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true

echo "==> Nginx for $DOMAIN"
cat > "/etc/nginx/sites-available/$NAME" <<EOF
server {
  listen 80;
  server_name $DOMAIN www.$DOMAIN;
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
ln -sf "/etc/nginx/sites-available/$NAME" "/etc/nginx/sites-enabled/$NAME"
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "==> HTTPS"
SERVER_IP="$(curl -fsS https://api.ipify.org || true)"
DNS_IP="$(getent hosts "$DOMAIN" | awk '{print $1}' | head -1 || true)"
if [ -n "$SERVER_IP" ] && [ "$SERVER_IP" = "$DNS_IP" ]; then
  certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "$CERT_EMAIL" --redirect \
    || certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$CERT_EMAIL" --redirect
else
  echo ">>> Skipped: $DOMAIN points to '${DNS_IP:-nothing}', this server is '$SERVER_IP'."
  echo ">>> Add DNS A records for @ and www pointing to $SERVER_IP, wait a few minutes, run this script again."
fi

echo
echo "==> Done. Health check:"
curl -fsS "http://127.0.0.1:$PORT/api/health" && echo
echo "Site: http://$DOMAIN  (https once the certificate is issued)"
