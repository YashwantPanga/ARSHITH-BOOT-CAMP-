// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

vi.mock('../src/services/api', () => ({ api: { checkPractice: vi.fn(), getModuleEnrichment: vi.fn() } }));
import { api } from '../src/services/api';
import WorkflowDiagram, { layoutDiagram } from '../src/components/lesson/WorkflowDiagram';
import PracticeExercises, { ExerciseCard } from '../src/components/lesson/PracticeExercises';
import Markdown from '../src/components/lesson/Markdown';
import CourseSlideshow from '../src/components/CourseSlideshow';
import { slidesForCourse } from '../src/data/courseGallery';
import ENRICHMENT from '../server/data/enrichment/index.js';
import { toPublicEnrichment } from '../server/lib/practice.js';
import { displayTitle } from '../src/utils/textUtils';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

const valid = { title: 'Pipeline', nodes: [{ id: 'a', label: 'Collect', input: 'raw', output: 'rows' }, { id: 'b', label: 'Clean' }, { id: 'c', label: 'Model' }], edges: [{ from: 'a', to: 'b' }, { from: 'b', to: 'c', label: 'ok' }, { from: 'c', to: 'a', label: 'retrain' }] };

describe('WorkflowDiagram', () => {
  it('renders nodes, labelled edges and an accessible stage table', () => {
    const { container } = render(<WorkflowDiagram def={valid} />);
    expect(container.querySelectorAll('svg text').length).toBeGreaterThan(3);
    expect(screen.getAllByText('Collect').length).toBeGreaterThan(0);
    expect(screen.getByText('retrain')).toBeTruthy();
    expect(screen.getByRole('table')).toBeTruthy();
  });
  it('shows an explicit message for malformed data instead of an empty panel', () => {
    render(<WorkflowDiagram def={{ nodes: [{ id: 'x' }], edges: [{ from: 'x', to: 'nope' }] }} />);
    expect(screen.getByRole('alert').textContent).toMatch(/unavailable/);
  });
  it('shows an explicit message for missing data', () => {
    render(<WorkflowDiagram def={undefined} />);
    expect(screen.getByRole('alert').textContent).toMatch(/missing/);
  });
  it('lays out long diagrams left to right and puts loops below', () => {
    const L = layoutDiagram(valid);
    expect(L.nodes.map(n => n.layer)).toEqual([0, 1, 2]);
    expect(L.edges.find(e => e.label === 'retrain').back).toBe(true);
  });
  it('renders every real module diagram without throwing', () => {
    for (const mods of Object.values(ENRICHMENT)) for (const e of Object.values(mods)) {
      const { container, unmount } = render(<WorkflowDiagram def={e.workflow} />);
      expect(container.querySelector('svg')).toBeTruthy();
      unmount();
    }
  });
});

describe('Practice exercises', () => {
  const ex = toPublicEnrichment(ENRICHMENT['python-programming']['py-mod-6']).exercises[0];

  it('shows a clear message for an empty exercise collection', () => {
    render(<PracticeExercises exercises={[]} courseId="c" moduleId="m" />);
    expect(screen.getByText(/No practice exercises/)).toBeTruthy();
  });
  it('reveals hints progressively', () => {
    render(<ExerciseCard ex={{ ...ex, hints: ['first', 'second'] }} index={0} courseId="python-programming" moduleId="py-mod-6" />);
    expect(screen.queryByText(/first/)).toBeNull();
    fireEvent.click(screen.getByText(/Show a hint/));
    expect(screen.getByText(/first/)).toBeTruthy();
    expect(screen.queryByText(/second/)).toBeNull();
  });
  it('does not submit without an answer', () => {
    render(<ExerciseCard ex={ex} index={0} courseId="python-programming" moduleId="py-mod-6" />);
    fireEvent.click(screen.getByText('Check answer'));
    expect(api.checkPractice).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toMatch(/Choose an option/);
  });
  it('shows feedback and the solution after an attempt', async () => {
    api.checkPractice.mockResolvedValue({ correct: true, feedback: 'Correct.', explanation: 'Because.', solution: ['Step one'], solutionCode: '', mistakes: [], expected: 2, recorded: true });
    const onCompleted = vi.fn();
    render(<ExerciseCard ex={ex} index={0} courseId="python-programming" moduleId="py-mod-6" onCompleted={onCompleted} />);
    fireEvent.click(screen.getAllByRole('radio')[2]);
    fireEvent.click(screen.getByText('Check answer'));
    await waitFor(() => expect(screen.getByText('Step one')).toBeTruthy());
    expect(api.checkPractice).toHaveBeenCalledWith(expect.objectContaining({ itemId: ex.id, answer: '2', kind: 'exercise' }));
    expect(onCompleted).toHaveBeenCalledWith(ex.id, true);
  });
  it('keeps the answer and reports the error when the request fails', async () => {
    api.checkPractice.mockRejectedValue(new Error('network down'));
    render(<ExerciseCard ex={ex} index={0} courseId="python-programming" moduleId="py-mod-6" />);
    fireEvent.click(screen.getAllByRole('radio')[1]);
    fireEvent.click(screen.getByText('Check answer'));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/Your work is kept/));
    expect(screen.getAllByRole('radio')[1].checked).toBe(true);
  });
});

describe('Markdown renderer', () => {
  it('renders headings, lists, code and math without injecting raw HTML', () => {
    const { container } = render(<Markdown source={'### Title\n- **bold** item\n- `code`\n\nMean: $\\bar{x}$\n\n<img src=x onerror=alert(1)>'} />);
    expect(container.querySelector('h4').textContent).toBe('Title');
    expect(container.querySelector('strong').textContent).toBe('bold');
    expect(container.querySelector('.katex')).toBeTruthy();
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toMatch(/<img src=x/);
  });
});

describe('Course slideshow', () => {
  it('maps slides only to the selected course and keeps its own thumbnail first', () => {
    const slides = slidesForCourse({ id: 'sql-mastery', title: 'SQL', thumbnail: 'https://example.com/sql.jpg' });
    expect(slides[0].src).toBe('https://example.com/sql.jpg');
    expect(slides.every(s => s.alt)).toBe(true);
    expect(slidesForCourse({ id: 'unknown', title: 'X' })).toEqual([]);
  });
  it('navigates with buttons, indicators and keyboard', () => {
    const slides = [1, 2, 3].map(i => ({ src: `https://example.com/${i}.jpg`, alt: `Slide ${i}` }));
    const { container } = render(<CourseSlideshow slides={slides} courseTitle="Test" interval={100000} />);
    const current = () => [...container.querySelectorAll('[aria-roledescription=slide]')].findIndex(g => g.getAttribute('aria-hidden') === 'false');
    expect(current()).toBe(0);
    fireEvent.click(screen.getByLabelText('Next image'));
    expect(current()).toBe(1);
    fireEvent.click(screen.getByLabelText('Show image 3'));
    expect(current()).toBe(2);
    fireEvent.keyDown(container.querySelector('[aria-roledescription=carousel]'), { key: 'ArrowRight' });
    expect(current()).toBe(0);
    fireEvent.keyDown(container.querySelector('[aria-roledescription=carousel]'), { key: 'ArrowLeft' });
    expect(current()).toBe(2);
  });
  it('falls back to a course card when nothing is mapped', () => {
    render(<CourseSlideshow slides={[]} courseTitle="Lonely course" />);
    expect(screen.getByText('Lonely course')).toBeTruthy();
  });
});

describe('display titles', () => {
  it('formats ALL-CAPS names for display without changing others', () => {
    expect(displayTitle('AI WITH DATA SCIENCE')).toBe('AI with Data Science');
    expect(displayTitle('Python Programming')).toBe('Python Programming');
    expect(displayTitle('SQL & Relational Databases')).toBe('SQL & Relational Databases');
  });
});
