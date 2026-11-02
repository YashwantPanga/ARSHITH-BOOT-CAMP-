import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { getDb, saveDb } from '../db.js';
import { getAnswer, saveAnswer } from '../lib/tutorStore.js';
import { findTutorLanguage, isTutorStyle, TUTOR_ACTIONS } from '../../shared/tutor/languages.js';

// "Lekha", the AI tutor. Two endpoints:
//   POST /tutor/explain - explains one module in the learner's language, written to be read aloud.
//   POST /tutor/ask     - follow-ups: a quick action ("explain simpler", "quiz me"...), a typed or spoken
//                         doubt, or "explain this part" for one sentence, with the conversation so far.
// Explanations and quick-action answers are generated once per module, language and depth and saved
// (server/lib/tutorStore.js, outside the main database), so later learners get them instantly. Personal doubts
// are not saved. Both kinds of new generation have a daily allowance per learner.

const router = express.Router();

export const TUTOR_MODEL = process.env.TUTOR_MODEL || 'claude-opus-5-5';
const DAILY_EXPLAIN = Number(process.env.TUTOR_DAILY_LIMIT || 40);      // new explanations per learner per day
const DAILY_QUESTIONS = Number(process.env.TUTOR_DAILY_QUESTIONS || 60); // new follow-up answers per learner per day
const MAX_HISTORY = 6;

let client = null;
/** Tests replace the Anthropic client with a fake. */
export function setTutorClient(c) { client = c; }
const getClient = () => (client ||= new Anthropic());
export const tutorEnabled = () => !!(client || process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

const SYSTEM_PROMPT = `You are Lekha, the AI tutor of CodeLekho, an Indian online academy for programming, SQL, web development and AI. A student is studying one lesson module and has chosen a language. What you write is shown on screen and read aloud by a text-to-speech voice, so write the way a warm, patient teacher speaks to one student. Your goal is that the student truly understands, not that they hear everything.

A full explanation is a lesson shown as a series of animated boards, like slides, each narrated by the voice. Write 8 to 12 boards that build one idea at a time:
- a "why" board: why this topic matters for the student's career;
- "idea" boards: one concept each, in order;
- at least one "analogy" board using everyday Indian life (a railway reservation chart, a kirana shop's ledger, a cricket scorecard, a tiffin box) where it genuinely makes the idea clearer;
- one or two "code" boards walking through the module's own code examples line by line;
- a "mistake" board with the mistakes beginners usually make, taken from the module;
- a "check" board after the main concept, a "recap" board, and a final "check" board.

Board format, exactly:
[[BOARD type]]
## Short board title (2 to 6 words)
- one point the voice reads, one or two short sentences
- another point (2 to 4 points per board)
> optional one-line big idea shown in large text
[[/BOARD]]

type is one of: why, idea, analogy, code, steps, mistake, recap, check.
A code board has the title, a fenced code block (at most 12 lines, from the module), then one note per important line, written as "@N " followed by what line N does, for example:
@1 This line creates a variable called name and stores the text in it.
@2 print shows the value on the screen, so the output is CodeLekho.
A check board contains only the title and one check-yourself question in the check-yourself format.
Write nothing outside the boards.

Check-yourself questions (in check boards and in quizzes) use exactly this format, each on its own lines, so the app can show them as cards the student answers before seeing the answer:
[[CHECK]]
Q: the question
A: the answer, one to three sentences
[[/CHECK]]

Language rules:
- Write in the requested language and its usual script, in simple spoken style, not textbook style.
- Keep programming keywords, code, function names and well-known technical terms in English (for example print, variable, SELECT, loop). The first time you use an important term, add a short explanation of it in the requested language.
- For Hinglish, write Hindi and English mixed naturally, the way students talk, using English (Latin) letters only.

Format rules (the voice reads everything except code):
- In follow-up answers use "## " headings for parts and short paragraphs of two to four sentences; in a full explanation use the board format.
- Put code only inside fenced code blocks. Never put code, symbols or URLs inside sentences that will be read aloud; describe them in words instead.
- No tables, no emojis, no markdown other than headings, short "- " bullet lists, "> " big-idea lines, **bold** for key terms, fenced code, "@N " code notes, boards and the check-yourself format.
- Stay with the module content provided. Do not invent facts, outputs or statistics that the module does not support; if the module's own example output is given, use it.

Follow-up turns (after the explanation):
- Answer only what was asked, in the same language, in about 80 to 300 words unless the request needs more, with at most one "## " heading.
- If the student is confused, try a different angle from the one already used: a new analogy, smaller steps, or a concrete worked example. Do not repeat the earlier wording.
- If the question is unrelated to this module or to learning programming, gently bring the student back to the module in one or two sentences.`;

const STYLE_GUIDE = {
  simple: 'Style: the student is a beginner. Use very simple words and more analogies; about 8 to 10 boards.',
  exam: 'Style: the student is preparing for interviews and exams. Be more precise: key definitions, edge cases and how this topic is asked in interviews; about 10 to 12 boards.'
};

/** Instructions for each quick action (shared/tutor/languages.js lists their labels). */
const ACTION_PROMPTS = {
  simpler: 'I did not fully understand. Explain the main idea of this module again, much more simply, in small steps, with a different everyday analogy than before.',
  example: 'Give me one more worked example for this module: a small, new piece of code (not one already shown), what it prints, and why, line by line.',
  reallife: 'Show me where this module is used in real jobs and real apps in India: two or three short, concrete situations.',
  code: 'Take the most important code example of this module and explain it line by line, very slowly, including what is printed at each step.',
  quiz: 'Quiz me on this module: give me three check-yourself questions, from easy to harder, each in the check-yourself format, with no other text except one short line of encouragement at the start.'
};

/** The module's teaching content, without quiz questions or answers. */
function moduleText(course, mod) {
  const rm = mod.readingMaterial || {};
  const parts = [`Course: ${course.title}`, `Module: ${mod.title}`];
  if (mod.description) parts.push(`Summary: ${mod.description}`);
  if (rm.introduction) parts.push(`Introduction:\n${rm.introduction}`);
  if (Array.isArray(rm.objectives) && rm.objectives.length) parts.push(`Learning objectives:\n- ${rm.objectives.join('\n- ')}`);
  for (const s of Array.isArray(rm.sections) ? rm.sections : []) {
    const bullets = Array.isArray(s.bulletPoints) && s.bulletPoints.length ? `\n- ${s.bulletPoints.join('\n- ')}` : '';
    parts.push(`Section: ${s.heading || ''}\n${s.text || s.content || ''}${bullets}`);
  }
  for (const ex of Array.isArray(rm.codeExamples) ? rm.codeExamples : []) {
    parts.push(`Code example: ${ex.title || ''}\n\`\`\`\n${ex.code || ''}\n\`\`\`\n${ex.explanation || ''}`);
  }
  if (Array.isArray(rm.commonMistakes) && rm.commonMistakes.length) parts.push(`Common mistakes:\n- ${rm.commonMistakes.join('\n- ')}`);
  if (Array.isArray(rm.bestPractices) && rm.bestPractices.length) parts.push(`Best practices:\n- ${rm.bestPractices.join('\n- ')}`);
  if (Array.isArray(rm.keyTakeaways) && rm.keyTakeaways.length) parts.push(`Key takeaways:\n- ${rm.keyTakeaways.join('\n- ')}`);
  return parts.join('\n\n');
}

const languageLine = (language) => (language.code === 'hinglish'
  ? 'Language: Hinglish (Hindi and English mixed, written only in English letters).'
  : `Language: ${language.name} (${language.native}).`);

/** The first user turn: the module and what to do. Identical for every follow-up, so it caches. */
const explainRequest = (course, mod, language, style) =>
  `${languageLine(language)}\n${STYLE_GUIDE[style]}\n\nExplain this module:\n\n<module>\n${moduleText(course, mod)}\n</module>`;

// FORMAT is part of every saved key: changing how explanations are written starts a fresh set.
const FORMAT = 'boards1';
const explainKey = (courseId, moduleId, lang, style) => `${courseId}::${moduleId}::${lang}::${style}::${FORMAT}`;
const today = () => new Date().toISOString().slice(0, 10);
const inFlight = new Map(); // cache key -> Promise<string>, so two learners asking at once share one generation

/** Finds the course and module or answers 400/404. */
function lookup(req, res) {
  const { courseId, moduleId, lang, style = 'simple' } = req.body || {};
  const language = findTutorLanguage(lang);
  if (!language || !isTutorStyle(style)) { res.status(400).json({ success: false, message: 'Choose a language and a style.' }); return null; }
  const db = getDb();
  const course = (db.courses || []).find(c => c.id === courseId);
  const mod = course?.modules?.find(m => m.id === moduleId);
  if (!mod) { res.status(404).json({ success: false, message: 'Module not found.' }); return null; }
  return { db, course, mod, language, style, courseId, moduleId, lang };
}

const sendText = (res, text, how) => {
  res.set({ 'Content-Type': 'text/plain; charset=utf-8', 'X-Tutor-Cache': how, 'Cache-Control': 'no-store' });
  res.end(text);
};

/** Takes one unit of the learner's daily allowance; returns a refund function, or null when it is used up. */
function takeAllowance(db, who, kind, limit) {
  if (!who) return () => {}; // admins are not limited
  const usage = (db.tutorUsage ||= {});
  const prev = usage[who]?.day === today() ? usage[who] : { day: today() };
  if ((prev[kind] || 0) >= limit) return null;
  usage[who] = { ...prev, [kind]: (prev[kind] || 0) + 1 };
  saveDb(db);
  return () => {
    const fresh = getDb(); // getDb returns a new copy each call: change and save the same one
    const u = fresh.tutorUsage?.[who];
    if (u?.[kind]) { u[kind] -= 1; saveDb(fresh); }
  };
}

/**
 * Streams one Claude answer to the response and resolves with the full text. When `saveAs` is given
 * and the answer finished normally, it is stored under that key for everyone.
 */
async function generate(res, { messages, saveAs, refund }) {
  res.set({ 'Content-Type': 'text/plain; charset=utf-8', 'X-Tutor-Cache': 'miss', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' });
  res.flushHeaders?.();
  const job = (async () => {
    const stream = getClient().beta.messages.stream({
      model: TUTOR_MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium' },
      system: SYSTEM_PROMPT,
      messages
    });
    stream.on('text', (delta) => { if (!res.writableEnded) res.write(delta); });
    const message = await stream.finalMessage();
    if (message.stop_reason === 'refusal') throw new Error('refusal');
    const text = message.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
    if (!text) throw new Error('empty');
    if (saveAs && message.stop_reason === 'end_turn') {
      await saveAnswer(saveAs, { text, model: message.model, createdAt: new Date().toISOString() });
    }
    return text;
  })();
  if (saveAs) inFlight.set(saveAs, job);
  try {
    await job;
    if (!res.writableEnded) res.end();
  } catch (err) {
    console.error('[tutor]', err?.status || '', err?.message || err);
    refund?.();
    if (!res.writableEnded) res.end('\n\n[[TUTOR_ERROR]]');
  } finally {
    if (saveAs) inFlight.delete(saveAs);
  }
}

/** Serves a saved or in-progress shared answer; returns true when it did. */
async function serveShared(res, key) {
  const saved = await getAnswer(key);
  if (saved?.text) { sendText(res, saved.text, 'hit'); return true; }
  if (inFlight.has(key)) {
    try { sendText(res, await inFlight.get(key), 'shared'); }
    catch { res.status(502).json({ success: false, message: 'The tutor could not finish this. Please try again.' }); }
    return true;
  }
  return false;
}

const tutorOff = (res) => res.status(503).json({ success: false, code: 'TUTOR_OFF', message: 'The AI tutor is not switched on yet. Please try again later.' });

router.get('/tutor/status', (req, res) => {
  res.json({ success: true, enabled: tutorEnabled() });
});

router.post('/tutor/explain', async (req, res) => {
  const ctx = lookup(req, res);
  if (!ctx) return;
  const { db, course, mod, language, style, courseId, moduleId, lang } = ctx;
  const key = explainKey(courseId, moduleId, lang, style);
  if (await serveShared(res, key)) return;
  if (!tutorEnabled()) return tutorOff(res);

  const refund = takeAllowance(db, req.learnerEmail, 'explain', DAILY_EXPLAIN);
  if (!refund) return res.status(429).json({ success: false, message: `You have used today's ${DAILY_EXPLAIN} new explanations. Explanations already made still open, and you get more tomorrow.` });

  await generate(res, { messages: [{ role: 'user', content: explainRequest(course, mod, language, style) }], saveAs: key, refund });
});

router.post('/tutor/ask', async (req, res) => {
  const ctx = lookup(req, res);
  if (!ctx) return;
  const { db, course, mod, language, style, courseId, moduleId, lang } = ctx;
  const { action } = req.body || {};
  const question = String(req.body?.question || '').trim().slice(0, 600);
  const focus = String(req.body?.focus || '').trim().slice(0, 500);
  const history = (Array.isArray(req.body?.history) ? req.body.history : [])
    .slice(-MAX_HISTORY)
    .map(t => ({ q: String(t?.q || '').slice(0, 600), a: String(t?.a || '').slice(0, 4000) }))
    .filter(t => t.q && t.a);
  if (action && !TUTOR_ACTIONS.some(a => a.id === action)) return res.status(400).json({ success: false, message: 'Unknown action.' });
  if (!action && !question && !focus) return res.status(400).json({ success: false, message: 'Ask a question first.' });

  // A quick action with no conversation is the same for every learner: share and save it.
  const shared = action && !question && !focus && !history.length ? `${explainKey(courseId, moduleId, lang, style)}::ask::${action}` : null;
  if (shared && await serveShared(res, shared)) return;
  if (!tutorEnabled()) return tutorOff(res);

  const refund = takeAllowance(db, req.learnerEmail, 'ask', DAILY_QUESTIONS);
  if (!refund) return res.status(429).json({ success: false, message: `You have asked ${DAILY_QUESTIONS} new questions today. Saved answers still open, and you can ask more tomorrow.` });

  const explanation = (await getAnswer(explainKey(courseId, moduleId, lang, style)))?.text;
  let ask = action ? ACTION_PROMPTS[action] : question;
  if (focus) ask = `About this part of your explanation: "${focus}"\n${question || 'I did not understand this part. Explain it again more simply, with an example.'}`;

  // module + explanation first (marked for prompt caching: identical for every follow-up on this module),
  // then the conversation, then the new request
  const messages = [{ role: 'user', content: explainRequest(course, mod, language, style) }];
  if (explanation) messages.push({ role: 'assistant', content: [{ type: 'text', text: explanation, cache_control: { type: 'ephemeral' } }] });
  else messages.push({ role: 'assistant', content: [{ type: 'text', text: '(The student has read the module; no explanation was given yet.)', cache_control: { type: 'ephemeral' } }] });
  for (const t of history) messages.push({ role: 'user', content: t.q }, { role: 'assistant', content: t.a });
  messages.push({ role: 'user', content: `${ask}\n\n(Answer in ${language.code === 'hinglish' ? 'Hinglish' : language.name}.)` });

  await generate(res, { messages, saveAs: shared, refund });
});

export default router;
