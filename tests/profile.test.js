import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import bcrypt from 'bcryptjs';

// A signed-in learner can edit name / registration number / phone and change the password.
const tmp = path.join(os.tmpdir(), `arb-profile-db-${process.pid}-${Date.now()}.json`);
let app;
let token;
const login = (password, regNo = 'PROF1001') => request(app).post('/api/learners/login').send({ email: 'prof@example.test', password, regNo });

beforeAll(async () => {
  fs.copyFileSync(path.join(__dirname, '..', 'server', 'data', 'db.json'), tmp);
  process.env.ARB_DB_FILE = tmp;
  process.env.NODE_ENV = 'test';
  app = (await import('../server/app.js')).default;
  const { getDb, saveDb } = await import('../server/db.js');
  const db = getDb();
  db.learners = db.learners || {};
  for (const [email, regNo] of [['prof@example.test', 'PROF1001'], ['other@example.test', 'OTHER2002']]) {
    db.learners[email] = { name: 'Prof Learner', email, regNo, phone: '9999999999', learnerId: `ARB-STU-${regNo}`, passwordHash: bcrypt.hashSync('Start#pass1', 10), emailVerified: true, createdAt: new Date().toISOString() };
  }
  saveDb(db);
  token = (await login('Start#pass1')).body.token;
});
afterAll(() => { try { fs.unlinkSync(tmp); } catch { /* ignore */ } });

const put = (body, t = token) => request(app).put('/api/learners/me').set('X-Learner-Token', t || '').send(body);

describe('learner profile', () => {
  it('requires a signed-in learner', async () => {
    expect((await put({ name: 'X Y' }, '')).status).toBe(401);
  });

  it('updates name, registration number and phone', async () => {
    const res = await put({ name: '  Kolla   Bhavana Sowmya ', regNo: 'new-2024a', phone: '+91 82177 29744' });
    expect(res.status).toBe(200);
    expect(res.body.learner).toMatchObject({ name: 'Kolla Bhavana Sowmya', regNo: 'NEW-2024A', phone: '+91 82177 29744', nameLocked: false });
    expect((await login('Start#pass1', 'NEW-2024A')).status).toBe(200);
  });

  it('rejects a registration number used by another account and bad values', async () => {
    expect((await put({ regNo: 'OTHER2002' })).status).toBe(409);
    expect((await put({ name: 'A' })).status).toBe(400);
    expect((await put({ phone: '123' })).status).toBe(400);
  });

  it('locks the name once a certificate exists', async () => {
    const { getDb, saveDb } = await import('../server/db.js');
    const db = getDb(); // a fresh copy: changes need saveDb
    db.certificates = db.certificates || [];
    db.certificates.push({ certificateId: 'TEST-CERT', userId: 'prof@example.test', status: 'active' });
    saveDb(db);
    const res = await put({ name: 'Someone Else' });
    expect(res.status).toBe(409);
    expect(res.body.field).toBe('name');
    expect((await put({ phone: '9000000000' })).status).toBe(200); // other fields still editable
  });

  it('changes the password only with the current one', async () => {
    const bad = await request(app).post('/api/learners/change-password').set('X-Learner-Token', token).send({ currentPassword: 'wrong', newPassword: 'Next#pass2' });
    expect(bad.status).toBe(400);
    const ok = await request(app).post('/api/learners/change-password').set('X-Learner-Token', token).send({ currentPassword: 'Start#pass1', newPassword: 'Next#pass2' });
    expect(ok.status).toBe(200);
    expect(ok.body.token).toBeTruthy();
    expect((await login('Start#pass1', 'NEW-2024A')).status).toBe(401);
    expect((await login('Next#pass2', 'NEW-2024A')).status).toBe(200);
    // the fresh token keeps working
    expect((await put({ phone: '9111111111' }, ok.body.token)).status).toBe(200);
  });
});
