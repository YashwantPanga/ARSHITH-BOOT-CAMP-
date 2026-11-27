import { describe, it, expect } from 'vitest';
import { buildCyberCourse, CYBER_ENRICHMENT, CYBER_CONTENT_VERSION } from '../server/data/courses/cyber-security/build.js';
import { ensureCyberCourse } from '../server/lib/cyberCourse.js';
import { withLessons } from '../server/data/lessons/index.js';
import ENRICHMENT from '../server/data/enrichment/index.js';
import { gradeExercise } from '../server/lib/practice.js';
import { CYBER_DIAGRAMS } from '../src/data/cyberDiagrams.js';
import { validateSlideDiagram } from '../src/components/diagrams/SlideDiagram.jsx';

const course = buildCyberCourse();

describe('Cyber Security course', () => {
  it('has 15 published modules with reading material and a 5-question quiz', () => {
    expect(course.modules).toHaveLength(15);
    course.modules.forEach((m, i) => {
      expect(m.id).toBe(`cs-mod-${i + 1}`);
      expect(m.readingMaterial.sections.length).toBeGreaterThanOrEqual(7);
      expect(m.readingMaterial.objectives.length).toBeGreaterThanOrEqual(5);
      expect(m.quiz.questions).toHaveLength(5);
      for (const q of m.quiz.questions) {
        expect(q.options).toHaveLength(4);
        expect(q.correctAnswer).toBeGreaterThanOrEqual(0);
        expect(q.correctAnswer).toBeLessThan(4);
      }
    });
  });

  it('has a final exam of 4 papers x 25 questions with answers spread over A-D', () => {
    const papers = course.finalTest.questionPapers;
    expect(papers).toHaveLength(4);
    const positions = [0, 0, 0, 0];
    const ids = new Set();
    for (const p of papers) {
      expect(p.questions).toHaveLength(25);
      for (const q of p.questions) {
        expect(new Set(q.options).size).toBe(4);
        positions[q.correctAnswer]++;
        ids.add(q.id);
      }
    }
    expect(ids.size).toBe(100);
    for (const n of positions) expect(n).toBeGreaterThanOrEqual(20);
  });

  it('has three projects and enrichment for every module', () => {
    expect(course.projects.map(p => p.id)).toEqual(['cs-proj-1', 'cs-proj-2', 'cs-proj-3']);
    expect(ENRICHMENT['cyber-security']).toBe(CYBER_ENRICHMENT);
    for (const m of course.modules) {
      const e = CYBER_ENRICHMENT[m.id];
      expect(e.workflow.nodes.length).toBeGreaterThanOrEqual(5);
      expect(e.workflow.edges.length).toBe(e.workflow.nodes.length - 1);
      expect(e.exercises.length).toBeGreaterThanOrEqual(4);
      expect(e.knowledgeCheck.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('grades its exercises with the stored answers', () => {
    const cvss = CYBER_ENRICHMENT['cs-mod-8'].exercises[0];
    expect(gradeExercise(cvss, { answer: '6.5' }).correct).toBe(true);
    const mcq = CYBER_ENRICHMENT['cs-mod-1'].exercises[0];
    expect(gradeExercise(mcq, { answer: mcq.check.answer }).correct).toBe(true);
    const code = CYBER_ENRICHMENT['cs-mod-4'].exercises[0];
    expect(gradeExercise(code, { output: '203.0.113.7 3\n198.51.100.2 1\n' }).correct).toBe(true);
  });

  it('has a valid designed diagram for every module', () => {
    for (const m of course.modules) {
      const def = CYBER_DIAGRAMS[m.id];
      expect(def, m.id).toBeTruthy();
      expect(validateSlideDiagram(def), m.id).toEqual([]);
    }
  });

  it('is added to a database once and refreshed when the content version changes', () => {
    const db = { courses: [{ id: 'python-programming' }] };
    expect(ensureCyberCourse(db)).toBe('added');
    expect(ensureCyberCourse(db)).toBe(null);
    const stored = db.courses.find(c => c.id === 'cyber-security');
    stored.status = 'draft';            // an admin edit
    stored.contentVersion = 'old';
    stored.modules = [];
    expect(ensureCyberCourse(db)).toBe('updated');
    expect(stored.modules).toHaveLength(15);
    expect(stored.status).toBe('draft'); // admin settings are kept
    expect(stored.contentVersion).toBe(CYBER_CONTENT_VERSION);
  });

  it('keeps the course PDF link and quiz options unchanged when served', () => {
    const served = withLessons(course);
    expect(served.pdfUrl).toBe('/course-pdfs/cyber-security/CodeLekho-Cyber-Security-Course.pdf');
    expect(served.modules[1].quiz.questions[0].options).toEqual(course.modules[1].quiz.questions[0].options);
  });
});
