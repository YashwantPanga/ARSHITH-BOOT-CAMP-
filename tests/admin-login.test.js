import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';

// Admin sign-in: no built-in default passwords; email and password come from ADMIN_EMAIL / ADMIN_PASSWORD.
const tmp = path.join(os.tmpdir(), `arb-admin-db-${process.pid}-${Date.now()}.json`);
let app;
let applyAdminSettings;

beforeAll(async () => {
  fs.copyFileSync(path.join(__dirname, '..', 'server', 'data', 'db.json'), tmp);
  process.env.ARB_DB_FILE = tmp;
  process.env.NODE_ENV = 'test';
  app = (await import('../server/app.js')).default;
  ({ applyAdminSettings } = await import('../server/lib/adminSetup.js'));
});
afterAll(() => {
  delete process.env.ADMIN_EMAIL;
  delete process.env.ADMIN_PASSWORD;
  try { fs.unlinkSync(tmp); } catch { /* ignore */ }
});

const login = (adminId, password) => request(app).post('/api/admin/login').send({ adminId, password });

describe('admin login', () => {
  it('never accepts the old published demo passwords', async () => {
    for (const pw of ['admin123', 'Admin@2026']) {
      const res = await login('ARB-ADMIN-001', pw);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('DEFAULT_PASSWORD_DISABLED');
      expect(res.body.token).toBeUndefined();
    }
  });

  it('applies ADMIN_EMAIL and ADMIN_PASSWORD from .env and signs in with the email', async () => {
    process.env.ADMIN_EMAIL = 'Owner@Example.test';
    process.env.ADMIN_PASSWORD = 'Str0ng-test-pass';
    const changes = applyAdminSettings();
    expect(changes).toEqual(['admin email set to owner@example.test', 'admin password updated from .env']);
    const byEmail = await login('owner@example.test', 'Str0ng-test-pass');
    expect(byEmail.status).toBe(200);
    expect(byEmail.body.token).toBeTruthy();
    const byId = await login('ARB-ADMIN-001', 'Str0ng-test-pass');
    expect(byId.status).toBe(200);
    const db = JSON.parse(fs.readFileSync(tmp, 'utf8'));
    expect(JSON.stringify(db.admin)).not.toContain('Str0ng-test-pass');
  });

  it('rejects a wrong password', async () => {
    const res = await login('owner@example.test', 'not-the-password');
    expect(res.status).toBe(401);
  });

  it('keeps a password changed in the dashboard when the server restarts with the same .env', async () => {
    const { body } = await login('owner@example.test', 'Str0ng-test-pass');
    const change = await request(app).post('/api/admin/change-password').set('Authorization', `Bearer ${body.token}`)
      .send({ currentPassword: 'Str0ng-test-pass', newPassword: 'Changed#Pass9', confirmPassword: 'Changed#Pass9' });
    expect(change.status).toBe(200);
    expect(applyAdminSettings()).toEqual([]); // same .env values: nothing re-applied
    expect((await login('owner@example.test', 'Changed#Pass9')).status).toBe(200);
  });

  it('refuses to set a published demo password from the dashboard', async () => {
    const { body } = await login('owner@example.test', 'Changed#Pass9');
    const res = await request(app).post('/api/admin/change-password').set('Authorization', `Bearer ${body.token}`)
      .send({ currentPassword: 'Changed#Pass9', newPassword: 'Admin@2026', confirmPassword: 'Admin@2026' });
    expect(res.status).toBe(400);
  });

  it('ignores a too-short ADMIN_PASSWORD', () => {
    process.env.ADMIN_PASSWORD = 'short';
    expect(applyAdminSettings()).toContain('ADMIN_PASSWORD ignored: use at least 8 characters');
  });
});
