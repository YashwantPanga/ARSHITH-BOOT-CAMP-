import React, { useEffect, useState } from 'react';
import { Award, BookOpen, ChevronRight, Flame, Heart, Search, Sparkles, Star, Target } from 'lucide-react';
import { SafeImg } from '../ui';
import { courseArt } from '../CourseCard';
import { hoursOf } from '../../data/meta';
import { displayTitle } from '../../utils/textUtils';
import { paths } from '../../router';
import { INTERVIEW_SETS } from '../../../shared/interview/index.js';
import { Mascot, QUEST } from '../interview/QuestArt';

const SEARCH_WORDS = ['Python', 'SQL joins', 'DSA', 'JavaScript', 'Data Science', 'React', 'Interview questions'];

/** Search bar whose hint word slides up and changes every 2 seconds. */
function RotatingSearch({ onOpen }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI(n => (n + 1) % SEARCH_WORDS.length), 2000);
    return () => clearInterval(t);
  }, []);
  return (
    <button onClick={onOpen} className="w-full h-12 rounded-2xl bg-white border border-brand-900/10 shadow-[0_8px_20px_-14px_rgba(12,45,38,.5)] flex items-center gap-3 px-4 text-left active:scale-[.99] transition">
      <Search className="w-5 h-5 text-forest shrink-0" />
      <span className="text-[15px] text-charcoal/50 flex items-center gap-1 overflow-hidden">
        Search for
        <span className="relative inline-block h-[22px] overflow-hidden">
          <span key={i} className="block text-charcoal/80 font-medium mhome-word">'{SEARCH_WORDS[i]}'</span>
        </span>
      </span>
    </button>
  );
}

/** Grey shimmering card shapes shown while a row loads. */
export function ShimmerRow({ count = 3, tall = 196 }) {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="shrink-0 w-[150px]">
          <div className="mhome-shimmer rounded-2xl" style={{ height: tall - 56 }} />
          <div className="mhome-shimmer h-3 rounded mt-2.5 w-[85%]" />
          <div className="mhome-shimmer h-3 rounded mt-1.5 w-[55%]" />
        </div>
      ))}
    </div>
  );
}

function CourseMini({ course, tag, onOpen }) {
  return (
    <button onClick={onOpen} className="mhome-card snap-start shrink-0 w-[150px] text-left">
      <span className="relative block h-[100px] rounded-2xl overflow-hidden bg-forest shadow-[0_10px_20px_-14px_rgba(1,58,43,.9)]">
        <SafeImg src={courseArt(course)} alt="" className="w-full h-full object-cover" />
        <span className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/70 to-transparent" />
        <span className="absolute left-2 bottom-1.5 text-white font-display font-extrabold text-[15px] leading-none drop-shadow">{tag}</span>
        <span className="absolute right-1.5 top-1.5 w-7 h-7 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center"><Heart className="w-3.5 h-3.5 text-white" /></span>
      </span>
      <span className="block mt-2 text-[13.5px] font-bold text-charcoal leading-snug line-clamp-2 min-h-[36px]">{displayTitle(course.title)}</span>
      <span className="mt-1 flex items-center gap-1 text-[11.5px] text-charcoal/60">
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-mint-400"><Star className="w-2.5 h-2.5 fill-white text-white" /></span>
        {course.rating} · {hoursOf(course)}
      </span>
    </button>
  );
}

function QuestMini({ set, solved, onOpen }) {
  const q = QUEST[set.id];
  return (
    <button onClick={onOpen} className="mhome-card snap-start shrink-0 w-[150px] text-left">
      <span className="relative block h-[100px] rounded-2xl overflow-hidden shadow-[0_10px_20px_-14px_rgba(20,10,60,.9)]" style={{ background: q.bg }}>
        <span className="quest-rays" />
        <Mascot q={q} className="absolute -right-5 -bottom-7 w-[110px]" />
        <span className="absolute left-2 top-2 px-1.5 py-0.5 rounded bg-[#FFD34D] text-[#2A1A05] text-[8.5px] font-extrabold tracking-[0.12em]">{q.track}</span>
        <span className="absolute left-2 bottom-1.5 text-white font-display font-extrabold text-[15px] leading-none drop-shadow">{set.items.length} Qs</span>
      </span>
      <span className="block mt-2 text-[13.5px] font-bold text-charcoal leading-snug line-clamp-2 min-h-[36px]">{set.title}</span>
      <span className="mt-1 flex items-center gap-1 text-[11.5px] text-charcoal/60">
        <Sparkles className="w-3.5 h-3.5 text-[#E8A13A]" />{solved ? `${solved} solved` : 'With solutions'}
      </span>
    </button>
  );
}

/**
 * Phones: an app-style home top - greeting, rotating search, section tiles, a festival banner and
 * medium cards in swipeable rows (with a shimmer while switching).
 */
export default function MobileHome({ courses, coursesLoaded, studentUser, offer, navigate }) {
  const [tab, setTab] = useState('courses');
  const [switching, setSwitching] = useState(false);
  const first = (studentUser?.name || '').split(' ')[0];
  const switchTo = (t) => {
    if (t === tab) return;
    setTab(t);
    setSwitching(true);
    setTimeout(() => setSwitching(false), 450);
  };
  const isMine = (id) => offer?.enrolledIds?.includes(id);
  const tiles = [
    { label: 'Courses', icon: BookOpen, bg: 'from-[#1E5141] to-[#013A2B]', to: paths.courses(), badge: 'FREE' },
    { label: 'Interview', icon: Target, bg: 'from-[#5B4BD1] to-[#26207A]', to: paths.interview(), badge: 'NEW' },
    { label: 'Streak', icon: Flame, bg: 'from-[#FFB347] to-[#E8641C]', to: studentUser ? paths.dashboard() : paths.login(paths.dashboard()) },
    { label: 'Certificate', icon: Award, bg: 'from-[#C9A646] to-[#7A5A1C]', to: paths.verify() }
  ];

  return (
    <section className="sm:hidden bg-ivory px-4 pt-4 pb-6">
      <p className="text-[13px] text-charcoal/55">{first ? `Hi ${first} 👋` : 'Welcome 👋'}</p>
      <h1 className="font-display text-[23px] font-bold text-evergreen leading-tight">What will you learn today?</h1>

      <div className="mt-3"><RotatingSearch onOpen={() => navigate(paths.courses())} /></div>

      <div className="mt-4 grid grid-cols-4 gap-2.5">
        {tiles.map((t, i) => (
          <button key={t.label} onClick={() => navigate(t.to)} className="mhome-tile relative flex flex-col items-center gap-1.5 rounded-2xl bg-white border border-brand-900/[.08] pt-3 pb-2 shadow-[0_8px_18px_-14px_rgba(12,45,38,.55)] active:scale-95 transition" style={{ animationDelay: `${i * 70}ms` }}>
            {t.badge && <span className={`absolute -top-1.5 left-1/2 -translate-x-1/2 px-1.5 py-[1px] rounded-md text-[8.5px] font-extrabold tracking-wider text-white ${t.badge === 'NEW' ? 'bg-[#E8641C]' : 'bg-forest'}`}>{t.badge}</span>}
            <span className={`w-11 h-11 rounded-xl bg-gradient-to-br ${t.bg} text-white flex items-center justify-center shadow-[0_6px_12px_-6px_rgba(0,0,0,.5)]`}><t.icon className="w-5 h-5" /></span>
            <span className="text-[11.5px] font-semibold text-charcoal/80">{t.label}</span>
          </button>
        ))}
      </div>

      {/* festival banner */}
      <div className="mt-4 relative overflow-hidden rounded-[22px] p-4 text-white" style={{ background: 'linear-gradient(120deg,#3B1478 0%,#7A2A9C 55%,#E2577E 100%)' }}>
        <span className="quest-rays" />
        <span className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-[#FFD34D]/25 blur-2xl" />
        <p className="relative text-[10.5px] font-extrabold tracking-[0.2em] text-[#FFD34D]">✦ LIMITED TIME ✦</p>
        <p className="relative font-display text-[30px] font-extrabold leading-none mt-1 mhome-fest">CAREER<span className="text-[#FFD34D]">FEST</span></p>
        <p className="relative text-[12.5px] text-white/80 mt-1">Every course is free. Learn, practise and get certified.</p>
        <div className="relative mt-3 flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
          {[['100%', 'FREE courses'], ['355+', 'practice Qs'], ['479', 'solutions'], ['QR', 'certificate']].map(([big, small]) => (
            <span key={small} className="shrink-0 w-[78px] rounded-xl bg-white/[.12] border border-white/20 px-2 py-2 text-center backdrop-blur-sm">
              <span className="block font-display text-[17px] font-extrabold text-[#FFD34D] leading-none">{big}</span>
              <span className="block text-[10.5px] text-white/85 mt-1 leading-tight">{small}</span>
            </span>
          ))}
        </div>
      </div>

      {/* segmented switch + medium cards */}
      <div className="mt-5 grid grid-cols-2 p-1 rounded-full bg-white border border-brand-900/10 shadow-[0_6px_14px_-12px_rgba(12,45,38,.5)]">
        {[['courses', 'Free courses'], ['interview', 'Interview prep']].map(([id, label]) => (
          <button key={id} onClick={() => switchTo(id)} className={`h-9 rounded-full text-[12.5px] font-bold uppercase tracking-wide transition ${tab === id ? 'bg-forest text-ivory shadow' : 'text-charcoal/55'}`}>{label}</button>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <h2 className="font-display text-[17px] font-bold text-evergreen">{tab === 'courses' ? 'Top courses for you' : 'Crack your interviews'}</h2>
        <button onClick={() => navigate(tab === 'courses' ? paths.courses() : paths.interview())} className="text-[13px] font-semibold text-[#C2561A] inline-flex items-center">See all <ChevronRight className="w-4 h-4" /></button>
      </div>
      <div className="mt-2.5 -mx-4 px-4 flex gap-3 overflow-x-auto no-scrollbar snap-x scroll-px-4 pb-1">
        {switching || !coursesLoaded ? <ShimmerRow /> : tab === 'courses'
          ? courses.map(c => <CourseMini key={c.id} course={c} tag={isMine(c.id) ? 'ENROLLED' : offer?.price > 0 ? `₹${offer.price}` : 'FREE'} onOpen={() => navigate(paths.course(c.id))} />)
          : INTERVIEW_SETS.map(s => <QuestMini key={s.id} set={s} solved={0} onOpen={() => navigate(paths.interview(s.id))} />)}
      </div>
    </section>
  );
}
