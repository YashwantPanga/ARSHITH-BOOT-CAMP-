import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';

// Final assessment lock: all module quizzes AND a GitHub repository for any one course project.
const tmp = path.join(os.tmpdir(), `arb-lock-db-${process.pid}-${Date.now()}.json`);
let app;
const email = `lock${Date.now()}@example.test`;
let token;

beforeAll(async () => {
  fs.copyFileSync(path.join(__dirname, '..', 'server', 'data', 'db.json'), tmp);
  process.env.ARB_DB_FILE = tmp;
  process.env.NODE_ENV = 'test';
  process.env.ARB_OUTBOX_DIR = path.join(os.tmpdir(), `arb-outbox-${process.pid}`);
  app = (await import('../server/app.js')).default;
  const reg = await request(app).post('/api/learners/register').send({ name: 'Lock Tester', regNo: 'LOCK0001', phone: '9876543210', email, password: 'secret123' });
  const verified = await request(app).post('/api/learners/verify-email').send({ email, code: reg.body.devCode });
  token = verified.body.token;
  await request(app).post('/api/enrollment').set('X-Learner-Token', token).send({ userId: email, courseId: 'python-programming' });
});
afterAll(() => { try { fs.unlinkSync(tmp); } catch { /* ignore */ } });

const passAllQuizzes = () => {
  const db = JSON.parse(fs.readFileSync(tmp, 'utf8'));
  const course = db.courses.find(c => c.id === 'python-programming');
  db.quizAttempts = db.quizAttempts || [];
  for (const m of course.modules) db.quizAttempts.push({ id: `t-${m.id}`, userId: email, courseId: course.id, moduleId: m.id, score: 5, totalQuestions: 5, percentage: 100, passed: true });
  fs.writeFileSync(tmp, JSON.stringify(db));
};

describe('final assessment lock', () => {
  it('stays locked by quizzes first', async () => {
    const res = await request(app).post('/api/final-test/start').set('X-Learner-Token', token).send({ userId: email, courseId: 'python-programming' });
    expect(res.status).toBe(403);
    expect(res.body.locked).toBe(true);
  });

  it('stays locked after all quizzes until a project repository is submitted', async () => {
    passAllQuizzes();
    const res = await request(app).post('/api/final-test/start').set('X-Learner-Token', token).send({ userId: email, courseId: 'python-programming' });
    expect(res.status).toBe(403);
    expect(res.body.reason).toBe('projects');
    expect(res.body.projects).toMatchObject({ required: 1, total: 3, submitted: 0 });
  });

  it('rejects links that are not GitHub repositories', async () => {
    for (const githubUrl of ['https://gitlab.com/a/b', 'https://github.com/onlyuser', 'not a url', 'http://github.com/a/b']) {
      const res = await request(app).post('/api/projects/submit').set('X-Learner-Token', token).send({ userId: email, courseId: 'python-programming', projectId: 'py-proj-1', githubUrl });
      expect(res.status, githubUrl).toBe(400);
    }
  });

  it('requires a signed-in learner to submit', async () => {
    const res = await request(app).post('/api/projects/submit').send({ userId: email, courseId: 'python-programming', projectId: 'py-proj-1', githubUrl: 'https://github.com/a/b' });
    expect(res.status).toBe(401);
  });

  it('unlocks once any one repository is submitted (the second project is enough), and admins can see it', async () => {
    const res = await request(app).post('/api/projects/submit').set('X-Learner-Token', token).send({ userId: email, courseId: 'python-programming', projectId: 'py-proj-2', githubUrl: 'https://github.com/lock-tester/project-2' });
    expect(res.status).toBe(200);
    expect(res.body.requirement).toMatchObject({ required: 1, total: 3, submitted: 1, missing: [] });
    const progress = await request(app).get(`/api/progress/python-programming?userId=${email}`).set('X-Learner-Token', token);
    expect(progress.body.projects.missing).toEqual([]);
    const start = await request(app).post('/api/final-test/start').set('X-Learner-Token', token).send({ userId: email, studentName: 'Lock Tester', courseId: 'python-programming' });
    expect(start.status).toBe(200);
    const db = JSON.parse(fs.readFileSync(tmp, 'utf8'));
    expect(db.projectSubmissions.filter(s => s.userId === email).length).toBe(1);
  });
});

describe('QR address', () => {
  it('advertises a network address instead of localhost', async () => {
    const res = await request(app).get('/api/site-info').set('Host', 'localhost:5000');
    expect(res.body.publicUrl).not.toMatch(/localhost|127\.0\.0\.1/);
    expect(res.body.publicUrl).toMatch(/^https?:\/\//);
  });
  it('uses PUBLIC_SITE_URL when configured', async () => {
    process.env.PUBLIC_SITE_URL = 'https://learn.example.com/';
    const res = await request(app).get('/api/site-info');
    delete process.env.PUBLIC_SITE_URL;
    expect(res.body.publicUrl).toBe('https://learn.example.com');
  });
});
