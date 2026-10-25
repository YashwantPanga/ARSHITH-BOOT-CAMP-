// Tiny History-API router. Every screen has a real URL, so the browser Back
// button moves between pages of the site instead of leaving it.

export function parseLocation(loc = window.location) {
  const path = loc.pathname.replace(/\/+$/, '') || '/';
  const query = Object.fromEntries(new URLSearchParams(loc.search));
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);

  if (parts.length === 0) return { name: 'home', params: {}, query };
  const [head, a, b] = parts;
  switch (head) {
    case 'courses': return { name: 'courses', params: {}, query };
    case 'categories': return { name: 'categories', params: {}, query };
    case 'about': return { name: 'about', params: {}, query };
    case 'contact': return { name: 'contact', params: {}, query };
    case 'terms': return { name: 'terms', params: {}, query };
    case 'privacy': return { name: 'privacy', params: {}, query };
    case 'course': return a ? { name: 'course-details', params: { courseId: a }, query } : { name: 'courses', params: {}, query };
    case 'learn': return a ? { name: 'learning', params: { courseId: a, moduleId: b || null }, query } : { name: 'dashboard', params: {}, query };
    case 'dashboard': return { name: 'dashboard', params: {}, query };
    case 'certificate': return { name: 'certificate', params: { courseId: a || null }, query };
    case 'verify': return { name: 'verify', params: { certId: a || '' }, query };
    case 'login': return { name: 'login', params: {}, query };
    case 'register': return { name: 'register', params: {}, query };
    case 'verify-email': return { name: 'verify-email', params: {}, query };
    case 'forgot-password': return { name: 'forgot-password', params: {}, query };
    case 'reset-password': return { name: 'reset-password', params: {}, query };
    default: return { name: 'not-found', params: {}, query };
  }
}

export const paths = {
  home: () => '/',
  courses: (q) => (q ? `/courses?${new URLSearchParams(q)}` : '/courses'),
  categories: () => '/categories',
  about: () => '/about',
  contact: () => '/contact',
  terms: () => '/terms',
  privacy: () => '/privacy',
  course: (id) => `/course/${encodeURIComponent(id)}`,
  learn: (id, moduleId) => `/learn/${encodeURIComponent(id)}${moduleId ? `/${encodeURIComponent(moduleId)}` : ''}`,
  dashboard: () => '/dashboard',
  certificate: (courseId) => `/certificate/${encodeURIComponent(courseId)}`,
  verify: (certId) => (certId ? `/verify/${encodeURIComponent(certId)}` : '/verify'),
  login: (next) => (next ? `/login?next=${encodeURIComponent(next)}` : '/login'),
  register: (next) => (next ? `/register?next=${encodeURIComponent(next)}` : '/register'),
  verifyEmail: (email) => `/verify-email${email ? `?email=${encodeURIComponent(email)}` : ''}`,
  forgotPassword: (email) => `/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`,
  resetPassword: (email) => `/reset-password${email ? `?email=${encodeURIComponent(email)}` : ''}`
};

/** True while a proctored exam is running; App ignores Back presses then. */
export const examGuard = { active: false };
