// Admin API calls. Loaded on demand (dynamic import) only after the server has confirmed an admin
// session, so they are not part of what every visitor downloads.
import { api as base, request, getAdminToken, setAdminToken } from './api';

// A rejected staff call means the session has ended (the server answers 404 without one).
const staffRequest = (url, options) => request(url, options).catch((err) => {
  if ([401, 403, 404].includes(err.status) && getAdminToken()) {
    setAdminToken(null);
    window.dispatchEvent(new CustomEvent('arb:staff-session-expired'));
  }
  throw err;
});

export const api = {
  ...base,
  // Admin session (sign-in goes through the normal login form)
  adminLogout: () => 
    staffRequest('/admin/logout', { method: 'POST' })
      .finally(() => setAdminToken(null)),

  getAdminProfile: () => staffRequest('/admin/me'),

  changeAdminPassword: (currentPassword, newPassword, confirmPassword) =>
    staffRequest('/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
    }),

  updateAdminProfile: (name, email) =>
    staffRequest('/admin/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, email })
    }),

  // Admin Courses
  getAdminCourses: () => staffRequest('/admin/courses'),
  createCourse: (courseData) => staffRequest('/admin/courses', { method: 'POST', body: JSON.stringify(courseData) }),
  updateCourse: (id, courseData) => staffRequest(`/admin/courses/${id}`, { method: 'PUT', body: JSON.stringify(courseData) }),
  duplicateCourse: (id) => staffRequest(`/admin/courses/${id}/duplicate`, { method: 'POST' }),
  deleteCourse: (id, archiveOnly = false) => staffRequest(`/admin/courses/${id}?archiveOnly=${archiveOnly}`, { method: 'DELETE' }),

  // Modules & Content
  addModule: (courseId, moduleData) => staffRequest(`/admin/courses/${courseId}/modules`, { method: 'POST', body: JSON.stringify(moduleData) }),
  updateModule: (courseId, moduleId, moduleData) => staffRequest(`/admin/courses/${courseId}/modules/${moduleId}`, { method: 'PUT', body: JSON.stringify(moduleData) }),
  deleteModule: (courseId, moduleId) => staffRequest(`/admin/courses/${courseId}/modules/${moduleId}`, { method: 'DELETE' }),
  updateQuiz: (courseId, moduleId, quizData) => staffRequest(`/admin/courses/${courseId}/modules/${moduleId}/quiz`, { method: 'PUT', body: JSON.stringify(quizData) }),
  updateFinalTest: (courseId, testData) => staffRequest(`/admin/courses/${courseId}/final-test`, { method: 'PUT', body: JSON.stringify(testData) }),
  updateFinalProject: (courseId, projectData) => staffRequest(`/admin/courses/${courseId}/final-project`, { method: 'PUT', body: JSON.stringify(projectData) }),

  // Students & Enrollments
  getStudents: () => staffRequest('/admin/students'),
  getStudentDetails: (id) => staffRequest(`/admin/students/${id}`),
  updateStudentStatus: (id, status) => staffRequest(`/admin/students/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
  deleteStudent: (id) => staffRequest(`/admin/students/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  resetStudentPassword: (id) => staffRequest(`/admin/students/${id}/reset-password`, { method: 'POST' }),
  enrollStudent: (studentId, courseId) => staffRequest('/admin/enrollments', { method: 'POST', body: JSON.stringify({ studentId, courseId }) }),
  removeEnrollment: (studentId, courseId) => staffRequest(`/admin/enrollments/${studentId}/${courseId}`, { method: 'DELETE' }),
  exportStudentsExcel: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const token = getAdminToken();
    return fetch(`/api/admin/export/students${qs ? '?' + qs : ''}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }).then(res => {
      if (!res.ok) throw new Error('Excel export failed');
      return res.blob();
    });
  },

  // Project Submissions
  getProjectSubmissions: () => staffRequest('/admin/projects/submissions'),
  reviewProjectSubmission: (id, status, score, feedback) => 
    staffRequest(`/admin/projects/submissions/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ status, score, feedback })
    }),

  // Certificates
  getCertificates: () => staffRequest('/admin/certificates'),
  checkCertificateEligibility: (studentId, courseId) => 
    staffRequest('/admin/certificates/check-eligibility', {
      method: 'POST',
      body: JSON.stringify({ studentId, courseId })
    }),
  generateCertificate: (studentId, courseId, grade, forceOverride = false) =>
    staffRequest('/admin/certificates/generate', {
      method: 'POST',
      body: JSON.stringify({ studentId, courseId, grade, forceOverride })
    }),
  revokeCertificate: (id) => staffRequest(`/admin/certificates/${id}/revoke`, { method: 'POST' }),
  restoreCertificate: (id) => staffRequest(`/admin/certificates/${id}/restore`, { method: 'POST' }),

  // Analytics & Audit Logs
  getAnalytics: () => staffRequest('/admin/analytics'),
  getActivityLogs: () => staffRequest('/admin/activity-logs'),

  // Admin Quiz System Management & Analytics
  getAdminQuestions: () => staffRequest('/admin/questions'),
  createAdminQuestion: (questionData) => staffRequest('/admin/questions', { method: 'POST', body: JSON.stringify(questionData) }),
  updateAdminQuestion: (id, questionData) => staffRequest(`/admin/questions/${id}`, { method: 'PUT', body: JSON.stringify(questionData) }),
  deleteAdminQuestion: (id) => staffRequest(`/admin/questions/${id}`, { method: 'DELETE' }),
  getQuizAnalytics: () => staffRequest('/admin/quiz-analytics')
};

/** Ends the session on the server and forgets it here. */
export const endSession = () => api.adminLogout();

/** Confirms the saved admin session with the server; resolves to the admin profile or null. */
export async function confirmSession() {
  if (!getAdminToken()) return null;
  try {
    const res = await api.getAdminProfile();
    return res.success ? res.admin : null;
  } catch {
    setAdminToken(null);
    return null;
  }
}
