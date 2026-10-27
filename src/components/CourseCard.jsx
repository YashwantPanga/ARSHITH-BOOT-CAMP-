import React from 'react';
import { Star, Clock, Lock, PlayCircle, Users, BadgeCheck, ArrowRight, BookOpen } from 'lucide-react';
import { SafeImg, ProgressBar } from './ui';
import TrackBadge from './TrackBadge';
import { cleanText, displayTitle } from '../utils/textUtils';
import { hoursOf, TRACKS } from '../data/meta';

// Certificate-style card art (1600x1000, 16:10) in public/course-cards/, by course id. Other courses
// keep their own thumbnail.
const CARD_ART = new Set(['python-programming', 'sql-mastery', 'web-development', 'data-science-ai']);
/** The course's card image: certificate-style art when available, otherwise its thumbnail. */
export const courseArt = (course) => (CARD_ART.has(course.id) ? `/course-cards/${course.id}.webp` : course.thumbnail);
/** Price shown on enrol buttons: 'Free' or '₹99'. */
export const priceLabel = (offer) => (offer?.price > 0 ? `₹${offer.price}` : 'Free');

export default function CourseCard({ course, enrolledCourseId, onSelect, onEnroll, offer, index = 0 }) {
  const isMine = offer?.enrolledIds ? offer.enrolledIds.includes(course.id) : enrolledCourseId === course.id;
  const isLocked = false;
  const modules = course.modules?.length || 0;
  const art = CARD_ART.has(course.id) ? `/course-cards/${course.id}.webp` : null;

  return (
    <article
      className={`edu-card group relative flex flex-col h-full overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_40px_-24px_rgba(1,58,43,.4)] hover:border-sage/50 ${isLocked ? 'opacity-80' : ''}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Image with the overlapping track plate */}
      <button onClick={() => onSelect(course.id)} className="relative block text-left" aria-label={`View ${course.title}`}>
        <div className="relative aspect-[16/10] overflow-hidden bg-forest">
          <SafeImg src={art || course.thumbnail} alt="" className="w-full h-full object-cover object-[44%_50%] transition-transform duration-700 group-hover:scale-[1.04]" />
          {!art && <div className="absolute inset-0 bg-gradient-to-t from-evergreen/55 via-evergreen/5 to-transparent" />}
          {isMine && <span className="absolute top-2.5 right-2.5 chip bg-ivory text-brand-900">Enrolled</span>}
          {isLocked && <span className="absolute top-2.5 right-2.5 chip bg-white/90 text-charcoal/70"><Lock className="w-3 h-3" /> Locked</span>}
        </div>
        <TrackBadge type={course.iconType} className="absolute left-5 -bottom-5" />
      </button>

      <div className="px-5 pt-8 pb-5 flex flex-col flex-1">
        <h3 className="font-display text-[19px] font-semibold text-evergreen leading-snug">
          <button onClick={() => onSelect(course.id)} className="text-left hover:text-sage transition-colors">{displayTitle(course.title)}</button>
        </h3>
        <p className="mt-1.5 text-sm text-charcoal/60 line-clamp-2">{cleanText(course.shortDescription || course.description)}</p>

        <div className="mt-auto pt-5">
          <p className="flex items-center gap-2 text-sm text-charcoal/70"><BadgeCheck className="w-4 h-4 text-sage" /> Completion Certificate · {modules} modules</p>
          <div className="mt-2 flex items-center gap-2 text-sm text-charcoal/70">
            <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-[#E0B54A] text-[#E0B54A]" />{course.rating}</span>
            <span className="text-charcoal/30">•</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-sage" />{hoursOf(course)}</span>
            <span className="text-charcoal/30">•</span>
            <span className="flex items-center gap-1"><Users className="w-4 h-4 text-sage" />{course.studentsCount}</span>
          </div>

          {isMine && (
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1.5"><span className="text-charcoal/60">Your progress</span><span className="font-semibold text-brand-900">{course.progress || 0}%</span></div>
              <ProgressBar value={course.progress || 0} />
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-brand-900/10">
            {isMine ? (
              <button onClick={() => onEnroll(course.id)} className="btn-primary font-display w-full py-3 !rounded-md"><PlayCircle className="w-4 h-4" /> Continue learning</button>
            ) : isLocked ? (
              <button disabled className="btn font-display w-full py-3 !rounded-md bg-cream text-charcoal/50 border border-brand-900/10" title="Finish your current course first">
                <Lock className="w-4 h-4" /> Finish current course first
              </button>
            ) : (
              <button onClick={() => onEnroll(course.id)} className="btn font-display w-full py-3 !rounded-md bg-cream text-forest border border-forest/20 hover:bg-forest hover:text-ivory hover:border-forest group/btn">
                {offer?.price > 0 ? `Unlock for ₹${offer.price}` : 'Enroll for Free'} <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/** Courses page card in the eduleb "single_course" style: image with a vertical category tag,
 *  centered stars, title and facts, a course-fee strip and the enrol action. */
export function CourseTile({ course, enrolledCourseId, onSelect, onEnroll, offer }) {
  const isMine = offer?.enrolledIds ? offer.enrolledIds.includes(course.id) : enrolledCourseId === course.id;
  const isLocked = false;
  const modules = course.modules?.length || 0;
  const rating = Number(course.rating) || 0;

  return (
    <article className={`edu-card group relative flex flex-col h-full overflow-hidden text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_48px_-26px_rgba(1,58,43,.45)] ${isLocked ? 'opacity-80' : ''}`}>
      <button onClick={() => onSelect(course.id)} className="relative block" aria-label={`View ${course.title}`}>
        <div className="relative aspect-[16/10] overflow-hidden bg-forest">
          <SafeImg src={courseArt(course)} alt="" className="w-full h-full object-cover object-[44%_50%] transition-transform duration-700 group-hover:scale-[1.05]" />
          {isMine && <span className="absolute top-3 right-3 chip bg-ivory text-brand-900">Enrolled</span>}
          {isLocked && <span className="absolute top-3 right-3 chip bg-white/90 text-charcoal/70"><Lock className="w-3 h-3" /> Locked</span>}
        </div>
        {/* vertical category tag on the image's left edge */}
        <span className="absolute left-0 bottom-6 [writing-mode:vertical-rl] rotate-180 rounded-l-md bg-sage group-hover:bg-forest transition-colors text-ivory font-display text-[12.5px] font-medium tracking-wide whitespace-nowrap px-1.5 py-3">
          {TRACKS[course.iconType]?.label || course.category}
        </span>
      </button>

      <div className="px-6 pt-5 pb-6 flex flex-col flex-1 items-center">
        <div className="flex items-center gap-0.5" aria-label={`Rated ${rating} out of 5`}>
          {[1, 2, 3, 4, 5].map(n => <Star key={n} className={`w-4 h-4 ${n <= Math.round(rating) ? 'fill-[#E0B54A] text-[#E0B54A]' : 'text-charcoal/20'}`} />)}
          <span className="ml-1.5 text-[13px] font-semibold text-charcoal/70">{course.rating}</span>
        </div>
        <h3 className="mt-3 font-display text-[21px] font-semibold text-evergreen leading-snug">
          <button onClick={() => onSelect(course.id)} className="hover:text-sage transition-colors">{displayTitle(course.title)}</button>
        </h3>
        <p className="mt-2 text-[14px] text-charcoal/60 line-clamp-2">{cleanText(course.shortDescription || course.description)}</p>

        <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[14px] text-charcoal/70">
          <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-sage" />{modules} modules</span>
          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-sage" />{hoursOf(course)}</span>
          <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-sage" />{course.studentsCount}</span>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[13.5px] text-charcoal/60"><BadgeCheck className="w-4 h-4 text-sage" /> Completion Certificate</p>

        {isMine && (
          <div className="mt-4 w-full text-left">
            <div className="flex justify-between text-xs mb-1.5"><span className="text-charcoal/60">Your progress</span><span className="font-semibold text-brand-900">{course.progress || 0}%</span></div>
            <ProgressBar value={course.progress || 0} />
          </div>
        )}

        <div className="mt-auto pt-5 w-full">
          <p className="py-2.5 rounded-md bg-cream border border-brand-900/10 font-display text-[15px] font-semibold text-forest">{isMine ? 'Unlocked - yours to learn' : `Course Fee - ${priceLabel(offer)}`}</p>
          <div className="mt-3">
            {isMine ? (
              <button onClick={() => onEnroll(course.id)} className="btn-primary font-display w-full py-3 !rounded-md"><PlayCircle className="w-4 h-4" /> Continue learning</button>
            ) : isLocked ? (
              <button disabled className="btn font-display w-full py-3 !rounded-md bg-cream text-charcoal/50 border border-brand-900/10" title="Finish your current course first">
                <Lock className="w-4 h-4" /> Finish current course first
              </button>
            ) : (
              <button onClick={() => onEnroll(course.id)} className="btn font-display w-full py-3 !rounded-md bg-forest text-ivory hover:bg-sage group/btn">
                {offer?.price > 0 ? `Unlock for ₹${offer.price}` : 'Enroll for Free'} <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
