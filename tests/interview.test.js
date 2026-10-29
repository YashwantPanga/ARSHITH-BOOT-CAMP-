import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import initSqlJs from 'sql.js';
import { INTERVIEW_SETS, findInterviewSet } from '../shared/interview/index.js';
import { INTERVIEW_SQL_SCHEMA } from '../shared/interview/sqlSchema.js';
import { buildPythonCheck, parsePythonCheck, pyRepr } from '../shared/interview/pyHarness.js';
import { approachesFor } from '../shared/interview/approaches/index.js';

// Interview Prep content and progress. Python answers are checked against real Python by
// `npm run verify:interview`; here we check the content shape, the SQL answers and the API.
describe('interview content', () => {
  it('has every set with unique ids and complete items', () => {
    expect(INTERVIEW_SETS.map(s => [s.id, s.items.length])).toEqual([['sql-50', 50], ['dsa-75', 75], ['programming-essentials', 50], ['js-30', 30], ['interview-questions', 150]]);
    const ids = INTERVIEW_SETS.flatMap(s => s.items.map(i => i.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of INTERVIEW_SETS) {
      for (const it of s.items) {
        expect(it.title && it.difficulty && it.topic, it.id).toBeTruthy();
        expect(['Easy', 'Medium', 'Hard']).toContain(it.difficulty);
        if (s.kind === 'sql') expect(it.prompt && it.solution && it.explanation, it.id).toBeTruthy();
        if (s.kind === 'python') {
          expect(it.fn && it.params && it.solution && it.tests.length >= 3, it.id).toBeTruthy();
          expect(it.solution, it.id).toContain(`def ${it.fn}(`);
        }
        if (s.kind === 'concept') expect(it.answer.length, it.id).toBeGreaterThan(80);
        if (s.kind === 'javascript') {
          expect(it.tests.length >= 3 && it.tests.every(t => t.code.includes('return')), it.id).toBeTruthy();
          expect(it.solution, it.id).toContain(it.cls ? `class ${it.fn} ` : `function ${it.fn}(`);
        }
      }
    }
  });

  it('every coding problem has several approaches with one recommended', () => {
    for (const set of INTERVIEW_SETS.filter(s => s.kind !== 'concept')) {
      for (const item of set.items) {
        const { list, pick } = approachesFor(item);
        expect(list.length, item.id).toBeGreaterThanOrEqual(2);
        expect(list.filter(a => a.recommended), item.id).toHaveLength(1);
        expect(pick, item.id).toBeTruthy();
        for (const a of list) expect(a.title && a.idea && a.code, `${item.id} ${a.title}`).toBeTruthy();
      }
    }
  });

  it('every SQL answer runs on a fresh practice database and returns rows', async () => {
    const SQL = await initSqlJs();
    for (const p of findInterviewSet('sql-50').items) {
      const db = new SQL.Database();
      db.exec(INTERVIEW_SQL_SCHEMA);
      const res = db.exec(p.solution);
      expect(res.at(-1)?.values.length, p.id).toBeGreaterThan(0);
      db.close();
    }
  });

  it('builds a Python check program and reads its result line', () => {
    const p = findInterviewSet('dsa-75').items[0];
    const src = buildPythonCheck(p, p.solution, 2);
    expect(src).toContain('def pair_sum(nums, target):');
    expect(src).toContain('_arb_run("pair_sum"');
    expect(parsePythonCheck('hello\n__ARB_RESULT__{"results":[{"ok":true,"got":1}]}\n')).toEqual({ printed: 'hello', result: { results: [{ ok: true, got: 1 }] } });
    expect(pyRepr([true, null, 'a', [1]])).toBe('[True, None, "a", [1]]');
  });
});

const tmp = path.join(os.tmpdir(), `arb-interview-db-${process.pid}-${Date.now()}.json`);
const E = 'prep@example.test';
let app; let tok;

describe('interview progress API', () => {
  beforeAll(async () => {
    fs.copyFileSync(path.join(__dirname, '..', 'server', 'data', 'db.json'), tmp);
    Object.assign(process.env, { ARB_DB_FILE: tmp, NODE_ENV: 'test' });
    app = (await import('../server/app.js')).default;
    const db$ = await import('../server/db.js');
    const db = db$.getDb();
    db.learners[E] = { name: 'Prep Learner', email: E, regNo: 'PREP01', phone: '9999999999', learnerId: 'ARB-STU-PREP01', passwordHash: bcrypt.hashSync('Pw#12345', 10), emailVerified: true };
    db$.saveDb(db);
    tok = (await request(app).post('/api/learners/login').send({ email: E, password: 'Pw#12345', regNo: 'PREP01' })).body.token;
  });
  afterAll(() => { try { fs.unlinkSync(tmp); } catch { /* ignore */ } });

  it('needs a signed-in learner', async () => {
    expect((await request(app).get('/api/interview/progress')).status).toBe(401);
  });

  it('records, lists and clears solved items', async () => {
    const mark = (body) => request(app).post('/api/interview/solved').set('X-Learner-Token', tok).send(body);
    expect((await mark({ setId: 'sql-50', itemId: 'sql-01' })).status).toBe(200);
    expect((await mark({ setId: 'dsa-75', itemId: 'dsa-10' })).status).toBe(200);
    expect((await mark({ setId: 'dsa-75', itemId: 'nope' })).status).toBe(404);
    const p = (await request(app).get('/api/interview/progress').set('X-Learner-Token', tok)).body.progress;
    expect(Object.keys(p['sql-50'])).toEqual(['sql-01']);
    expect(Object.keys(p['dsa-75'])).toEqual(['dsa-10']);
    const plan = (body) => request(app).post('/api/interview/plan').set('X-Learner-Token', tok).send(body);
    expect((await plan({ setId: 'programming-essentials', perDay: 0, days: [1] })).status).toBe(400);
    expect((await plan({ setId: 'programming-essentials', perDay: 2, days: [] })).status).toBe(400);
    const saved = await plan({ setId: 'programming-essentials', perDay: 2, days: [5, 1, 1, 9] });
    expect(saved.body.plans['programming-essentials']).toMatchObject({ perDay: 2, days: [1, 5] });
    expect((await request(app).get('/api/interview/progress').set('X-Learner-Token', tok)).body.plans['programming-essentials'].perDay).toBe(2);
    expect((await plan({ setId: 'programming-essentials', clear: true })).body.plans).toEqual({});
    const cleared = (await mark({ setId: 'sql-50', itemId: 'sql-01', solved: false })).body.progress;
    expect(cleared['sql-50']).toEqual({});
  });
});
