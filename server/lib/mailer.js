import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

// Sends email through the SMTP server configured in the environment (see .env.example):
//   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_FROM
// When SMTP is not configured, messages are written to server/data/outbox/ instead so the flows can
// be tested locally. Nothing is reported as "sent" unless the SMTP server accepted it.

const OUTBOX = process.env.ARB_OUTBOX_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'outbox');
let transport = null;

export const smtpConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

/** In development without SMTP, APIs may return verification/reset codes so the flow can be tested. */
export const devCodesAllowed = () => !smtpConfigured() && process.env.NODE_ENV !== 'production';

function getTransport() {
  if (!transport) {
    const port = Number(process.env.SMTP_PORT || 587);
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: String(process.env.SMTP_SECURE || (port === 465)).toLowerCase() === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }
  return transport;
}

/** Returns { delivered, mode: 'smtp' | 'outbox', error? }. Never throws. */
export async function sendMail({ to, subject, html, text }) {
  const from = process.env.MAIL_FROM || (process.env.SMTP_USER ? `Arshith Bootcamp <${process.env.SMTP_USER}>` : 'Arshith Bootcamp <no-reply@arshithbootcamp.local>');
  if (smtpConfigured()) {
    try {
      await getTransport().sendMail({ from, to, subject, html, text });
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
