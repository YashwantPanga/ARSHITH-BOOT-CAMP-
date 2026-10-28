import React, { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Star } from 'lucide-react';
import CourseCard, { courseArt } from './CourseCard';
import { SafeImg } from './ui';
import { hoursOf } from '../data/meta';
import { cleanText, displayTitle } from '../utils/textUtils';
import { Reveal } from './ui';
import { TrackMark } from './TrackBadge';
import { TRACKS } from '../data/meta';

export default function PopularCourses({ courses, enrolledCourseId, offer, onSelectCourse, onEnrollCourse, onViewAllCourses }) {
  const [track, setTrack] = useState('all');
  const tracks = useMemo(() => [...new Set(courses.map(c => c.iconType).filter(Boolean))], [courses]);
  const list = (track === 'all' ? courses : courses.filter(c => c.iconType === track)).slice(0, 8);

  return (
    <section className="py-12 sm:py-20 bg-ivory">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-sage">Free certificate courses</p>
            <h2 className="edu-title mt-2 text-3xl sm:text-[38px] leading-tight max-w-2xl">Access <b>free certificate courses</b>, built by industry mentors</h2>
          </div>
          <button onClick={onViewAllCourses} className="hidden sm:inline-flex font-display items-center gap-2 h-12 px-6 rounded-md bg-forest text-ivory text-[15px] font-semibold hover:bg-sage transition-colors self-start sm:self-auto group shrink-0">
            View all courses <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </Reveal>

        {/* Track filter – like the partner tabs in the reference */}
        <div className="mt-6 sm:mt-8 flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3 sm:overflow-x-auto no-scrollbar pb-1">
          <button onClick={() => setTrack('all')} className={`font-display shrink-0 h-10 sm:h-[54px] px-4 sm:px-6 rounded-full border text-[14px] sm:text-[15px] font-medium transition ${track === 'all' ? 'bg-forest border-forest text-ivory' : 'bg-white border-brand-900/15 text-charcoal/75 hover:border-sage hover:text-forest'}`}>All Tracks</button>
          {tracks.map(t => (
            <button key={t} onClick={() => setTrack(t)} className={`shrink-0 h-10 sm:h-[54px] pl-1 sm:pl-1.5 pr-3.5 sm:pr-5 rounded-full border flex items-center gap-1.5 sm:gap-2.5 transition ${track === t ? 'bg-forest border-forest text-ivory' : 'bg-white border-brand-900/15 text-charcoal/80 hover:border-sage'}`}>
              <span className="w-8 h-8 sm:w-[42px] sm:h-[42px] rounded-full bg-white ring-2 sm:ring-4 ring-brand-50 flex items-center justify-center"><TrackMark type={t} className="w-5 h-5 sm:w-6 sm:h-6" /></span>
              <span className="font-display text-[14px] sm:text-[15.5px] font-medium">{TRACKS[t]?.label || t}</span>
            </button>
          ))}
        </div>

        {courses.length === 0 ? (
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[0, 1, 2, 3].map(i => <div key={i} className="rounded-2xl h-[26rem] skeleton" />)}
          </div>
        ) : (
          <>
          {/* phones: compact list rows (reference style), then a full-width "show all" button */}
          <div className="mt-5 space-y-3 sm:hidden">
            {list.slice(0, 4).map(c => <CourseRow key={`${track}-${c.id}`} course={c} enrolledCourseId={enrolledCourseId} offer={offer} onSelect={onSelectCourse} />)}
            <button onClick={onViewAllCourses} className="font-display w-full h-12 rounded-md bg-forest text-ivory text-[15px] font-semibold hover:bg-sage transition">Show all courses</button>
          </div>
          <div className="mt-8 hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {list.map((c, i) => (
              <div key={`${track}-${c.id}`} className="h-full animate-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
                <CourseCard course={c} index={i} enrolledCourseId={enrolledCourseId} offer={offer} onSelect={onSelectCourse} onEnroll={onEnrollCourse} />
              </div>
            ))}
          </div>
          </>
        )}
      </div>
    </section>
  );
}

/** One course as a compact row (phones): picture, provider, title, key facts and price. */
export function CourseRow({ course, enrolledCourseId, offer, onSelect }) {
  const isMine = offer?.enrolledIds ? offer.enrolledIds.includes(course.id) : enrolledCourseId === course.id;
  const tag = isMine ? 'Enrolled' : offer?.price > 0 ? `₹${offer.price}` : 'Free';
  return (
    <button onClick={() => onSelect(course.id)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-brand-900/15 text-left active:scale-[.99] transition">
      {/* the course art is 16:10 - show all of it so the course name on the picture is never cut off */}
      <span className="relative shrink-0 w-[124px] aspect-[16/10] rounded-lg overflow-hidden bg-forest shadow-[0_6px_14px_-8px_rgba(1,58,43,.6)]">
        <SafeImg src={courseArt(course)} alt="" className="w-full h-full object-cover" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <img src="/arshith-bootcamp-icon.png" alt="" className="w-5 h-5 rounded border border-brand-900/10 bg-white object-contain p-0.5" />
          <span className="text-[12px] text-charcoal/60 truncate">Arshith Bootcamp</span>
        </span>
        <span className="mt-1 block text-[15px] font-bold leading-snug text-charcoal line-clamp-2">{displayTitle(course.title)}</span>
        <span className="mt-1 flex items-center gap-1 text-[12px] text-charcoal/60 min-w-0">
          <Star className="w-3.5 h-3.5 shrink-0 fill-amber-400 text-amber-400" />
          <span className="truncate">{course.rating} · {hoursOf(course)} · Certificate</span>
        </span>
        <span className={`mt-1.5 inline-flex rounded-full border px-2.5 py-0.5 text-[12px] font-medium ${isMine ? 'border-forest/30 bg-brand-50 text-forest' : 'border-brand-900/20 text-charcoal/80'}`}>{tag}</span>
      </span>
    </button>
  );
}
