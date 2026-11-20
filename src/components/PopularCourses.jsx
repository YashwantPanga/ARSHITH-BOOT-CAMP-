import React, { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Clock } from 'lucide-react';
import CourseCard, { courseArt, priceLabel, BestSellerBadge } from './CourseCard';
import { SafeImg } from './ui';
import { hoursOf } from '../data/meta';
import { cleanText, displayTitle } from '../utils/textUtils';
import { Reveal, RevealText } from './ui';
import { TrackMark } from './TrackBadge';
import { TRACKS } from '../data/meta';
import CourseCarousel from './CourseCarousel';

export default function PopularCourses({ courses, enrolledCourseId, offer, onSelectCourse, onEnrollCourse, onViewAllCourses }) {
  const [track, setTrack] = useState('all');
  const tracks = useMemo(() => [...new Set(courses.map(c => c.iconType).filter(Boolean))], [courses]);
  const list = (track === 'all' ? courses : courses.filter(c => c.iconType === track)).slice(0, 8);

  return (
    <section className="py-12 sm:py-20 bg-ivory">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-sage">Certificate courses</p>
            <RevealText as="h2" className="edu-title mt-2 text-3xl sm:text-[38px] leading-tight max-w-2xl">Job-ready <b>certificate courses</b>, built by industry mentors</RevealText>
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
          {/* phones: a swipe carousel - the centre card full size, the ones beside it smaller - then "show all" */}
          <div className="mt-5 sm:hidden">
            <CourseCarousel key={track} items={list} getKey={c => c.id} label="Certificate courses"
              renderItem={(c, extra) => <CourseRow course={c} enrolledCourseId={enrolledCourseId} offer={offer} onSelect={onSelectCourse} large {...extra} />} />
            <button onClick={onViewAllCourses} className="btn-3d font-display mt-5 w-full h-12 rounded-xl text-[15px] font-semibold">Show all courses</button>
          </div>
          <div className="mt-8 hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-5">
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

/** One course as a medium card (phones, two per row): picture, provider, title, key facts and price. */
export function CourseRow({ course, enrolledCourseId, offer, onSelect, large = false, tabIndex }) {
  const isMine = offer?.enrolledIds ? offer.enrolledIds.includes(course.id) : enrolledCourseId === course.id;
  const tag = isMine ? (offer?.admin ? 'Full access' : 'Enrolled') : priceLabel(course);
  return (
    <button onClick={() => onSelect(course.id)} tabIndex={tabIndex} className="group w-full h-full flex flex-col rounded-2xl bg-white border border-brand-900/10 overflow-hidden text-left shadow-[0_10px_24px_-18px_rgba(1,58,43,.55)] active:scale-[.98] transition">
      {/* the course art is 16:10 - show all of it so the course name on the picture is never cut off */}
      <span className="relative block w-full aspect-[16/10] bg-forest overflow-hidden">
        <SafeImg src={courseArt(course)} alt="" className="w-full h-full object-cover" />
        <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10.5px] font-bold shadow-sm ${isMine ? 'bg-forest text-ivory' : 'bg-white/95 text-forest'}`}>{tag}</span>
        {course.bestSeller && !isMine && <BestSellerBadge className="absolute right-1.5 top-1.5 !px-1.5 !py-0.5 !text-[9px]" />}
      </span>
      <span className={`flex-1 flex flex-col ${large ? 'p-3.5' : 'p-2.5'}`}>
        <span className="flex items-center gap-1 min-w-0">
          <img src="/codelekho-icon.png" alt="" className="w-4 h-4 rounded border border-brand-900/10 bg-white object-contain p-[1px] shrink-0" />
          <span className="text-[10.5px] text-charcoal/55 truncate">CodeLekho</span>
        </span>
        <span className={`mt-1 block font-bold leading-snug text-charcoal line-clamp-2 ${large ? 'text-[16px] min-h-[42px]' : 'text-[13.5px] min-h-[36px]'}`}>{displayTitle(course.title)}</span>
        <span className={`mt-auto pt-1.5 flex items-center gap-1 text-charcoal/60 min-w-0 ${large ? 'text-[12.5px]' : 'text-[11px]'}`}>
          <Clock className="w-3 h-3 shrink-0 text-sage" />
          <span className="truncate">{hoursOf(course)}</span>
          {large && <span className="ml-auto shrink-0 font-display text-[13px] font-bold text-forest">{tag}</span>}
        </span>
      </span>
    </button>
  );
}
