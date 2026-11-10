import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import bcrypt from 'bcryptjs';

// Paid mode (PAID_COURSES=on). Several courses per learner. Every course is paid: Data Science is ₹199, the others ₹149
// (an admin can also unlock one). Failing the final twice closes the course; buying it again gives two fresh attempts.
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
  it('no course is free: Data Science costs ₹199 and the others ₹149', async () => {
    for (const id of ['python-programming', 'sql-mastery', 'web-development']) {
      const r = await enrol(A, id);
      expect(r.status).toBe(402);
      expect(r.body).toMatchObject({ code: 'PAYMENT_REQUIRED', price: 149 });
    }
    const ds = await enrol(A, 'data-science-ai');
    expect(ds.status).toBe(402);
    expect(ds.body.price).toBe(199);
    expect((await state(A)).courseIds).toEqual([]);
  });

  it('the course list shows each price and marks Data Science as the best seller', async () => {
    const { body } = await request(app).get('/api/courses');
    const list = body.courses || body;
    const byId = Object.fromEntries(list.map(c => [c.id, c]));
    expect(byId['data-science-ai']).toMatchObject({ price: 199, isFree: false, bestSeller: true });
    expect(byId['python-programming']).toMatchObject({ price: 149, isFree: false, bestSeller: false });
  });

  it('the admin unlocks paid courses (both stay open)', async () => {
    expect((await unlock('ARB-STU-PASS01', 'python-programming')).status).toBe(200);
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

  it('passing does not make the next course free', async () => {
    addAttempt(A, 'python-programming', true);
    addAttempt(A, 'sql-mastery', true);
    expect((await enrol(A, 'python-programming')).status).toBe(409); // already passed
    const r = await enrol(A, 'web-development');
    expect(r.status).toBe(402);
    expect(r.body.price).toBe(149);
  });

  it('after failing twice, the course must be bought again; unlocking it again resets attempts', async () => {
    expect((await unlock('ARB-STU-FAIL01', 'web-development')).status).toBe(200);
    addAttempt(B, 'web-development', false);
    addAttempt(B, 'web-development', false);
    expect(await state(B)).toMatchObject({ courses: { 'web-development': 'failed' } });
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
