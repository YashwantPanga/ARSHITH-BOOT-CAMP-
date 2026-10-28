#!/usr/bin/env bash
# Turns on online payment: asks for the Razorpay keys, checks them with Razorpay, saves them in
# .env and restarts the site. The secret is never shown on screen.
# Run on the VPS as root:  cd /var/www/arshithcamp && bash scripts/set-razorpay.sh
# Keys: Razorpay Dashboard > Account & Settings > API Keys (Live mode for real payments).
set -uo pipefail
cd "$(dirname "$0")/.."

setv() {
  if grep -q "^$1=" .env; then
    K="$1" V="$2" awk 'BEGIN { k = ENVIRON["K"]; v = ENVIRON["V"] } index($0, k "=") == 1 { print k "=" v; next } { print }' .env > .env.tmp && mv .env.tmp .env
  else
    printf '%s=%s\n' "$1" "$2" >> .env
  fi
}

echo "Razorpay Dashboard > Account & Settings > API Keys. Copy the Key ID and the Key Secret."
read -rp  "Key ID (starts with rzp_live_ or rzp_test_), then Enter: " ID
read -rsp "Key Secret (nothing shows while pasting), then Enter: " SECRET; echo
# Some web terminals add invisible "bracketed paste" codes (ESC[200~ ... ESC[201~) around pasted
# text; Razorpay keys only contain letters, digits and _, so keep just those.
clean() { printf '%s' "$1" | sed -e 's/\[20[01]~//g' -e 's/\[20[01]~//g' | tr -cd 'A-Za-z0-9_'; }
ID="$(clean "$ID")"
SECRET="$(clean "$SECRET")"
echo "   received Key ID: $ID"
echo "   received Key Secret: ${#SECRET} characters (a Razorpay secret has 24)"
case "$ID" in rzp_live_*|rzp_test_*) ;; *) echo "!! The Key ID must start with rzp_live_ or rzp_test_. Nothing changed."; exit 1 ;; esac
[ -n "$SECRET" ] || { echo "!! The Key Secret is empty. Nothing changed."; exit 1; }

echo "==> Checking the keys with Razorpay"
code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 -u "$ID:$SECRET" 'https://api.razorpay.com/v1/orders?count=1')"
if [ "$code" != "200" ]; then
  echo "!! Razorpay did not accept these keys (answer $code). Nothing changed."
  echo "   - If the secret length above is not 24, the paste went wrong: run this script again and paste with right-click."
  echo "   - If it is 24, the secret belongs to another key: in Razorpay click Regenerate Key and use the new ID and secret together."
  exit 1
fi
echo "   keys accepted"

cp .env ".env.backup-$(date +%Y%m%d-%H%M%S)"
setv RAZORPAY_KEY_ID "$ID"
setv RAZORPAY_KEY_SECRET "$SECRET"
unset SECRET
chmod 600 .env
case "$ID" in rzp_test_*) echo "   note: these are TEST keys - payments are not real money. Use rzp_live_ keys for real payments." ;; esac

echo "==> Restarting the site"
bash scripts/db-status.sh | tail -2
echo "==> Online payment is ON. Unlock a course on the site (Ctrl+F5 first) - it shows 'Pay ₹99 and unlock'."
