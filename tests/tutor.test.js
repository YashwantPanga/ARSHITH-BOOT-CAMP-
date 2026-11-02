import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { TUTOR_LANGUAGES } from '../shared/tutor/languages.js';

// AI tutor: the Anthropic client is replaced by a fake, so these tests never call the real API.

const tmp = path.join(os.tmpdir(), `arb-tutor-db-${process.pid}-${Date.now()}.json`);
const E = 'tutor@example.test';
let app; let tok; let tutor; let calls;

/** A fake of client.beta.messages.stream(): emits `chunks` as text deltas, then the final message. */
function fakeClient({ chunks = ['## Why it matters\n', 'Python is easy. ', 'It reads like English.'], fail = false, stop = 'end_turn' } = {}) {
  return {
    beta: {
      messages: {
        stream(params) {
          calls.push(params);
          const listeners = [];
          return {
            on(event, cb) { if (event === 'text') listeners.push(cb); return this; },
            async finalMessage() {
              if (fail) throw new Error('boom');
              for (const c of chunks) listeners.forEach(cb => cb(c));
              return { model: params.model, stop_reason: stop, content: [{ type: 'text', text: chunks.join('') }] };
            }
          };
        }
      }
    }
  };
}

const firstModule = async () => {
  const db = (await import('../server/db.js')).getDb();
  const course = db.courses[0];
  return { courseId: course.id, moduleId: course.modules[0].id, mod: course.modules[0] };
};

describe('tutor languages', () => {
  it('covers English, Hinglish and the 22 scheduled languages with unique codes', () => {
    expect(TUTOR_LANGUAGES).toHaveLength(24);
    const codes = TUTOR_LANGUAGES.map(l => l.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const c of ['en', 'hinglish', 'hi', 'te', 'ta', 'ml', 'kn', 'bn', 'mr', 'gu', 'pa', 'or', 'ur', 'as', 'sa', 'sat', 'mni', 'ks', 'sd', 'kok', 'mai', 'doi', 'brx', 'ne']) expect(codes).toContain(c);
    for (const l of TUTOR_LANGUAGES) expect(l.name && l.native && l.speech, l.code).toBeTruthy();
  });
});

describe('tutor API', () => {
  beforeAll(async () => {
    fs.copyFileSync(path.join(__dirname, '..', 'server', 'data', 'db.json'), tmp);
    Object.assign(process.env, { ARB_DB_FILE: tmp, NODE_ENV: 'test' });
    app = (await import('../server/app.js')).default;
    tutor = await import('../server/routes/tutorRoutes.js');
    const db$ = await import('../server/db.js');
    const db = db$.getDb();
    db.learners[E] = { name: 'Tutor Learner', email: E, regNo: 'TUT01', phone: '9999999999', learnerId: 'ARB-STU-TUT01', passwordHash: bcrypt.hashSync('Pw#12345', 10), emailVerified: true };
    db$.saveDb(db);
    tok = (await request(app).post('/api/learners/login').send({ email: E, password: 'Pw#12345', regNo: 'TUT01' })).body.token;
  });
  afterAll(() => { tutor.setTutorClient(null); try { fs.unlinkSync(tmp); fs.rmSync(`${tmp}.tutor`, { recursive: true, force: true }); } catch { /* ignore */ } });
  beforeEach(() => { calls = []; });

  const explain = (body) => request(app).post('/api/tutor/explain').set('X-Learner-Token', tok).send(body);

  it('needs a signed-in learner', async () => {
    const { courseId, moduleId } = await firstModule();
    expect((await request(app).post('/api/tutor/explain').send({ courseId, moduleId, lang: 'te' })).status).toBe(401);
  });

  it('rejects an unknown language or module', async () => {
    tutor.setTutorClient(fakeClient());
    const { courseId, moduleId } = await firstModule();
    expect((await explain({ courseId, moduleId, lang: 'xx' })).status).toBe(400);
    expect((await explain({ courseId, moduleId, lang: 'te', style: 'loud' })).status).toBe(400);
    expect((await explain({ courseId, moduleId: 'nope', lang: 'te' })).status).toBe(404);
    expect(calls).toHaveLength(0);
  });

  it('streams a new explanation, then serves it from the cache', async () => {
    tutor.setTutorClient(fakeClient());
    const { courseId, moduleId, mod } = await firstModule();
    const first = await explain({ courseId, moduleId, lang: 'te', style: 'simple' });
    expect(first.status).toBe(200);
    expect(first.headers['x-tutor-cache']).toBe('miss');
    expect(first.text).toBe('## Why it matters\nPython is easy. It reads like English.');

    expect(calls).toHaveLength(1);
    const p = calls[0];
    expect(p.model).toBe('claude-opus-5-5');
    expect(p.fallbacks).toBe('default');
    expect(p.betas).toContain('server-side-fallback-2026-07-01');
    expect(p.output_config).toEqual({ effort: 'medium' });
    expect(p.thinking).toBeUndefined();
    const prompt = p.messages[0].content;
    expect(prompt).toContain('Language: Telugu (తెలుగు).');
    expect(prompt).toContain(mod.readingMaterial.sections[0].heading);
    // quiz questions and answers never go to the model
    const quizQ = mod.readingMaterial.selfAssessment?.questions?.[0]?.question || mod.readingMaterial.mcqs?.[0]?.question;
    if (quizQ) expect(prompt).not.toContain(quizQ);

    const db$ = await import('../server/db.js');
    expect(db$.getDb().tutorExplanations).toBeUndefined(); // kept outside the main database
    (await import('../server/lib/tutorStore.js')).clearTutorMemory(); // next read comes from disk

    const again = await explain({ courseId, moduleId, lang: 'te', style: 'simple' });
    expect(again.headers['x-tutor-cache']).toBe('hit');
    expect(again.text).toBe(first.text);
    expect(calls).toHaveLength(1); // no second API call

    // another style or language is a separate explanation
    await explain({ courseId, moduleId, lang: 'te', style: 'exam' });
    await explain({ courseId, moduleId, lang: 'hinglish' });
    expect(calls).toHaveLength(3);
    expect(calls[2].messages[0].content).toContain('Hinglish');
  });

  it('does not cache a cut-off answer and gives the allowance back on failure', async () => {
    const { courseId, moduleId } = await firstModule();
    tutor.setTutorClient(fakeClient({ stop: 'max_tokens' }));
    await explain({ courseId, moduleId, lang: 'ta' });
    await explain({ courseId, moduleId, lang: 'ta' });
    expect(calls).toHaveLength(2); // not cached, so asked again

    const db$ = await import('../server/db.js');
    const store = await import('../server/lib/tutorStore.js');
    const before = db$.getDb().tutorUsage[E].explain;
    tutor.setTutorClient(fakeClient({ fail: true }));
    const res = await explain({ courseId, moduleId, lang: 'ml' });
    expect(res.text).toContain('[[TUTOR_ERROR]]');
    expect(db$.getDb().tutorUsage[E].explain).toBe(before); // read again: the refund must be saved
    expect(await store.getAnswer(`${courseId}::${moduleId}::ml::simple::boards1`)).toBeNull();
    expect(await store.getAnswer(`${courseId}::${moduleId}::te::simple::boards1`)).not.toBeNull();
  });

  const askReq = (body) => request(app).post('/api/tutor/ask').set('X-Learner-Token', tok).send(body);

  it('answers a quick action once and shares it with everyone after that', async () => {
    tutor.setTutorClient(fakeClient({ chunks: ['Simpler: think of a tiffin box.'] }));
    const { courseId, moduleId } = await firstModule();
    const a = await askReq({ courseId, moduleId, lang: 'te', style: 'simple', action: 'simpler' });
    expect(a.status).toBe(200);
    expect(a.headers['x-tutor-cache']).toBe('miss');
    expect(a.text).toBe('Simpler: think of a tiffin box.');
    const p = calls[0];
    // module request, then the saved explanation (cached prefix), then the action
    expect(p.messages.map(m => m.role)).toEqual(['user', 'assistant', 'user']);
    expect(p.messages[1].content[0].text).toContain('Python is easy.');
    expect(p.messages[1].content[0].cache_control).toEqual({ type: 'ephemeral' });
    expect(p.messages[2].content).toContain('Explain the main idea of this module again');
    expect(p.messages[2].content).toContain('Answer in Telugu');

    const b = await askReq({ courseId, moduleId, lang: 'te', style: 'simple', action: 'simpler' });
    expect(b.headers['x-tutor-cache']).toBe('hit');
    expect(calls).toHaveLength(1);
  });

  it('answers a typed doubt with the conversation so far, and a doubt about one sentence', async () => {
    tutor.setTutorClient(fakeClient({ chunks: ['A variable is a labelled box.'] }));
    const { courseId, moduleId } = await firstModule();
    const history = [{ q: 'What is print?', a: 'print shows text.' }];
    const r = await askReq({ courseId, moduleId, lang: 'te', question: 'What is a variable?', history });
    expect(r.status).toBe(200);
    expect(r.headers['x-tutor-cache']).toBe('miss');
    const msgs = calls[0].messages;
    expect(msgs.map(m => m.role)).toEqual(['user', 'assistant', 'user', 'assistant', 'user']);
    expect(msgs[2].content).toBe('What is print?');
    expect(msgs[4].content).toContain('What is a variable?');
    // personal doubts are not saved for others
    await askReq({ courseId, moduleId, lang: 'te', question: 'What is a variable?', history });
    expect(calls).toHaveLength(2);

    await askReq({ courseId, moduleId, lang: 'te', focus: 'Python is easy.' });
    expect(calls[2].messages.at(-1).content).toContain('About this part of your explanation: "Python is easy."');
  });

  it('rejects an empty question or an unknown action', async () => {
    tutor.setTutorClient(fakeClient());
    const { courseId, moduleId } = await firstModule();
    expect((await askReq({ courseId, moduleId, lang: 'te' })).status).toBe(400);
    expect((await askReq({ courseId, moduleId, lang: 'te', action: 'dance' })).status).toBe(400);
    expect((await request(app).post('/api/tutor/ask').send({ courseId, moduleId, lang: 'te', question: 'hi' })).status).toBe(401);
    expect(calls).toHaveLength(0);
  });

  it('says so when the tutor has no API key', async () => {
    const saved = { k: process.env.ANTHROPIC_API_KEY, t: process.env.ANTHROPIC_AUTH_TOKEN };
    delete process.env.ANTHROPIC_API_KEY; delete process.env.ANTHROPIC_AUTH_TOKEN;
    tutor.setTutorClient(null);
    const { courseId, moduleId } = await firstModule();
    const res = await explain({ courseId, moduleId, lang: 'kn' });
    expect(res.status).toBe(503);
    expect(res.body.code).toBe('TUTOR_OFF');
    expect((await request(app).get('/api/tutor/status')).body.enabled).toBe(false);
    if (saved.k) process.env.ANTHROPIC_API_KEY = saved.k;
    if (saved.t) process.env.ANTHROPIC_AUTH_TOKEN = saved.t;
  });
});
