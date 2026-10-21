import express from 'express';
import { getDb, saveDb, logActivity } from '../db.js';
import { verifyAdminToken } from '../middleware/auth.js';

const router = express.Router();

// Every module quiz and every final assessment uses the same pass mark.
export const PASS_PERCENTAGE = 70;
const FINAL_DURATION_SECONDS = 45 * 60;
const SUBMIT_GRACE_SECONDS = 90;

// =========================================================================
// HELPERS
// =========================================================================

export const normalizeUserId = (id) => String(id || '').trim().toLowerCase();

const stripAnswer = ({ correctAnswer, explanation, ...safe }) => safe;

function findCourse(db, courseId) {
  return (db.courses || []).find(c => c.id === courseId || c.slug === courseId) || null;
}

function findCourseOfModule(db, moduleId) {
  return (db.courses || []).find(c => (c.modules || []).some(m => m.id === moduleId)) || null;
}

/** Question source priority: admin question bank → module.quiz → reading-material self assessment. */
function getModuleQuestions(db, moduleId) {
  const fromBank = (db.questionBank || []).filter(q => q.moduleId === moduleId && q.status === 'active');
  if (fromBank.length) return fromBank;
  const course = findCourseOfModule(db, moduleId);
  const mod = course?.modules?.find(m => m.id === moduleId);
  if (mod?.quiz?.questions?.length) return mod.quiz.questions;
  if (mod?.readingMaterial?.selfAssessment?.questions?.length) return mod.readingMaterial.selfAssessment.questions;
  return [];
}

/** Module ids of `courseId` whose quiz this user has passed at least once. */
export function getPassedModuleIds(db, userId, courseId) {
  const course = findCourse(db, courseId);
  const moduleIds = new Set((course?.modules || []).map(m => m.id));
  const passed = new Set();
  for (const a of db.quizAttempts || []) {
    if (a.userId === userId && a.passed && moduleIds.has(a.moduleId)) passed.add(a.moduleId);
  }
  return [...passed];
}

function getBestModuleScores(db, userId, courseId) {
  const scores = {};
  for (const a of db.quizAttempts || []) {
    if (a.userId !== userId || a.courseId !== courseId) continue;
    if (scores[a.moduleId] === undefined || a.percentage > scores[a.moduleId]) scores[a.moduleId] = a.percentage;
  }
  return scores;
}

export function getPassedFinalAttempt(db, userId, courseId) {
  return (db.finalTestAttempts || []).find(
    a => a.userId === userId && a.courseId === courseId && a.passed && a.percentage >= PASS_PERCENTAGE
  ) || null;
}

/** Deterministic paper allocation by first letter of the candidate's name. */
function getPaperSetForStudent(studentName, papers = []) {
  if (!papers.length) return null;
  const first = String(studentName || '').trim().toUpperCase().charAt(0);
  if (first >= 'A' && first <= 'F') return papers[0];
  if (first >= 'G' && first <= 'L') return papers[1] || papers[0];
  if (first >= 'M' && first <= 'R') return papers[2] || papers[0];
  if (first >= 'S' && first <= 'Z') return papers[3] || papers[0];
  return papers[0];
}

function getFinalQuestions(course, paperCode) {
  const papers = course?.finalTest?.questionPapers || [];
  const paper = papers.find(p => p.paperCode === paperCode) || null;
  const questions = paper?.questions?.length ? paper.questions : (course?.finalTest?.questions || []);
  return { paper, questions };
}

/** Returns an error message when the learner is locked into a different course. */
function enrollmentConflict(db, userId, courseId) {
  const enrolled = db.learnerEnrollments?.[userId]?.courseId;
  if (enrolled && courseId && enrolled !== courseId) {
    const title = findCourse(db, enrolled)?.title || enrolled;
    return `Your account is enrolled in "${title}". Only one course is allowed per login.`;
  }
  return null;
}

function formatDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m} minute${m !== 1 ? 's' : ''} ${s} second${s !== 1 ? 's' : ''}`;
}

function attemptSummary(a) {
  if (!a) return null;
  return {
    attemptId: a.id,
    score: a.score,
    totalQuestions: a.totalQuestions,
    correctCount: a.score,
    incorrectCount: a.totalQuestions - a.score,
    percentage: a.percentage,
    passed: a.passed,
    attemptNumber: a.attemptNumber,
    timeTakenFormatted: a.timeTakenFormatted,
    submittedAt: a.submittedAt,
    proctorViolations: a.proctoring?.violationCount || 0,
    terminated: Boolean(a.proctoring?.terminated)
  };
}

// =========================================================================
// LEARNER PROGRESS (server is the source of truth for quiz + exam results)
// =========================================================================

router.get('/progress/:courseId', (req, res) => {
  const userId = normalizeUserId(req.query.userId);
  const { courseId } = req.params;
  if (!userId) return res.status(400).json({ success: false, message: 'userId is required.' });

  const db = getDb();
  const course = findCourse(db, courseId);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

  const finalAttempts = (db.finalTestAttempts || []).filter(a => a.userId === userId && a.courseId === course.id);
  const passedFinal = getPassedFinalAttempt(db, userId, course.id);
  const certificate = (db.certificates || []).find(
    c => c.userId === userId && c.courseId === course.id && c.status === 'active'
  );

  res.json({
    success: true,
    courseId: course.id,
    passPercentage: PASS_PERCENTAGE,
    totalModules: course.modules?.length || 0,
    passedModuleIds: getPassedModuleIds(db, userId, course.id),
    moduleScores: getBestModuleScores(db, userId, course.id),
    finalAttempts: finalAttempts.map(attemptSummary),
    passedFinal: attemptSummary(passedFinal),
    certificateId: certificate?.certificateId || null
  });
});

// =========================================================================
// MODULE QUIZZES
// =========================================================================

router.get('/quizzes/module/:moduleId', (req, res) => {
  const { moduleId } = req.params;
  const db = getDb();
  const questions = getModuleQuestions(db, moduleId).map(stripAnswer);

  if (!questions.length) {
    return res.status(404).json({ success: false, message: `No quiz questions found for module ${moduleId}` });
  }
  res.json({ success: true, moduleId, totalQuestions: questions.length, passingScore: PASS_PERCENTAGE, questions });
});

router.post('/quizzes/module/:moduleId/submit', (req, res) => {
  const { moduleId } = req.params;
  const userId = normalizeUserId(req.body.userId);
  const { studentName = 'Learner', answers = {} } = req.body;
  if (!userId) return res.status(400).json({ success: false, message: 'Please sign in to submit quizzes.' });

  const db = getDb();
  const moduleQuestions = getModuleQuestions(db, moduleId);
  if (!moduleQuestions.length) return res.status(404).json({ success: false, message: 'Quiz questions not found.' });

  const course = findCourseOfModule(db, moduleId);
  const conflict = enrollmentConflict(db, userId, course?.id);
  if (conflict) return res.status(403).json({ success: false, message: conflict });
  let correctCount = 0;
  const questionsReview = moduleQuestions.map(q => {
    const selectedAnswer = answers[q.id] !== undefined && answers[q.id] !== null ? Number(answers[q.id]) : null;
    const isCorrect = selectedAnswer === q.correctAnswer;
    if (isCorrect) correctCount += 1;
    return {
      id: q.id,
      questionText: q.questionText,
      codeSnippet: q.codeSnippet || null,
      options: q.options,
      selectedAnswer,
      correctAnswer: q.correctAnswer,
      isCorrect,
      explanation: q.explanation,
      difficulty: q.difficulty
    };
  });

  const totalQuestions = moduleQuestions.length;
  const percentage = Math.round((correctCount / totalQuestions) * 100);
  const passed = percentage >= PASS_PERCENTAGE;

  if (!db.quizAttempts) db.quizAttempts = [];
  const attemptNumber = db.quizAttempts.filter(a => a.userId === userId && a.moduleId === moduleId).length + 1;

  const attempt = {
    id: `attempt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    studentName,
    courseId: course?.id || null,
    moduleId,
    score: correctCount,
    totalQuestions,
    percentage,
    passed,
    attemptNumber,
    answers,
    completedAt: new Date().toISOString()
  };
  db.quizAttempts.unshift(attempt);
  saveDb(db);

  res.json({
    success: true,
    message: passed ? 'Module Quiz Passed!' : 'Module Quiz Not Passed',
    result: {
      attemptId: attempt.id,
      moduleId,
      score: correctCount,
      totalQuestions,
      correctCount,
      incorrectCount: totalQuestions - correctCount,
      percentage,
      passed,
      attemptNumber,
      passedModuleIds: course ? getPassedModuleIds(db, userId, course.id) : [],
      questionsReview
    }
  });
});

router.get('/quizzes/module/:moduleId/attempts', (req, res) => {
  const { moduleId } = req.params;
  const userId = normalizeUserId(req.query.userId);
  const db = getDb();
  const attempts = (db.quizAttempts || [])
    .filter(a => a.moduleId === moduleId && a.userId === userId)
    .map(a => ({
      id: a.id,
      attemptNumber: a.attemptNumber,
      score: a.score,
      totalQuestions: a.totalQuestions,
      percentage: a.percentage,
      passed: a.passed,
      completedAt: a.completedAt
    }));
  res.json({ success: true, attempts });
});

// =========================================================================
// FINAL ASSESSMENT (45-minute, server-timed, proctored)
// =========================================================================

router.post('/final-test/start', (req, res) => {
  const userId = normalizeUserId(req.body.userId);
  const { studentName = 'Learner', courseId } = req.body;
  if (!userId) return res.status(400).json({ success: false, message: 'Please sign in to take the final assessment.' });

  const db = getDb();
  const course = findCourse(db, courseId);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
  const conflict = enrollmentConflict(db, userId, course.id);
  if (conflict) return res.status(403).json({ success: false, message: conflict });

  // 1. Lock: every module quiz of this course must be passed first.
  const totalModules = course.modules?.length || 0;
  const passedModuleIds = getPassedModuleIds(db, userId, course.id);
  if (passedModuleIds.length < totalModules) {
    return res.status(403).json({
      success: false,
      locked: true,
      message: `Final assessment is locked. Pass all ${totalModules} module quizzes first (${passedModuleIds.length}/${totalModules} done).`,
      passedModules: passedModuleIds.length,
      totalModules
    });
  }

  // 2. Already certified → no re-attempts.
  const passed = getPassedFinalAttempt(db, userId, course.id);
  if (passed) {
    return res.status(409).json({
      success: false,
      alreadyPassed: true,
      message: 'You have already passed this final assessment.',
      result: attemptSummary(passed)
    });
  }

  if (!db.finalTestActiveSessions) db.finalTestActiveSessions = {};
  const sessionKey = `${userId}::${course.id}::final`;
  const now = Date.now();
  let session = db.finalTestActiveSessions[sessionKey];

  const expired = session && (now - session.startedAt) / 1000 > FINAL_DURATION_SECONDS + SUBMIT_GRACE_SECONDS;
  if (!session || session.submitted || expired) {
    const paper = getPaperSetForStudent(studentName, course.finalTest?.questionPapers || []);
    session = {
      sessionId: `session-${now}-${Math.floor(Math.random() * 1e6)}`,
      userId,
      studentName,
      courseId: course.id,
      paperCode: paper?.paperCode || null,
      startedAt: now,
      durationSeconds: FINAL_DURATION_SECONDS,
      submitted: false
    };
    db.finalTestActiveSessions[sessionKey] = session;
    saveDb(db);
  }

  const { paper, questions } = getFinalQuestions(course, session.paperCode);
  if (!questions.length) {
    return res.status(404).json({ success: false, message: 'No final assessment questions are configured for this course.' });
  }

  const remainingSeconds = Math.max(0, FINAL_DURATION_SECONDS - Math.floor((now - session.startedAt) / 1000));

  res.json({
    success: true,
    sessionId: session.sessionId,
    startedAt: session.startedAt,
    serverTime: now,
    durationSeconds: FINAL_DURATION_SECONDS,
    remainingSeconds,
    totalQuestions: questions.length,
    passingScore: PASS_PERCENTAGE,
    courseTitle: course.title,
    assignedPaper: paper ? {
      id: paper.id,
      paperCode: paper.paperCode,
      groupName: paper.groupName,
      letterRange: paper.letterRange,
      title: paper.title
    } : null,
    questions: questions.map(stripAnswer)
  });
});

router.post('/final-test/submit', (req, res) => {
  const userId = normalizeUserId(req.body.userId);
  const { studentName = 'Learner', courseId, sessionId, answers = {}, proctoring = {} } = req.body;
  if (!userId) return res.status(400).json({ success: false, message: 'Please sign in to submit.' });

  const db = getDb();
  const course = findCourse(db, courseId);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });

  const sessionKey = `${userId}::${course.id}::final`;
  const session = db.finalTestActiveSessions?.[sessionKey];
  if (!session || session.sessionId !== sessionId) {
    return res.status(400).json({ success: false, message: 'No active exam session found. Please restart the assessment.' });
  }
  if (session.submitted) {
    const last = (db.finalTestAttempts || []).find(a => a.sessionId === sessionId);
    if (last) return res.json({ success: true, message: 'Already submitted', result: { ...attemptSummary(last), questionsReview: last.questionsReview || [] } });
    return res.status(400).json({ success: false, message: 'This exam session was already submitted.' });
  }

  const now = Date.now();
  const elapsedSeconds = Math.min(FINAL_DURATION_SECONDS, Math.floor((now - session.startedAt) / 1000));
  const isAutoSubmitted = (now - session.startedAt) / 1000 >= FINAL_DURATION_SECONDS;

  const { questions } = getFinalQuestions(course, session.paperCode);
  let correctCount = 0;
  const questionsReview = questions.map(q => {
    const selectedAnswer = answers[q.id] !== undefined && answers[q.id] !== null ? Number(answers[q.id]) : null;
    const isCorrect = selectedAnswer === q.correctAnswer;
    if (isCorrect) correctCount += 1;
    return {
      id: q.id,
      questionText: q.questionText,
      codeSnippet: q.codeSnippet || null,
      options: q.options,
      selectedAnswer,
      correctAnswer: q.correctAnswer,
      isCorrect,
      explanation: q.explanation,
      difficulty: q.difficulty
    };
  });

  const totalQuestions = questions.length || 1;
  const percentage = Math.round((correctCount / totalQuestions) * 100);
  const terminated = Boolean(proctoring.terminated);
  // A proctoring termination is an automatic fail regardless of score.
  const passed = !terminated && percentage >= PASS_PERCENTAGE;

  if (!db.finalTestAttempts) db.finalTestAttempts = [];
  const attemptNumber = db.finalTestAttempts.filter(a => a.userId === userId && a.courseId === course.id).length + 1;

  const violations = Array.isArray(proctoring.violations) ? proctoring.violations.slice(0, 50) : [];
  const attempt = {
    id: `ftest-attempt-${now}`,
    sessionId,
    userId,
    studentName,
    courseId: course.id,
    paperCode: session.paperCode,
    score: correctCount,
    totalQuestions,
    percentage,
    passed,
    attemptNumber,
    timeTakenSeconds: elapsedSeconds,
    timeTakenFormatted: formatDuration(elapsedSeconds),
    isAutoSubmitted,
    startedAt: new Date(session.startedAt).toISOString(),
    submittedAt: new Date(now).toISOString(),
    answers,
    questionsReview,
    proctoring: {
      violationCount: violations.length,
      terminated,
      cameraVerified: Boolean(proctoring.cameraVerified),
      violations
    }
  };

  db.finalTestAttempts.unshift(attempt);
  session.submitted = true;
  saveDb(db);

  res.json({
    success: true,
    message: passed ? 'Final Assessment Passed!' : 'Final Assessment Not Passed',
    result: { ...attemptSummary(attempt), isAutoSubmitted, questionsReview }
  });
});

router.get('/final-test/attempts', (req, res) => {
  const userId = normalizeUserId(req.query.userId);
  const db = getDb();
  const attempts = (db.finalTestAttempts || [])
    .filter(a => a.userId === userId && (!req.query.courseId || a.courseId === req.query.courseId))
    .map(attemptSummary);
  res.json({ success: true, attempts });
});

// =========================================================================
// ADMIN QUIZ MANAGEMENT & ANALYTICS (PROTECTED BY VERIFY ADMIN)
// =========================================================================

/**
 * GET /api/admin/questions
 * Returns all questions WITH correct answers and explanations for Admin
 */
router.get('/admin/questions', verifyAdminToken, (req, res) => {
  const db = getDb();
  res.json({
    success: true,
    total: (db.questionBank || []).length,
    questions: db.questionBank || []
  });
});

/**
 * POST /api/admin/questions
 * Creates a new question in the question bank
 */
router.post('/admin/questions', verifyAdminToken, (req, res) => {
  const {
    questionText, options, correctAnswer, explanation,
    moduleId, category = 'module', difficulty = 'medium', status = 'active'
  } = req.body;

  if (!questionText || !options || options.length < 2 || correctAnswer === undefined) {
    return res.status(400).json({ success: false, message: 'Missing required question fields.' });
  }

  const db = getDb();
  if (!db.questionBank) db.questionBank = [];

  const newQ = {
    id: `sql-q-custom-${Date.now()}`,
    courseId: 'sql-data-analysis',
    moduleId: category === 'final-test' ? 'final-test' : (moduleId || 'sql-mod-1'),
    category: category || 'module',
    order: db.questionBank.length + 1,
    difficulty: difficulty || 'medium',
    questionText,
    options,
    correctAnswer: Number(correctAnswer),
    explanation: explanation || '',
    status: status || 'active'
  };

  db.questionBank.push(newQ);
  saveDb(db);

  logActivity({
    adminId: req.admin.adminId,
    action: 'QUESTION_CREATED',
    target: `Question: ${newQ.id}`,
    details: `Created question in ${newQ.moduleId}`
  });

  res.status(201).json({ success: true, message: 'Question created successfully', question: newQ });
});

/**
 * PUT /api/admin/questions/:id
 * Updates an existing question
 */
router.put('/admin/questions/:id', verifyAdminToken, (req, res) => {
  const { id } = req.params;
  const db = getDb();

  const index = (db.questionBank || []).findIndex(q => q.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Question not found' });
  }

  const existing = db.questionBank[index];
  const updated = {
    ...existing,
    ...req.body,
    id: existing.id // preserve ID
  };

  db.questionBank[index] = updated;
  saveDb(db);

  logActivity({
    adminId: req.admin.adminId,
    action: 'QUESTION_UPDATED',
    target: `Question: ${id}`,
    details: `Updated question attributes`
  });

  res.json({ success: true, message: 'Question updated successfully', question: updated });
});

/**
 * DELETE /api/admin/questions/:id
 * Deletes a question from the question bank
 */
router.delete('/admin/questions/:id', verifyAdminToken, (req, res) => {
  const { id } = req.params;
  const db = getDb();

  const index = (db.questionBank || []).findIndex(q => q.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Question not found' });
  }

  db.questionBank.splice(index, 1);
  saveDb(db);

  logActivity({
    adminId: req.admin.adminId,
    action: 'QUESTION_DELETED',
    target: `Question: ${id}`,
    details: `Permanently deleted question ${id}`
  });

  res.json({ success: true, message: 'Question deleted successfully' });
});

/**
 * GET /api/admin/quiz-analytics
 * Calculates comprehensive analytics across module quizzes & final test
 */
router.get('/admin/quiz-analytics', verifyAdminToken, (req, res) => {
  const db = getDb();

  const quizAttempts = db.quizAttempts || [];
  const finalTestAttempts = db.finalTestAttempts || [];

  const totalQuizAttempts = quizAttempts.length;
  const passedQuizAttempts = quizAttempts.filter(a => a.passed).length;
  const quizPassRate = totalQuizAttempts > 0 ? Math.round((passedQuizAttempts / totalQuizAttempts) * 100) : 0;
  const avgQuizScore = totalQuizAttempts > 0 
    ? Math.round(quizAttempts.reduce((acc, a) => acc + a.percentage, 0) / totalQuizAttempts) 
    : 0;

  const totalFinalAttempts = finalTestAttempts.length;
  const passedFinalAttempts = finalTestAttempts.filter(a => a.passed).length;
  const finalPassRate = totalFinalAttempts > 0 ? Math.round((passedFinalAttempts / totalFinalAttempts) * 100) : 0;
  const avgFinalScore = totalFinalAttempts > 0 
    ? Math.round(finalTestAttempts.reduce((acc, a) => acc + a.percentage, 0) / totalFinalAttempts) 
    : 0;

  // Module-wise average scores
  const modulePerformance = {};
  for (let i = 1; i <= 15; i++) {
    const modId = `sql-mod-${i}`;
    const modAttempts = quizAttempts.filter(a => a.moduleId === modId);
    const count = modAttempts.length;
    const avgPct = count > 0 ? Math.round(modAttempts.reduce((acc, a) => acc + a.percentage, 0) / count) : 0;
    modulePerformance[modId] = {
      moduleNumber: i,
      attempts: count,
      avgPercentage: avgPct,
      passedCount: modAttempts.filter(a => a.passed).length
    };
  }

  res.json({
    success: true,
    analytics: {
      totalQuizAttempts,
      passedQuizAttempts,
      quizPassRate,
      avgQuizScore,
      totalFinalAttempts,
      passedFinalAttempts,
      finalPassRate,
      avgFinalScore,
      modulePerformance,
      recentQuizAttempts: quizAttempts.slice(0, 10),
      recentFinalAttempts: finalTestAttempts.slice(0, 10)
    }
  });
});

export default router;
