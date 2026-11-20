// One-time wording fixes for course records that live in the database (titles, categories and the
// descriptions shown on cards). Runs at startup; a flag in db.meta makes it run only once, so later
// edits made by the admin are never overwritten.

const FLAG = 'courseText-2026-11-20';

// One name per course and per category, used everywhere on the site.
export const COURSE_TEXT = {
  'python-programming': {
    title: 'Python Programming',
    category: 'Python',
    shortDescription: 'Learn Python from first principles to object-oriented programming, files, web data and databases, following the “Python for Everybody” curriculum.',
    description: 'Learn Python from scratch, following the well-known “Python for Everybody” curriculum by Dr. Charles Severance. You cover variables, conditionals, loops, functions, data structures, files, regular expressions, web services, object-oriented programming and databases.'
  },
  'sql-mastery': {
    title: 'SQL & Relational Databases',
    category: 'SQL',
    shortDescription: 'Write SQL queries, join tables, summarize data, and design, index and normalize databases.',
    description: 'A 15-module course covering DDL and DML, filtering with WHERE, sorting with ORDER BY, aggregate functions, GROUP BY and HAVING, joins, subqueries, CTEs, views, indexes, transactions (TCL), DCL security, Python integration and AI-assisted SQL.'
  },
  'web-development': {
    title: 'Web Development',
    category: 'Web Development',
    shortDescription: 'Build full-stack websites with HTML5, CSS3, modern JavaScript, React, and Node/Express for REST APIs, then deploy them to the cloud.',
    description: 'A 15-module course that takes you from how the internet works, semantic HTML5 and responsive CSS (Grid and Flexbox) to modern JavaScript, React components and hooks, Node.js and Express for REST APIs, databases, authentication and full-stack cloud deployment.'
  },
  'data-science-ai': {
    title: 'AI & Data Science',
    category: 'AI & Data Science',
    shortDescription: 'Explore AI and Data Science, from the foundations to deep learning, large language models (LLMs) and production MLOps.',
    description: 'A complete curriculum covering Python for data science, NumPy, Pandas, data cleaning, statistical inference, exploratory data analysis, scikit-learn pipelines, regression, classification, clustering, PCA, model calibration, deep learning, Transformers, generative AI, RAG and model deployment with FastAPI.'
  }
};

/** Applies the fixes once. Returns true when the database changed (the caller saves it). */
export function applyTextFixes(db) {
  if (!db) return false;
  db.meta = db.meta || {};
  const done = db.meta.textFixes || [];
  if (done.includes(FLAG)) return false;
  for (const course of db.courses || []) {
    const t = COURSE_TEXT[course.id];
    if (t) Object.assign(course, t);
  }
  db.meta.textFixes = [...done, FLAG];
  return true;
}
