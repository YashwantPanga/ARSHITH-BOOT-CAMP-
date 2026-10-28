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
import { WhatBringsYou } from './components/MobileWelcome';
import EnrollCelebration from './components/EnrollCelebration';
import { Lock } from 'lucide-react';
import { displayTitle } from './utils/textUtils';
import PaymentNotice from './components/PaymentNotice';

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
import { TermsPage, PrivacyPage, RefundPage } from './pages/LegalPages';
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
  // a learner can hold several courses; enrolledCourseId is the most recent one
  const enrolledIds = useMemo(() => studentUser?.enrolledCourseIds || [], [studentUser]);
  const enrolledCourseId = enrolledCourseOf(studentUser);
  // from the server: { courseIds, courses: { id: status }, nextPrice, history }
  const [enrollState, setEnrollState] = useState(null);
  // failed courses (both final attempts used) stay locked until the learner pays to take them again
  const closedIds = useMemo(() => enrolledIds.filter(id => enrollState?.courses?.[id] === 'failed'), [enrolledIds, enrollState]);
  const courseOffer = useMemo(() => ({
    canEnrollNew: true,
    enrolledIds: enrolledIds.filter(id => !closedIds.includes(id)),
    price: studentUser ? (enrollState ? enrollState.nextPrice || 0 : (enrolledIds.length ? 99 : 0)) : 0
  }), [studentUser, enrollState, enrolledIds, closedIds]);

  const saveUser = useCallback((u) => {
    setStudentUser(u);
    writeStudent(u);
  }, []);

  // Sync the learner's courses with the server whenever they sign in.
  useEffect(() => {
    if (!studentUser?.email) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.getEnrollment(userIdOf(studentUser));
        if (cancelled) return;
        setEnrollState(res);
        const serverIds = res.courseIds || (res.courseId ? [res.courseId] : []);
        const localIds = studentUser.enrolledCourseIds || [];
        if (serverIds.join('|') !== localIds.join('|')) saveUser({ ...studentUser, enrolledCourseIds: serverIds });
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

  const enrolledKey = enrolledIds.join('|');
  useEffect(() => {
    setProgressByCourse({});
    enrolledIds.forEach(id => refreshProgress(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, enrolledKey, refreshProgress]);

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

  /* ---------------- Enrollment (rules in server/lib/enrollment.js) ---------------- */
  const [enrollTarget, setEnrollTarget] = useState(null);
  const [paymentFor, setPaymentFor] = useState(null); // { course, price } when a course needs payment
  const [enrolling, setEnrolling] = useState(false);
  const [celebrate, setCelebrate] = useState(null); // course just enrolled in

  const requestEnroll = useCallback((courseId) => {
    const course = courses.find(c => c.id === courseId);
    if (!studentUser) {
      toast('Please sign in or create an account to enroll.', 'info');
      navigate(paths.login(paths.course(courseId)));
      return;
    }
    const retake = closedIds.includes(courseId);
    if (enrolledIds.includes(courseId) && !retake) {
      navigate(paths.learn(courseId));
      return;
    }
    if (retake || courseOffer.price > 0) {
      setPaymentFor({ course: course || { id: courseId, title: courseId }, price: courseOffer.price || 99, retake });
      return;
    }
    setEnrollTarget(course || { id: courseId, title: courseId });
  }, [studentUser, enrolledIds, closedIds, courses, navigate, toast, courseOffer]);

  const confirmEnroll = async () => {
    if (!enrollTarget || !studentUser) return;
    setEnrolling(true);
    try {
      const res = await api.enroll(userId, enrollTarget.id);
      setEnrollState(res);
      saveUser({ ...studentUser, enrolledCourseIds: res.courseIds || [enrollTarget.id, ...enrolledIds.filter(id => id !== enrollTarget.id)] });
      // the celebration takes over from here; Start learning opens the first module
      setCelebrate(findCourse(enrollTarget.id) || enrollTarget);
      setEnrollTarget(null);
    } catch (err) {
      if (err.status === 402) setPaymentFor({ course: enrollTarget, price: err.data?.price || 99 });
      else toast(err.message || 'Could not enroll right now. Please try again.', 'error', 5200);
      setEnrollTarget(null);
    } finally {
      setEnrolling(false);
    }
  };

  // Razorpay confirmed the payment and the server unlocked the course
  const onCoursePaid = (res) => {
    const paidId = res.courseId || paymentFor?.course?.id;
    setEnrollState(res);
    saveUser({ ...studentUser, enrolledCourseIds: res.courseIds || [paidId, ...enrolledIds.filter(id => id !== paidId)] });
    setCelebrate({ ...(findCourse(paidId) || paymentFor?.course), paid: paymentFor?.price || 99 });
    setPaymentFor(null);
    toast('Payment received - a receipt is on its way to your email.', 'success', 5000);
  };

  // After a second failed final: reload the course states (the course shows as locked at once) and,
  // when the learner chooses to, open the ₹99 payment to take the course again.
  const refreshEnrollment = useCallback(() => {
    if (!userId) return;
    api.getEnrollment(userId).then(setEnrollState).catch(() => {});
  }, [userId]);
  const offerRetake = (courseId) => {
    const course = findCourse(courseId) || { id: courseId, title: courseId };
    setPaymentFor({ course, price: enrollState?.nextPrice || 99, retake: true });
    refreshEnrollment();
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
      if (!enrolledIds.includes(id)) {
        toast('Enroll in this course to start learning.', 'info', 4800);
        navigate(paths.course(id), { replace: true });
      }
    }
    if ((route.name === 'login' || route.name === 'register') && (studentUser || adminUser)) {
      navigate(paths.home(), { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, studentUser, adminUser, adminChecked, coursesLoaded, enrolledKey]);

  /* ---------------- Render ---------------- */
  const goCourses = (query) => navigate(paths.courses(query));
  // Login, register and the account screens open as a modal card over the page the visitor was on
  // (that page stays visible, faded, behind it). Opening one directly shows the home page behind.
  const AUTH_ROUTES = ['login', 'register', 'verify-email', 'forgot-password', 'reset-password'];
  const BACKDROP_ROUTES = ['home', 'courses', 'course-details', 'categories', 'about', 'contact', 'verify', 'terms', 'privacy', 'refunds'];
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
            offer={courseOffer}
            onSelectCourse={(id) => navigate(paths.course(id))}
            onEnrollCourse={requestEnroll}
            onViewAllCourses={() => goCourses()}
          />
          <WhatBringsYou onCourses={() => goCourses()} onCategories={() => navigate(paths.categories())} />
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
          offer={courseOffer}
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
          offer={courseOffer}
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
      page = !coursesLoaded || !studentUser ? loading : !course ? notFound('Course not found') : !enrolledIds.includes(course.id) ? loading : closedIds.includes(course.id) ? (
        <CourseClosed
          course={course}
          price={courseOffer.price || 99}
          onUnlock={() => requestEnroll(course.id)}
          onDashboard={() => navigate(paths.dashboard())}
        />
      ) : (
        <LearningPage
          course={course}
          studentUser={studentUser}
          activeModuleId={route.params.moduleId}
          onSelectModule={(moduleId) => navigate(paths.learn(course.id, moduleId), { replace: true, scroll: false })}
          onExit={() => navigate(paths.dashboard())}
          onProgressChanged={() => refreshProgress(course.id)}
          onViewCertificate={() => navigate(paths.certificate(course.id))}
          onCourseLocked={refreshEnrollment}
          onUnlockAgain={() => offerRetake(course.id)}
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
          onUnlock={requestEnroll}
          onRefresh={() => { enrolledIds.forEach(id => refreshProgress(id)); api.getEnrollment(userId).then(setEnrollState).catch(() => {}); }}
          enrolledIds={enrolledIds}
          enrollState={enrollState}
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
    case 'refunds':
      page = <RefundPage onHome={() => navigate(paths.home())} />;
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
            <p>This will be your <strong>one free course</strong>. Every other course - and this one again if you fail its final assessment twice - costs ₹99 to unlock.</p>
          </>
        }
        confirmLabel="Yes, enroll me"
        busy={enrolling}
        onConfirm={confirmEnroll}
        onCancel={() => !enrolling && setEnrollTarget(null)}
      />
      {paymentFor && (
        <PaymentNotice
          course={paymentFor.course}
          price={paymentFor.price}
          retake={!!paymentFor.retake}
          paymentsEnabled={enrollState ? !!enrollState.paymentsEnabled : undefined}
          onPaid={onCoursePaid}
          onClose={() => setPaymentFor(null)}
        />
      )}
      {celebrate && (
        <EnrollCelebration
          course={celebrate}
          paid={celebrate.paid || 0}
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

/** A failed course (both final attempts used): locked until the learner unlocks it again. */
function CourseClosed({ course, price, onUnlock, onDashboard }) {
  return (
    <div className="bg-ivory min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="edu-card max-w-md w-full p-7 text-center">
        <span className="mx-auto w-14 h-14 rounded-full bg-brand-100 text-forest flex items-center justify-center"><Lock className="w-7 h-7" /></span>
        <h1 className="mt-4 text-[24px] font-bold text-evergreen leading-tight">{displayTitle(course.title)} is locked</h1>
        <p className="mt-2 text-[14.5px] text-charcoal/70 leading-relaxed">
          You used both final assessment attempts without passing. Unlock the course again for ₹{price} to study it and get two fresh attempts.
        </p>
        <button onClick={onUnlock} className="font-display mt-6 w-full h-12 rounded-md bg-forest text-ivory text-[15.5px] font-semibold hover:bg-sage transition-colors">Unlock again for ₹{price}</button>
        <button onClick={onDashboard} className="mt-3 text-[14px] font-medium text-charcoal/60 hover:text-forest">Back to my dashboard</button>
      </div>
    </div>
  );
}
