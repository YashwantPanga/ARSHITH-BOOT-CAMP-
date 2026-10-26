import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import bcrypt from 'bcryptjs';

// Free while passing; after failing a final twice every course (the same one too) costs ₹99, which
// only the admin can grant until online payment is connected. Buying a course again resets attempts.
const tmp = path.join(os.tmpdir(), `arb-enrol-db-${process.pid}-${Date.now()}.json`);
const A = 'pass@example.test';
const B = 'fail@example.test';
let app; let db$; const tok = {}; let admin;

const addAttempt = (email, courseId, passed) => {
  const db = db$.getDb();
  db.finalTestAttempts = [...(db.finalTestAttempts || []), { id: `fa-${Math.random()}`, userId: email, courseId, passed, percentage: passed ? 90 : 20, submittedAt: new Date().toISOString() }];
  db$.saveDb(db);
};
const enrol = (email, courseId) => request(app).post('/api/enrollment').set('X-Learner-Token', tok[email]).send({ courseId });
const state = async (email) => (await request(app).get('/api/enrollment').set('X-Learner-Token', tok[email])).body;

beforeAll(async () => {
  fs.copyFileSync(path.join(__dirname, '..', 'server', 'data', 'db.json'), tmp);
  Object.assign(process.env, { ARB_DB_FILE: tmp, NODE_ENV: 'test', ADMIN_EMAIL: 'enrol-admin@example.test', ADMIN_PASSWORD: 'Enrol-admin-77' });
  app = (await import('../server/app.js')).default;
  (await import('../server/lib/adminSetup.js')).applyAdminSettings();
  db$ = await import('../server/db.js');
  const db = db$.getDb();
  for (const [email, id] of [[A, 'ARB-STU-PASS01'], [B, 'ARB-STU-FAIL01']]) {
    db.learners[email] = { name: 'Learner ' + id, email, regNo: id.slice(-6), phone: '9999999999', learnerId: id, passwordHash: bcrypt.hashSync('Pw#12345', 10), emailVerified: true };
    db.students = [{ id, name: 'Learner ' + id, email, status: 'active' }, ...(db.students || [])];
  }
  db$.saveDb(db);
  for (const [email, reg] of [[A, 'PASS01'], [B, 'FAIL01']]) tok[email] = (await request(app).post('/api/learners/login').send({ email, password: 'Pw#12345', regNo: reg })).body.token;
  admin = (await request(app).post('/api/learners/login').send({ email: 'enrol-admin@example.test', password: 'Enrol-admin-77' })).body.staffToken;
});
afterAll(() => { delete process.env.ADMIN_EMAIL; delete process.env.ADMIN_PASSWORD; try { fs.unlinkSync(tmp); } catch { /* ignore */ } });

describe('enrolment rules', () => {
  it('first course is free and must be finished before another', async () => {
    expect((await enrol(A, 'python-programming')).status).toBe(200);
    const s = await state(A);
    expect(s).toMatchObject({ courseId: 'python-programming', status: 'active', canEnrollNew: false, nextPrice: 0 });
    expect((await enrol(A, 'sql-mastery')).status).toBe(409);
  });

  it('after passing, the next course is free too and the passed one is in history', async () => {
    addAttempt(A, 'python-programming', true);
    expect((await state(A)).canEnrollNew).toBe(true);
    expect((await enrol(A, 'python-programming')).status).toBe(409); // already passed
    const r = await enrol(A, 'sql-mastery');
    expect(r.status).toBe(200);
    expect(r.body.history).toEqual([expect.objectContaining({ courseId: 'python-programming', outcome: 'passed' })]);
  });

  it('after failing twice, any course costs ₹99 (the learner cannot enrol themselves)', async () => {
    expect((await enrol(B, 'web-development')).status).toBe(200);
    addAttempt(B, 'web-development', false);
    expect((await state(B)).canEnrollNew).toBe(false); // one attempt left
    addAttempt(B, 'web-development', false);
    const s = await state(B);
    expect(s).toMatchObject({ status: 'failed', canEnrollNew: true, nextPrice: 99 });
    for (const course of ['sql-mastery', 'web-development']) {
      const r = await enrol(B, course);
      expect(r.status).toBe(402);
      expect(r.body.code).toBe('PAYMENT_REQUIRED');
      expect(r.body.price).toBe(99);
    }
  });

  it('the admin can enrol them again in the same course, with two fresh attempts', async () => {
    const r = await request(app).post('/api/admin/enrollments').set('Authorization', `Bearer ${admin}`).send({ studentId: 'ARB-STU-FAIL01', courseId: 'web-development' });
    expect(r.status).toBe(200);
    const s = await state(B);
    expect(s).toMatchObject({ courseId: 'web-development', status: 'active', canEnrollNew: false, nextPrice: 99 });
    const db = db$.getDb();
    expect(db.learnerEnrollments[B]).toMatchObject({ paid: true, by: 'admin', attemptOffset: 2 });
    const { finalAttemptsUsed } = await import('../server/routes/quizRoutes.js');
    expect(finalAttemptsUsed(db, B, 'web-development')).toBe(0);
  });
});
