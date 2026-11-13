#!/usr/bin/env bash
# Stops browsers from keeping an old copy of the site. Nginx serves index.html without a Cache-Control
# header, so after an update some browsers keep opening the previous version of the site.
# Adds one small Nginx file and changes no site config; it is removed again if Nginx rejects it.
# Run on the VPS as root:  cd /var/www/arshithcamp && bash scripts/fix-html-cache.sh
set -uo pipefail
SITE="https://codelekho.com"
FILE="/etc/nginx/conf.d/codelekho-html-cache.conf"

cat > "$FILE" <<'CONF'
# HTML pages are checked with the server on every visit; pictures and scripts are left as they are.
map $sent_http_content_type $codelekho_html_cache {
  ~*text/html "no-cache";
  default     "";
}
add_header Cache-Control $codelekho_html_cache;
CONF

echo "==> Checking the Nginx settings"
if ! nginx -t >/dev/null 2>&1; then
  rm -f "$FILE"
  echo "!! Nginx did not accept this, so it was removed and nothing changed. Send this to your developer:"
  nginx -t
  exit 1
fi
systemctl reload nginx
sleep 1

echo "==> Checking the live site"
if curl -sI --max-time 20 "$SITE/" | grep -qi '^cache-control:.*no-cache'; then
  echo "   [ok] browsers will now always get the latest version of the site"
else
  echo "   [warn] the header is not showing yet. The site's Nginx config probably sets its own headers."
  echo "   Send a screenshot of this to your developer. The site itself is working normally."
fi
