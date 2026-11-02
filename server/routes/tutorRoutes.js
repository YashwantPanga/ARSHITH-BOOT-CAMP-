import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { getDb, saveDb } from '../db.js';
import { findTutorLanguage, isTutorStyle } from '../../shared/tutor/languages.js';

// "Lekha", the AI tutor: explains one module in the learner's language, written to be read aloud.
// Each explanation is generated once per (course, module, language, style) and stored in
// db.tutorExplanations, so later learners get it instantly and the API is not called again.

const router = express.Router();

export const TUTOR_MODEL = process.env.TUTOR_MODEL || 'claude-opus-5-5';
const DAILY_LIMIT = Number(process.env.TUTOR_DAILY_LIMIT || 40); // new (uncached) explanations per learner per day

let client = null;
/** Tests replace the Anthropic client with a fake. */
export function setTutorClient(c) { client = c; }
const getClient = () => (client ||= new Anthropic());
export const tutorEnabled = () => !!(client || process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

const SYSTEM_PROMPT = `You are Lekha, the AI tutor of CodeLekho, an Indian online academy for programming, SQL, web development and AI. A student has pressed "Explain" on a lesson module and chosen a language. Your explanation is shown on screen and read aloud by a text-to-speech voice, so write the way a warm, patient teacher speaks to one student.

Teaching approach:
- Start with one or two sentences on why this topic matters for the student's career.
- Explain the concepts in order, one idea at a time, building on what came before. Use analogies from everyday Indian life (a railway reservation chart, a kirana shop's ledger, a cricket scorecard, a tiffin box) where they genuinely make the idea clearer.
- Walk through one or two of the module's code examples line by line: what each line does and what it prints.
- Point out the mistakes beginners usually make, taken from the module.
- End with a short recap and two quick check-yourself questions, each followed by its answer.

Language rules:
- Write the whole explanation in the requested language and its usual script, in simple spoken style, not textbook style.
- Keep programming keywords, code, function names and well-known technical terms in English (for example print, variable, SELECT, loop). The first time you use an important term, add a short explanation of it in the requested language.
- For Hinglish, write Hindi and English mixed naturally, the way students talk, using English (Latin) letters only.

Format rules (the voice reads everything except code):
- Use "## " headings for each part. Keep paragraphs short: two to four sentences.
- Put code only inside fenced code blocks. Never put code, symbols or URLs inside sentences that will be read aloud; describe them in words instead.
- No tables, no emojis, no markdown other than headings, short "- " bullet lists, **bold** for key terms and fenced code.
- Stay with the module content provided. Do not invent facts, outputs or statistics that the module does not support; if the module's own example output is given, use it.`;

const STYLE_GUIDE = {
  simple: 'Style: the student is a beginner. Use very simple words, more analogies, and keep it to about 600 to 900 words.',
  exam: 'Style: the student is preparing for interviews and exams. Be more precise, include key definitions, edge cases and how this topic is asked in interviews, about 900 to 1300 words.'
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

const cacheKey = (courseId, moduleId, lang, style) => `${courseId}::${moduleId}::${lang}::${style}`;
const today = () => new Date().toISOString().slice(0, 10);
const inFlight = new Map(); // cacheKey -> Promise<string>, so two learners asking at once share one generation

router.get('/tutor/status', (req, res) => {
  res.json({ success: true, enabled: tutorEnabled() });
});

router.post('/tutor/explain', async (req, res) => {
  const { courseId, moduleId, lang, style = 'simple' } = req.body || {};
  const language = findTutorLanguage(lang);
  if (!language || !isTutorStyle(style)) return res.status(400).json({ success: false, message: 'Choose a language and a style.' });

  const db = getDb();
  const course = (db.courses || []).find(c => c.id === courseId);
  const mod = course?.modules?.find(m => m.id === moduleId);
  if (!mod) return res.status(404).json({ success: false, message: 'Module not found.' });

  const key = cacheKey(courseId, moduleId, lang, style);
  const cached = db.tutorExplanations?.[key];
  if (cached?.text) {
    res.set({ 'Content-Type': 'text/plain; charset=utf-8', 'X-Tutor-Cache': 'hit', 'Cache-Control': 'no-store' });
    return res.end(cached.text);
  }

  if (!tutorEnabled()) {
    return res.status(503).json({ success: false, code: 'TUTOR_OFF', message: 'The AI tutor is not switched on yet. Please try again later.' });
  }

  // Someone else is generating the same explanation right now: wait for it.
  if (inFlight.has(key)) {
    try {
      const text = await inFlight.get(key);
      res.set({ 'Content-Type': 'text/plain; charset=utf-8', 'X-Tutor-Cache': 'shared', 'Cache-Control': 'no-store' });
      return res.end(text);
    } catch {
      return res.status(502).json({ success: false, message: 'The tutor could not finish this explanation. Please try again.' });
    }
  }

  // Daily allowance of new explanations per learner (admins are not limited).
  const who = req.learnerEmail;
  if (who) {
    const usage = (db.tutorUsage ||= {});
    const mine = usage[who]?.day === today() ? usage[who] : { day: today(), count: 0 };
    if (mine.count >= DAILY_LIMIT) {
      return res.status(429).json({ success: false, message: `You have used today's ${DAILY_LIMIT} new explanations. Explanations already made still open, and you get more tomorrow.` });
    }
    usage[who] = { day: mine.day, count: mine.count + 1 };
    saveDb(db);
  }

  res.set({ 'Content-Type': 'text/plain; charset=utf-8', 'X-Tutor-Cache': 'miss', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' });
  res.flushHeaders?.();

  const languageLine = language.code === 'hinglish'
    ? 'Language: Hinglish (Hindi and English mixed, written only in English letters).'
    : `Language: ${language.name} (${language.native}).`;

  const generation = (async () => {
    const stream = getClient().beta.messages.stream({
      model: TUTOR_MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium' },
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `${languageLine}\n${STYLE_GUIDE[style]}\n\nExplain this module:\n\n<module>\n${moduleText(course, mod)}\n</module>`
      }]
    });
    stream.on('text', (delta) => { if (!res.writableEnded) res.write(delta); });
    const message = await stream.finalMessage();
    if (message.stop_reason === 'refusal') throw new Error('refusal');
    const text = message.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
    if (!text) throw new Error('empty');
    if (message.stop_reason === 'end_turn') {
      const fresh = getDb();
      (fresh.tutorExplanations ||= {})[key] = { text, model: message.model, createdAt: new Date().toISOString() };
      saveDb(fresh);
    }
    return text;
  })();
  inFlight.set(key, generation);

  try {
    await generation;
    if (!res.writableEnded) res.end();
  } catch (err) {
    console.error('[tutor]', err?.status || '', err?.message || err);
    // give the allowance back: nothing usable was produced
    if (who) { const u = getDb().tutorUsage?.[who]; if (u?.count) { u.count -= 1; saveDb(getDb()); } }
    if (!res.headersSent) res.status(502).json({ success: false, message: 'The tutor could not explain this right now. Please try again.' });
    else if (!res.writableEnded) res.end('\n\n[[TUTOR_ERROR]]');
  } finally {
    inFlight.delete(key);
  }
});

export default router;
