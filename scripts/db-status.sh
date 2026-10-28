#!/usr/bin/env bash
# Shows which database the live site uses, after a fresh restart. Prints no secret values.
#   cd /var/www/arshithcamp && bash scripts/db-status.sh
cd "$(dirname "$0")/.."
sed -i 's/\r$//' .env
echo "==> Supabase settings in .env"
for k in SUPABASE_URL SUPABASE_SERVICE_KEY; do
  v="$(grep -E "^$k=" .env | tail -1 | cut -d= -f2-)"
  if [ -n "$v" ]; then echo "  $k: set (${#v} characters)"; else echo "  $k: EMPTY"; fi
done
echo "==> Restarting and waiting for the site to start (up to 40 seconds)"
pm2 flush bootcamp >/dev/null 2>&1
pm2 restart bootcamp --update-env >/dev/null 2>&1
line=""
for _ in $(seq 1 20); do
  sleep 2
  line="$(pm2 logs bootcamp --lines 80 --nostream 2>/dev/null | grep -E 'Database:' | tail -1)"
  [ -n "$line" ] && break
done
err="$(pm2 logs bootcamp --err --lines 20 --nostream 2>/dev/null | grep -iE 'supabase|Error' | tail -3)"
echo "  ${line:-no start-up line yet}"
PORT="$(grep -E '^PORT=' .env | cut -d= -f2 | tr -d ' ')"; PORT="${PORT:-5000}"
echo "  health: $(curl -s --max-time 5 "http://127.0.0.1:$PORT/api/health" | sed 's/"timestamp":"[^"]*",\{0,1\}//')"
[ -n "$err" ] && echo "$err" | sed 's/^/  /'
if echo "$line" | grep -q "Database: Supabase"; then
  echo "==> OK: the live site uses Supabase."
else
  echo "==> NOT connected to Supabase. Run:  bash scripts/set-supabase.sh ask"
  echo "    and paste the two values from D:\\arshithcamp\\.env on your PC when asked."
fi
