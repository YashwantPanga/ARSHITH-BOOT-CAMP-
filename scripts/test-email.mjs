// Sends one test email with the SMTP settings in .env and explains common Gmail errors.
// Usage: npm run email:test [-- someone@example.com]   (defaults to SMTP_USER)
import 'dotenv/config';
import { smtpConfigured, sendMail } from '../server/lib/mailer.js';

if (!smtpConfigured()) {
  console.error('Email is not set up: fill in SMTP_USER and SMTP_PASS in .env (see the comments there).');
  process.exit(1);
}
const to = process.argv[2] || process.env.SMTP_USER;
console.log(`Sending a test email from ${process.env.SMTP_USER} to ${to} ...`);
const res = await sendMail({
  to,
  subject: 'Arshith Bootcamp - test email',
  text: 'Email sending works. Verification, password reset and course-completion emails will now be delivered.',
  html: '<p>Email sending works. Verification, password reset and course-completion emails will now be delivered.</p>'
});
if (res.delivered) {
  console.log('Sent. Check the inbox (and the Spam folder).');
} else {
  const e = res.error || '';
  console.error('Not sent:', e);
  if (/535|Username and Password not accepted|BadCredentials/i.test(e)) console.error('-> Gmail rejected the login. Use a 16-letter App Password (not your normal password), with no spaces, and make sure SMTP_USER is the same Gmail account.');
  else if (/ETIMEDOUT|ECONNREFUSED|ENOTFOUND/i.test(e)) console.error('-> Could not reach smtp.gmail.com. Check your internet connection or firewall.');
  process.exit(1);
}
