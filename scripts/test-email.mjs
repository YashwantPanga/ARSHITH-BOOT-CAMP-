// Sends one test email with the SMTP settings in .env and explains common errors.
// Usage: npm run email:test [-- someone@example.com]   (defaults to SMTP_USER)
import 'dotenv/config';
import { smtpConfigured, sendMail, mailMode } from '../server/lib/mailer.js';

if (!smtpConfigured()) {
  console.error('Email is not set up on this machine: .env has no SMTP_HOST / SMTP_USER / SMTP_PASS.');
  console.error('-> Run: bash scripts/use-domain-email.sh   (or copy the email lines from .env.example), then try again.');
  process.exit(1);
}
const to = process.argv[2] || process.env.SMTP_USER;
console.log(`Sending a test email via ${mailMode()} from ${process.env.MAIL_FROM || process.env.SMTP_USER} to ${to} ...`);
const res = await sendMail({
  to,
  subject: 'CodeLekho - test email',
  text: 'Email sending works. Verification, password reset and course-completion emails will now be delivered.',
  html: '<p>Email sending works. Verification, password reset and course-completion emails will now be delivered.</p>'
});
if (res.delivered) {
  console.log('Sent. Check the inbox (and the Spam folder).');
} else {
  const e = res.error || '';
  console.error('Not sent:', e);
  if (/535|Username and Password not accepted|BadCredentials|authentication failed|Invalid login/i.test(e)) console.error('-> The mail server rejected the login. Check SMTP_USER (the full mailbox address, e.g. bootcamp@arshithgroup.com) and the mailbox password in .env.');
  else if (/ETIMEDOUT|ECONNREFUSED|ENOTFOUND|ESOCKET|Greeting never received/i.test(e)) console.error(`-> Could not reach ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587}. Try SMTP_PORT=587 with SMTP_SECURE=false, or 465 with SMTP_SECURE=true.`);
  else if (/sender|not allowed|relay|553|550/i.test(e)) console.error('-> The server refused the sender. MAIL_FROM must use the same address as SMTP_USER (e.g. CodeLekho <bootcamp@arshithgroup.com>).');
  process.exit(1);
}
