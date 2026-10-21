import React, { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import CourseCard from './CourseCard';
import { Reveal } from './ui';
import { TrackMark } from './TrackBadge';
import { TRACKS } from '../data/meta';

export default function PopularCourses({ courses, enrolledCourseId, onSelectCourse, onEnrollCourse, onViewAllCourses }) {
  const [track, setTrack] = useState('all');
  const tracks = useMemo(() => [...new Set(courses.map(c => c.iconType).filter(Boolean))], [courses]);
  const list = (track === 'all' ? courses : courses.filter(c => c.iconType === track)).slice(0, 8);

  return (
    <section className="py-20 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Free certificate courses</p>
            <h2 className="mt-2 text-3xl sm:text-[2.6rem] leading-tight font-medium text-charcoal">Access free certificate courses, built by industry mentors</h2>
          </div>
          <button onClick={onViewAllCourses} className="btn-ghost self-start sm:self-auto group shrink-0">
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
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {list.map((c, i) => (
              <div key={`${track}-${c.id}`} className="h-full animate-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
                <CourseCard course={c} index={i} enrolledCourseId={enrolledCourseId} onSelect={onSelectCourse} onEnroll={onEnrollCourse} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
