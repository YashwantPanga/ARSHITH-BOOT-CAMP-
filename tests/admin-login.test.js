import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import bcrypt from 'bcryptjs';

// One login form for everyone: the admin (ADMIN_EMAIL / ADMIN_PASSWORD) signs in through
// /api/learners/login without a registration number; every failure looks the same; the admin API
// answers 404 to anyone without an admin session.
const tmp = path.join(os.tmpdir(), `arb-admin-db-${process.pid}-${Date.now()}.json`);
let app;
let applyAdminSettings;
const GENERIC = 'Incorrect email, registration number or password.';

beforeAll(async () => {
  fs.copyFileSync(path.join(__dirname, '..', 'server', 'data', 'db.json'), tmp);
  process.env.ARB_DB_FILE = tmp;
  process.env.NODE_ENV = 'test';
  app = (await import('../server/app.js')).default;
  ({ applyAdminSettings } = await import('../server/lib/adminSetup.js'));
  const { getDb, saveDb } = await import('../server/db.js');
  const db = getDb();
  db.learners = db.learners || {};
  db.learners['student@example.test'] = {
    name: 'Test Student', email: 'student@example.test', regNo: '21A91A0501', phone: '9999999999',
    learnerId: 'ARB-STU-TEST01', passwordHash: bcrypt.hashSync('Student#pass1', 10), emailVerified: true,
    createdAt: new Date().toISOString()
  };
  saveDb(db);
});
afterAll(() => {
  delete process.env.ADMIN_EMAIL;
  delete process.env.ADMIN_PASSWORD;
  try { fs.unlinkSync(tmp); } catch { /* ignore */ }
});

const login = (email, password, regNo = '') => request(app).post('/api/learners/login').send({ email, password, regNo });
const expectGeneric = (res) => {
  expect(res.status).toBe(401);
  expect(res.body.message).toBe(GENERIC);
  expect(JSON.stringify(res.body).toLowerCase()).not.toContain('admin');
  expect(res.body.token).toBeFalsy();
  expect(res.body.staffToken).toBeUndefined();
};

describe('single login form', () => {
  it('applies ADMIN_EMAIL and ADMIN_PASSWORD from .env; the admin signs in with no registration number', async () => {
    process.env.ADMIN_EMAIL = 'Owner@Example.test';
    process.env.ADMIN_PASSWORD = 'Str0ng-test-pass';
    expect(applyAdminSettings()).toEqual(['admin email set to owner@example.test', 'admin password updated from .env']);
    for (const regNo of ['', 'ANYTHING']) {
      const res = await login('owner@example.test', 'Str0ng-test-pass', regNo);
      expect(res.status).toBe(200);
      expect(res.body.staffToken).toBeTruthy();
      expect(res.body.learner.staff).toBe(true);
    }
    const db = JSON.parse(fs.readFileSync(tmp, 'utf8'));
    expect(JSON.stringify(db.admin)).not.toContain('Str0ng-test-pass');
  });

  it('gives a wrong admin password the same generic failure', async () => {
    expectGeneric(await login('owner@example.test', 'not-the-password'));
  });

  it('never accepts the old published demo passwords', async () => {
    process.env.ADMIN_PASSWORD = 'Admin@2026';
    // applyAdminSettings would apply it; force the stored hash to a demo password to prove it is refused
    const { getDb, saveDb } = await import('../server/db.js');
    const db = getDb(); // a fresh copy: changes need saveDb
    const saved = db.admin.passwordHash;
    db.admin.passwordHash = bcrypt.hashSync('Admin@2026', 10);
    saveDb(db);
    expectGeneric(await login('owner@example.test', 'Admin@2026'));
    const back = getDb();
    back.admin.passwordHash = saved;
    saveDb(back);
    process.env.ADMIN_PASSWORD = 'Str0ng-test-pass';
  });

  it('signs a student in only with the right registration number', async () => {
    const ok = await login('student@example.test', 'Student#pass1', '21a91a0501');
    expect(ok.status).toBe(200);
    expect(ok.body.token).toBeTruthy();
    expect(ok.body.staffToken).toBeUndefined();
    expectGeneric(await login('student@example.test', 'Student#pass1', ''));
    expectGeneric(await login('student@example.test', 'Student#pass1', 'WRONG123'));
    expectGeneric(await login('student@example.test', 'wrong-pass', '21A91A0501'));
  });

  it('gives an unknown email the same generic failure', async () => {
    expectGeneric(await login('nobody@example.test', 'whatever1', '21A91A0501'));
  });

  it('keeps a password changed in the dashboard when the server restarts with the same .env', async () => {
    const { body } = await login('owner@example.test', 'Str0ng-test-pass');
    const change = await request(app).post('/api/admin/change-password').set('Authorization', `Bearer ${body.staffToken}`)
      .send({ currentPassword: 'Str0ng-test-pass', newPassword: 'Changed#Pass9', confirmPassword: 'Changed#Pass9' });
    expect(change.status).toBe(200);
    expect(applyAdminSettings()).toEqual([]); // same .env values: nothing re-applied
    expect((await login('owner@example.test', 'Changed#Pass9')).status).toBe(200);
  });

  it('refuses to set a published demo password from the dashboard', async () => {
    const { body } = await login('owner@example.test', 'Changed#Pass9');
    const res = await request(app).post('/api/admin/change-password').set('Authorization', `Bearer ${body.staffToken}`)
      .send({ currentPassword: 'Changed#Pass9', newPassword: 'Admin@2026', confirmPassword: 'Admin@2026' });
    expect(res.status).toBe(400);
  });

  it('ignores a too-short ADMIN_PASSWORD', () => {
    process.env.ADMIN_PASSWORD = 'short';
    expect(applyAdminSettings()).toContain('ADMIN_PASSWORD ignored: use at least 8 characters');
  });
});

describe('admin API is invisible without an admin session', () => {
  it('answers 404 to no token, a student token and the removed admin login', async () => {
    const student = (await login('student@example.test', 'Student#pass1', '21A91A0501')).body.token;
    for (const req of [
      request(app).get('/api/admin/students'),
      request(app).get('/api/admin/students').set('Authorization', `Bearer ${student}`).set('X-Learner-Token', student),
      request(app).get('/api/admin/me').set('Authorization', 'Bearer not-a-token'),
      request(app).post('/api/admin/login').send({ adminId: 'owner@example.test', password: 'Changed#Pass9' })
    ]) {
      const res = await req;
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('API Endpoint Not Found');
    }
  });

  it('serves the admin API to an admin session', async () => {
    const { body } = await login('owner@example.test', 'Changed#Pass9');
    const res = await request(app).get('/api/admin/students').set('Authorization', `Bearer ${body.staffToken}`);
    expect(res.status).toBe(200);
  });
});
