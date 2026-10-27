#!/usr/bin/env bash
# Connects the live site to Supabase (the same database the PC version uses).
# Run on the VPS as root:  cd /var/www/arshithcamp && bash scripts/set-supabase.sh
#  - uses Supabase lines from an earlier settings backup if one has them, otherwise asks for them
#  - restarts the app and shows which database it is using
set -euo pipefail
cd /var/www/arshithcamp

setv() {
  if grep -q "^$1=" .env; then
    K="$1" V="$2" awk 'BEGIN { k = ENVIRON["K"]; v = ENVIRON["V"] } index($0, k "=") == 1 { print k "=" v; next } { print }' .env > .env.tmp && mv .env.tmp .env
  else
    printf '%s=%s\n' "$1" "$2" >> .env
  fi
}

cp .env ".env.backup-$(date +%Y%m%d-%H%M%S)"
URL=""; KEY=""
for b in $(ls -t .env.backup-* 2>/dev/null) /var/www/bootcamp/.env; do
  if [ -f "$b" ] && grep -q '^SUPABASE_URL=.' "$b" && grep -q '^SUPABASE_SERVICE_KEY=.' "$b"; then
    URL="$(grep -E '^SUPABASE_URL=' "$b" | tail -1 | cut -d= -f2-)"
    KEY="$(grep -E '^SUPABASE_SERVICE_KEY=' "$b" | tail -1 | cut -d= -f2-)"
    echo "Found Supabase settings in $b"
    break
  fi
done
if [ -z "$URL" ] || [ -z "$KEY" ]; then
  echo "Copy these two values from the .env file on your PC (D:\\arshithcamp\\.env)."
  read -rp  "SUPABASE_URL (starts with https://), then Enter: " URL
  read -rsp "SUPABASE_SERVICE_KEY (long text - nothing shows while pasting), then Enter: " KEY; echo
  echo "   received ${#KEY} characters"
fi
[ -n "$URL" ] && [ -n "$KEY" ] || { echo "!! Both values are needed. Nothing changed."; exit 1; }
setv SUPABASE_URL "$URL"
setv SUPABASE_SERVICE_KEY "$KEY"
unset KEY
chmod 600 .env

pm2 restart bootcamp --update-env
sleep 5
echo
pm2 logs bootcamp --lines 30 --nostream | grep -E "Database:|supabase|Supabase" | tail -3 || true
echo "If it says 'Database: Supabase' the live site now uses Supabase."
