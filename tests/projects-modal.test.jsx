// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

vi.mock('../src/services/api', () => ({ api: { getMyProjects: vi.fn(), submitProject: vi.fn() } }));
import { api } from '../src/services/api';
import CourseProjectsModal from '../src/components/CourseProjectsModal';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

const course = {
  id: 'web-development',
  projects: [
    { id: 'web-proj-1', title: 'Project 1: Landing page', difficulty: 'Beginner' },
    { id: 'web-proj-2', title: 'Project 2: Dashboard', difficulty: 'Intermediate' },
    { id: 'web-proj-3', title: 'Project 3: Full stack', difficulty: 'Advanced' }
  ]
};
const submitted = { projectId: 'web-proj-1', githubUrl: 'https://github.com/someone/landing-page', status: 'Submitted' };
const renderModal = (props) => render(<CourseProjectsModal isOpen onClose={() => {}} course={course} onSubmitted={() => {}} {...props} />);

describe('Course projects popup', () => {
  it('shows "Start final assessment" once a repository is saved and all quizzes are done', async () => {
    api.getMyProjects.mockResolvedValue({ submissions: [submitted] });
    const onStartFinal = vi.fn();
    renderModal({ quizProgress: { done: 15, total: 15 }, passedFinal: false, onStartFinal });
    const button = await screen.findByRole('button', { name: /start final assessment/i });
    fireEvent.click(button);
    expect(onStartFinal).toHaveBeenCalledTimes(1);
  });

  it('appears right after submitting the first repository', async () => {
    api.getMyProjects.mockResolvedValue({ submissions: [] });
    api.submitProject.mockResolvedValue({ submission: submitted, requirement: { required: 1, total: 3, submitted: 1, missing: [] } });
    renderModal({ quizProgress: { done: 15, total: 15 }, passedFinal: false, onStartFinal: vi.fn() });
    await waitFor(() => expect(api.getMyProjects).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: /start final assessment/i })).toBeNull();
    fireEvent.change(screen.getByPlaceholderText(/github\.com/), { target: { value: submitted.githubUrl } });
    fireEvent.click(screen.getByRole('button', { name: /submit repository/i }));
    expect(await screen.findByRole('button', { name: /start final assessment/i })).toBeTruthy();
  });

  it('asks for the remaining quizzes instead when some are not done', async () => {
    api.getMyProjects.mockResolvedValue({ submissions: [submitted] });
    renderModal({ quizProgress: { done: 12, total: 15 }, passedFinal: false, onStartFinal: vi.fn() });
    expect(await screen.findByText(/complete the remaining module quizzes \(12\/15 done\)/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /start final assessment/i })).toBeNull();
  });

  it('shows no start button after the final is already passed', async () => {
    api.getMyProjects.mockResolvedValue({ submissions: [submitted] });
    renderModal({ quizProgress: { done: 15, total: 15 }, passedFinal: true, onStartFinal: vi.fn() });
    await waitFor(() => expect(api.getMyProjects).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: /start final assessment/i })).toBeNull();
  });
});
