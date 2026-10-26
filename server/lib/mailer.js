import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Sends email through the SMTP server configured in the environment (see .env.example):
//   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_FROM
// When SMTP is not configured, messages are written to server/data/outbox/ instead so the flows can
// be tested locally. Nothing is reported as "sent" unless the SMTP server accepted it.

const OUTBOX = process.env.ARB_OUTBOX_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'outbox');
let transport = null;

// BREVO_API_KEY sends through Brevo's HTTPS API (port 443), for servers whose network blocks SMTP ports.
const brevoApi = () => Boolean(process.env.BREVO_API_KEY);
export const smtpConfigured = () => brevoApi() || Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
/** 'brevo-api' | 'smtp' | 'outbox' - how email is sent with the current settings. */
export const mailMode = () => (brevoApi() ? 'brevo-api' : smtpConfigured() ? 'smtp' : 'outbox');

/** "Name <a@b.c>" or "a@b.c" -> { name, email } */
function parseAddress(value) {
  const m = String(value || '').match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  return m ? { name: m[1].trim() || undefined, email: m[2].trim() } : { email: String(value || '').trim() };
}

async function sendViaBrevoApi({ from, to, subject, html, text }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ sender: parseAddress(from), to: [{ email: to }], replyTo: parseAddress(from), subject, htmlContent: html, textContent: text }),
    signal: AbortSignal.timeout(15000)
  });
  if (!res.ok) {
    let detail = '';
    try { const body = await res.json(); detail = body.message || body.code || ''; } catch { /* no body */ }
    throw new Error(`Brevo API ${res.status}${detail ? ': ' + detail : ''}`);
  }
}

/** In development without SMTP, APIs may return verification/reset codes so the flow can be tested. */
export const devCodesAllowed = () => !smtpConfigured() && process.env.NODE_ENV !== 'production';

function getTransport() {
  if (!transport) {
    const port = Number(process.env.SMTP_PORT || 587);
    transport = nodemailer.createTransport({
      // Keep the SMTP connection open and reuse it: a fresh connect + TLS + login to Gmail costs ~4-5 s per email.
      pool: true,
      maxConnections: 2,
      maxMessages: Infinity,
      host: process.env.SMTP_HOST,
      port,
      secure: String(process.env.SMTP_SECURE || (port === 465)).toLowerCase() === 'true',
      // Gmail shows App Passwords as "abcd efgh ijkl mnop"; the spaces are not part of the password.
      auth: { user: process.env.SMTP_USER, pass: String(process.env.SMTP_PASS).replace(/\s+/g, '') }
    });
  }
  return transport;
}

const FREE_MAILBOX = /@(gmail|googlemail|yahoo|outlook|hotmail|live|icloud|rediffmail)./i;

/** Opens the SMTP connection ahead of time so the first email is not delayed. Never throws. */
export async function warmUpMailer() {
  if (!smtpConfigured()) return false;
  if (brevoApi()) return true; // nothing to open ahead of time for the HTTPS API
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || '';
  if (FREE_MAILBOX.test(from)) {
    console.warn('[mail] Emails are sent from a free mailbox (' + from.replace(/^.*@/, '@') + '). Mail providers often put such codes in spam.'
      + ' For inbox delivery send from your own domain, e.g. Brevo with MAIL_FROM=Arshith Bootcamp <no-reply@arshithgroup.com> (see .env.example).');
  }
  try {
    await getTransport().verify();
    return true;
  } catch (err) {
    console.error('[mail] SMTP login failed:', err.message);
    return false;
  }
}

/** Returns { delivered, mode: 'brevo-api' | 'smtp' | 'outbox', error? }. Never throws. */
export async function sendMail({ to, subject, html, text }) {
  const from = process.env.MAIL_FROM || (process.env.SMTP_USER ? `Arshith Bootcamp <${process.env.SMTP_USER}>` : 'Arshith Bootcamp <no-reply@arshithbootcamp.local>');
  if (brevoApi()) {
    try {
      await sendViaBrevoApi({ from, to, subject, html, text });
      return { delivered: true, mode: 'brevo-api' };
    } catch (err) {
      console.error(`[mail] Brevo API delivery to ${to} failed:`, err.message);
      return { delivered: false, mode: 'brevo-api', error: err.message };
    }
  }
  if (smtpConfigured()) {
    try {
      await getTransport().sendMail({
        from,
        to,
        replyTo: from,
        subject,
        text,
        html,
        headers: { 'X-Entity-Ref-ID': crypto.randomUUID(), 'Auto-Submitted': 'auto-generated' }
      });
      return { delivered: true, mode: 'smtp' };
    } catch (err) {
      console.error(`[mail] SMTP delivery to ${to} failed:`, err.message);
      return { delivered: false, mode: 'smtp', error: err.message };
    }
  }
  try {
    fs.mkdirSync(OUTBOX, { recursive: true });
    const safe = String(to).replace(/[^a-z0-9@._-]/gi, '_');
    const file = path.join(OUTBOX, `${new Date().toISOString().replace(/[:.]/g, '-')}_${safe}.html`);
    fs.writeFileSync(file, `<!-- To: ${to}\n     From: ${from}\n     Subject: ${subject} -->\n${html}`);
    if (process.env.NODE_ENV !== 'test') console.log(`[mail] SMTP not configured – saved "${subject}" for ${to} to ${file}`);
    return { delivered: false, mode: 'outbox' };
  } catch (err) {
    return { delivered: false, mode: 'outbox', error: err.message };
  }
}
