#!/usr/bin/env bash
# Turns on online payment with Cashfree: asks for the App ID and Secret Key, checks them with
# Cashfree, saves them in .env, removes the old Razorpay keys and restarts the site.
# The secret is never shown on screen.
# Run on the VPS as root:  cd /var/www/arshithcamp && bash scripts/set-cashfree.sh
# Keys: Cashfree Merchant Dashboard > Developers > API Keys (switch to Production for real payments).
set -uo pipefail
cd "$(dirname "$0")/.."

setv() {
  if grep -q "^$1=" .env; then
    K="$1" V="$2" awk 'BEGIN { k = ENVIRON["K"]; v = ENVIRON["V"] } index($0, k "=") == 1 { print k "=" v; next } { print }' .env > .env.tmp && mv .env.tmp .env
  else
    printf '%s=%s\n' "$1" "$2" >> .env
  fi
}

echo "Cashfree Merchant Dashboard > Developers > API Keys. Copy the App ID and the Secret Key."
read -rp "Live payments (production) or test (sandbox)? Type live or test, then Enter: " MODE
case "$(printf '%s' "$MODE" | tr 'A-Z' 'a-z')" in
  live|production|prod) ENV=production; API=https://api.cashfree.com/pg ;;
  test|sandbox) ENV=sandbox; API=https://sandbox.cashfree.com/pg ;;
  *) echo "!! Type live or test. Nothing changed."; exit 1 ;;
esac
read -rp  "App ID, then Enter: " ID
read -rsp "Secret Key (nothing shows while pasting), then Enter: " SECRET; echo
# Some web terminals add invisible "bracketed paste" codes around pasted text; keep only key characters.
clean() { printf '%s' "$1" | sed -e 's/\[20[01]~//g' | tr -cd 'A-Za-z0-9_.-'; }
ID="$(clean "$ID")"
SECRET="$(clean "$SECRET")"
echo "   received App ID: $ID"
echo "   received Secret Key: ${#SECRET} characters"
[ -n "$ID" ] && [ -n "$SECRET" ] || { echo "!! The App ID or Secret Key is empty. Nothing changed."; exit 1; }

echo "==> Checking the keys with Cashfree ($ENV)"
# asking for an order that does not exist: 404 means the keys work, 401 means they do not
code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 \
  -H "x-client-id: $ID" -H "x-client-secret: $SECRET" -H 'x-api-version: 2023-08-01' \
  "$API/orders/codelekho_key_check")"
if [ "$code" = "401" ] || [ "$code" = "403" ] || [ "$code" = "000" ]; then
  echo "!! Cashfree did not accept these keys (answer $code). Nothing changed."
  echo "   - Make sure the keys match the mode you chose (live keys with live, test keys with test)."
  exit 1
fi
echo "   keys accepted"

cp .env ".env.backup-$(date +%Y%m%d-%H%M%S)"
setv CASHFREE_APP_ID "$ID"
setv CASHFREE_SECRET_KEY "$SECRET"
setv CASHFREE_ENV "$ENV"
sed -i '/^RAZORPAY_/d' .env
unset SECRET
chmod 600 .env
[ "$ENV" = "sandbox" ] && echo "   note: TEST mode - payments are not real money. Run this again with live keys for real payments."

echo "==> Restarting the site"
bash scripts/db-status.sh | tail -2
echo "==> Online payment is ON. Courses after the first show 'Pay ₹99 and unlock'; Interview Prep shows 'Unlock for ₹499'."
echo "   Optional: Cashfree Dashboard > Developers > Webhooks > add https://<your site>/api/payments/webhook"
