import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';

// Live proctoring: warnings reach the admin panel during the exam, and every attempt keeps its
// violations, review flags and identity results.
const tmp = path.join(os.tmpdir(), `arb-proctor-db-${process.pid}-${Date.now()}.json`);
let app;
let adminToken;
let token;
let sessionId;
const email = `proctor${Date.now()}@example.test`;
const courseId = 'python-programming';

beforeAll(async () => {
  fs.copyFileSync(path.join(__dirname, '..', 'server', 'data', 'db.json'), tmp);
  process.env.ARB_DB_FILE = tmp;
  process.env.NODE_ENV = 'test';
  process.env.ARB_OUTBOX_DIR = path.join(os.tmpdir(), `arb-outbox-${process.pid}`);
  process.env.ADMIN_EMAIL = 'proctor-admin@example.test';
  process.env.ADMIN_PASSWORD = 'Proctor-test-9';
  app = (await import('../server/app.js')).default;
  (await import('../server/lib/adminSetup.js')).applyAdminSettings();
  adminToken = (await request(app).post('/api/learners/login').send({ email: 'proctor-admin@example.test', password: 'Proctor-test-9', regNo: '' })).body.staffToken;

  const reg = await request(app).post('/api/learners/register').send({ name: 'Proctor Tester', regNo: 'PROC0001', phone: '9876543210', email, password: 'secret123' });
  token = (await request(app).post('/api/learners/verify-email').send({ email, code: reg.body.devCode })).body.token;
  await request(app).post('/api/enrollment').set('X-Learner-Token', token).send({ userId: email, courseId });
  const db = JSON.parse(fs.readFileSync(tmp, 'utf8'));
  const course = db.courses.find(c => c.id === courseId);
  db.quizAttempts = db.quizAttempts || [];
  for (const m of course.modules) db.quizAttempts.push({ id: `p-${m.id}`, userId: email, courseId, moduleId: m.id, score: 5, totalQuestions: 5, percentage: 100, passed: true });
  fs.writeFileSync(tmp, JSON.stringify(db));
  await request(app).post('/api/projects/submit').set('X-Learner-Token', token).send({ userId: email, courseId, projectId: 'py-proj-1', githubUrl: 'https://github.com/proctor-tester/p1' });
  const start = await request(app).post('/api/final-test/start').set('X-Learner-Token', token).send({ userId: email, studentName: 'Proctor Tester', courseId });
  sessionId = start.body.sessionId;
});
afterAll(() => { try { fs.unlinkSync(tmp); } catch { /* ignore */ } });

const adminStudent = async () => {
  const res = await request(app).get('/api/admin/students').set('Authorization', `Bearer ${adminToken}`);
  const st = res.body.students.find(s => String(s.email).toLowerCase() === email);
  return st.enrolledCourseDetails.find(cd => cd.courseId === courseId);
};

describe('live proctoring in the admin panel', () => {
  it('shows a running exam with its warnings as they happen', async () => {
    expect(sessionId).toBeTruthy();
    const send = (event) => request(app).post('/api/final-test/proctor-event').set('X-Learner-Token', token).send({ userId: email, courseId, sessionId, event });
    expect((await send({ type: 'PHONE_DETECTED', message: 'A mobile phone was detected on camera.', strike: true })).status).toBe(200);
    expect((await send({ type: 'HAND_NEAR_FACE', message: 'A hand is near your face.', strike: false })).status).toBe(200);
    const cd = await adminStudent();
    expect(cd.liveExam.violationCount).toBe(1);
    expect(cd.liveExam.events.map(e => e.type)).toEqual(['PHONE_DETECTED', 'HAND_NEAR_FACE']);
  });

  it('rejects events for a session that is not running', async () => {
    const res = await request(app).post('/api/final-test/proctor-event').send({ userId: email, courseId, sessionId: 'session-nope', event: { type: 'X' } });
    expect(res.status).toBe(409);
  });

  it('keeps each violation, flag and identity result with the submitted attempt', async () => {
    const sub = await request(app).post('/api/final-test/submit').set('X-Learner-Token', token).send({
      userId: email, studentName: 'Proctor Tester', courseId, sessionId, answers: {},
      proctoring: {
        cameraVerified: true,
        violations: [{ type: 'PHONE_DETECTED', message: 'A mobile phone was detected on camera.', at: new Date().toISOString() }, { type: 'LOOKING_DOWN', message: 'You are looking down.', at: new Date().toISOString() }],
        flags: [{ type: 'HAND_NEAR_FACE', message: 'A hand is near your face.', at: new Date().toISOString() }],
        identity: { faceCaptured: true, idCard: { method: 'name', checked: true, matched: true, percent: 100, attempts: 1 }, liveChecks: 40, mismatchedChecks: 0, averageMatch: 91 }
      }
    });
    expect(sub.status).toBe(200);
    const cd = await adminStudent();
    expect(cd.liveExam).toBeNull();
    expect(cd.totalViolations).toBe(2);
    const [attempt] = cd.examAttempts;
    expect(attempt.violationCount).toBe(2);
    expect(attempt.violations.map(v => v.type)).toEqual(['PHONE_DETECTED', 'LOOKING_DOWN']);
    expect(attempt.flags.map(f => f.type)).toEqual(['HAND_NEAR_FACE']);
    expect(attempt.identity).toMatchObject({ faceCaptured: true, idCardMatched: true, averageMatch: 91 });
  });
});
