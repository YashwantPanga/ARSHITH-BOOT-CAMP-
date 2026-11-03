// Sends one test email with the SMTP settings in .env and explains common Gmail errors.
// Usage: npm run email:test [-- someone@example.com]   (defaults to SMTP_USER)
import 'dotenv/config';
import { smtpConfigured, sendMail, mailMode } from '../server/lib/mailer.js';

if (!smtpConfigured()) {
  console.error('Email is not set up on this machine: .env has no BREVO_API_KEY and no SMTP_HOST / SMTP_USER / SMTP_PASS.');
  console.error('-> Copy the email lines from your working .env (see .env.example), then run this again.');
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
  if (/535|Username and Password not accepted|BadCredentials/i.test(e)) console.error('-> Gmail rejected the login. Use a 16-letter App Password (not your normal password), with no spaces, and make sure SMTP_USER is the same Gmail account.');
  else if (/ETIMEDOUT|ECONNREFUSED|ENOTFOUND|ESOCKET|Greeting never received/i.test(e)) console.error(`-> Could not reach ${process.env.SMTP_HOST}. This network probably blocks SMTP ports. Add BREVO_API_KEY (Brevo > SMTP & API > API keys) to .env to send over HTTPS instead.`);
  else if (/unrecogni[sz]ed IP|authori[sz]ed IP|not authori[sz]ed|401|403/i.test(e)) console.error('-> Brevo refused this server. In Brevo open Security > Authorised IPs and add this server\'s IP address (or turn IP blocking off), then try again.');
  else if (/sender|not valid|not verified/i.test(e)) console.error('-> MAIL_FROM is not a verified sender in Brevo (Senders & IP > Senders).');
  process.exit(1);
}
