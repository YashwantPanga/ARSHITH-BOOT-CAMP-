#!/usr/bin/env bash
# Sends the site's emails (verification codes, password resets, certificates) straight from the
# arshithgroup.com mailbox on StackMail - no Brevo or other email company in between.
# Run on the VPS as root:  cd /var/www/arshithcamp && git pull && bash scripts/use-domain-email.sh
#  - backs up .env, sets the StackMail SMTP lines and removes the old Brevo settings
#  - asks for the mailbox password (hidden, never printed), restarts the site and sends a test email
set -euo pipefail
cd "$(dirname "$0")/.."

MAILBOX="${1:-bootcamp@arshithgroup.com}"

[ -f .env ] || { echo "!! No .env in $(pwd). Run this from the website folder."; exit 1; }
cp .env ".env.backup-$(date +%Y%m%d-%H%M%S)"

# set KEY=VALUE in .env (value taken literally)
setv() {
  if grep -q "^$1=" .env; then
    K="$1" V="$2" awk 'BEGIN { k = ENVIRON["K"]; v = ENVIRON["V"] } index($0, k "=") == 1 { print k "=" v; next } { print }' .env > .env.tmp && mv .env.tmp .env
  else
    printf '%s=%s\n' "$1" "$2" >> .env
  fi
}

echo "==> Email from $MAILBOX (StackMail)"
setv SMTP_HOST smtp.stackmail.com
setv SMTP_PORT 465
setv SMTP_SECURE true
setv SMTP_USER "$MAILBOX"
setv MAIL_FROM "CodeLekho <$MAILBOX>"
# the old Brevo HTTPS key would no longer be used; drop it so nothing points at Brevo
sed -i '/^BREVO_API_KEY=/d' .env

read -rsp "Type the password of the mailbox $MAILBOX, then Enter: " PW; echo
if [ -n "$PW" ]; then setv SMTP_PASS "$PW"; echo "   received ${#PW} characters"; else echo "   nothing typed - keeping the current SMTP_PASS"; fi
unset PW
chmod 600 .env

echo "==> Restarting the site"
if command -v pm2 >/dev/null 2>&1; then
  pm2 restart bootcamp --update-env >/dev/null && echo "   [ok] restarted"
else
  echo "   pm2 not found - restart the site yourself"
fi

echo "==> Test email"
node scripts/test-email.mjs "$MAILBOX"
