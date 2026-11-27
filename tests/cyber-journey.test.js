import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { ensureCyberCourse } from '../server/lib/cyberCourse.js';
import { linkedInAddUrl } from '../src/utils/linkedin.js';

// The Cyber Security course end to end through the real API: enrol -> module quizzes -> project ->
// proctored final (with live warnings) -> certificate -> public verification -> LinkedIn link.
const tmp = path.join(os.tmpdir(), `arb-cyber-journey-${process.pid}-${Date.now()}.json`);
const COURSE = 'cyber-security';
const email = `cyber${Date.now()}@example.test`;
const student = { name: 'Kiran Cyber', regNo: 'CYB0001', phone: '9876500077', email, password: 'Cyber#12345' };
let app; let db$; let token; let sessionId; let certificateId;
const as = (r) => r.set('X-Learner-Token', token);

beforeAll(async () => {
  const db = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'server', 'data', 'db.json'), 'utf8'));
  ensureCyberCourse(db); // the server does this at startup
  fs.writeFileSync(tmp, JSON.stringify(db));
  Object.assign(process.env, { ARB_DB_FILE: tmp, NODE_ENV: 'test', PAID_COURSES: 'off', ARB_OUTBOX_DIR: path.join(os.tmpdir(), `arb-cyber-outbox-${process.pid}`) });
  app = (await import('../server/app.js')).default;
  db$ = await import('../server/db.js');
  const reg = await request(app).post('/api/learners/register').send(student);
  token = reg.body.token;
  expect(token).toBeTruthy();
});
afterAll(() => { try { fs.unlinkSync(tmp); } catch { /* ignore */ } });

describe('Cyber Security: from enrolment to a LinkedIn-ready certificate', () => {
  it('enrols, and the final stays locked until quizzes and a project are done', async () => {
    const e = await as(request(app).post('/api/enrollment')).send({ userId: email, courseId: COURSE });
    expect(e.status).toBe(200);
    const locked = await as(request(app).post('/api/final-test/start')).send({ userId: email, courseId: COURSE, studentName: student.name });
    expect(locked.status).toBe(403);
  });

  it('passes all 15 module quizzes and submits a project', async () => {
    const course = db$.getDb().courses.find(c => c.id === COURSE);
    expect(course.modules).toHaveLength(15);
    for (const m of course.modules) {
      const q = await as(request(app).get(`/api/quizzes/module/${m.id}`));
      expect(q.status).toBe(200);
      const answers = Object.fromEntries((m.quiz?.questions || m.quiz || []).map(x => [x.id, x.correctAnswer]));
      const r = await as(request(app).post(`/api/quizzes/module/${m.id}/submit`)).send({ userId: email, answers, studentName: student.name });
      expect(r.status).toBe(200);
    }
    const p = await as(request(app).post('/api/projects/submit')).send({ userId: email, courseId: COURSE, projectId: course.projects[0].id, githubUrl: 'https://github.com/kiran/cyber-lab' });
    expect(p.status).toBe(200);
  });

  it('starts the proctored final without leaking answers, and logs live warnings', async () => {
    const s = await as(request(app).post('/api/final-test/start')).send({ userId: email, courseId: COURSE, studentName: student.name });
    expect(s.status).toBe(200);
    expect(s.body.questions.length).toBeGreaterThan(0);
    expect(JSON.stringify(s.body.questions)).not.toMatch(/correctAnswer/);
    sessionId = s.body.sessionId;
    const ev = await as(request(app).post('/api/final-test/proctor-event')).send({ userId: email, courseId: COURSE, sessionId, event: { type: 'TAB_SWITCH', message: 'You left the exam tab.', strike: true } });
    expect(ev.status).toBe(200);
  });

  it('passes the final with every answer right', async () => {
    const db = db$.getDb();
    const session = db.finalTestActiveSessions[`${email}::${COURSE}::final`];
    const course = db.courses.find(c => c.id === COURSE);
    const paper = (course.finalTest?.questionPapers || []).find(p => p.paperCode === session.paperCode);
    const questions = paper?.questions?.length ? paper.questions : course.finalTest.questions;
    const answers = Object.fromEntries(questions.map(q => [q.id, q.correctAnswer]));
    const r = await as(request(app).post('/api/final-test/submit')).send({
      userId: email, courseId: COURSE, sessionId, answers, studentName: student.name,
      proctoring: { cameraVerified: true, violations: [{ type: 'TAB_SWITCH', message: 'You left the exam tab.', at: new Date().toISOString() }], flags: [], identity: { faceCaptured: true } }
    });
    expect(r.status).toBe(200);
    expect(r.body.result.passed).toBe(true);
    expect(r.body.result.percentage).toBe(100);
  });

  it('issues one CS certificate that anyone can verify, with a filled LinkedIn link', async () => {
    const c = await as(request(app).post('/api/certificates/issue')).send({ userId: email, courseId: COURSE, studentName: student.name, regNo: student.regNo });
    expect(c.status).toBe(200);
    const cert = c.body.certificate;
    certificateId = cert.certificateId;
    expect(certificateId).toMatch(/-CS-/);
    const again = await as(request(app).post('/api/certificates/issue')).send({ userId: email, courseId: COURSE, studentName: student.name, regNo: student.regNo });
    expect(again.body.certificate.certificateId).toBe(certificateId);
    const pub = await request(app).get(`/api/certificates/verify/${certificateId}`);
    expect(pub.status).toBe(200);
    expect(JSON.stringify(pub.body)).toContain('Kiran');

    const url = new URL(linkedInAddUrl(cert, `https://codelekho.com/verify/${certificateId}`));
    expect(url.origin + url.pathname).toBe('https://www.linkedin.com/profile/add');
    expect(url.searchParams.get('startTask')).toBe('CERTIFICATION_NAME');
    expect(url.searchParams.get('name')).toBe(cert.courseTitle);
    expect(url.searchParams.get('organizationName')).toBe('CodeLekho');
    expect(url.searchParams.get('certId')).toBe(certificateId);
    expect(url.searchParams.get('certUrl')).toContain(certificateId);
    expect(Number(url.searchParams.get('issueYear'))).toBe(new Date().getFullYear());
    expect(Number(url.searchParams.get('issueMonth'))).toBe(new Date().getMonth() + 1);
  });
});
