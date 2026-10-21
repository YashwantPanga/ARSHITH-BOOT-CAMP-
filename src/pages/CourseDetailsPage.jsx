import React, { useState } from 'react';
import { ArrowLeft, Star, Clock, Users, Award, CheckCircle2, ChevronDown, BookOpen, ShieldCheck, Lock, PlayCircle, ListChecks, FileText } from 'lucide-react';
import { SafeImg, ProgressBar, Triangles } from '../components/ui';
import { cleanText } from '../utils/textUtils';

export default function CourseDetailsPage({ course, enrolledCourseId, isLoggedIn, onBack, onEnroll, onContinue }) {
  const [open, setOpen] = useState(() => new Set([course.modules?.[0]?.id]));
  const isMine = enrolledCourseId === course.id;
  const isLocked = !!enrolledCourseId && !isMine;
  const done = course.modules?.filter(m => m.completed).length || 0;
  const total = course.modules?.length || 0;
  const nextModule = course.modules?.find(m => !m.completed) || course.modules?.[0];

  const toggle = (id) => setOpen(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const cta = isMine ? (
    <button onClick={() => onContinue(nextModule?.id)} className="btn-plum w-full py-3.5"><PlayCircle className="w-5 h-5" />{done ? 'Continue learning' : 'Start learning'}</button>
  ) : isLocked ? (
    <div className="space-y-2">
      <button disabled className="btn w-full py-3.5 bg-slate-100 text-slate-500"><Lock className="w-4 h-4" /> Locked for your account</button>
      <p className="text-xs text-slate-500 text-center">Only one course is allowed per login.</p>
    </div>
  ) : (
    <button onClick={onEnroll} className="btn-primary w-full py-3.5">{isLoggedIn ? 'Enroll in this course' : 'Sign in to enroll'}</button>
  );

  return (
    <div className="pb-16">
      <section className="relative overflow-hidden bg-brand-900 text-white">
        <Triangles />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-14">
          <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-brand-200 hover:text-white transition"><ArrowLeft className="w-4 h-4" /> All courses</button>
          <div className="grid lg:grid-cols-12 gap-10 mt-6 items-center">
            <div className="lg:col-span-7">
              <span className="chip bg-peach-500 text-white">{course.category}</span>
              <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">{cleanText(course.title)}</h1>
              <p className="mt-4 text-brand-100 text-base sm:text-lg leading-relaxed max-w-2xl">{cleanText(course.description)}</p>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-brand-100">
                <span className="flex items-center gap-1.5"><Star className="w-4 h-4 fill-amber-400 text-amber-400" />{course.rating} rating</span>
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{course.studentsCount} learners</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{course.duration}</span>
                <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" />{total} modules</span>
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="rounded-[2rem] overflow-hidden ring-8 ring-white/10 shadow-2xl aspect-[16/10]">
                <SafeImg src={course.thumbnail} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-8 -mt-6 relative">
        <div className="lg:col-span-8 space-y-8 order-2 lg:order-1 pt-6 lg:pt-14">
          {course.whatYouWillLearn?.length > 0 && (
            <section className="card p-6 sm:p-8">
              <p className="eyebrow">Outcomes</p>
              <h2 className="text-2xl font-bold text-brand-900 mt-1">What you'll learn</h2>
              <ul className="mt-5 grid sm:grid-cols-2 gap-3">
                {course.whatYouWillLearn.map((w, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-600"><CheckCircle2 className="w-5 h-5 text-mint-400 shrink-0" />{cleanText(w)}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="card p-6 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Curriculum</p>
                <h2 className="text-2xl font-bold text-brand-900 mt-1">{total} modules · quiz after each</h2>
              </div>
              {isMine && <span className="text-sm text-slate-500">{done}/{total} quizzes passed</span>}
            </div>
            <div className="mt-6 divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
              {course.modules?.map((m, i) => {
                const isOpen = open.has(m.id);
                return (
                  <div key={m.id}>
                    <button onClick={() => toggle(m.id)} className="w-full flex items-center gap-4 px-4 sm:px-5 py-4 text-left hover:bg-slate-50 transition" aria-expanded={isOpen}>
                      <span className={`w-9 h-9 rounded-xl text-xs font-bold flex items-center justify-center shrink-0 ${m.completed ? 'bg-mint-400 text-white' : 'bg-brand-50 text-brand-700'}`}>
                        {m.completed ? <CheckCircle2 className="w-4 h-4" /> : String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="flex-1 font-semibold text-sm text-brand-900">{cleanText(m.title)}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <div className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <div className="overflow-hidden">
                        <div className="px-4 sm:px-5 pb-5 pl-[4.25rem] text-sm text-slate-500 space-y-3">
                          <p>{cleanText(m.description)}</p>
                          {m.readingMaterial?.objectives?.length > 0 && (
                            <ul className="space-y-1.5">
                              {m.readingMaterial.objectives.slice(0, 4).map((o, k) => <li key={k} className="flex gap-2"><span className="text-peach-500">•</span>{cleanText(o)}</li>)}
                            </ul>
                          )}
                          {isMine && (
                            <button onClick={() => onContinue(m.id)} className="text-peach-500 font-semibold hover:text-peach-600">Open module →</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {course.instructor && (
            <section className="card p-6 sm:p-8 flex flex-col sm:flex-row gap-5 items-start">
              <SafeImg src={course.instructor.avatar} alt="" className="w-20 h-20 rounded-full object-cover ring-4 ring-peach-100" />
              <div>
                <p className="eyebrow">Our team</p>
                <h3 className="text-lg font-bold text-brand-900 mt-1">{course.instructor.name}</h3>
                <p className="text-sm text-slate-500">{course.instructor.role}</p>
              </div>
            </section>
          )}
        </div>

        <aside className="lg:col-span-4 order-1 lg:order-2">
          <div className="card p-6 lg:sticky lg:top-24 space-y-5 shadow-card-hover">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-brand-900">Free</span>
              <span className="chip bg-mint-50 text-mint-500">Certificate included</span>
            </div>
            {isMine && (
              <div>
                <div className="flex justify-between text-xs mb-1.5"><span className="text-slate-500">Your progress</span><span className="font-semibold">{course.progress}%</span></div>
                <ProgressBar value={course.progress} />
              </div>
            )}
            {cta}
            <ul className="space-y-3 text-sm text-slate-600 pt-2">
              <li className="flex gap-3"><FileText className="w-4 h-4 text-brand-400 mt-0.5" />{total} reading modules with code</li>
              <li className="flex gap-3"><ListChecks className="w-4 h-4 text-brand-400 mt-0.5" />{total} module quizzes · pass mark 70%</li>
              <li className="flex gap-3"><ShieldCheck className="w-4 h-4 text-brand-400 mt-0.5" />45-min proctored final ({course.finalTest?.totalQuestions || 25} questions)</li>
              <li className="flex gap-3"><Award className="w-4 h-4 text-brand-400 mt-0.5" />Certificate with your score &amp; unique ID</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
