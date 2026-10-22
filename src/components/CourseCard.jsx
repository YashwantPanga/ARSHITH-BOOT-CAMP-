import React from 'react';
import { Star, Clock, Lock, PlayCircle, Users, BadgeCheck, ArrowRight } from 'lucide-react';
import { SafeImg, ProgressBar } from './ui';
import TrackBadge from './TrackBadge';
import { cleanText, displayTitle } from '../utils/textUtils';
import { hoursOf } from '../data/meta';

export default function CourseCard({ course, enrolledCourseId, onSelect, onEnroll, index = 0 }) {
  const isMine = enrolledCourseId === course.id;
  const isLocked = !!enrolledCourseId && !isMine;
  const modules = course.modules?.length || 0;

  return (
    <article
      className={`group relative flex flex-col h-full bg-white rounded-2xl border border-brand-900/10 p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover hover:border-brand-300 ${isLocked ? 'opacity-80' : ''}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Image with the overlapping track plate */}
      <button onClick={() => onSelect(course.id)} className="relative block text-left" aria-label={`View ${course.title}`}>
        <div className="relative h-40 rounded-xl overflow-hidden">
          <SafeImg src={course.thumbnail} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
          <div className="absolute inset-0 bg-gradient-to-t from-evergreen/55 via-evergreen/5 to-transparent" />
          {isMine && <span className="absolute top-2.5 right-2.5 chip bg-ivory text-brand-900">Enrolled</span>}
          {isLocked && <span className="absolute top-2.5 right-2.5 chip bg-white/90 text-charcoal/70"><Lock className="w-3 h-3" /> Locked</span>}
          {course.bestseller && !isMine && !isLocked && <span className="absolute top-2.5 right-2.5 chip bg-ivory/95 text-brand-900">Bestseller</span>}
        </div>
        <TrackBadge type={course.iconType} className="absolute left-3 -bottom-5" />
      </button>

      <div className="px-1.5 pt-8 pb-1 flex flex-col flex-1">
        <h3 className="font-sans text-[17px] font-semibold text-charcoal leading-snug">
          <button onClick={() => onSelect(course.id)} className="text-left hover:text-brand-900 transition-colors">{displayTitle(course.title)}</button>
        </h3>
        <p className="mt-1.5 text-sm text-charcoal/60 line-clamp-2">{cleanText(course.shortDescription || course.description)}</p>

        <div className="mt-auto pt-5">
          <p className="flex items-center gap-2 text-sm text-charcoal/70"><BadgeCheck className="w-4 h-4 text-sage" /> Completion Certificate · {modules} modules</p>
          <div className="mt-2 flex items-center gap-2 text-sm text-charcoal/70">
            <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-[#E0B54A] text-[#E0B54A]" />{course.rating}</span>
            <span className="text-charcoal/30">•</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{hoursOf(course)}</span>
            <span className="text-charcoal/30">•</span>
            <span className="flex items-center gap-1"><Users className="w-4 h-4" />{course.studentsCount}</span>
          </div>

          {isMine && (
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1.5"><span className="text-charcoal/60">Your progress</span><span className="font-semibold text-brand-900">{course.progress || 0}%</span></div>
              <ProgressBar value={course.progress || 0} />
            </div>
          )}

          <div className="mt-4">
            {isMine ? (
              <button onClick={() => onEnroll(course.id)} className="btn-primary w-full py-3"><PlayCircle className="w-4 h-4" /> Continue learning</button>
            ) : isLocked ? (
              <button disabled className="btn w-full py-3 bg-cream text-charcoal/50 border border-brand-900/10" title="Only one course is allowed per login">
                <Lock className="w-4 h-4" /> One course per login
              </button>
            ) : (
              <button onClick={() => onEnroll(course.id)} className="btn-outline w-full py-3 group/btn">
                Enroll for Free <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
