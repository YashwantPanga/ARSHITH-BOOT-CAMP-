// Applies the admin email and password from .env (ADMIN_EMAIL, ADMIN_PASSWORD) to the admin account.
// The password is applied only when the value in .env changes, so a password later changed from the
// admin dashboard is not overwritten on every restart. Only a bcrypt hash is stored in the database.
import bcrypt from 'bcryptjs';
import { getDb, saveDb } from '../db.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function applyAdminSettings() {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const username = String(process.env.ADMIN_USERNAME || '').trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || '');

  const db = getDb();
  if (!db.admin) return ['no admin account found'];
  const admin = db.admin;
  const changes = [];

  if (username && admin.username !== username) {
    admin.username = username;
    changes.push(`admin username set to ${username}`);
  }

  if (email) {
    if (!EMAIL_RE.test(email)) changes.push('ADMIN_EMAIL ignored: not a valid email address');
    else if (String(admin.email || '').toLowerCase() !== email) { admin.email = email; changes.push(`admin email set to ${email}`); }
  }

  if (password) {
    if (password.length < 8) changes.push('ADMIN_PASSWORD ignored: use at least 8 characters');
    else if (!admin.passwordEnvHash || !bcrypt.compareSync(password, admin.passwordEnvHash)) {
      // passwordEnvHash remembers (as a bcrypt hash) which .env password was last applied.
      admin.passwordHash = bcrypt.hashSync(password, 10);
      admin.passwordEnvHash = bcrypt.hashSync(password, 10);
      admin.passwordChangedAt = new Date().toISOString();
      changes.push('admin password updated from .env');
    }
  }

  if (changes.some(c => !c.includes('ignored'))) saveDb(db);
  return changes;
}
