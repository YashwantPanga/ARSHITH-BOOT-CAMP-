import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';

// Run the real Express app against a throw-away copy of the database.
const tmp = path.join(os.tmpdir(), `arb-test-db-${process.pid}-${Date.now()}.json`);
let app;

beforeAll(async () => {
  fs.copyFileSync(path.join(__dirname, '..', 'server', 'data', 'db.json'), tmp);
  process.env.ARB_DB_FILE = tmp;
  process.env.NODE_ENV = 'test';
  process.env.ARB_OUTBOX_DIR = path.join(os.tmpdir(), `arb-outbox-${process.pid}`);
  app = (await import('../server/app.js')).default;
});
afterAll(() => { try { fs.unlinkSync(tmp); } catch { /* ignore */ } });

const learner = { name: 'Test Learner', regNo: 'TST0001', phone: '9876543210', email: `t${Date.now()}@example.test`, password: 'secret123' };
let token;

describe('learner accounts', () => {
  it('registers, requires email verification, then returns a signed token (never the password)', async () => {
    const res = await request(app).post('/api/learners/register').send(learner);
    expect(res.status).toBe(201);
    expect(res.body.verificationRequired).toBe(true);
    expect(res.body.token).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toMatch(/secret123|passwordHash/);
    const v = await request(app).post('/api/learners/verify-email').send({ email: learner.email, code: res.body.devCode });
    expect(v.status).toBe(200);
    expect(v.body.token).toBeTruthy();
    expect(JSON.stringify(v.body)).not.toMatch(/secret123|passwordHash|codeHash/);
    token = v.body.token;
  });
  it('rejects a duplicate registration number', async () => {
    const res = await request(app).post('/api/learners/register').send({ ...learner, email: 'other@example.test' });
    expect(res.status).toBe(409);
  });
  it('rejects a wrong password', async () => {
    const res = await request(app).post('/api/learners/login').send({ email: learner.email, regNo: learner.regNo, password: 'nope' });
    expect(res.status).toBe(401);
  });
});

describe('protected learner endpoints', () => {
  it('reject unauthenticated visitors', async () => {
    const r1 = await request(app).get(`/api/progress/python-programming?userId=${learner.email}`);
    const r2 = await request(app).post('/api/quizzes/module/py-mod-1/submit').send({ userId: learner.email, answers: {} });
    const r3 = await request(app).post('/api/certificates/issue').send({ userId: learner.email, courseId: 'python-programming' });
    for (const r of [r1, r2, r3]) { expect(r.status).toBe(401); expect(r.body.code).toBe('LEARNER_AUTH_REQUIRED'); }
  });
  it('refuse access to another learner\'s records', async () => {
    const res = await request(app).get('/api/progress/python-programming?userId=someone-else@example.test').set('X-Learner-Token', token);
    expect(res.status).toBe(403);
  });
  it('allow the signed-in learner (enroll, then read existing-style progress)', async () => {
    const e = await request(app).post('/api/enrollment').set('X-Learner-Token', token).send({ userId: learner.email, courseId: 'python-programming' });
    expect(e.status).toBe(200);
    const p = await request(app).get(`/api/progress/python-programming?userId=${learner.email}`).set('X-Learner-Token', token);
    expect(p.status).toBe(200);
    expect(p.body.passedModuleIds).toEqual([]);
  });
  it('mark a module done after any quiz attempt (module quizzes have no pass mark)', async () => {
    const res = await request(app).post('/api/quizzes/module/py-mod-1/submit').set('X-Learner-Token', token).send({ userId: learner.email, answers: {} });
    expect(res.status).toBe(200);
    expect(res.body.result.percentage).toBe(0);
    expect(res.body.result.passed).toBe(true);
    expect(res.body.result.passedModuleIds).toContain('py-mod-1');
    const p = await request(app).get(`/api/progress/python-programming?userId=${learner.email}`).set('X-Learner-Token', token);
    expect(p.body.passedModuleIds).toContain('py-mod-1');
    expect(p.body.passPercentage).toBe(70); // the final assessment still needs 70%
  });
  it('keep certification requirements intact (no certificate without passing the final)', async () => {
    const res = await request(app).post('/api/certificates/issue').set('X-Learner-Token', token).send({ userId: learner.email, courseId: 'python-programming' });
    expect(res.status).toBe(403);
  });
});

describe('admin-only content editing', () => {
  it('rejects a user without admin permission', async () => {
    const r1 = await request(app).put('/api/admin/courses/python-programming').send({ title: 'Hacked' });
    const r2 = await request(app).put('/api/admin/courses/python-programming').set('X-Learner-Token', token).send({ title: 'Hacked' });
    // the admin API is hidden: non-admins get the same 404 as for a route that does not exist
    expect(r1.status).toBe(404);
    expect(r2.status).toBe(404);
  });
});

describe('enrichment and practice API', () => {
  it('returns enrichment without answers', async () => {
    const res = await request(app).get('/api/courses/sql-mastery/modules/sql-mod-9/enrichment');
    expect(res.status).toBe(200);
    expect(res.body.enrichment.exercises.length).toBeGreaterThan(0);
    // Exercises must not carry answers; the worked example's expected output is intentionally public.
    expect(JSON.stringify(res.body.enrichment.exercises)).not.toMatch(/"solutionCode"|"expectedOutput"|"check"|"solution"/);
    expect(JSON.stringify(res.body.enrichment.knowledgeCheck)).not.toMatch(/"answer"/);
  });
  it('404s for unknown modules', async () => {
    const res = await request(app).get('/api/courses/sql-mastery/modules/does-not-exist/enrichment');
    expect(res.status).toBe(404);
  });
  it('grades a submission, reveals the solution and records progress for the learner', async () => {
    const wrong = await request(app).post('/api/practice/check').set('X-Learner-Token', token)
      .send({ courseId: 'python-programming', moduleId: 'py-mod-3', itemId: 'py3-e1', answer: '9' });
    expect(wrong.body.correct).toBe(false);
    expect(wrong.body.solution.length).toBeGreaterThan(0);
    expect(wrong.body.recorded).toBe(false);
    const right = await request(app).post('/api/practice/check').set('X-Learner-Token', token)
      .send({ courseId: 'python-programming', moduleId: 'py-mod-3', itemId: 'py3-e1', answer: '4' });
    expect(right.body.correct).toBe(true);
    expect(right.body.recorded).toBe(true);
    const prog = await request(app).get(`/api/practice/progress?userId=${learner.email}&courseId=python-programming`).set('X-Learner-Token', token);
    expect(Object.keys(prog.body.progress['py-mod-3'].exercises)).toContain('py3-e1');
  });
  it('does not record progress for anonymous visitors', async () => {
    const res = await request(app).post('/api/practice/check').send({ courseId: 'python-programming', moduleId: 'py-mod-3', itemId: 'py3-e1', answer: '4' });
    expect(res.body.correct).toBe(true);
    expect(res.body.recorded).toBe(false);
  });
  it('grades knowledge checks without exposing answers beforehand', async () => {
    const res = await request(app).post('/api/practice/check').send({ courseId: 'web-development', moduleId: 'web-mod-7', itemId: 'web7-k1', kind: 'knowledge', answer: 2 });
    expect(res.body.correct).toBe(true);
    expect(res.body.answer).toBe(2);
  });
  it('quiz answer keys are still stripped from the public course payload', async () => {
    const res = await request(app).get('/api/courses/python-programming');
    expect(JSON.stringify(res.body)).not.toMatch(/"correctAnswer"/);
  });
});

describe('health check', () => {
  it('reports which database, email and payment setup is active, without secrets', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'file' });
    expect(['brevo-api', 'smtp', 'outbox']).toContain(res.body.email);
    expect(['on', 'off']).toContain(res.body.payments);
    expect(JSON.stringify(res.body)).not.toMatch(/sb_secret|rzp_|xsmtpsib|eyJ/);
  });
});
