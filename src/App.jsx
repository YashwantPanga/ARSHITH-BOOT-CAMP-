import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import PopularCourses from './components/PopularCourses';
import WhyLearnWithUs from './components/WhyLearnWithUs';
import CtaSection from './components/CtaSection';
import HomeButton from './components/HomeButton';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import AuthPage from './components/LoginModal';
import { ToastProvider, useToast, ConfirmDialog, PageLoader } from './components/ui';

import CoursesPage from './pages/CoursesPage';
import CourseDetailsPage from './pages/CourseDetailsPage';
import LearningPage from './pages/LearningPage';
import CertificatePage from './pages/CertificatePage';
import CertificateVerifyPage from './pages/CertificateVerifyPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import CategoriesPage from './pages/CategoriesPage';
import { AboutPage, ContactPage } from './pages/AboutContactPages';
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

  // A saved admin login is checked with the server first; an expired or invalid one is cleared and
  // the admin is sent to the login page (also when any admin call is rejected later).
  const [adminChecked, setAdminChecked] = useState(() => !getAdminToken());
  useEffect(() => {
    const token = getAdminToken();
    if (!token) return;
    api.getAdminProfile()
      .then(res => { if (res.success) setAdminUser(res.admin); else { setAdminToken(null); setAdminUser(null); } })
      .catch(() => { setAdminToken(null); setAdminUser(null); })
      .finally(() => setAdminChecked(true));
  }, []);
  useEffect(() => {
    const expired = () => {
      setAdminUser(null);
      if (parseLocation().name === 'admin-dashboard') navigate(paths.adminLogin(), { replace: true });
    };
    window.addEventListener('arb:admin-session-expired', expired);
    return () => window.removeEventListener('arb:admin-session-expired', expired);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      toast(`Enrolled in ${enrollTarget.title}. Happy learning!`, 'success');
      const id = enrollTarget.id;
      setEnrollTarget(null);
      navigate(paths.learn(id));
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
    saveUser(user);
    toast(isNew
      ? `Account created! Your learner ID is ${user.learnerId} — it will appear on your certificate.`
      : `Welcome${user.name ? `, ${user.name.split(' ')[0]}` : ''}!`, 'success', isNew ? 6500 : 3800);
    const next = route.query.next && route.query.next.startsWith('/') ? route.query.next : paths.dashboard();
    navigate(next, { replace: true });
  };

  const handleLogout = () => {
    saveUser(null);
    setProgressByCourse({});
    toast('You have been signed out.', 'info');
    navigate(paths.home());
  };

  const handleAdminLoginSuccess = (adminData) => {
    setAdminUser(adminData);
    navigate(paths.adminDashboard(), { replace: true });
  };

  const handleAdminLogout = async () => {
    try { await api.adminLogout(); } catch { /* ignore */ }
    setAdminUser(null);
    navigate(paths.adminLogin(), { replace: true });
  };

  /* ---------------- Route guards ---------------- */
  const needsLogin = ['learning', 'dashboard', 'certificate'].includes(route.name);

  useEffect(() => {
    // Ignore stale runs (e.g. StrictMode re-run after we already redirected).
    if (parseLocation().name !== route.name) return;
    if (needsLogin && !studentUser) {
      const here = window.location.pathname + window.location.search;
      navigate(paths.login(here), { replace: true });
      return;
    }
    if (route.name === 'admin-dashboard' && !adminUser && (!getAdminToken() || adminChecked)) {
      navigate(paths.adminLogin(), { replace: true });
      return;
    }
    if (route.name === 'admin-login' && adminUser) {
      navigate(paths.adminDashboard(), { replace: true });
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
    if ((route.name === 'login' || route.name === 'register') && studentUser) {
      navigate(paths.dashboard(), { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, studentUser, adminUser, adminChecked, coursesLoaded, enrolledCourseId]);

  /* ---------------- Render ---------------- */
  const goCourses = (query) => navigate(paths.courses(query));
  const isChromeless = ['learning', 'admin-login', 'admin-dashboard', 'login', 'register', 'verify-email', 'forgot-password', 'reset-password'].includes(route.name);

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

  let page = null;
  switch (route.name) {
    case 'home':
      page = (
        <>
          <HeroSection onExploreClick={() => goCourses()} onVerifyClick={() => navigate(paths.verify())} onRegisterClick={() => navigate(studentUser ? paths.dashboard() : paths.register())} courses={courses} />
          <PopularCourses
            courses={decoratedCourses}
            enrolledCourseId={enrolledCourseId}
            onSelectCourse={(id) => navigate(paths.course(id))}
            onEnrollCourse={requestEnroll}
            onViewAllCourses={() => goCourses()}
          />
          <WhyLearnWithUs />
          <CtaSection onExploreClick={() => goCourses()} />
        </>
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
      page = <CategoriesPage courses={courses} onCategorySelect={(cat) => goCourses({ category: cat })} />;
      break;
    case 'about':
      page = <AboutPage onExplore={() => goCourses()} />;
      break;
    case 'contact':
      page = <ContactPage />;
      break;
    case 'login':
    case 'register':
      page = (
        <AuthPage
          mode={route.name === 'register' ? 'signup' : 'login'}
          onSwitchMode={(m) => navigate((m === 'signup' ? paths.register : paths.login)(route.query.next), { replace: true })}
          onBack={() => (window.history.length > 1 ? window.history.back() : navigate('/'))}
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
    case 'admin-login':
      page = <AdminLoginPage onLoginSuccess={handleAdminLoginSuccess} onGoHome={() => navigate('/')} />;
      break;
    case 'admin-dashboard':
      // The dashboard only shows for an admin the server has confirmed; otherwise the login form.
      page = adminUser
        ? <AdminDashboard admin={adminUser} onLogout={handleAdminLogout} onCourseDataChanged={fetchCourses} />
        : adminChecked
          ? <AdminLoginPage onLoginSuccess={handleAdminLoginSuccess} onGoHome={() => navigate('/')} />
          : <PageLoader />;
      break;
    default:
      page = notFound();
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans bg-ivory text-charcoal ${isChromeless ? '' : 'has-bottom-nav'}`}>
      {!isChromeless && (
        <Header
          route={route}
          navigate={navigate}
          studentUser={studentUser}
          onLogout={handleLogout}
          courses={courses}
        />
      )}

      <main className="flex-1" key={route.name === 'learning' ? `learn-${route.params.courseId}` : route.name}>
        <div className={isChromeless ? '' : 'animate-fade-in'}>{page}</div>
      </main>

      {!isChromeless && <Footer navigate={navigate} />}
      {!isChromeless && (
        <MobileBottomNav route={route} navigate={navigate} studentUser={studentUser} />
      )}

      {!['home', 'admin-dashboard'].includes(route.name) && (
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
    </div>
  );
}
