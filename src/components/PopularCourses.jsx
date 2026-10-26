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
        <div className="mt-8 flex gap-3 overflow-x-auto no-scrollbar pb-1">
          <button onClick={() => setTrack('all')} className={`font-display shrink-0 h-[54px] px-6 rounded-full border text-[15px] font-medium transition ${track === 'all' ? 'bg-forest border-forest text-ivory' : 'bg-white border-brand-900/15 text-charcoal/75 hover:border-sage hover:text-forest'}`}>All Tracks</button>
          {tracks.map(t => (
            <button key={t} onClick={() => setTrack(t)} className={`shrink-0 h-[54px] pl-1.5 pr-5 rounded-full border flex items-center gap-2.5 transition ${track === t ? 'bg-forest border-forest text-ivory' : 'bg-white border-brand-900/15 text-charcoal/80 hover:border-sage'}`}>
              <span className="w-[42px] h-[42px] rounded-full bg-white ring-4 ring-brand-50 flex items-center justify-center"><TrackMark type={t} className="w-6 h-6" /></span>
              <span className="font-display text-[15.5px] font-medium">{TRACKS[t]?.label || t}</span>
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

/** One course as a compact row: image on the left, title and key facts on the right. */
function CourseRow({ course, enrolledCourseId, offer, onSelect }) {
  const isMine = offer?.enrolledIds ? offer.enrolledIds.includes(course.id) : enrolledCourseId === course.id;
  const isLocked = false;
  return (
    <button onClick={() => onSelect(course.id)} className={`edu-card w-full flex gap-3 p-2.5 !rounded-2xl text-left active:scale-[.99] transition ${isLocked ? 'opacity-80' : ''}`}>
      <span className="relative shrink-0 w-[112px] aspect-[16/10] rounded-lg overflow-hidden bg-forest">
        <SafeImg src={courseArt(course)} alt="" className="w-full h-full object-cover" />
      </span>
      <span className="min-w-0 flex-1 py-0.5">
        <span className="font-display text-[15.5px] font-semibold leading-snug text-evergreen line-clamp-2">{displayTitle(course.title)}</span>
        <span className="mt-0.5 text-[12.5px] text-charcoal/55 line-clamp-1">{cleanText(course.shortDescription || course.description)}</span>
        <span className="mt-1.5 flex items-center gap-2 text-[12px] text-charcoal/65">
          <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-[#E0B54A] text-[#E0B54A]" />{course.rating}</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{hoursOf(course)}</span>
          {isMine && <span className="ml-auto px-2 py-0.5 rounded-full bg-brand-50 text-brand-900 text-[11px] font-semibold">Enrolled</span>}
          {!isMine && offer?.price > 0 && <span className="ml-auto px-2 py-0.5 rounded-full bg-cream text-forest text-[11px] font-semibold">₹{offer.price}</span>}
        </span>
      </span>
    </button>
  );
}
