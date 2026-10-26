import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import PopularCourses from './components/PopularCourses';
import WhyLearnWithUs from './components/WhyLearnWithUs';
import CtaSection from './components/CtaSection';
import HomeButton from './components/HomeButton';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import DesktopNotice from './components/DesktopNotice';
import EnrollCelebration from './components/EnrollCelebration';

const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminCourseBar = lazy(() => import('./components/staff/AdminCourseBar'));
import AuthPage from './components/LoginModal';
import { ToastProvider, useToast, ConfirmDialog, PageLoader } from './components/ui';

import CoursesPage from './pages/CoursesPage';
import CourseDetailsPage from './pages/CourseDetailsPage';
import LearningPage from './pages/LearningPage';
import CertificatePage from './pages/CertificatePage';
import CertificateVerifyPage from './pages/CertificateVerifyPage';
import StudentDashboard from './pages/StudentDashboard';
import CategoriesPage from './pages/CategoriesPage';
import { AboutPage, ContactPage } from './pages/AboutContactPages';
import { TermsPage, PrivacyPage } from './pages/LegalPages';
import { VerifyEmailPage, ForgotPasswordPage, ResetPasswordPage, rememberDevMail } from './pages/AccountPages';

import { api, getAdminToken, setAdminToken } from './services/api';
import { parseLocation, paths, examGuard } from './router';
import { readStudent, writeStudent, userIdOf, enrolledCourseOf } from './utils/session';

export default function App() {
  return (
    <ToastProvider>
      <AppShell />
    </ToastProvider>
  );
}

function AppShell() {
  const toast = useToast();

  /* ---------------- Routing ---------------- */
  const [route, setRoute] = useState(() => parseLocation());
  const lastPageRef = useRef(null);

  const navigate = useCallback((to, { replace = false, scroll = true } = {}) => {
    const current = window.location.pathname + window.location.search;
    if (to !== current) {
      if (replace) window.history.replaceState(null, '', to);
      else window.history.pushState(null, '', to);
    }
    setRoute(parseLocation());
    if (scroll) window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    const onPop = () => {
      if (examGuard.active) return; // the proctored exam handles Back itself
      setRoute(parseLocation());
      window.scrollTo({ top: 0, behavior: 'auto' });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  /* ---------------- Data ---------------- */
  const [courses, setCourses] = useState([]);
  const [coursesLoaded, setCoursesLoaded] = useState(false);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await api.getPublicCourses();
      if (res.success && Array.isArray(res.courses)) {
        setCourses(res.courses);
        setCoursesLoaded(true);
        return;
      }
      throw new Error('Empty course list');
    } catch (err) {
      console.warn('Course API unavailable – using bundled offline catalogue.', err);
      try {
        const mod = await import('./data/coursesData');
        setCourses(mod.INITIAL_COURSES || []);
      } catch {
        setCourses([]);
      }
      setCoursesLoaded(true);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  /* ---------------- Learner session ---------------- */
  const [studentUser, setStudentUser] = useState(() => readStudent());
  const [adminUser, setAdminUser] = useState(null);
  const userId = userIdOf(studentUser);
  const enrolledCourseId = enrolledCourseOf(studentUser);

  const saveUser = useCallback((u) => {
    setStudentUser(u);
    writeStudent(u);
  }, []);

  // Sync the one-course enrollment with the server whenever a learner signs in.
  useEffect(() => {
    if (!studentUser?.email) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.getEnrollment(userIdOf(studentUser));
        if (cancelled) return;
        const local = enrolledCourseOf(studentUser);
        if (res.courseId && res.courseId !== local) {
          saveUser({ ...studentUser, enrolledCourseIds: [res.courseId] });
        } else if (!res.courseId && local) {
          await api.enroll(userIdOf(studentUser), local).catch(() => {});
        } else if ((studentUser.enrolledCourseIds || []).length > 1) {
          saveUser({ ...studentUser, enrolledCourseIds: [local] });
        }
      } catch {
        /* offline – keep local state */
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentUser?.email]);

  // Learner sessions are server-signed. Sessions created before that (no token) or expired ones
  // must sign in again; the API raises 'arb:learner-session-expired' on a 401 from a protected route.
  useEffect(() => {
    const expire = () => {
      if (!readStudent()) return;
      saveUser(null);
      setProgressByCourse({});
      toast('Please sign in again to continue — your session has expired.', 'info', 5200);
      const here = window.location.pathname + window.location.search;
      navigate(paths.login(here.startsWith('/login') ? undefined : here), { replace: true });
    };
    window.addEventListener('arb:learner-session-expired', expire);
    if (studentUser && !studentUser.token) expire();
    return () => window.removeEventListener('arb:learner-session-expired', expire);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Staff sessions sign in through the normal login form. A saved one is confirmed with the server
  // before any staff tools load; an expired or invalid one is cleared.
  const [adminChecked, setAdminChecked] = useState(() => !getAdminToken());
  const confirmStaff = () => {
    if (!getAdminToken()) { setAdminChecked(true); return; }
    import('./services/adminApi')
      .then(m => m.confirmSession())
      .then(profile => { setAdminUser(profile); if (!profile) setAdminToken(null); })
      .catch(() => setAdminUser(null))
      .finally(() => setAdminChecked(true));
  };
  useEffect(confirmStaff, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const expired = () => setAdminUser(null);
    window.addEventListener('arb:staff-session-expired', expired);
    return () => window.removeEventListener('arb:staff-session-expired', expired);
  }, []);

  /* ---------------- Per-learner progress (server is source of truth) ---------------- */
  const [progressByCourse, setProgressByCourse] = useState({});

  const refreshProgress = useCallback(async (courseId) => {
    if (!userId || !courseId) return null;
    try {
      const res = await api.getProgress(courseId, userId);
      setProgressByCourse(p => ({ ...p, [courseId]: res }));
      return res;
    } catch {
      return null;
    }
  }, [userId]);

  useEffect(() => {
    setProgressByCourse({});
    if (enrolledCourseId) refreshProgress(enrolledCourseId);
  }, [userId, enrolledCourseId, refreshProgress]);

  const decoratedCourses = useMemo(() => courses.map(c => {
    const p = progressByCourse[c.id];
    const passed = new Set(p?.passedModuleIds || []);
    const modules = (c.modules || []).map(m => ({ ...m, completed: passed.has(m.id), quizScore: p?.moduleScores?.[m.id] }));
    const total = modules.length || 1;
    return {
      ...c,
      modules,
      progress: Math.round((passed.size / total) * 100),
      learnerProgress: p || null
    };
  }), [courses, progressByCourse]);

  const findCourse = (id) => decoratedCourses.find(c => c.id === id || c.slug === id) || null;

  /* ---------------- Enrollment (one course per login) ---------------- */
  const [enrollTarget, setEnrollTarget] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [celebrate, setCelebrate] = useState(null); // course just enrolled in

  const requestEnroll = useCallback((courseId) => {
    const course = courses.find(c => c.id === courseId);
    if (!studentUser) {
      toast('Please sign in or create an account to enroll.', 'info');
      navigate(paths.login(paths.course(courseId)));
      return;
    }
    if (enrolledCourseId === courseId) {
      navigate(paths.learn(courseId));
      return;
    }
    if (enrolledCourseId) {
      const current = courses.find(c => c.id === enrolledCourseId);
      toast(`You're already enrolled in "${current?.title || enrolledCourseId}". Only one course is allowed per login.`, 'error', 5200);
      return;
    }
    setEnrollTarget(course || { id: courseId, title: courseId });
  }, [studentUser, enrolledCourseId, courses, navigate, toast]);

  const confirmEnroll = async () => {
    if (!enrollTarget || !studentUser) return;
    setEnrolling(true);
    try {
      await api.enroll(userId, enrollTarget.id);
      saveUser({ ...studentUser, enrolledCourseIds: [enrollTarget.id] });
      // the celebration takes over from here; Start learning opens the first module
      setCelebrate(findCourse(enrollTarget.id) || enrollTarget);
      setEnrollTarget(null);
    } catch (err) {
      if (err.status === 409 && err.data?.courseId) {
        saveUser({ ...studentUser, enrolledCourseIds: [err.data.courseId] });
      }
      toast(err.message || 'Could not enroll right now. Please try again.', 'error', 5200);
      setEnrollTarget(null);
    } finally {
      setEnrolling(false);
    }
  };

  /* ---------------- Auth ---------------- */
  const handleAuthSuccess = (user, { isNew = false } = {}) => {
    if (user.staff) {
      saveUser(null);
      setAdminChecked(false);
      confirmStaff();
      toast(`Welcome${user.name ? `, ${user.name.split(' ')[0]}` : ''}!`, 'success', 3800);
      navigate(paths.dashboard(), { replace: true }); // staff go straight to their tools
      return;
    }
    setAdminToken(null);
    setAdminUser(null);
    saveUser(user);
    toast(isNew
      ? `Account created! Your learner ID is ${user.learnerId} — it will appear on your certificate.`
      : `Welcome${user.name ? `, ${user.name.split(' ')[0]}` : ''}!`, 'success', isNew ? 6500 : 3800);
    const next = route.query.next && route.query.next.startsWith('/') ? route.query.next : paths.home();
    navigate(next, { replace: true });
  };

  const handleLogout = () => {
    saveUser(null);
    setProgressByCourse({});
    toast('You have been signed out.', 'info');
    navigate(paths.home());
  };

  const handleStaffLogout = async () => {
    try { await (await import('./services/adminApi')).endSession(); } catch { /* ignore */ }
    setAdminToken(null);
    setAdminUser(null);
    toast('You have been signed out.', 'info');
    navigate(paths.home());
  };

  /* ---------------- Route guards ---------------- */
  const needsLogin = ['learning', 'dashboard', 'certificate'].includes(route.name);

  useEffect(() => {
    // Ignore stale runs (e.g. StrictMode re-run after we already redirected).
    if (parseLocation().name !== route.name) return;
    if (needsLogin && !studentUser && !(route.name === 'dashboard' && (adminUser || !adminChecked))) {
      const here = window.location.pathname + window.location.search;
      navigate(paths.login(here), { replace: true });
      return;
    }
    if (route.name === 'learning' && studentUser && coursesLoaded) {
      const id = route.params.courseId;
      if (!courses.some(c => c.id === id)) return; // not-found screen handles it
      if (enrolledCourseId !== id) {
        toast(enrolledCourseId
          ? 'This course is locked for your account — only one course is allowed per login.'
          : 'Enroll in this course to start learning.', enrolledCourseId ? 'error' : 'info', 4800);
        navigate(paths.course(id), { replace: true });
      }
    }
    if ((route.name === 'login' || route.name === 'register') && (studentUser || adminUser)) {
      navigate(paths.home(), { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, studentUser, adminUser, adminChecked, coursesLoaded, enrolledCourseId]);

  /* ---------------- Render ---------------- */
  const goCourses = (query) => navigate(paths.courses(query));
  // Login, register and the account screens open as a modal card over the page the visitor was on
  // (that page stays visible, faded, behind it). Opening one directly shows the home page behind.
  const AUTH_ROUTES = ['login', 'register', 'verify-email', 'forgot-password', 'reset-password'];
  const BACKDROP_ROUTES = ['home', 'courses', 'course-details', 'categories', 'about', 'contact', 'verify', 'terms', 'privacy'];
  const isAuthModal = AUTH_ROUTES.includes(route.name);
  if (!isAuthModal && BACKDROP_ROUTES.includes(route.name)) {
    lastPageRef.current = { route, path: window.location.pathname + window.location.search };
  }
  const displayRoute = isAuthModal ? (lastPageRef.current?.route || { name: 'home', params: {}, query: {} }) : route;
  const closeAuthModal = () => navigate(lastPageRef.current?.path || '/');
  const isChromeless = displayRoute.name === 'learning';

  const loading = <PageLoader />;

  const notFound = (title = 'Page not found', text = "The page you're looking for doesn't exist or has moved.") => (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-20">
      <p className="eyebrow">404</p>
      <h1 className="text-3xl font-bold text-brand-900 mt-2">{title}</h1>
      <p className="text-slate-500 mt-2 max-w-md">{text}</p>
      <div className="flex gap-3 mt-6">
        <button className="btn-outline" onClick={() => window.history.length > 1 ? window.history.back() : navigate('/')}>Go back</button>
        <button className="btn-primary" onClick={() => navigate(paths.courses())}>Browse courses</button>
      </div>
    </div>
  );

  const renderPage = (route) => {
  let page = null;
  switch (route.name) {
    case 'home':
      page = (
        <div className="landing-type">
          <HeroSection onExploreClick={() => goCourses()} onSearch={(q) => goCourses(q ? { q } : undefined)} onVerifyClick={() => navigate(paths.verify())} onRegisterClick={() => navigate(studentUser ? paths.dashboard() : paths.register())} courses={courses} />
          <PopularCourses
            courses={decoratedCourses}
            enrolledCourseId={enrolledCourseId}
            onSelectCourse={(id) => navigate(paths.course(id))}
            onEnrollCourse={requestEnroll}
            onViewAllCourses={() => goCourses()}
          />
          <WhyLearnWithUs />
          <CtaSection onExploreClick={() => goCourses()} />
        </div>
      );
      break;
    case 'courses':
      page = !coursesLoaded ? loading : (
        <CoursesPage
          key={`${route.query.q || ''}|${route.query.category || ''}`}
          courses={decoratedCourses}
          enrolledCourseId={enrolledCourseId}
          onSelectCourse={(id) => navigate(paths.course(id))}
          onEnrollCourse={requestEnroll}
          initialSearch={route.query.q || ''}
          initialCategory={route.query.category || 'All Categories'}
          onHome={() => navigate(paths.home())}
        />
      );
      break;
    case 'course-details': {
      const course = findCourse(route.params.courseId);
      page = !coursesLoaded ? loading : !course ? notFound('Course not found') : (
        <CourseDetailsPage
          course={course}
          enrolledCourseId={enrolledCourseId}
          isLoggedIn={!!studentUser}
          onBack={() => navigate(paths.courses())}
          onEnroll={() => requestEnroll(course.id)}
          onContinue={(moduleId) => navigate(paths.learn(course.id, moduleId))}
          onHome={() => navigate(paths.home())}
        />
      );
      break;
    }
    case 'learning': {
      const course = findCourse(route.params.courseId);
      page = !coursesLoaded || !studentUser ? loading : !course ? notFound('Course not found') : enrolledCourseId !== course.id ? loading : (
        <LearningPage
          course={course}
          studentUser={studentUser}
          activeModuleId={route.params.moduleId}
          onSelectModule={(moduleId) => navigate(paths.learn(course.id, moduleId), { replace: true, scroll: false })}
          onExit={() => navigate(paths.dashboard())}
          onProgressChanged={() => refreshProgress(course.id)}
          onViewCertificate={() => navigate(paths.certificate(course.id))}
        />
      );
      break;
    }
    case 'dashboard':
      if (!studentUser && adminUser) {
        page = (
          <Suspense fallback={loading}>
            <AdminDashboard embedded initialSection={route.query.section} profile={adminUser} onLogout={handleStaffLogout} onCourseDataChanged={fetchCourses} />
          </Suspense>
        );
        break;
      }
      page = !studentUser ? loading : (
        <StudentDashboard
          studentUser={studentUser}
          courses={decoratedCourses}
          coursesLoaded={coursesLoaded}
          enrolledCourseId={enrolledCourseId}
          onOpenCourse={(id) => navigate(paths.course(id))}
          onContinue={(id, moduleId) => navigate(paths.learn(id, moduleId))}
          onViewCertificate={(id) => navigate(paths.certificate(id))}
          onExploreCourses={() => goCourses()}
          onRefresh={() => enrolledCourseId && refreshProgress(enrolledCourseId)}
          onHome={() => navigate(paths.home())}
          onProfileSaved={(changes) => saveUser({ ...studentUser, ...changes })}
          initialTab={route.query.tab}
        />
      );
      break;
    case 'certificate': {
      const course = findCourse(route.params.courseId || enrolledCourseId || '');
      page = !coursesLoaded || !studentUser ? loading : !course ? notFound('Certificate not found') : (
        <CertificatePage
          course={course}
          studentUser={studentUser}
          onBack={() => navigate(paths.dashboard())}
          onVerify={(id) => navigate(paths.verify(id))}
          onGoToCourse={() => navigate(paths.learn(course.id))}
        />
      );
      break;
    }
    case 'verify':
      page = <CertificateVerifyPage certId={route.params.certId} onSearch={(id) => navigate(paths.verify(id), { replace: true })} onHome={() => navigate('/')} />;
      break;
    case 'categories':
      page = <CategoriesPage courses={courses} onCategorySelect={(cat) => goCourses({ category: cat })} onHome={() => navigate(paths.home())} />;
      break;
    case 'about':
      page = <AboutPage onExplore={() => goCourses()} onHome={() => navigate(paths.home())} />;
      break;
    case 'contact':
      page = <ContactPage onHome={() => navigate(paths.home())} />;
      break;
    case 'terms':
      page = <TermsPage onHome={() => navigate(paths.home())} />;
      break;
    case 'privacy':
      page = <PrivacyPage onHome={() => navigate(paths.home())} />;
      break;
    case 'login':
    case 'register':
      page = (
        <AuthPage
          asModal
          mode={route.name === 'register' ? 'signup' : 'login'}
          onSwitchMode={(m) => navigate((m === 'signup' ? paths.register : paths.login)(route.query.next), { replace: true })}
          onBack={closeAuthModal}
          onHome={() => navigate('/')}
          onSuccess={handleAuthSuccess}
          onNeedVerification={(email, dev) => {
            if (dev) rememberDevMail({ email, ...dev });
            navigate(paths.verifyEmail(email) + (route.query.next ? `&next=${encodeURIComponent(route.query.next)}` : ''));
          }}
          onForgotPassword={(email) => navigate(paths.forgotPassword(email))}
        />
      );
      break;
    case 'verify-email':
      page = (
        <VerifyEmailPage
          asModal
          key={route.query.email || ''}
          email={route.query.email || ''}
          token={route.query.token || ''}
          onVerified={(user) => handleAuthSuccess(user, { isNew: true })}
          onBack={() => navigate(paths.login())}
          onHome={() => navigate('/')}
        />
      );
      break;
    case 'forgot-password':
      page = (
        <ForgotPasswordPage
          asModal
          initialEmail={route.query.email || ''}
          onCodeSent={(email) => navigate(paths.resetPassword(email))}
          onBack={() => navigate(paths.login())}
          onHome={() => navigate('/')}
        />
      );
      break;
    case 'reset-password':
      page = (
        <ResetPasswordPage
          asModal
          key={`${route.query.email || ''}|${route.query.token || ''}`}
          email={route.query.email || ''}
          token={route.query.token || ''}
          onDone={() => { toast('Password changed. Please sign in with your new password.', 'success', 5000); navigate(paths.login()); }}
          onResend={() => navigate(paths.forgotPassword(route.query.email || ''))}
          onBack={() => navigate(paths.login())}
          onHome={() => navigate('/')}
        />
      );
      break;
    default:
      page = notFound();
  }
  return page;
  };
  const page = renderPage(displayRoute);
  const authModal = isAuthModal ? renderPage(route) : null;

  return (
    <div className={`min-h-screen flex flex-col font-sans bg-ivory text-charcoal ${isChromeless ? '' : 'has-bottom-nav'}`}>
      {!isChromeless && (
        <Header
          route={route}
          navigate={navigate}
          studentUser={studentUser || (adminUser && { name: adminUser.name, email: adminUser.email })}
          onLogout={adminUser && !studentUser ? handleStaffLogout : handleLogout}
          courses={courses}
        />
      )}

      <main className="flex-1" key={displayRoute.name === 'learning' ? `learn-${displayRoute.params.courseId}` : displayRoute.name}>
        {adminUser && displayRoute.name === 'course-details' && (
          <Suspense fallback={null}>
            <AdminCourseBar courseId={displayRoute.params.courseId} onOpen={(section) => navigate(`${paths.dashboard()}?section=${section}`)} />
          </Suspense>
        )}
        {/* no fade wrapper on the staff page: its animation would keep the page's pop-ups under the header */}
        <div className={isChromeless || (adminUser && displayRoute.name === 'dashboard') ? '' : 'animate-fade-in'}>{page}</div>
      </main>

      {!isChromeless && <Footer navigate={navigate} />}
      {!isChromeless && (
        <MobileBottomNav route={displayRoute} navigate={navigate} studentUser={studentUser} />
      )}

      {authModal && <AuthModalLayer onClose={closeAuthModal}>{authModal}</AuthModalLayer>}
      {!adminUser && <DesktopNotice />}

      {!isAuthModal && route.name !== 'home' && !(adminUser && route.name === 'dashboard') && (
        <HomeButton onClick={() => navigate(paths.home())} aboveBottomNav={!isChromeless} />
      )}

      <ConfirmDialog
        open={!!enrollTarget}
        title={`Enroll in ${enrollTarget?.title || 'this course'}?`}
        message={
          <>
            <p>Each Arshith Bootcamp login can be enrolled in <strong>only one course</strong>. After you enroll, other courses will be locked for this account.</p>
          </>
        }
        confirmLabel="Yes, enroll me"
        busy={enrolling}
        onConfirm={confirmEnroll}
        onCancel={() => !enrolling && setEnrollTarget(null)}
      />
      {celebrate && (
        <EnrollCelebration
          course={celebrate}
          learnerName={studentUser?.name}
          onStart={() => { const id = celebrate.id; setCelebrate(null); navigate(paths.learn(id)); }}
          onClose={() => setCelebrate(null)}
        />
      )}
    </div>
  );
}

/**
 * Faded, blurred backdrop over the current page with the auth card centred on top (Coursera-style).
 * Closes on a click outside the card or Esc; page scrolling is paused while it is open.
 */
function AuthModalLayer({ onClose, children }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-[#0C2D26]/45 backdrop-blur-[3px] animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div className="relative min-h-full flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div className="pointer-events-auto w-full flex justify-center">{children}</div>
      </div>
    </div>
  );
}
