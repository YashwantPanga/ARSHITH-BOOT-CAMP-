// Interview Prep: the problem sets, shared by the site and the server (which records solved items).
import { SQL_50 } from './sql50.js';
import { DSA_PART1 } from './dsa75.part1.js';
import { DSA_PART2 } from './dsa75.part2.js';
import { QUESTIONS_60 } from './questions60.js';

export const INTERVIEW_SETS = [
  {
    id: 'sql-50', kind: 'sql', title: 'SQL Interview 50', tagline: 'Crack SQL rounds in 50 questions',
    description: 'Fifty hands-on SQL problems on a realistic company database: filtering, joins, grouping, subqueries, window functions and dates. Write your query, run it, and check it against the expected result.',
    icon: 'database', theme: 'forest', items: SQL_50
  },
  {
    id: 'dsa-75', kind: 'python', title: 'DSA Top 75', tagline: 'Must-do coding problems in Python',
    description: 'The 75 data-structure and algorithm patterns that come up again and again in coding interviews. Solve each in Python, test with the examples, then submit against hidden tests.',
    icon: 'target', theme: 'teal', items: [...DSA_PART1, ...DSA_PART2]
  },
  {
    id: 'questions-60', kind: 'concept', title: 'Interview Questions 60', tagline: 'Theory questions with model answers',
    description: 'Sixty concept questions interviewers love, across SQL, Python, web development and data science. Answer in your head, compare with ours, and mark the ones you know.',
    icon: 'chat', theme: 'gold', items: QUESTIONS_60
  }
];

export const findInterviewSet = (id) => INTERVIEW_SETS.find(s => s.id === id) || null;
export const findInterviewItem = (setId, itemId) => findInterviewSet(setId)?.items.find(i => i.id === itemId) || null;
