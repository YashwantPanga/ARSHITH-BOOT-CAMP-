// Interview Prep: the problem sets, shared by the site and the server (which records solved items).
import { SQL_50 } from './sql50.js';
import { DSA_PART1 } from './dsa75.part1.js';
import { DSA_PART2 } from './dsa75.part2.js';
import { QUESTIONS_60 } from './questions60.js';
import { JS_30 } from './js30.js';

export const INTERVIEW_SETS = [
  {
    id: 'sql-50', kind: 'sql', title: 'SQL Interview 50', tagline: 'Crack SQL rounds in 50 questions',
    description: 'Fifty hands-on SQL problems on a realistic company database: filtering, joins, grouping, subqueries, window functions and dates. Write your query, run it, and check it against the expected result.',
    icon: 'database', theme: 'forest', items: SQL_50,
    summary: ['Designed for students preparing for SQL and data rounds', 'Covers joins, grouping, subqueries and window functions', 'Instant check against the expected result table']
  },
  {
    id: 'dsa-75', kind: 'python', title: 'DSA Top 75', tagline: 'Must-do coding problems in Python',
    description: 'The 75 data-structure and algorithm patterns that come up again and again in coding interviews. Solve each in Python, test with the examples, then submit against hidden tests.',
    icon: 'target', theme: 'teal', items: [...DSA_PART1, ...DSA_PART2],
    summary: ['Made for coding rounds at product and service companies', 'Covers the 12 patterns behind most DSA questions', 'Hidden tests, worked solutions and complexity for each']
  },
  {
    id: 'js-30', kind: 'javascript', title: 'JavaScript 30-Day Sprint', tagline: 'Master modern JS, one problem a day',
    description: 'Thirty days, thirty JavaScript problems that build on each other: closures, array methods, function tricks, promises and timers, objects and classes. Solve one a day in the browser and finish with real interview-ready JavaScript.',
    icon: 'js', theme: 'ember', challenge: true, items: JS_30,
    summary: ['Built for JavaScript beginners and front-end interviews', 'Covers closures, promises, async/await and classes', 'Every problem has tests and a worked solution']
  },
  {
    id: 'questions-60', kind: 'concept', title: 'Interview Questions 60', tagline: 'Theory questions with model answers',
    description: 'Sixty concept questions interviewers love, across SQL, Python, web development and data science. Answer in your head, compare with ours, and mark the ones you know.',
    icon: 'chat', theme: 'gold', items: QUESTIONS_60,
    summary: ['Quick revision before technical interviews', 'SQL, Python, web and data science concepts', 'Model answers you can say out loud in two minutes']
  }
];

export const findInterviewSet = (id) => INTERVIEW_SETS.find(s => s.id === id) || null;
export const findInterviewItem = (setId, itemId) => findInterviewSet(setId)?.items.find(i => i.id === itemId) || null;
