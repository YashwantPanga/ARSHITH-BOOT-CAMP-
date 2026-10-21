import React, { useEffect } from 'react';
import { PlayCircle, Award, Lock, ListChecks, ShieldCheck, BookOpen, Mail, Hash, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ProgressRing, ProgressBar, SafeImg, BrandLoader, Triangles } from '../components/ui';
import { cleanText } from '../utils/textUtils';

export default function StudentDashboard({ studentUser, courses, coursesLoaded, enrolledCourseId, onOpenCourse, onContinue, onViewCertificate, onExploreCourses, onRefresh }) {
  useEffect(() => { onRefresh?.(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const course = courses.find(c => c.id === enrolledCourseId);
  const firstName = (studentUser.name || studentUser.email).split(' ')[0];
  const lp = course?.learnerProgress;
  const done = course?.modules?.filter(m => m.completed).length || 0;
  const total = course?.modules?.length || 0;
  const allPassed = total > 0 && done === total;
  const passedFinal = lp?.passedFinal;
  const lastFinal = lp?.finalAttempts?.[0];
  const nextModule = course?.modules?.find(m => !m.completed) || course?.modules?.[0];

  return (
    <div className="bg-cream min-h-[70vh]">
      <section className="relative overflow-hidden bg-brand-900 text-white">
        <Triangles />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-wrap items-center gap-6 justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-peach-400">My dashboard</p>
            <h1 className="mt-1 text-3xl font-bold">Welcome back, {firstName}!</h1>
            <p className="text-brand-100 mt-1">{course ? 'Pick up where you left off.' : 'Choose your course to get started.'}</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-brand-100">
            <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-peach-400" />{studentUser.email}</span>
            {studentUser.regNo && <span className="flex items-center gap-2"><Hash className="w-4 h-4 text-peach-400" />{studentUser.regNo}</span>}
            {studentUser.learnerId && <span className="flex items-center gap-2 font-mono"><ShieldCheck className="w-4 h-4 text-peach-400" />{studentUser.learnerId}</span>}
            {studentUser.phone && <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-peach-400" />{studentUser.phone}</span>}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!coursesLoaded ? (
          <div className="py-20 flex justify-center"><BrandLoader label="Loading" /></div>
        ) : !course ? (
          <div className="card p-8 sm:p-12 text-center max-w-2xl mx-auto">
            <BookOpen className="w-12 h-12 text-peach-500 mx-auto" />
            <h2 className="mt-4 text-2xl font-bold text-brand-900">You haven't enrolled in a course yet</h2>
            <p className="mt-2 text-slate-500">Each account can enroll in <strong>one</strong> course. Choose carefully — it stays with this login through to your certificate.</p>
            <button onClick={onExploreCourses} className="btn-primary mt-6">Browse courses <ArrowRight className="w-4 h-4" /></button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="card overflow-hidden grid sm:grid-cols-5">
                <SafeImg src={course.thumbnail} alt="" className="sm:col-span-2 h-48 sm:h-full w-full object-cover" />
                <div className="sm:col-span-3 p-6 flex flex-col">
                  <span className="chip bg-peach-50 text-peach-600 self-start">{course.category}</span>
                  <h2 className="mt-3 text-xl font-bold text-brand-900">{cleanText(course.title)}</h2>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{cleanText(course.shortDescription)}</p>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1.5"><span className="text-slate-500">{done}/{total} module quizzes passed</span><span className="font-semibold text-brand-900">{course.progress}%</span></div>
                    <ProgressBar value={course.progress} />
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button onClick={() => onContinue(course.id, nextModule?.id)} className="btn-plum"><PlayCircle className="w-4 h-4" />{done ? 'Continue learning' : 'Start learning'}</button>
                    <button onClick={() => onOpenCourse(course.id)} className="btn-outline">Course details</button>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="font-bold text-brand-900 flex items-center gap-2"><ListChecks className="w-5 h-5 text-peach-500" /> Module quizzes</h3>
                <div className="mt-4 grid sm:grid-cols-2 gap-2">
                  {course.modules.map((m, i) => (
                    <button key={m.id} onClick={() => onContinue(course.id, m.id)} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/40 text-left transition">
                      <span className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${m.completed ? 'bg-mint-400 text-white' : 'bg-slate-100 text-slate-500'}`}>{m.completed ? <CheckCircle2 className="w-4 h-4" /> : i + 1}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm text-slate-700 truncate">{cleanText(m.title)}</span>
                        <span className="block text-[11px] text-slate-400">{m.quizScore !== undefined ? `Best score ${m.quizScore}%` : 'Not attempted'}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card p-6 text-center">
                <ProgressRing value={course.progress} size={96} stroke={9} />
                <p className="mt-3 font-semibold text-brand-900">Course progress</p>
                <p className="text-sm text-slate-500">{done} of {total} modules complete</p>
              </div>

              <div className={`card p-6 ${passedFinal ? 'border-mint-200' : ''}`}>
                <h3 className="font-bold text-brand-900 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-peach-500" /> Final assessment</h3>
                {passedFinal ? (
                  <p className="mt-2 text-sm text-slate-600">Passed with <strong className="text-mint-500">{passedFinal.percentage}%</strong>.</p>
                ) : allPassed ? (
                  <p className="mt-2 text-sm text-slate-600">Unlocked! 45 minutes, proctored, pass mark 70%.{lastFinal ? ` Last attempt: ${lastFinal.percentage}%.` : ''}</p>
                ) : (
                  <p className="mt-2 text-sm text-slate-500 flex gap-2"><Lock className="w-4 h-4 mt-0.5 shrink-0" />Locked until all {total} module quizzes are passed ({done}/{total}).</p>
                )}
                {!passedFinal && allPassed && <button onClick={() => onContinue(course.id, nextModule?.id)} className="btn-primary w-full mt-4">Go to final assessment</button>}
              </div>

              <div className="card p-6">
                <h3 className="font-bold text-brand-900 flex items-center gap-2"><Award className="w-5 h-5 text-peach-500" /> Certificate</h3>
                {passedFinal ? (
                  <>
                    <p className="mt-2 text-sm text-slate-600">Your certificate shows your final score of {passedFinal.percentage}% and a unique ID.</p>
                    <button onClick={() => onViewCertificate(course.id)} className="btn-plum w-full mt-4"><Award className="w-4 h-4" /> View &amp; download</button>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">Available after you score 70% or more in the final assessment.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
