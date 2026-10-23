import React, { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Star, Clock, Lock } from 'lucide-react';
import CourseCard, { courseArt } from './CourseCard';
import { SafeImg } from './ui';
import { hoursOf } from '../data/meta';
import { cleanText, displayTitle } from '../utils/textUtils';
import { Reveal } from './ui';
import { TrackMark } from './TrackBadge';
import { TRACKS } from '../data/meta';

export default function PopularCourses({ courses, enrolledCourseId, onSelectCourse, onEnrollCourse, onViewAllCourses }) {
  const [track, setTrack] = useState('all');
  const tracks = useMemo(() => [...new Set(courses.map(c => c.iconType).filter(Boolean))], [courses]);
  const list = (track === 'all' ? courses : courses.filter(c => c.iconType === track)).slice(0, 8);

  return (
    <section className="py-12 sm:py-20 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Free certificate courses</p>
            <h2 className="mt-2 text-3xl sm:text-[2.6rem] leading-tight font-medium text-charcoal">Access free certificate courses, built by industry mentors</h2>
          </div>
          <button onClick={onViewAllCourses} className="hidden sm:inline-flex btn-ghost self-start sm:self-auto group shrink-0">
            View all courses <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </Reveal>

        {/* Track filter – like the partner tabs in the reference */}
        <div className="mt-8 flex gap-3 overflow-x-auto no-scrollbar pb-1">
          <button onClick={() => setTrack('all')} className={`shrink-0 h-12 px-5 rounded-xl border text-[15px] font-medium transition ${track === 'all' ? 'bg-white border-brand-900 text-brand-900 shadow-soft' : 'bg-white/60 border-brand-900/10 text-charcoal/70 hover:border-brand-300'}`}>All Tracks</button>
          {tracks.map(t => (
            <button key={t} onClick={() => setTrack(t)} className={`shrink-0 h-12 px-4 rounded-xl border flex items-center gap-2 transition ${track === t ? 'bg-white border-brand-900 shadow-soft' : 'bg-white/60 border-brand-900/10 hover:border-brand-300'}`}>
              <TrackMark type={t} className="w-6 h-6" />
              <span className="font-display text-[17px] font-semibold text-brand-900">{TRACKS[t]?.label || t}</span>
            </button>
          ))}
        </div>

        {courses.length === 0 ? (
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[0, 1, 2, 3].map(i => <div key={i} className="rounded-2xl h-[26rem] skeleton" />)}
          </div>
        ) : (
          <>
          {/* phones: compact list rows (Coursera-style), then a full-width "show all" button */}
          <div className="mt-6 space-y-3 sm:hidden">
            {list.slice(0, 4).map(c => <CourseRow key={`${track}-${c.id}`} course={c} enrolledCourseId={enrolledCourseId} onSelect={onSelectCourse} />)}
            <button onClick={onViewAllCourses} className="w-full h-12 rounded-lg border border-brand-900/70 text-brand-900 text-[15px] font-semibold hover:bg-white transition">Show all courses</button>
          </div>
          <div className="mt-8 hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {list.map((c, i) => (
              <div key={`${track}-${c.id}`} className="h-full animate-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
                <CourseCard course={c} index={i} enrolledCourseId={enrolledCourseId} onSelect={onSelectCourse} onEnroll={onEnrollCourse} />
              </div>
            ))}
          </div>
          </>
        )}
      </div>
    </section>
  );
}

/** One course as a compact row: image on the left, title and key facts on the right. */
function CourseRow({ course, enrolledCourseId, onSelect }) {
  const isMine = enrolledCourseId === course.id;
  const isLocked = !!enrolledCourseId && !isMine;
  return (
    <button onClick={() => onSelect(course.id)} className={`w-full flex gap-3 p-2.5 rounded-xl bg-white border border-brand-900/10 text-left shadow-[0_1px_2px_rgba(12,45,38,.05)] active:scale-[.99] transition ${isLocked ? 'opacity-80' : ''}`}>
      <span className="relative shrink-0 w-[112px] aspect-[16/10] rounded-lg overflow-hidden bg-forest">
        <SafeImg src={courseArt(course)} alt="" className="w-full h-full object-cover" />
      </span>
      <span className="min-w-0 flex-1 py-0.5">
        <span className="text-[15px] font-semibold leading-snug text-charcoal line-clamp-2">{displayTitle(course.title)}</span>
        <span className="mt-0.5 text-[12.5px] text-charcoal/55 line-clamp-1">{cleanText(course.shortDescription || course.description)}</span>
        <span className="mt-1.5 flex items-center gap-2 text-[12px] text-charcoal/65">
          <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-[#E0B54A] text-[#E0B54A]" />{course.rating}</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{hoursOf(course)}</span>
          {isMine && <span className="ml-auto px-2 py-0.5 rounded-full bg-brand-50 text-brand-900 text-[11px] font-semibold">Enrolled</span>}
          {isLocked && <span className="ml-auto flex items-center gap-1 text-[11px]"><Lock className="w-3 h-3" />Locked</span>}
        </span>
      </span>
    </button>
  );
}
