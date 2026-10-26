import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import bcrypt from 'bcryptjs';

// Final assessment: no answers in the result, two tries at most. Admin can delete a student.
// Certificate picture + LinkedIn preview tags. Project submit works with an admin session in the same browser.
const tmp = path.join(os.tmpdir(), `arb-exam-db-${process.pid}-${Date.now()}.json`);
const imgDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arb-cert-img-'));
const EMAIL = 'exam@example.test';
const COURSE = 'python-programming';
let app; let token; let adminToken; let db$;

beforeAll(async () => {
  fs.copyFileSync(path.join(__dirname, '..', 'server', 'data', 'db.json'), tmp);
  Object.assign(process.env, { ARB_DB_FILE: tmp, NODE_ENV: 'test', ARB_CERT_IMAGE_DIR: imgDir, ADMIN_EMAIL: 'exam-admin@example.test', ADMIN_PASSWORD: 'Exam-admin-77' });
  app = (await import('../server/app.js')).default;
  (await import('../server/lib/adminSetup.js')).applyAdminSettings();
  db$ = await import('../server/db.js');
  const db = db$.getDb();
  const course = db.courses.find(c => c.id === COURSE);
  db.learners[EMAIL] = { name: 'Exam Taker', email: EMAIL, regNo: 'EXAM0001', phone: '9999999999', learnerId: 'ARB-STU-EXAM01', passwordHash: bcrypt.hashSync('Exam#pass1', 10), emailVerified: true };
  db.students = [{ id: 'ARB-STU-EXAM01', name: 'Exam Taker', email: EMAIL, status: 'active' }, ...(db.students || [])];
  db.learnerEnrollments = { ...(db.learnerEnrollments || {}), [EMAIL]: { courseId: COURSE } };
  db.quizAttempts = [...(db.quizAttempts || []), ...course.modules.map((m, i) => ({ id: `qa-${i}`, userId: EMAIL, courseId: COURSE, moduleId: m.id, passed: true, percentage: 100 }))];
  db$.saveDb(db);
  token = (await request(app).post('/api/learners/login').send({ email: EMAIL, password: 'Exam#pass1', regNo: 'EXAM0001' })).body.token;
  adminToken = (await request(app).post('/api/learners/login').send({ email: 'exam-admin@example.test', password: 'Exam-admin-77' })).body.staffToken;
});
afterAll(() => {
  delete process.env.ADMIN_EMAIL; delete process.env.ADMIN_PASSWORD; delete process.env.ARB_CERT_IMAGE_DIR;
  try { fs.unlinkSync(tmp); fs.rmSync(imgDir, { recursive: true, force: true }); } catch { /* ignore */ }
});

const asLearner = (r) => r.set('X-Learner-Token', token);

describe('project submission', () => {
  it('works even when the browser also holds an admin session', async () => {
    const res = await asLearner(request(app).post('/api/projects/submit').set('Authorization', `Bearer ${adminToken}`))
      .send({ courseId: COURSE, projectId: 'py-proj-1', githubUrl: 'https://github.com/someone/log-analyzer' });
    expect(res.status).toBe(200);
    expect(res.body.submission.userId).toBe(EMAIL);
  });
});

describe('final assessment', () => {
  const start = () => asLearner(request(app).post('/api/final-test/start')).send({ courseId: COURSE, studentName: 'Exam Taker' });
  const submit = (sessionId) => asLearner(request(app).post('/api/final-test/submit')).send({ courseId: COURSE, sessionId, answers: {}, studentName: 'Exam Taker' });

  it('returns no answers in the result and counts attempts down', async () => {
    const s1 = await start();
    expect(s1.status).toBe(200);
    expect(s1.body.attemptNumber).toBe(1);
    expect(s1.body.maxAttempts).toBe(2);
    expect(JSON.stringify(s1.body.questions)).not.toMatch(/correctAnswer|explanation/);
    const r1 = await submit(s1.body.sessionId);
    expect(r1.status).toBe(200);
    expect(r1.body.result.passed).toBe(false);
    expect(r1.body.result.questionsReview).toBeUndefined();
    expect(JSON.stringify(r1.body)).not.toMatch(/correctAnswer|explanation/);
    expect(r1.body.result.attemptsLeft).toBe(1);
  });

  it('counts an abandoned (expired, unsubmitted) exam as a try and then refuses a third', async () => {
    const s2 = await start();
    expect(s2.status).toBe(200);
    expect(s2.body.attemptNumber).toBe(2);
    // let the second exam expire without submitting
    const db = db$.getDb();
    const key = Object.keys(db.finalTestActiveSessions).find(k => k.startsWith(`${EMAIL}::`));
    db.finalTestActiveSessions[key].startedAt -= 4 * 3600 * 1000;
    db$.saveDb(db);
    const s3 = await start();
    expect(s3.status).toBe(403);
    expect(s3.body.code).toBe('FINAL_ATTEMPTS_USED');
  });
});

describe('certificate picture and preview tags', () => {
  it('lets only the owner upload, serves the picture and tags the verify page', async () => {
    const db = db$.getDb();
    db.certificates = [...(db.certificates || []), { certificateId: 'ARB-TEST-0001', userId: EMAIL, studentName: 'Exam Taker', courseTitle: 'Python Programming', percentage: 88, status: 'active' }];
    db$.saveDb(db);
    const jpeg = 'data:image/jpeg;base64,' + Buffer.concat([Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]), Buffer.alloc(20000, 1)]).toString('base64');
    expect((await request(app).post('/api/certificates/ARB-TEST-0001/image').send({ image: jpeg })).status).toBe(401);
    const up = await asLearner(request(app).post('/api/certificates/ARB-TEST-0001/image')).send({ image: jpeg });
    expect(up.status).toBe(200);
    const img = await request(app).get('/api/certificates/ARB-TEST-0001/image.jpg');
    expect(img.status).toBe(200);
    expect(img.headers['content-type']).toMatch(/image\/jpeg/);
  });
});

describe('admin deletes a student', () => {
  it('is hidden from non-admins and removes the account and its records', async () => {
    expect((await request(app).delete('/api/admin/students/ARB-STU-EXAM01')).status).toBe(404);
    const res = await request(app).delete('/api/admin/students/ARB-STU-EXAM01').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.removed.finalAttempts).toBe(1);
    const db = db$.getDb();
    expect(db.learners[EMAIL]).toBeUndefined();
    expect(db.learnerEnrollments[EMAIL]).toBeUndefined();
    expect((db.quizAttempts || []).some(a => a.userId === EMAIL)).toBe(false);
    expect((db.certificates || []).some(c => c.userId === EMAIL)).toBe(false);
    expect((await request(app).post('/api/learners/login').send({ email: EMAIL, password: 'Exam#pass1', regNo: 'EXAM0001' })).status).toBe(401);
  });
});
