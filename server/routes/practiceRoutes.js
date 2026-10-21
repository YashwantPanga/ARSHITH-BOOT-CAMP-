import express from 'express';
import { getDb, saveDb } from '../db.js';
import { getModuleEnrichment, toPublicEnrichment, gradeExercise, gradeKnowledge } from '../lib/practice.js';
import { learnerFromRequest } from '../middleware/learnerAuth.js';

const router = express.Router();

function moduleExists(db, courseId, moduleId) {
  const course = (db.courses || []).find(c => c.id === courseId || c.slug === courseId);
  return course && (course.modules || []).some(m => m.id === moduleId) ? course : null;
}

// Additional learning content for one module (loaded on demand by the module reader).
router.get('/courses/:courseId/modules/:moduleId/enrichment', (req, res) => {
  const { courseId, moduleId } = req.params;
  const db = getDb();
  const course = moduleExists(db, courseId, moduleId);
  if (!course) return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Module not found.' });
  const e = getModuleEnrichment(course.id, moduleId);
  if (!e) return res.json({ success: true, enrichment: null });
  res.json({ success: true, enrichment: toPublicEnrichment(e) });
});

// Grade a practice exercise or knowledge-check answer. Solutions are only revealed in the response,
// i.e. after the learner has made an attempt. Practice results never count towards certification.
router.post('/practice/check', (req, res) => {
  const { courseId, moduleId, itemId, kind = 'exercise' } = req.body || {};
  const db = getDb();
  const course = moduleExists(db, courseId, moduleId);
  if (!course) return res.status(404).json({ success: false, message: 'Module not found.' });
  const e = getModuleEnrichment(course.id, moduleId);
  const list = kind === 'knowledge' ? e?.knowledgeCheck : e?.exercises;
  const item = (list || []).find(x => x.id === itemId);
  if (!item) return res.status(404).json({ success: false, message: 'Exercise not found.' });

  const result = kind === 'knowledge' ? gradeKnowledge(item, req.body.answer) : gradeExercise(item, req.body);

  // Record completion for signed-in learners (practice credit only).
  const email = learnerFromRequest(req);
  let recorded = false;
  if (email && result.correct) {
    if (!db.practiceProgress) db.practiceProgress = {};
    const mine = (db.practiceProgress[email] ||= {});
    const mod = ((mine[course.id] ||= {})[moduleId] ||= { exercises: {}, knowledge: {} });
    const bucket = kind === 'knowledge' ? mod.knowledge : mod.exercises;
    if (!bucket[itemId]) {
      bucket[itemId] = { completedAt: new Date().toISOString() };
      saveDb(db);
    }
    recorded = true;
  }

  res.json({
    success: true,
    correct: result.correct,
    feedback: result.feedback,
    recorded,
    ...(kind === 'knowledge'
      ? { answer: item.answer, explanation: item.explanation }
      : {
          explanation: item.explanation || '',
          solution: item.solution || [],
          solutionCode: item.solutionCode || '',
          mistakes: item.mistakes || [],
          expected: item.check?.type === 'mcq' ? item.check.answer : undefined
        })
  });
});

// The signed-in learner's completed practice items for a course.
router.get('/practice/progress', (req, res) => {
  const { userId, courseId } = req.query;
  const db = getDb();
  res.json({ success: true, progress: db.practiceProgress?.[userId]?.[courseId] || {} });
});

export default router;
