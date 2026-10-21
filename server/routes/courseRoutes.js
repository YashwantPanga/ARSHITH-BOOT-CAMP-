import express from 'express';
import { getDb, saveDb, logActivity } from '../db.js';
import { verifyAdminToken } from '../middleware/auth.js';

const router = express.Router();

// ==========================================
// PUBLIC ROUTES (STUDENT WEBSITE SOURCE OF TRUTH)
// ==========================================

// Remove every answer key from a course before it is sent to the public website.
// Quizzes and the final assessment are graded on the server, so learners never need them.
function stripAnswers(node) {
  if (Array.isArray(node)) return node.map(stripAnswers);
  if (!node || typeof node !== 'object') return node;
  const out = {};
  const isQuestion = Array.isArray(node.options);
  for (const [k, v] of Object.entries(node)) {
    if (isQuestion && (k === 'correctAnswer' || k === 'explanation' || k === 'answer')) continue;
    out[k] = stripAnswers(v);
  }
  return out;
}

function toPublicCourse(course) {
  const papers = course.finalTest?.questionPapers || [];
  const { finalTest, modules, ...rest } = course;
  return {
    ...stripAnswers(rest),
    progress: 0,
    finalTest: finalTest ? {
      id: finalTest.id,
      title: finalTest.title,
      description: finalTest.description,
      passingScore: 70,
      timeLimitMinutes: finalTest.timeLimitMinutes || 45,
      totalQuestions: papers[0]?.questions?.length || finalTest.questions?.length || 25,
      paperCount: papers.length
    } : null,
    modules: (modules || []).map(m => ({ ...stripAnswers(m), completed: false }))
  };
}

// Get all active/published courses for website
router.get('/courses', (req, res) => {
  const db = getDb();
  const publicCourses = (db.courses || [])
    .filter(c => c.status !== 'archived' && c.status !== 'draft')
    .map(toPublicCourse);
  res.json({ success: true, courses: publicCourses });
});

// Get single course by ID or Slug
router.get('/courses/:id', (req, res) => {
  const db = getDb();
  const course = (db.courses || []).find(c => c.id === req.params.id || c.slug === req.params.id);
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }
  res.json({ success: true, course: toPublicCourse(course) });
});

// ==========================================
// PROTECTED ADMIN ROUTES (REQUIRE VERIFY ADMIN)
// ==========================================

// Get all courses (including draft, published, archived) for Admin
router.get('/admin/courses', verifyAdminToken, (req, res) => {
  const db = getDb();
  res.json({ success: true, courses: db.courses || [] });
});

// Add new course
router.post('/admin/courses', verifyAdminToken, (req, res) => {
  const {
    title, category, level, duration, price, isFree, shortDescription, description,
    instructorName, instructorRole, thumbnail, introVideoUrl, prerequisites, skills
  } = req.body;

  if (!title || !category) {
    return res.status(400).json({ success: false, message: 'Course title and category are required.' });
  }

  const db = getDb();
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const id = slug || `course-${Date.now()}`;

  // Check duplicate
  if (db.courses.some(c => c.id === id)) {
    return res.status(400).json({ success: false, message: 'A course with this title/slug already exists.' });
  }

  const newCourse = {
    id,
    slug,
    title,
    category: category || 'Programming',
    level: level || 'Beginner',
    duration: duration || '30 hours',
    rating: 5.0,
    studentsCount: '0',
    studentsNumeric: 0,
    price: isFree ? 0 : Number(price) || 0,
    isFree: Boolean(isFree),
    bestseller: false,
    progress: 0,
    status: 'draft', // default draft
    featured: false,
    certificateAvailable: true,
    sequentialLearning: true,
    iconBg: 'bg-emerald-50 border-2 border-emerald-200 text-emerald-600',
    iconType: 'code',
    introVideoUrl: introVideoUrl || 'https://www.youtube.com/embed/kqtD5dpn9C8',
    thumbnail: thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
    shortDescription: shortDescription || description.slice(0, 120),
    description: description || '',
    instructor: {
      name: instructorName || 'Arshith Bootcamp Instructor',
      role: instructorRole || 'Lead Educator',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
    },
    prerequisites: prerequisites || 'None',
    skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []),
    whatYouWillLearn: [
      'Master core concepts and foundational syntax',
      'Build real-world hands-on project assignments',
      'Pass module assessments and earn verified certification'
    ],
    modules: [
      {
        id: `mod-${Date.now()}-1`,
        title: 'Module 01 — Getting Started & Orientation',
        description: 'Introduction to course topics, tools installation, and setup.',
        completed: false,
        order: 1,
        published: true,
        readingMaterial: {
          introduction: `Welcome to ${title}!`,
          objectives: ['Set up development workspace', 'Learn essential concepts'],
          sections: [{ heading: 'Overview', text: 'Course introductory material and instructions.' }],
          codeExamples: [{ title: 'Getting Started', code: '// Welcome to the course', explanation: 'Initial sample code.' }],
          keyTakeaways: ['Practice daily for maximum retention.']
        },
        quiz: {
          id: `quiz-${Date.now()}-1`,
          title: 'Module 01 Quiz',
          passingScore: 70,
          timeLimitMinutes: 15,
          maxAttempts: 3,
          published: true,
          questions: [
            {
              id: 'q1',
              type: 'multiple-choice',
              questionText: 'What is the main objective of Module 01?',
              options: ['Environment Setup', 'Advanced Refactoring', 'Deployment', 'Legacy Migration'],
              correctAnswer: 0,
              marks: 10
            }
          ]
        }
      }
    ],
    finalTest: {
      id: `ftest-${Date.now()}`,
      title: `${title} Final Certification Exam`,
      description: 'Final evaluation testing overall course knowledge.',
      passingScore: 80,
      timeLimitMinutes: 45,
      maxAttempts: 2,
      published: true,
      questions: []
    },
    finalProject: {
      id: `fproj-${Date.now()}`,
      title: `${title} Capstone Project`,
      description: 'Build a comprehensive capstone application demonstrating your mastery.',
      requirements: ['Complete core requirements', 'Submit clean code repository'],
      instructions: 'Submit GitHub repository URL or live deployment URL.',
      allowedFileTypes: ['.zip', '.pdf'],
      maxFileSizeMb: 50,
      githubUrlAllowed: true,
      liveProjectUrlAllowed: true,
      passingScore: 80,
      published: true
    },
    createdAt: new Date().toISOString()
  };

  db.courses.unshift(newCourse);
  saveDb(db);

  logActivity({
    adminId: req.admin.adminId,
    action: 'COURSE_CREATED',
    target: `Course: ${title}`,
    details: `Created new course ID: ${id}`
  });

  res.status(201).json({ success: true, message: 'Course created successfully', course: newCourse });
});

// Update course details
router.put('/admin/courses/:id', verifyAdminToken, (req, res) => {
  const db = getDb();
  const index = db.courses.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  const existing = db.courses[index];
  const updated = {
    ...existing,
    ...req.body,
    id: existing.id, // preserve ID
    updatedAt: new Date().toISOString()
  };

  db.courses[index] = updated;
  saveDb(db);

  logActivity({
    adminId: req.admin.adminId,
    action: 'COURSE_EDITED',
    target: `Course: ${updated.title}`,
    details: `Updated course details for ${existing.id}`
  });

  res.json({ success: true, message: 'Course updated successfully', course: updated });
});

// Duplicate course
router.post('/admin/courses/:id/duplicate', verifyAdminToken, (req, res) => {
  const db = getDb();
  const original = db.courses.find(c => c.id === req.params.id);
  if (!original) {
    return res.status(404).json({ success: false, message: 'Original course not found' });
  }

  const newId = `${original.id}-copy-${Date.now().toString().slice(-4)}`;
  const copy = JSON.parse(JSON.stringify(original));
  copy.id = newId;
  copy.slug = newId;
  copy.title = `${original.title} (Copy)`;
  copy.status = 'draft';
  copy.createdAt = new Date().toISOString();

  db.courses.unshift(copy);
  saveDb(db);

  logActivity({
    adminId: req.admin.adminId,
    action: 'COURSE_DUPLICATED',
    target: `Course: ${copy.title}`,
    details: `Duplicated from ${original.id} to ${newId}`
  });

  res.json({ success: true, message: 'Course duplicated successfully', course: copy });
});

// Delete or Archive course
router.delete('/admin/courses/:id', verifyAdminToken, (req, res) => {
  const { archiveOnly } = req.query;
  const db = getDb();
  const index = db.courses.findIndex(c => c.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  const targetCourse = db.courses[index];

  if (archiveOnly === 'true') {
    targetCourse.status = 'archived';
    saveDb(db);
    logActivity({
      adminId: req.admin.adminId,
      action: 'COURSE_ARCHIVED',
      target: `Course: ${targetCourse.title}`,
      details: `Archived course ${targetCourse.id}`
    });
    return res.json({ success: true, message: 'Course archived successfully.' });
  } else {
    db.courses.splice(index, 1);
    saveDb(db);
    logActivity({
      adminId: req.admin.adminId,
      action: 'COURSE_DELETED',
      target: `Course: ${targetCourse.title}`,
      details: `Permanently deleted course ${targetCourse.id}`
    });
    return res.json({ success: true, message: 'Course deleted permanently.' });
  }
});

// Add module to course
router.post('/admin/courses/:id/modules', verifyAdminToken, (req, res) => {
  const db = getDb();
  const course = db.courses.find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  const { title, description, readingMaterial } = req.body;
  const newModule = {
    id: `mod-${Date.now()}`,
    title: title || `Module 0${(course.modules?.length || 0) + 1} — New Module`,
    description: description || '',
    completed: false,
    order: (course.modules?.length || 0) + 1,
    published: true,
    readingMaterial: readingMaterial || {
      introduction: 'Module Introduction',
      objectives: ['Objective 1'],
      sections: [{ heading: 'Section 1', text: 'Section content' }],
      keyTakeaways: ['Takeaway 1']
    },
    quiz: {
      id: `quiz-${Date.now()}`,
      title: `${title || 'Module'} Quiz`,
      passingScore: 70,
      timeLimitMinutes: 15,
      maxAttempts: 3,
      published: true,
      questions: []
    }
  };

  if (!course.modules) course.modules = [];
  course.modules.push(newModule);
  saveDb(db);

  logActivity({
    adminId: req.admin.adminId,
    action: 'MODULE_CREATED',
    target: `Course: ${course.title}`,
    details: `Added module ${newModule.title}`
  });

  res.status(201).json({ success: true, message: 'Module added successfully', module: newModule, course });
});

// Edit module
router.put('/admin/courses/:id/modules/:moduleId', verifyAdminToken, (req, res) => {
  const db = getDb();
  const course = db.courses.find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  const modIndex = course.modules.findIndex(m => m.id === req.params.moduleId);
  if (modIndex === -1) return res.status(404).json({ success: false, message: 'Module not found' });

  course.modules[modIndex] = {
    ...course.modules[modIndex],
    ...req.body
  };

  saveDb(db);

  logActivity({
    adminId: req.admin.adminId,
    action: 'MODULE_EDITED',
    target: `Course: ${course.title}`,
    details: `Updated module ${req.params.moduleId}`
  });

  res.json({ success: true, message: 'Module updated successfully', course });
});

// Delete module
router.delete('/admin/courses/:id/modules/:moduleId', verifyAdminToken, (req, res) => {
  const db = getDb();
  const course = db.courses.find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  course.modules = (course.modules || []).filter(m => m.id !== req.params.moduleId);
  saveDb(db);

  logActivity({
    adminId: req.admin.adminId,
    action: 'MODULE_DELETED',
    target: `Course: ${course.title}`,
    details: `Deleted module ${req.params.moduleId}`
  });

  res.json({ success: true, message: 'Module deleted successfully', course });
});

// Update Module Quiz
router.put('/admin/courses/:id/modules/:moduleId/quiz', verifyAdminToken, (req, res) => {
  const db = getDb();
  const course = db.courses.find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  const mod = course.modules.find(m => m.id === req.params.moduleId);
  if (!mod) return res.status(404).json({ success: false, message: 'Module not found' });

  mod.quiz = {
    ...mod.quiz,
    ...req.body
  };

  saveDb(db);

  logActivity({
    adminId: req.admin.adminId,
    action: 'QUIZ_EDITED',
    target: `Module: ${mod.title}`,
    details: 'Updated module quiz configuration and questions'
  });

  res.json({ success: true, message: 'Quiz updated successfully', quiz: mod.quiz });
});

// Update Final Test
router.put('/admin/courses/:id/final-test', verifyAdminToken, (req, res) => {
  const db = getDb();
  const course = db.courses.find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  course.finalTest = {
    ...course.finalTest,
    ...req.body
  };

  saveDb(db);

  logActivity({
    adminId: req.admin.adminId,
    action: 'FINAL_TEST_EDITED',
    target: `Course: ${course.title}`,
    details: 'Updated final certification test'
  });

  res.json({ success: true, message: 'Final test updated successfully', finalTest: course.finalTest });
});

// Update Final Project
router.put('/admin/courses/:id/final-project', verifyAdminToken, (req, res) => {
  const db = getDb();
  const course = db.courses.find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  course.finalProject = {
    ...course.finalProject,
    ...req.body
  };

  saveDb(db);

  logActivity({
    adminId: req.admin.adminId,
    action: 'FINAL_PROJECT_EDITED',
    target: `Course: ${course.title}`,
    details: 'Updated final mini project configuration'
  });

  res.json({ success: true, message: 'Final project updated successfully', finalProject: course.finalProject });
});

export default router;
