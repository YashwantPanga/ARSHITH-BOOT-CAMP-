import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import bcrypt from 'bcryptjs';

// Paid mode (PAID_COURSES=on). Several courses per learner. Exactly one free course (the first); every other course is
// ₹99 to unlock (admin unlocks until online payment is connected). Unlocking a failed
// course again gives two fresh final attempts.
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
const unlock = (studentId, courseId) => request(app).post('/api/admin/enrollments').set('Authorization', `Bearer ${admin}`).send({ studentId, courseId });

beforeAll(async () => {
  fs.copyFileSync(path.join(__dirname, '..', 'server', 'data', 'db.json'), tmp);
  Object.assign(process.env, { ARB_DB_FILE: tmp, NODE_ENV: 'test', PAID_COURSES: 'on', ADMIN_EMAIL: 'enrol-admin@example.test', ADMIN_PASSWORD: 'Enrol-admin-77' });
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
afterAll(() => { delete process.env.PAID_COURSES; delete process.env.ADMIN_EMAIL; delete process.env.ADMIN_PASSWORD; try { fs.unlinkSync(tmp); } catch { /* ignore */ } });

describe('enrolment rules', () => {
  it('first course is free; another course costs ₹99 to unlock straight away', async () => {
    expect((await enrol(A, 'python-programming')).status).toBe(200);
    expect(await state(A)).toMatchObject({ courseIds: ['python-programming'], courses: { 'python-programming': 'active' }, nextPrice: 99 });
    const r = await enrol(A, 'sql-mastery');
    expect(r.status).toBe(402);
    expect(r.body).toMatchObject({ code: 'PAYMENT_REQUIRED', price: 99 });
  });

  it('the admin unlocks a paid course next to the free one (both stay open)', async () => {
    expect((await unlock('ARB-STU-PASS01', 'sql-mastery')).status).toBe(200);
    const s = await state(A);
    expect(s.courseIds.sort()).toEqual(['python-programming', 'sql-mastery']);
    expect(s.courses).toEqual({ 'python-programming': 'active', 'sql-mastery': 'active' });
    // the learner can use both: progress for each course is allowed
    for (const id of ['python-programming', 'sql-mastery']) {
      expect((await request(app).get(`/api/progress/${id}`).set('X-Learner-Token', tok[A])).status).toBe(200);
    }
    const login = await request(app).post('/api/learners/login').send({ email: A, password: 'Pw#12345', regNo: 'PASS01' });
    expect(login.body.learner.enrolledCourseIds.sort()).toEqual(['python-programming', 'sql-mastery']);
  });

  it('only one course is ever free: passing does not make the next one free', async () => {
    addAttempt(A, 'python-programming', true);
    addAttempt(A, 'sql-mastery', true);
    expect((await state(A)).nextPrice).toBe(99);
    expect((await enrol(A, 'python-programming')).status).toBe(409); // already passed
    const r = await enrol(A, 'web-development');
    expect(r.status).toBe(402);
    expect(r.body.price).toBe(99);
  });

  it('after failing twice, the same course costs ₹99 too; unlocking it again resets attempts', async () => {
    expect((await enrol(B, 'web-development')).status).toBe(200); // B's one free course
    addAttempt(B, 'web-development', false);
    addAttempt(B, 'web-development', false);
    expect(await state(B)).toMatchObject({ courses: { 'web-development': 'failed' }, nextPrice: 99 });
    for (const course of ['sql-mastery', 'web-development']) expect((await enrol(B, course)).status).toBe(402);
    // the failed course is locked: no quizzes or projects until it is unlocked again
    const course = db$.getDb().courses.find(c => c.id === 'web-development');
    const quiz = await request(app).post(`/api/quizzes/module/${course.modules[0].id}/submit`).set('X-Learner-Token', tok[B]).send({ answers: {} });
    expect(quiz.status).toBe(403);
    expect(quiz.body.code).toBe('COURSE_CLOSED');
    if (course.projects?.length) {
      const proj = await request(app).post('/api/projects/submit').set('X-Learner-Token', tok[B])
        .send({ courseId: course.id, projectId: course.projects[0].id, githubUrl: 'https://github.com/someone/some-repo' });
      expect(proj.status).toBe(403);
    }
    expect((await unlock('ARB-STU-FAIL01', 'web-development')).status).toBe(200);
    expect((await request(app).post(`/api/quizzes/module/${course.modules[0].id}/submit`).set('X-Learner-Token', tok[B]).send({ answers: {} })).status).toBe(200);
    expect((await state(B)).courses['web-development']).toBe('active');
    const { finalAttemptsUsed } = await import('../server/routes/quizRoutes.js');
    expect(finalAttemptsUsed(db$.getDb(), B, 'web-development')).toBe(0);
  });
});
