import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import bcrypt from 'bcryptjs';

// Free mode (PAID_COURSES not set): every course is free, and a course failed twice can be started
// again at once - its module quizzes restart and the final gets two fresh attempts.
const tmp = path.join(os.tmpdir(), `arb-free-db-${process.pid}-${Date.now()}.json`);
const C = 'free@example.test';
let app; let db$; let tok;

const enrol = (courseId) => request(app).post('/api/enrollment').set('X-Learner-Token', tok).send({ courseId });
const state = async () => (await request(app).get('/api/enrollment').set('X-Learner-Token', tok)).body;
const progress = async (courseId) => (await request(app).get(`/api/progress/${courseId}`).set('X-Learner-Token', tok)).body;
const quiz = (moduleId) => request(app).post(`/api/quizzes/module/${moduleId}/submit`).set('X-Learner-Token', tok).send({ answers: {} });
const failFinal = () => {
  const db = db$.getDb();
  db.finalTestAttempts = [...(db.finalTestAttempts || []), { id: `fa-${Math.random()}`, userId: C, courseId: 'sql-mastery', passed: false, percentage: 20, submittedAt: new Date().toISOString() }];
  db$.saveDb(db);
};
const tick = () => new Promise(r => setTimeout(r, 5));

beforeAll(async () => {
  fs.copyFileSync(path.join(__dirname, '..', 'server', 'data', 'db.json'), tmp);
  delete process.env.PAID_COURSES;
  Object.assign(process.env, { ARB_DB_FILE: tmp, NODE_ENV: 'test' });
  app = (await import('../server/app.js')).default;
  db$ = await import('../server/db.js');
  const db = db$.getDb();
  db.learners[C] = { name: 'Free Learner', email: C, regNo: 'FREE01', phone: '9999999999', learnerId: 'ARB-STU-FREE01', passwordHash: bcrypt.hashSync('Pw#12345', 10), emailVerified: true };
  db.students = [{ id: 'ARB-STU-FREE01', name: 'Free Learner', email: C, status: 'active' }, ...(db.students || [])];
  db$.saveDb(db);
  tok = (await request(app).post('/api/learners/login').send({ email: C, password: 'Pw#12345', regNo: 'FREE01' })).body.token;
});
afterAll(() => { try { fs.unlinkSync(tmp); } catch { /* ignore */ } });

describe('free courses', () => {
  it('every course is free and several can be taken at once', async () => {
    for (const id of ['sql-mastery', 'python-programming', 'web-development']) expect((await enrol(id)).status).toBe(200);
    const s = await state();
    expect(s).toMatchObject({ free: true, nextPrice: 0, paymentsEnabled: false });
    expect(s.courseIds.sort()).toEqual(['python-programming', 'sql-mastery', 'web-development']);
  });

  it('after two failed finals the course closes; starting again restarts the modules and the attempts', async () => {
    const course = db$.getDb().courses.find(c => c.id === 'sql-mastery');
    const [m1, m2] = course.modules.map(m => m.id);
    expect((await quiz(m1)).status).toBe(200);
    expect((await quiz(m2)).status).toBe(200);
    expect((await progress('sql-mastery')).passedModuleIds.sort()).toEqual([m1, m2].sort());
    failFinal(); failFinal();
    expect((await state()).courses['sql-mastery']).toBe('failed');
    const blocked = await quiz(m1);
    expect(blocked.status).toBe(403);
    expect(blocked.body.code).toBe('COURSE_CLOSED');

    await tick();
    expect((await enrol('sql-mastery')).status).toBe(200); // start again, no payment
    expect((await state()).courses['sql-mastery']).toBe('active');
    const p = await progress('sql-mastery');
    expect(p.passedModuleIds).toEqual([]);   // every module has to be done again
    expect(p.finalAttemptsUsed).toBe(0);     // two fresh attempts
    await tick();
    expect((await quiz(m1)).status).toBe(200);
    expect((await progress('sql-mastery')).passedModuleIds).toEqual([m1]);
  });

  it('the loop repeats: failing twice again closes it again, and it can be restarted again', async () => {
    failFinal(); failFinal();
    expect((await state()).courses['sql-mastery']).toBe('failed');
    await tick();
    expect((await enrol('sql-mastery')).status).toBe(200);
    expect((await progress('sql-mastery'))).toMatchObject({ passedModuleIds: [], finalAttemptsUsed: 0 });
  });
});
