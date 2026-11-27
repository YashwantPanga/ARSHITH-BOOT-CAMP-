// Builds the Cyber Security course (15 modules) from the compact module files m01.js … m15.js into
// the same shape as the other courses: module reading material + quiz, the lesson enrichment
// (concept workflow, exercises, knowledge checks) and the course record with projects and final exam.
// Content source: the CodeLekho Cyber Security module PDFs (public/course-pdfs/cyber-security/).
import m01 from './m01.js';
import m02 from './m02.js';
import m03 from './m03.js';
import m04 from './m04.js';
import m05 from './m05.js';
import m06 from './m06.js';
import m07 from './m07.js';
import m08 from './m08.js';
import m09 from './m09.js';
import m10 from './m10.js';
import m11 from './m11.js';
import m12 from './m12.js';
import m13 from './m13.js';
import m14 from './m14.js';
import m15 from './m15.js';
import { PROJECTS, FINAL_PROJECT } from './projects.js';
import { PAPERS } from './final-test.js';

export const CYBER_COURSE_ID = 'cyber-security';
/** Bump when the course content changes, so existing databases get the new content on deploy. */
export const CYBER_CONTENT_VERSION = '2026-11-27.1';

const SOURCES = [m01, m02, m03, m04, m05, m06, m07, m08, m09, m10, m11, m12, m13, m14, m15];
const pad = (n) => String(n).padStart(2, '0');
const modId = (n) => `cs-mod-${n}`;

/** Moves the correct option to `target`, keeping the other options in their order. */
function placeAnswer(options, correct, target) {
  const right = options[correct];
  const rest = options.filter((_, i) => i !== correct);
  rest.splice(target, 0, right);
  return [rest, target];
}


const table = (t) => (t ? { headers: t[0], rows: t.slice(1) } : undefined);
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && !(Array.isArray(v) && !v.length)));

function quizQuestion(q, i, n, prefix = `cs${n}-q`) {
  const [questionText, rawOptions, rawCorrect, explanation] = q;
  const [options, correctAnswer] = placeAnswer(rawOptions, rawCorrect, (i * 3 + n) % 4);
  return { id: `${prefix}${i + 1}`, questionNumber: i + 1, topic: `Module ${pad(n)} Concept Check`, questionText, codeSnippet: null, options, correctAnswer, explanation };
}

function buildModule(s) {
  const n = s.n;
  const readingMaterial = clean({
    introduction: s.intro,
    objectives: s.objectives,
    terminology: (s.terms || []).map(([term, definition]) => ({ term, definition })),
    diagram: s.ascii ? { title: s.diagramTitle || `${s.title}: the big picture`, ascii: s.ascii, explanation: s.diagramExplain || '' } : undefined,
    sections: (s.sections || []).map((x) => clean({
      heading: x.h, text: x.t, bulletPoints: x.b, table: table(x.table), note: x.note,
      code: x.code, language: x.code ? (x.lang || 'bash') : undefined, run: x.code ? (x.run ?? x.lang === 'python') : undefined
    })),
    tutorials: s.lab ? [{
      title: s.lab.title,
      // lab commands run on the learner's own machine or VM, so they are shown without a Try-it button
      steps: s.lab.steps.map(([instruction, code, explanation], i) => clean({ step: i + 1, instruction, code, explanation, language: code ? (/^\s*(import |from |def |print\()/m.test(code) && !/^\s*\$ /m.test(code) ? 'python' : 'bash') : undefined, run: code ? false : undefined }))
    }] : undefined,
    codeExamples: (s.examples || []).map((e) => clean({ title: e.title, language: e.lang || 'bash', code: e.code, explanation: e.explanation, run: e.run === false || (e.lang || 'bash') !== 'python' ? false : undefined })),
    bestPractices: s.best,
    commonMistakes: s.mistakes,
    practiceExercise: s.exercise,
    miniTask: s.mini,
    keyTakeaways: s.takeaways,
    summary: { takeaways: s.takeaways, quickReference: s.quickRef || [] },
    references: (s.refs || []).map(([title, url]) => ({ title, url }))
  });
  return {
    id: modId(n),
    title: `Module ${pad(n)} – ${s.title}`,
    description: s.description,
    order: n,
    completed: false,
    published: true,
    readingMaterial,
    quiz: {
      id: `quiz-cs-mod-${n}`,
      title: `Module ${pad(n)} Quiz`,
      passingScore: 70,
      questions: s.quiz.map((q, i) => quizQuestion(q, i, n))
    }
  };
}

function buildEnrichment(s) {
  const n = s.n;
  const wf = s.workflow;
  const nodes = wf.nodes.map(([id, label, detail, input, output, explain]) => clean({ id, label, detail, input, output, explain }));
  return clean({
    skills: s.skills,
    prerequisites: s.prereq,
    intuition: { analogy: s.analogy, whyItMatters: s.why },
    workflow: {
      title: wf.title,
      nodes,
      edges: wf.edges || nodes.slice(1).map((x, i) => ({ from: nodes[i].id, to: x.id })),
      explanation: wf.explanation
    },
    caseStudy: s.caseStudy,
    exercises: (s.exercises || []).map((e, i) => {
      const base = { id: `cs${n}-e${i + 1}`, difficulty: e.difficulty || 'Beginner', title: e.title, objective: e.objective, problem: e.problem, hints: e.hints || [], solution: e.solution || [], explanation: e.explanation, mistakes: e.mistakes || [], challenge: e.challenge };
      if (e.options) {
        const [options, answer] = placeAnswer(e.options, e.answer, (i * 3 + n + 2) % 4);
        return clean({ ...base, type: e.type || 'Multiple choice', options, check: { type: 'mcq', answer } });
      }
      if (typeof e.answer === 'number') return clean({ ...base, type: e.type || 'Numerical calculation', check: { type: 'numeric', answer: e.answer, tolerance: e.tolerance || 0 } });
      if (e.code) return clean({ ...base, type: e.type || 'Python coding', language: 'python', starterCode: e.code, solutionCode: e.solutionCode, check: { type: 'output', expectedOutput: e.expected } });
      return clean({ ...base, type: e.type || 'Short answer', check: { type: 'text', accept: e.accept } });
    }),
    knowledgeCheck: (s.checks || []).map(([question, rawOptions, rawAnswer, explanation], i) => {
      const [options, answer] = placeAnswer(rawOptions, rawAnswer, (i * 3 + n + 1) % 4);
      return { id: `cs${n}-k${i + 1}`, question, options, answer, explanation };
    }),
    cheatSheet: s.cheat,
    references: (s.refs || []).map(([title, url]) => ({ title, url, publisher: s.refPublishers?.[url] || new URL(url).hostname.replace(/^www\./, '') })),
    next: s.next
  });
}

export const CYBER_MODULES = SOURCES.map(buildModule);

/** { [moduleId]: enrichment } for the lesson page. */
export const CYBER_ENRICHMENT = Object.fromEntries(SOURCES.map((s) => [modId(s.n), buildEnrichment(s)]));

const paperQuestions = (paper, letter, p) => paper.questions.map((q, i) => {
  const [questionText, rawOptions, rawCorrect, explanation, mod] = q;
  // spread the correct answers evenly over A–D (each block of 4 questions uses every position once)
  const [options, correctAnswer] = placeAnswer(rawOptions, rawCorrect, (i * 3 + p * 2 + 1) % 4);
  return { id: `cs-set-${letter}-${i + 1}`, questionNumber: i + 1, topic: `Module ${pad(mod)}: ${SOURCES[mod - 1].title}`, questionText, codeSnippet: null, options, correctAnswer, explanation };
});

const papers = PAPERS.map((p, i) => {
  const letter = 'abcd'[i];
  return {
    id: `qp-cs-set-${letter}`,
    paperCode: `CL-CS-QP0${i + 1}`,
    title: `Paper ${i + 1}: ${p.title}`,
    subtitle: p.subtitle,
    timeLimitMinutes: 45,
    passingScore: 70,
    totalMarks: 100,
    questions: paperQuestions(p, letter, i)
  };
});

/** The full course record as stored in the database. */
export function buildCyberCourse() {
  return {
    id: CYBER_COURSE_ID,
    title: 'Cyber Security',
    slug: CYBER_COURSE_ID,
    category: 'Cyber Security',
    level: 'Beginner to Job Ready',
    duration: '60 hours',
    rating: 4.9,
    studentsCount: '9.6k',
    studentsNumeric: 9600,
    price: 0,
    isFree: false,
    bestseller: false,
    progress: 0,
    status: 'published',
    featured: true,
    certificateAvailable: true,
    sequentialLearning: true,
    iconBg: 'bg-emerald-50 border-2 border-emerald-200 text-emerald-700',
    iconType: 'shield',
    introVideoUrl: '',
    pdfUrl: '/course-pdfs/cyber-security/CodeLekho-Cyber-Security-Course.pdf',
    thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=90',
    shortDescription: 'Learn to defend systems and networks, from the CIA Triad and networking to ethical hacking, SOC operations, forensics, cloud security and GRC.',
    description: 'A 15-module, job-focused program that starts from zero: security fundamentals, networks, Linux and Windows hardening, scripting, cryptography, web and API security (OWASP Top 10), ethical hacking and penetration testing in legal labs, security tools and vulnerability assessment, SOC operations, digital forensics and incident response, malware analysis and threat intelligence, cloud security, DevSecOps, identity and GRC, ending with a capstone and career plan.',
    instructor: { name: 'CodeLekho Security Mentors', role: 'Security practitioners and educators @ CodeLekho', avatar: '/codelekho-app-icon.svg' },
    prerequisites: null,
    skills: ['Network security', 'Linux & Windows hardening', 'Python & Bash for security', 'Cryptography', 'OWASP Top 10', 'Penetration testing', 'Nmap, Burp Suite, Wireshark', 'SIEM & SOC', 'Incident response', 'Digital forensics', 'Cloud security', 'DevSecOps', 'IAM & GRC'],
    whatYouWillLearn: [
      'Analyze any security problem with the CIA Triad, risk = likelihood × impact, and the Cyber Kill Chain',
      'Explain how networks work (OSI, TCP/IP, subnetting, DNS) and defend them with firewalls, segmentation and IDS/IPS',
      'Harden Linux and Windows: users, permissions, services, logging and patching',
      'Automate security tasks with Python, Bash and PowerShell',
      'Use hashing, encryption, digital signatures, TLS and key management correctly',
      'Find and fix the OWASP Top 10 web and API weaknesses',
      'Run an ethical, authorized penetration test from scoping to reporting',
      'Scan, prioritize and track vulnerabilities with CVSS and a remediation plan',
      'Work like a SOC analyst: SIEM, alert triage, detection rules and MITRE ATT&CK',
      'Respond to incidents and preserve digital evidence with a chain of custody',
      'Analyze malware safely and turn threat intelligence into detections',
      'Secure cloud accounts, DevSecOps pipelines, identities and compliance programs'
    ],
    modules: CYBER_MODULES,
    projects: PROJECTS,
    finalProject: FINAL_PROJECT,
    finalTest: {
      id: 'cs-final-test',
      title: 'Cyber Security Professional Certification Exam (4 Paper Sets)',
      description: 'A proctored exam covering all 15 modules: fundamentals, networks, operating systems, scripting, cryptography, web security, ethical hacking, vulnerability management, SOC, forensics, malware, cloud, DevSecOps, identity and GRC.',
      passingScore: 70,
      timeLimitMinutes: 45,
      totalMarks: 100,
      published: true,
      questionPapers: papers,
      questions: papers[0].questions
    },
    contentVersion: CYBER_CONTENT_VERSION
  };
}
