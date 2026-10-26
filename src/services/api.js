// API Service for Arshith Bootcamp Backend Integration

import { readStudent } from '../utils/session';

const API_BASE = '/api';

let adminToken = localStorage.getItem('arb_staff') || null;

export function setAdminToken(token, remember = true) {
  adminToken = token;
  if (token) {
    if (remember) {
      localStorage.setItem('arb_staff', token);
    } else {
      sessionStorage.setItem('arb_staff', token);
    }
  } else {
    localStorage.removeItem('arb_staff');
    sessionStorage.removeItem('arb_staff');
  }
}

export function getAdminToken() {
  return adminToken || localStorage.getItem('arb_staff') || sessionStorage.getItem('arb_staff');
}

export async function request(url, options = {}) {
  const token = getAdminToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // Signed learner session (required by quiz, progress, enrollment and certificate endpoints).
  const learnerToken = readStudent()?.token;
  if (learnerToken) headers['X-Learner-Token'] = learnerToken;

  try {
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers
    });

    let data = {};
    try {
      data = await res.json();
    } catch {
      data = { message: `Server returned ${res.status}` };
    }
    if (!res.ok) {
      const error = new Error(data.message || 'An error occurred during API request.');
      error.status = res.status;
      error.data = data;
      if (res.status === 401 && data.code === 'LEARNER_AUTH_REQUIRED') {
        window.dispatchEvent(new CustomEvent('arb:learner-session-expired'));
      }
      throw error;
    }
    return data;
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    if (!err.status) console.error(`API Error on ${url}:`, err);
    throw err;
  }
}

export const api = {
  // Public Courses
  getPublicCourses: () => request('/courses'),
  getPublicCourse: (id) => request(`/courses/${id}`),
  verifyPublicCertificate: (id) => request(`/certificates/verify/${id}`),

  // Module Quizzes & Final Test System
  getModuleQuiz: (moduleId) => request(`/quizzes/module/${moduleId}`),
  submitModuleQuiz: (moduleId, data) => request(`/quizzes/module/${moduleId}/submit`, { method: 'POST', body: JSON.stringify(data) }),
  getModuleQuizAttempts: (moduleId, userId) => request(`/quizzes/module/${moduleId}/attempts?userId=${encodeURIComponent(userId || '')}`),

  startFinalTest: (data = {}) => request('/final-test/start', { method: 'POST', body: JSON.stringify(data) }),
  submitFinalTest: (data) => request('/final-test/submit', { method: 'POST', body: JSON.stringify(data) }),
  reportProctorEvent: (data) => request('/final-test/proctor-event', { method: 'POST', body: JSON.stringify(data) }),
  getFinalTestAttempts: (userId, courseId = '') =>
    request(`/final-test/attempts?userId=${encodeURIComponent(userId || '')}&courseId=${encodeURIComponent(courseId)}`),

  // Learner progress, enrollment lock & certificates
  getProgress: (courseId, userId) =>
    request(`/progress/${encodeURIComponent(courseId)}?userId=${encodeURIComponent(userId || '')}`),
  getEnrollment: (userId) => request(`/enrollment?userId=${encodeURIComponent(userId || '')}`),
  enroll: (userId, courseId) => request('/enrollment', { method: 'POST', body: JSON.stringify({ userId, courseId }) }),
  uploadCertificateImage: (id, image) => request(`/certificates/${encodeURIComponent(id)}/image`, { method: 'POST', body: JSON.stringify({ image }) }),
  issueCertificate: (data) => request('/certificates/issue', { method: 'POST', body: JSON.stringify(data) }),

  // Learner accounts
  learnerRegister: (data) => request('/learners/register', { method: 'POST', body: JSON.stringify(data) }),
  learnerLogin: (data) => request('/learners/login', { method: 'POST', body: JSON.stringify(data) }),
  updateProfile: (data) => request('/learners/me', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (data) => request('/learners/change-password', { method: 'POST', body: JSON.stringify(data) }),
  sendContactMessage: (data) => request('/contact', { method: 'POST', body: JSON.stringify(data) }),
  verifyEmail: (data) => request('/learners/verify-email', { method: 'POST', body: JSON.stringify(data) }),
  resendVerification: (email) => request('/learners/resend-verification', { method: 'POST', body: JSON.stringify({ email }) }),
  forgotPassword: (email) => request('/learners/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (data) => request('/learners/reset-password', { method: 'POST', body: JSON.stringify(data) }),

  // Module enrichment & practice (graded on the server; solutions are returned only after an attempt)
  getModuleEnrichment: (courseId, moduleId, signal) =>
    request(`/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}/enrichment`, { signal }),
  checkPractice: (data) => request('/practice/check', { method: 'POST', body: JSON.stringify(data) }),
  submitProject: (data) => request('/projects/submit', { method: 'POST', body: JSON.stringify(data) }),
  getMyProjects: (userId, courseId) =>
    request(`/projects/mine?userId=${encodeURIComponent(userId || '')}&courseId=${encodeURIComponent(courseId)}`),
  getPracticeProgress: (userId, courseId) =>
    request(`/practice/progress?userId=${encodeURIComponent(userId || '')}&courseId=${encodeURIComponent(courseId)}`)

};
