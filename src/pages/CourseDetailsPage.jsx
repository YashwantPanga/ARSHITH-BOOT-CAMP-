import React, { useState, useMemo } from 'react';
import { ArrowLeft, Star, Clock, Users, Award, CheckCircle2, ChevronDown, BookOpen, ShieldCheck, Lock, PlayCircle, ListChecks, FileText, BarChart3, Layers, Languages } from 'lucide-react';
import { ProgressBar } from '../components/ui';
import CourseSlideshow from '../components/CourseSlideshow';
import { slidesForCourse } from '../data/courseGallery';
import { cleanText, displayTitle } from '../utils/textUtils';

export default function CourseDetailsPage({ course, enrolledCourseId, offer, isLoggedIn, onBack, onEnroll, onContinue, onHome }) {
  const [open, setOpen] = useState(() => new Set([course.modules?.[0]?.id]));
  const isMine = offer?.enrolledIds ? offer.enrolledIds.includes(course.id) : enrolledCourseId === course.id;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const slides = useMemo(() => slidesForCourse(course), [course.id, course.thumbnail]);
  const isLocked = false;
  const price = offer?.price > 0 ? offer.price : 0;
  const done = course.modules?.filter(m => m.completed).length || 0;
  const total = course.modules?.length || 0;
  const nextModule = course.modules?.find(m => !m.completed) || course.modules?.[0];

  const toggle = (id) => setOpen(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const cta = isMine ? (
    <button onClick={() => onContinue(nextModule?.id)} className="btn font-display !rounded-md w-full py-3.5 text-[15.5px] bg-forest text-ivory hover:bg-sage"><PlayCircle className="w-5 h-5" />{done ? 'Continue learning' : 'Start learning'}</button>
  ) : isLocked ? (
    <div className="space-y-2">
      <button disabled className="btn font-display !rounded-md w-full py-3.5 bg-cream text-charcoal/50 border border-brand-900/10"><Lock className="w-4 h-4" /> Locked for your account</button>
      <p className="text-xs text-charcoal/55 text-center">Finish your current course first (pass its final or use both attempts).</p>
    </div>
  ) : (
    <button onClick={onEnroll} className="btn font-display !rounded-md w-full py-3.5 text-[15.5px] bg-forest text-ivory hover:bg-sage shadow-[0_14px_28px_-16px_rgba(1,58,43,.8)]">{!isLoggedIn ? 'Sign in to enroll' : price ? `Unlock for ₹${price}` : 'Enroll in this course'}</button>
  );

  // eduleb "course details" side list
  const facts = [
    { icon: Layers, label: 'Category', value: course.category },
    { icon: BarChart3, label: 'Level', value: course.level || 'All levels' },
    { icon: Clock, label: 'Duration', value: course.duration },
    { icon: BookOpen, label: 'Modules', value: total },
    { icon: ListChecks, label: 'Quizzes', value: total },
    { icon: Users, label: 'Learners', value: course.studentsCount },
    { icon: Languages, label: 'Language', value: 'English' }
  ];

  return (
    <div className="bg-ivory pb-20">
      {/* banner */}
      <section className="relative overflow-hidden bg-cream border-b border-brand-900/10">
        <div className="absolute inset-0 edu-shape pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-14">
          <nav aria-label="Breadcrumb" className="font-display text-[15px] text-evergreen flex flex-wrap items-center gap-x-2">
            {onHome ? <button onClick={onHome} className="font-semibold text-sage hover:underline">Home</button> : <span className="font-semibold text-sage">Home</span>}
            <span className="text-charcoal/40">/</span>
            <button onClick={onBack} className="font-semibold text-sage hover:underline inline-flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5 sm:hidden" />Courses</button>
            <span className="text-charcoal/40">/</span>
            <span className="truncate max-w-[60vw]">{displayTitle(course.title)}</span>
          </nav>
          <div className="grid lg:grid-cols-12 gap-10 mt-8 items-center">
            <div className="lg:col-span-7">
              <span className="font-display inline-flex rounded-md bg-forest text-ivory text-[13px] font-medium px-3 py-1">{course.category}</span>
              <h1 className="mt-4 text-[36px] sm:text-[46px] lg:text-[54px] font-bold leading-[1.08] text-evergreen">{displayTitle(course.title)}</h1>
              <p className="mt-4 text-[16px] sm:text-[17px] text-charcoal/70 leading-relaxed max-w-2xl">{cleanText(course.description)}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                {[
                  { icon: Star, text: `${course.rating} rating`, star: true },
                  { icon: Users, text: `${course.studentsCount} learners` },
                  { icon: Clock, text: course.duration },
                  { icon: BookOpen, text: `${total} modules` }
                ].map(({ icon: Icon, text, star }) => (
                  <span key={text} className="inline-flex items-center gap-2 rounded-full bg-white border border-brand-900/10 px-4 py-2 text-[14px] font-medium text-charcoal/80 shadow-[0_6px_14px_-10px_rgba(12,45,38,.3)]">
                    <Icon className={`w-4 h-4 ${star ? 'fill-[#E0B54A] text-[#E0B54A]' : 'text-sage'}`} />{text}
                  </span>
                ))}
              </div>
            </div>
            <div className="lg:col-span-5">
              <CourseSlideshow slides={slides} courseTitle={displayTitle(course.title)} iconType={course.iconType} />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-8 pt-12">
        <div className="lg:col-span-8 space-y-8 order-2 lg:order-1">
          {course.whatYouWillLearn?.length > 0 && (
            <section className="edu-card p-6 sm:p-9">
              <p className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-sage">Outcomes</p>
              <h2 className="edu-title mt-1 text-[28px]">What you'll <b>learn</b></h2>
              <ul className="mt-6 grid sm:grid-cols-2 gap-x-6 gap-y-3.5">
                {course.whatYouWillLearn.map((w, i) => (
                  <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-charcoal/75">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-forest text-ivory flex items-center justify-center shrink-0"><CheckCircle2 className="w-3.5 h-3.5" /></span>{cleanText(w)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="edu-card p-6 sm:p-9">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-sage">Curriculum</p>
                <h2 className="edu-title mt-1 text-[28px]">{total} modules · <b>quiz after each</b></h2>
              </div>
              {isMine && <span className="rounded-full bg-brand-50 px-3 py-1 text-[13px] font-semibold text-forest">{done}/{total} quizzes completed</span>}
            </div>
            <div className="mt-7 space-y-3">
              {course.modules?.map((m, i) => {
                const isOpen = open.has(m.id);
                return (
                  <div key={m.id} className={`rounded-2xl border transition-colors ${isOpen ? 'border-sage/40 bg-cream' : 'border-brand-900/10 bg-white hover:border-sage/40'}`}>
                    <button onClick={() => toggle(m.id)} className="w-full flex items-center gap-4 px-4 sm:px-5 py-4 text-left" aria-expanded={isOpen}>
                      <span className={`w-11 h-11 rounded-full font-display text-[15px] font-semibold flex items-center justify-center shrink-0 ${m.completed ? 'bg-forest text-ivory' : 'bg-brand-100 text-forest'}`}>
                        {m.completed ? <CheckCircle2 className="w-5 h-5" /> : String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="flex-1 font-display text-[16.5px] font-medium text-evergreen leading-snug">{cleanText(m.title)}</span>
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition ${isOpen ? 'bg-forest text-ivory rotate-180' : 'bg-cream text-charcoal/60'}`}><ChevronDown className="w-4 h-4" /></span>
                    </button>
                    <div className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <div className="overflow-hidden">
                        <div className="px-4 sm:px-5 pb-5 sm:pl-[5rem] text-[14.5px] text-charcoal/70 leading-relaxed space-y-3">
                          <p>{cleanText(m.description)}</p>
                          {m.readingMaterial?.objectives?.length > 0 && (
                            <ul className="space-y-1.5">
                              {m.readingMaterial.objectives.slice(0, 4).map((o, k) => <li key={k} className="flex gap-2"><span className="text-sage font-bold">•</span>{cleanText(o)}</li>)}
                            </ul>
                          )}
                          {isMine && (
                            <button onClick={() => onContinue(m.id)} className="font-display font-semibold text-forest hover:text-sage">Open module →</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="lg:col-span-4 order-1 lg:order-2">
          <div className="edu-card overflow-hidden lg:sticky lg:top-28">
            <div className="bg-forest px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-[12px] uppercase tracking-[0.2em] text-[#BCD1C6]">Course fee</p>
                <p className="font-display text-[34px] font-bold leading-none text-ivory mt-1">{isMine ? 'Unlocked' : price ? `₹${price}` : 'Free'}</p>
              </div>
              <span className="rounded-full bg-ivory/15 text-ivory text-[12.5px] font-semibold px-3 py-1.5 inline-flex items-center gap-1.5"><Award className="w-3.5 h-3.5" /> Certificate included</span>
            </div>
            <div className="p-6 space-y-5">
              {isMine && (
                <div>
                  <div className="flex justify-between text-xs mb-1.5"><span className="text-charcoal/60">Your progress</span><span className="font-semibold text-forest">{course.progress}%</span></div>
                  <ProgressBar value={course.progress} />
                </div>
              )}
              {cta}
              <ul className="divide-y divide-brand-900/10 text-[14.5px]">
                {facts.map(({ icon: Icon, label, value }) => (
                  <li key={label} className="flex items-center gap-3 py-3">
                    <Icon className="w-4 h-4 text-sage shrink-0" />
                    <span className="text-charcoal/65">{label}</span>
                    <span className="ml-auto font-display font-medium text-evergreen text-right">{value}</span>
                  </li>
                ))}
              </ul>
              <div className="rounded-xl bg-cream border border-brand-900/10 p-4">
                <p className="font-display text-[15px] font-semibold text-evergreen">This course includes</p>
                <ul className="mt-3 space-y-2.5 text-[14px] text-charcoal/75">
                  <li className="flex gap-3"><FileText className="w-4 h-4 text-sage mt-0.5 shrink-0" />{total} reading modules with code</li>
                  <li className="flex gap-3"><ListChecks className="w-4 h-4 text-sage mt-0.5 shrink-0" />{total} module quizzes</li>
                  <li className="flex gap-3"><ShieldCheck className="w-4 h-4 text-sage mt-0.5 shrink-0" />45-min proctored final ({course.finalTest?.totalQuestions || 25} questions)</li>
                  <li className="flex gap-3"><Award className="w-4 h-4 text-sage mt-0.5 shrink-0" />Certificate with your score &amp; unique ID</li>
                </ul>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
