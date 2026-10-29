import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { dayKey, streakSummary } from '../server/lib/streak.js';

// Daily coding streak: consecutive India-time days with code runs or completed practice.
const at = (daysAgo) => new Date(Date.now() - daysAgo * 86400000);
const dbWith = (daysAgo, email = 'a@x.test') => ({
  learnerActivity: { [email]: { days: Object.fromEntries(daysAgo.map(d => [dayKey(at(d)), { runs: 1, kinds: { code: 1 } }])) } }
});

describe('streak summary', () => {
  it('counts consecutive days ending today', () => {
    const s = streakSummary(dbWith([0, 1, 2, 4]), 'a@x.test');
    expect(s).toMatchObject({ current: 3, best: 3, codedToday: true, totalDays: 4, nextMilestone: 7 });
    expect(s.recent).toHaveLength(35);
    expect(s.recent.at(-1)).toMatchObject({ date: dayKey(), active: true });
  });

  it('keeps yesterday\'s streak alive until the learner codes today', () => {
    expect(streakSummary(dbWith([1, 2]), 'a@x.test')).toMatchObject({ current: 2, codedToday: false });
  });

  it('a missed day resets the current streak but not the best', () => {
    expect(streakSummary(dbWith([2, 3, 4, 5, 6]), 'a@x.test')).toMatchObject({ current: 0, best: 5 });
  });

  it('completed practice, quizzes and interview problems count as coding days', () => {
    const db = {
      interviewProgress: { 'a@x.test': { 'dsa-75': { 'dsa-01': at(0).toISOString() } } },
      quizAttempts: [{ userId: 'a@x.test', completedAt: at(1).toISOString() }],
      practiceProgress: { 'a@x.test': { c: { m: { exercises: { e1: { completedAt: at(2).toISOString() } }, knowledge: {} } } } }
    };
    expect(streakSummary(db, 'a@x.test')).toMatchObject({ current: 3, best: 3 });
  });
});

const tmp = path.join(os.tmpdir(), `arb-streak-db-${process.pid}-${Date.now()}.json`);
const E = 'streak@example.test';
let app; let tok;

describe('activity API', () => {
  beforeAll(async () => {
    fs.copyFileSync(path.join(__dirname, '..', 'server', 'data', 'db.json'), tmp);
    Object.assign(process.env, { ARB_DB_FILE: tmp, NODE_ENV: 'test' });
    app = (await import('../server/app.js')).default;
    const db$ = await import('../server/db.js');
    const db = db$.getDb();
    db.learners[E] = { name: 'Streak Learner', email: E, regNo: 'STRK01', phone: '9999999999', learnerId: 'ARB-STU-STRK01', passwordHash: bcrypt.hashSync('Pw#12345', 10), emailVerified: true };
    db$.saveDb(db);
    tok = (await request(app).post('/api/learners/login').send({ email: E, password: 'Pw#12345', regNo: 'STRK01' })).body.token;
  });
  afterAll(() => { try { fs.unlinkSync(tmp); } catch { /* ignore */ } });

  it('needs a signed-in learner', async () => {
    expect((await request(app).get('/api/activity/streak')).status).toBe(401);
    expect((await request(app).post('/api/activity').send({ kind: 'code' })).status).toBe(401);
  });

  it('records a coding day and returns the streak', async () => {
    expect((await request(app).get('/api/activity/streak').set('X-Learner-Token', tok)).body.streak).toMatchObject({ current: 0, codedToday: false });
    const r = await request(app).post('/api/activity').set('X-Learner-Token', tok).send({ kind: 'code' });
    expect(r.body).toMatchObject({ newToday: true, streak: { current: 1, codedToday: true, totalDays: 1 } });
    const again = await request(app).post('/api/activity').set('X-Learner-Token', tok).send({ kind: 'interview' });
    expect(again.body).toMatchObject({ newToday: false, streak: { current: 1 } });
    expect(again.body.streak.recent.at(-1).runs).toBe(2);
  });
});
