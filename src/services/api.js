// API Service for Arshith Bootcamp Backend Integration

import { readStudent } from '../utils/session';

const API_BASE = '/api';

let adminToken = localStorage.getItem('arb_admin_token') || null;

export function setAdminToken(token, remember = true) {
  adminToken = token;
  if (token) {
    if (remember) {
      localStorage.setItem('arb_admin_token', token);
    } else {
      sessionStorage.setItem('arb_admin_token', token);
    }
  } else {
    localStorage.removeItem('arb_admin_token');
    sessionStorage.removeItem('arb_admin_token');
  }
}

export function getAdminToken() {
  return adminToken || localStorage.getItem('arb_admin_token') || sessionStorage.getItem('arb_admin_token');
}

async function request(url, options = {}) {
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
  // Admin Auth
  adminLogin: (adminId, password, remember = true) => 
    request('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ adminId, password })
    }).then(res => {
      if (res.token) setAdminToken(res.token, remember);
      return res;
    }),

  adminLogout: () => 
    request('/admin/logout', { method: 'POST' })
      .finally(() => setAdminToken(null)),

  getAdminProfile: () => request('/admin/me'),

  changeAdminPassword: (currentPassword, newPassword, confirmPassword) =>
    request('/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
    }),

  updateAdminProfile: (name, email) =>
    request('/admin/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, email })
    }),

  // Public Courses
  getPublicCourses: () => request('/courses'),
  getPublicCourse: (id) => request(`/courses/${id}`),

  // Admin Courses
  getAdminCourses: () => request('/admin/courses'),
  createCourse: (courseData) => request('/admin/courses', { method: 'POST', body: JSON.stringify(courseData) }),
  updateCourse: (id, courseData) => request(`/admin/courses/${id}`, { method: 'PUT', body: JSON.stringify(courseData) }),
  duplicateCourse: (id) => request(`/admin/courses/${id}/duplicate`, { method: 'POST' }),
  deleteCourse: (id, archiveOnly = false) => request(`/admin/courses/${id}?archiveOnly=${archiveOnly}`, { method: 'DELETE' }),

  // Modules & Content
  addModule: (courseId, moduleData) => request(`/admin/courses/${courseId}/modules`, { method: 'POST', body: JSON.stringify(moduleData) }),
  updateModule: (courseId, moduleId, moduleData) => request(`/admin/courses/${courseId}/modules/${moduleId}`, { method: 'PUT', body: JSON.stringify(moduleData) }),
  deleteModule: (courseId, moduleId) => request(`/admin/courses/${courseId}/modules/${moduleId}`, { method: 'DELETE' }),
  updateQuiz: (courseId, moduleId, quizData) => request(`/admin/courses/${courseId}/modules/${moduleId}/quiz`, { method: 'PUT', body: JSON.stringify(quizData) }),
  updateFinalTest: (courseId, testData) => request(`/admin/courses/${courseId}/final-test`, { method: 'PUT', body: JSON.stringify(testData) }),
  updateFinalProject: (courseId, projectData) => request(`/admin/courses/${courseId}/final-project`, { method: 'PUT', body: JSON.stringify(projectData) }),

  // Students & Enrollments
  getStudents: () => request('/admin/students'),
  getStudentDetails: (id) => request(`/admin/students/${id}`),
  updateStudentStatus: (id, status) => request(`/admin/students/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
  resetStudentPassword: (id) => request(`/admin/students/${id}/reset-password`, { method: 'POST' }),
  enrollStudent: (studentId, courseId) => request('/admin/enrollments', { method: 'POST', body: JSON.stringify({ studentId, courseId }) }),
  removeEnrollment: (studentId, courseId) => request(`/admin/enrollments/${studentId}/${courseId}`, { method: 'DELETE' }),

  // Project Submissions
  getProjectSubmissions: () => request('/admin/projects/submissions'),
  reviewProjectSubmission: (id, status, score, feedback) => 
    request(`/admin/projects/submissions/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ status, score, feedback })
    }),

  // Certificates
  getCertificates: () => request('/admin/certificates'),
  checkCertificateEligibility: (studentId, courseId) => 
    request('/admin/certificates/check-eligibility', {
      method: 'POST',
      body: JSON.stringify({ studentId, courseId })
    }),
  generateCertificate: (studentId, courseId, grade, forceOverride = false) =>
    request('/admin/certificates/generate', {
      method: 'POST',
      body: JSON.stringify({ studentId, courseId, grade, forceOverride })
    }),
  revokeCertificate: (id) => request(`/admin/certificates/${id}/revoke`, { method: 'POST' }),
  restoreCertificate: (id) => request(`/admin/certificates/${id}/restore`, { method: 'POST' }),
  verifyPublicCertificate: (id) => request(`/certificates/verify/${id}`),

  // Analytics & Audit Logs
  getAnalytics: () => request('/admin/analytics'),
  getActivityLogs: () => request('/admin/activity-logs'),

  // Module Quizzes & Final Test System
  getModuleQuiz: (moduleId) => request(`/quizzes/module/${moduleId}`),
  submitModuleQuiz: (moduleId, data) => request(`/quizzes/module/${moduleId}/submit`, { method: 'POST', body: JSON.stringify(data) }),
  getModuleQuizAttempts: (moduleId, userId) => request(`/quizzes/module/${moduleId}/attempts?userId=${encodeURIComponent(userId || '')}`),

  startFinalTest: (data = {}) => request('/final-test/start', { method: 'POST', body: JSON.stringify(data) }),
  submitFinalTest: (data) => request('/final-test/submit', { method: 'POST', body: JSON.stringify(data) }),
  getFinalTestAttempts: (userId, courseId = '') =>
    request(`/final-test/attempts?userId=${encodeURIComponent(userId || '')}&courseId=${encodeURIComponent(courseId)}`),

  // Learner progress, enrollment lock & certificates
  getProgress: (courseId, userId) =>
    request(`/progress/${encodeURIComponent(courseId)}?userId=${encodeURIComponent(userId || '')}`),
  getEnrollment: (userId) => request(`/enrollment?userId=${encodeURIComponent(userId || '')}`),
  enroll: (userId, courseId) => request('/enrollment', { method: 'POST', body: JSON.stringify({ userId, courseId }) }),
  issueCertificate: (data) => request('/certificates/issue', { method: 'POST', body: JSON.stringify(data) }),

  // Learner accounts
  learnerRegister: (data) => request('/learners/register', { method: 'POST', body: JSON.stringify(data) }),
  learnerLogin: (data) => request('/learners/login', { method: 'POST', body: JSON.stringify(data) }),
  sendContactMessage: (data) => request('/contact', { method: 'POST', body: JSON.stringify(data) }),

  // Module enrichment & practice (graded on the server; solutions are returned only after an attempt)
  getModuleEnrichment: (courseId, moduleId, signal) =>
    request(`/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}/enrichment`, { signal }),
  checkPractice: (data) => request('/practice/check', { method: 'POST', body: JSON.stringify(data) }),
  submitProject: (data) => request('/projects/submit', { method: 'POST', body: JSON.stringify(data) }),
  getMyProjects: (userId, courseId) =>
    request(`/projects/mine?userId=${encodeURIComponent(userId || '')}&courseId=${encodeURIComponent(courseId)}`),
  getPracticeProgress: (userId, courseId) =>
    request(`/practice/progress?userId=${encodeURIComponent(userId || '')}&courseId=${encodeURIComponent(courseId)}`),

  // Admin Quiz System Management & Analytics
  getAdminQuestions: () => request('/admin/questions'),
  createAdminQuestion: (questionData) => request('/admin/questions', { method: 'POST', body: JSON.stringify(questionData) }),
  updateAdminQuestion: (id, questionData) => request(`/admin/questions/${id}`, { method: 'PUT', body: JSON.stringify(questionData) }),
  deleteAdminQuestion: (id) => request(`/admin/questions/${id}`, { method: 'DELETE' }),
  getQuizAnalytics: () => request('/admin/quiz-analytics')
};
