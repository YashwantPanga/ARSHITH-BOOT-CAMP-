import React, { useEffect, useState } from 'react';
import { PlayCircle, Award, Lock, ListChecks, ShieldCheck, BookOpen, Mail, Hash, ArrowRight, CheckCircle2, User, KeyRound, Copy, Check, Eye, EyeOff, LayoutDashboard, Settings } from 'lucide-react';
import { ProgressRing, ProgressBar, SafeImg, BrandLoader } from '../components/ui';
import { courseArt } from '../components/CourseCard';
import { cleanText, displayTitle } from '../utils/textUtils';
import { api } from '../services/api';

export default function StudentDashboard({ studentUser, courses, coursesLoaded, enrolledCourseId, onOpenCourse, onContinue, onViewCertificate, onExploreCourses, onUnlock, onRefresh, onHome, onProfileSaved, initialTab = 'learning', enrollState, enrolledIds = [] }) {
  useEffect(() => { onRefresh?.(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  const [tab, setTab] = useState(initialTab === 'profile' ? 'profile' : 'learning');

  // several courses can be open; the chips above the course card switch between them
  const myIds = enrolledIds.length ? enrolledIds : (enrolledCourseId ? [enrolledCourseId] : []);
  const [selectedId, setSelectedId] = useState(null);
  const course = courses.find(c => c.id === (myIds.includes(selectedId) ? selectedId : myIds[0]));
  const firstName = (studentUser.name || studentUser.email).split(' ')[0];
  const lp = course?.learnerProgress;
  const done = course?.modules?.filter(m => m.completed).length || 0;
  const total = course?.modules?.length || 0;
  const quizzesDone = total > 0 && done === total;
  const projectReq = lp?.projects || { required: course?.projects?.length || 0, submitted: 0, missing: course?.projects || [] };
  const projectsDone = projectReq.required === 0 || (projectReq.missing || []).length === 0;
  const allPassed = quizzesDone && projectsDone;
  const passedFinal = lp?.passedFinal;
  const lastFinal = lp?.finalAttempts?.[0];
  const nextModule = course?.modules?.find(m => !m.completed) || course?.modules?.[0];
  const attemptsUsed = lp?.finalAttemptsUsed ?? lp?.finalAttempts?.length ?? 0;
  const titleOf = (id) => displayTitle(courses.find(c => c.id === id)?.title || id);
  const history = enrollState?.history || [];
  const courseState = course ? enrollState?.courses?.[course.id] : null;
  const canStartNext = courseState === 'passed' || courseState === 'failed';
  const nextPrice = enrollState?.nextPrice || 0;

  const stats = [
    { label: 'Course progress', value: course ? `${course.progress || 0}%` : '-', icon: BookOpen },
    { label: 'Quizzes passed', value: course ? `${done}/${total}` : '-', icon: ListChecks },
    { label: 'Final assessment', value: passedFinal ? `${passedFinal.percentage}%` : allPassed ? 'Unlocked' : 'Locked', icon: ShieldCheck },
    { label: 'Certificate', value: passedFinal ? 'Earned' : 'Not yet', icon: Award }
  ];

  return (
    <div className="bg-ivory min-h-[70vh] pb-16">
      {/* banner */}
      <section className="relative overflow-hidden bg-cream border-b border-brand-900/10">
        <div className="absolute inset-0 edu-shape pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
          <nav aria-label="Breadcrumb" className="font-display text-[15px] text-evergreen">
            {onHome ? <button onClick={onHome} className="font-semibold text-sage hover:underline">Home</button> : <span className="font-semibold text-sage">Home</span>}
            <span className="mx-2 text-charcoal/40">/</span>My dashboard
          </nav>
          <div className="mt-5">
            <div className="min-w-0">
              <p className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-sage">My dashboard</p>
              <h1 className="mt-1 text-[30px] sm:text-[38px] font-bold leading-tight text-evergreen">Welcome back, {firstName}!</h1>
              <p className="text-charcoal/65 mt-1">{course ? 'Pick up where you left off.' : 'Choose your course to get started.'}</p>
            </div>
          </div>
          <div className="mt-7 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="edu-card px-4 py-3.5 flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-brand-100 text-forest flex items-center justify-center shrink-0"><Icon className="w-[18px] h-[18px]" /></span>
                <span className="min-w-0">
                  <span className="block font-display text-[19px] font-semibold text-evergreen leading-tight">{value}</span>
                  <span className="block text-[12.5px] text-charcoal/60">{label}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* tabs */}
        <div className="flex gap-2 border-b border-brand-900/10" role="tablist">
          {[
            { id: 'learning', label: 'My learning', icon: LayoutDashboard },
            { id: 'profile', label: 'Profile & settings', icon: Settings }
          ].map(t => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
              className={`font-display inline-flex items-center gap-2 px-4 h-12 -mb-px border-b-2 text-[15.5px] font-semibold transition-colors ${tab === t.id ? 'border-forest text-forest' : 'border-transparent text-charcoal/55 hover:text-forest'}`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        <div className="pt-8">
          {tab === 'profile' ? (
            <ProfileSettings studentUser={studentUser} onSaved={onProfileSaved} />
          ) : !coursesLoaded ? (
            <div className="py-20 flex justify-center"><BrandLoader label="Loading" /></div>
          ) : !course ? (
            <div className="edu-card p-8 sm:p-12 text-center max-w-2xl mx-auto">
              <span className="mx-auto w-14 h-14 rounded-full bg-brand-100 text-forest flex items-center justify-center"><BookOpen className="w-7 h-7" /></span>
              <h2 className="mt-4 text-2xl font-semibold text-evergreen">You haven't enrolled in a course yet</h2>
              <p className="mt-2 text-charcoal/65">Each account can enroll in <strong>one</strong> course. Choose carefully — it stays with this login through to your certificate.</p>
              <button onClick={onExploreCourses} className="btn font-display !rounded-md bg-forest text-ivory hover:bg-sage mt-6 px-6 py-3">Browse courses <ArrowRight className="w-4 h-4" /></button>
            </div>
          ) : (
            <>
            {myIds.length > 1 && (
              <div className="mb-6 flex gap-2 overflow-x-auto no-scrollbar" role="tablist" aria-label="My courses">
                {myIds.map(id => (
                  <button key={id} role="tab" aria-selected={course?.id === id} onClick={() => setSelectedId(id)}
                    className={`font-display shrink-0 h-11 px-5 rounded-full border text-[14.5px] font-medium transition ${course?.id === id ? 'bg-forest border-forest text-ivory' : 'bg-white border-brand-900/15 text-charcoal/75 hover:border-sage'}`}>
                    {titleOf(id)}
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-[auto_1fr] gap-6">
                <div className="edu-card overflow-hidden grid grid-cols-1 sm:grid-cols-5 order-1 lg:order-none lg:col-span-2 lg:col-start-1 lg:row-start-1">
                  <div className="sm:col-span-2 bg-forest flex items-center">
                    <SafeImg src={courseArt(course)} alt="" className="w-full aspect-[16/10] object-cover object-[44%_50%]" />
                  </div>
                  <div className="sm:col-span-3 p-6 flex flex-col">
                    <span className="font-display self-start rounded-md bg-forest text-ivory text-[12.5px] font-medium px-2.5 py-1">{course.category}</span>
                    <h2 className="mt-3 text-[22px] font-semibold text-evergreen leading-snug">{displayTitle(course.title)}</h2>
                    <p className="text-[14px] text-charcoal/60 mt-1 line-clamp-2">{cleanText(course.shortDescription)}</p>
                    <div className="mt-4">
                      <div className="flex justify-between text-xs mb-1.5"><span className="text-charcoal/60">{done}/{total} module quizzes completed</span><span className="font-semibold text-forest">{course.progress}%</span></div>
                      <ProgressBar value={course.progress} />
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {courseState === 'failed'
                        ? <button onClick={() => onUnlock?.(course.id)} className="btn font-display !rounded-md bg-forest text-ivory hover:bg-sage px-5 py-2.5"><Lock className="w-4 h-4" />{nextPrice ? `Unlock again for ₹${nextPrice}` : 'Start the course again'}</button>
                        : <button onClick={() => onContinue(course.id, nextModule?.id)} className="btn font-display !rounded-md bg-forest text-ivory hover:bg-sage px-5 py-2.5"><PlayCircle className="w-4 h-4" />{done ? 'Continue learning' : 'Start learning'}</button>}
                      <button onClick={() => onOpenCourse(course.id)} className="btn font-display !rounded-md bg-cream text-forest border border-forest/20 hover:border-forest px-5 py-2.5">Course details</button>
                    </div>
                  </div>
                </div>

                <div className="edu-card p-6 min-w-0 order-3 lg:order-none lg:col-span-2 lg:col-start-1 lg:row-start-2 self-start">
                  <h3 className="font-display text-[19px] font-semibold text-evergreen flex items-center gap-2"><ListChecks className="w-5 h-5 text-sage" /> Module quizzes</h3>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {course.modules.map((m, i) => (
                      <button key={m.id} onClick={() => onContinue(course.id, m.id)} className="flex items-center gap-3 p-3 rounded-xl border border-brand-900/10 hover:border-sage/50 hover:bg-cream text-left transition">
                        <span className={`w-9 h-9 rounded-full font-display text-[13px] font-semibold flex items-center justify-center shrink-0 ${m.completed ? 'bg-forest text-ivory' : 'bg-brand-100 text-forest'}`}>{m.completed ? <CheckCircle2 className="w-4 h-4" /> : String(i + 1).padStart(2, '0')}</span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[14px] text-charcoal truncate">{cleanText(m.title)}</span>
                          <span className="block text-[12px] text-charcoal/50">{m.quizScore !== undefined ? `Best score ${m.quizScore}%` : 'Not attempted'}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

              <div className="space-y-6 min-w-0 order-2 lg:order-none lg:col-start-3 lg:row-start-1 lg:row-span-2">
                {canStartNext && (
                  <div className="edu-card p-6 border-sage/40 bg-brand-50/60">
                    <h3 className="font-display text-[18px] font-semibold text-evergreen">{courseState === 'passed' ? 'Ready for your next course' : nextPrice ? 'This course is closed' : 'Better luck next time!'}</h3>
                    <p className="mt-1.5 text-sm text-charcoal/70">{courseState === 'passed'
                      ? (nextPrice ? `Well done! Unlock your next course for ₹${nextPrice}.` : 'Well done! Pick your next course - every course is free.')
                      : (nextPrice ? `You used both final attempts without passing, so this course is locked. Pay ₹${nextPrice} to study it again with two fresh attempts.` : 'You used both final attempts without passing. Start again: complete every module once more, then you get two fresh attempts at the final.')}</p>
                    {courseState === 'failed'
                      ? <button onClick={() => onUnlock?.(course.id)} className="btn font-display !rounded-md bg-forest text-ivory hover:bg-sage w-full mt-4 py-3">{nextPrice ? `Unlock again for ₹${nextPrice}` : 'Start the course again'} <ArrowRight className="w-4 h-4" /></button>
                      : <button onClick={onExploreCourses} className="btn font-display !rounded-md bg-forest text-ivory hover:bg-sage w-full mt-4 py-3">Choose a course <ArrowRight className="w-4 h-4" /></button>}
                  </div>
                )}
                <div className="edu-card p-6 text-center">
                  <ProgressRing value={course.progress} size={96} stroke={9} />
                  <p className="mt-3 font-display text-[17px] font-semibold text-evergreen">Course progress</p>
                  <p className="text-sm text-charcoal/60">{done} of {total} modules complete</p>
                </div>

                <div className="edu-card p-6">
                  <h3 className="font-display text-[18px] font-semibold text-evergreen flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-sage" /> Final assessment</h3>
                  {passedFinal ? (
                    <p className="mt-2 text-sm text-charcoal/70">Passed with <strong className="text-forest">{passedFinal.percentage}%</strong>.</p>
                  ) : allPassed ? (
                    <p className="mt-2 text-sm text-charcoal/70">Unlocked! 45 minutes, proctored, pass mark 70%.{lastFinal ? ` Last attempt: ${lastFinal.percentage}%.` : ''}
                      <span className="block mt-1 font-semibold text-evergreen">{attemptsUsed >= 2 ? 'Both attempts used.' : `Attempts left: ${2 - attemptsUsed} of 2`}</span>
                    </p>
                  ) : (
                    <div className="mt-2 text-sm text-charcoal/60 space-y-1">
                      <p className="flex gap-2"><Lock className="w-4 h-4 mt-0.5 shrink-0" />Unlocks when both are done:</p>
                      <p className="pl-6">Module quizzes completed: <strong className="text-evergreen">{done}/{total}</strong></p>
                      {projectReq.required > 0 && <p className="pl-6">Project GitHub repos submitted: <strong className="text-evergreen">{projectReq.submitted}/{projectReq.required}</strong></p>}
                    </div>
                  )}
                  {!passedFinal && allPassed && attemptsUsed < 2 && <button onClick={() => onContinue(course.id, nextModule?.id)} className="btn font-display !rounded-md bg-forest text-ivory hover:bg-sage w-full mt-4 py-3">Go to final assessment</button>}
                </div>

                {history.length > 0 && (
                  <div className="edu-card p-6">
                    <h3 className="font-display text-[18px] font-semibold text-evergreen flex items-center gap-2"><BookOpen className="w-5 h-5 text-sage" /> Earlier courses</h3>
                    <ul className="mt-3 space-y-2.5">
                      {history.slice().reverse().map((h, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <span className="flex-1 min-w-0 truncate text-charcoal">{titleOf(h.courseId)}</span>
                          {h.outcome === 'passed'
                            ? <button onClick={() => onViewCertificate(h.courseId)} className="shrink-0 rounded-full bg-brand-100 text-forest text-[12px] font-semibold px-2.5 py-1 hover:bg-brand-200">Passed · Certificate</button>
                            : <span className="shrink-0 rounded-full bg-rose-50 text-rose-700 text-[12px] font-semibold px-2.5 py-1">{h.outcome === 'failed' ? 'Not passed' : 'Closed'}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="edu-card p-6">
                  <h3 className="font-display text-[18px] font-semibold text-evergreen flex items-center gap-2"><Award className="w-5 h-5 text-sage" /> Certificate</h3>
                  {passedFinal ? (
                    <>
                      <p className="mt-2 text-sm text-charcoal/70">Your certificate shows your final score of {passedFinal.percentage}% and a unique ID.</p>
                      <button onClick={() => onViewCertificate(course.id)} className="btn font-display !rounded-md bg-forest text-ivory hover:bg-sage w-full mt-4 py-3"><Award className="w-4 h-4" /> View &amp; download</button>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-charcoal/60">Available after you score 70% or more in the final assessment.</p>
                  )}
                </div>
              </div>
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Profile details (name, registration number, phone) and password change. */
function ProfileSettings({ studentUser, onSaved }) {
  const [form, setForm] = useState({ name: studentUser.name || '', regNo: studentUser.regNo || '', phone: studentUser.phone || '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [copied, setCopied] = useState(false);
  const changed = form.name.trim() !== (studentUser.name || '') || form.regNo.trim().toUpperCase() !== (studentUser.regNo || '') || form.phone.trim() !== (studentUser.phone || '');

  const save = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      const res = await api.updateProfile({ name: form.name.trim(), regNo: form.regNo.trim().toUpperCase(), phone: form.phone.trim() });
      onSaved?.(res.learner);
      setForm({ name: res.learner.name, regNo: res.learner.regNo, phone: res.learner.phone });
      setMsg({ ok: true, text: res.message });
    } catch (err) {
      setMsg({ ok: false, text: err.status ? err.message : 'Could not reach the server. Please try again.' });
    } finally { setSaving(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwMsg(null);
    if (pw.next.length < 6) return setPwMsg({ ok: false, text: 'The new password must be at least 6 characters.' });
    if (pw.next !== pw.confirm) return setPwMsg({ ok: false, text: 'The new passwords do not match.' });
    setPwBusy(true);
    try {
      const res = await api.changePassword({ currentPassword: pw.current, newPassword: pw.next });
      onSaved?.({ token: res.token });
      setPw({ current: '', next: '', confirm: '' });
      setPwMsg({ ok: true, text: res.message });
    } catch (err) {
      setPwMsg({ ok: false, text: err.status ? err.message : 'Could not reach the server. Please try again.' });
    } finally { setPwBusy(false); }
  };

  const copyId = async () => {
    try { await navigator.clipboard.writeText(studentUser.learnerId || ''); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ }
  };

  const Note = ({ m }) => m && <p className={`text-sm rounded-lg px-3 py-2 ${m.ok ? 'bg-brand-50 text-forest' : 'bg-rose-50 text-rose-700'}`}>{m.text}</p>;
  const field = 'auth-input w-full';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* account card */}
      <div className="edu-card p-6 h-fit">
        <h3 className="font-display text-[18px] font-semibold text-evergreen flex items-center gap-2"><User className="w-5 h-5 text-sage" /> Account</h3>
        <dl className="mt-4 space-y-4 text-[14.5px]">
          <div>
            <dt className="text-[12px] uppercase tracking-[0.14em] text-charcoal/50">Learner ID</dt>
            <dd className="mt-1 flex items-center gap-2 font-mono text-evergreen">{studentUser.learnerId || '-'}
              {studentUser.learnerId && <button type="button" onClick={copyId} className="p-1.5 rounded-md hover:bg-cream text-charcoal/50" aria-label="Copy learner ID">{copied ? <Check className="w-3.5 h-3.5 text-forest" /> : <Copy className="w-3.5 h-3.5" />}</button>}
            </dd>
            <p className="mt-1 text-[12px] text-charcoal/50">Printed on your certificate; it cannot be changed.</p>
          </div>
          <div>
            <dt className="text-[12px] uppercase tracking-[0.14em] text-charcoal/50">Email</dt>
            <dd className="mt-1 flex items-center gap-2 text-evergreen break-all"><Mail className="w-4 h-4 text-sage shrink-0" />{studentUser.email}</dd>
            <p className="mt-1 text-[12px] text-charcoal/50">Your sign-in email cannot be changed.</p>
          </div>
        </dl>
      </div>

      <div className="lg:col-span-2 space-y-6">
        {/* profile details */}
        <form onSubmit={save} className="edu-card p-6 space-y-4">
          <h3 className="font-display text-[18px] font-semibold text-evergreen flex items-center gap-2"><Hash className="w-5 h-5 text-sage" /> Profile details</h3>
          <label className="block">
            <span className="text-[14px] font-semibold text-charcoal">Full name</span>
            <input className={`${field} mt-1.5`} value={form.name} disabled={studentUser.nameLocked} onChange={e => setForm({ ...form, name: e.target.value })} autoComplete="name" />
            <span className="mt-1 block text-[12px] text-charcoal/55">{studentUser.nameLocked ? 'Locked: your name is printed on your certificate.' : 'Exactly as on your government or college photo ID - it is checked before the final exam and printed on your certificate.'}</span>
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-[14px] font-semibold text-charcoal">Registration / ID number</span>
              <input className={`${field} mt-1.5 uppercase tracking-wide`} value={form.regNo} onChange={e => setForm({ ...form, regNo: e.target.value.toUpperCase() })} />
            </label>
            <label className="block">
              <span className="text-[14px] font-semibold text-charcoal">Phone number</span>
              <input className={`${field} mt-1.5`} type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} autoComplete="tel" />
            </label>
          </div>
          <Note m={msg} />
          <button type="submit" disabled={!changed || saving} className="btn font-display !rounded-md bg-forest text-ivory hover:bg-sage px-6 py-3 disabled:opacity-50">{saving ? 'Saving…' : 'Save changes'}</button>
        </form>

        {/* password */}
        <form onSubmit={changePassword} className="edu-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[18px] font-semibold text-evergreen flex items-center gap-2"><KeyRound className="w-5 h-5 text-sage" /> Change password</h3>
            <button type="button" onClick={() => setShowPw(s => !s)} className="inline-flex items-center gap-1.5 text-[13px] text-charcoal/60 hover:text-forest">{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}{showPw ? 'Hide' : 'Show'}</button>
          </div>
          <label className="block">
            <span className="text-[14px] font-semibold text-charcoal">Current password</span>
            <input className={`${field} mt-1.5`} type={showPw ? 'text' : 'password'} value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" required />
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-[14px] font-semibold text-charcoal">New password</span>
              <input className={`${field} mt-1.5`} type={showPw ? 'text' : 'password'} value={pw.next} onChange={e => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" required />
            </label>
            <label className="block">
              <span className="text-[14px] font-semibold text-charcoal">Confirm new password</span>
              <input className={`${field} mt-1.5`} type={showPw ? 'text' : 'password'} value={pw.confirm} onChange={e => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" required />
            </label>
          </div>
          <Note m={pwMsg} />
          <button type="submit" disabled={pwBusy} className="btn font-display !rounded-md bg-forest text-ivory hover:bg-sage px-6 py-3 disabled:opacity-50">{pwBusy ? 'Changing…' : 'Change password'}</button>
        </form>
      </div>
    </div>
  );
}
