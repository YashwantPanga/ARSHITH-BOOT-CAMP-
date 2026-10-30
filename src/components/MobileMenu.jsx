import React, { useEffect, useState } from 'react';
import {
  Award, BookOpen, ChevronDown, Flame, Grid3X3, Home, Info, LayoutDashboard, LogIn, LogOut, Mail, Search, ShieldCheck,
  Target, UserRound, X
} from 'lucide-react';
import { TrackMark } from './TrackBadge';
import { paths } from '../router';
import { api } from '../services/api';
import { displayTitle } from '../utils/textUtils';
import { INTERVIEW_SETS } from '../../shared/interview/index.js';

function MenuRow({ icon: Icon, label, onClick, isActive = false, expanded }) {
  return (
    <button onClick={onClick} aria-expanded={expanded}
      className={`w-full flex items-center gap-3.5 px-3 h-12 rounded-xl text-left text-[15.5px] transition-colors active:bg-brand-50 ${isActive ? 'bg-brand-50 text-forest font-semibold' : 'text-charcoal'}`}>
      <Icon className={`w-[19px] h-[19px] shrink-0 ${isActive ? 'text-forest' : 'text-sage'}`} />
      <span className="flex-1">{label}</span>
      {expanded !== undefined && <ChevronDown className={`w-4 h-4 text-charcoal/45 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />}
    </button>
  );
}

/** A sub-list that opens smoothly (animating grid rows keeps the real content height). */
function MenuSub({ open, children }) {
  return (
    <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
      <div className="overflow-hidden">
        <div className="ml-[22px] pl-4 border-l border-brand-900/10 py-1 space-y-0.5">{children}</div>
      </div>
    </div>
  );
}

/**
 * Phones and tablets: a full-screen menu sheet. Profile header, a swipeable row of shortcut tiles,
 * then the site links with icons; Courses and Interview Prep open into their own lists.
 */
export default function MobileMenu({ open, onClose, route, navigate, studentUser, onLogout, courses = [], focusSearch = false }) {
  const [query, setQuery] = useState('');
  const [section, setSection] = useState(null);       // 'courses' | 'interview'
  const [streak, setStreak] = useState(null);
  const signedIn = !!studentUser;

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    if (focusSearch) setTimeout(() => document.getElementById('mobile-search')?.focus(), 80);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open, focusSearch, onClose]);

  useEffect(() => {
    if (!open || !studentUser?.token) return;
    api.getStreak().then(r => setStreak(r.streak || null)).catch(() => {});
  }, [open, studentUser?.token]);

  if (!open) return null;

  const go = (to) => { onClose(); navigate(to); };
  const name = studentUser?.name || 'Learner';
  const initials = name.split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase();
  const active = (id) => route.name === id || (id === 'courses' && route.name === 'course-details');

  const tiles = signedIn
    ? [
      { label: 'Dashboard', icon: LayoutDashboard, tone: 'from-[#1E5141] to-[#013A2B]', to: paths.dashboard() },
      { label: 'Interview', icon: Target, tone: 'from-[#2A7079] to-[#0F4A52]', to: paths.interview() },
      { label: 'Streak', icon: Flame, tone: 'from-[#FFB347] to-[#E8641C]', to: paths.dashboard() },
      { label: 'Courses', icon: BookOpen, tone: 'from-[#5F8574] to-[#1E5141]', to: paths.courses() },
      { label: 'Verify', icon: ShieldCheck, tone: 'from-[#B8862B] to-[#6E4F17]', to: paths.verify() },
      { label: 'Profile', icon: UserRound, tone: 'from-[#426557] to-[#0C2D26]', to: `${paths.dashboard()}?tab=profile` }
    ]
    : [
      { label: 'Courses', icon: BookOpen, tone: 'from-[#5F8574] to-[#1E5141]', to: paths.courses() },
      { label: 'Interview', icon: Target, tone: 'from-[#2A7079] to-[#0F4A52]', to: paths.interview() },
      { label: 'Categories', icon: Grid3X3, tone: 'from-[#1E5141] to-[#013A2B]', to: paths.categories() },
      { label: 'Verify', icon: ShieldCheck, tone: 'from-[#B8862B] to-[#6E4F17]', to: paths.verify() }
    ];

  const toggle = (id) => setSection(s => (s === id ? null : id));

  return (
    <div className="lg:hidden fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="absolute inset-0 bg-[#0C2D26]/40 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div className="mobile-sheet absolute inset-y-0 right-0 w-full sm:w-[420px] bg-white flex flex-col shadow-2xl">
        {/* profile header */}
        <div className="relative px-5 pt-[calc(18px+env(safe-area-inset-top))] pb-4">
          <button onClick={onClose} className="absolute right-3 top-[calc(10px+env(safe-area-inset-top))] w-10 h-10 rounded-full flex items-center justify-center text-charcoal/60 active:bg-brand-50" aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
          {signedIn ? (
            <button onClick={() => go(paths.dashboard())} className="flex items-center gap-3.5 pr-10 text-left">
              <span className="relative w-14 h-14 rounded-full bg-gradient-to-br from-[#1E5141] to-[#0C2D26] text-ivory font-display text-[18px] font-bold flex items-center justify-center shrink-0 ring-4 ring-brand-50">
                {initials}
                {streak?.current > 0 && <span className="absolute -right-1 -bottom-1 min-w-[24px] h-6 px-1.5 rounded-full bg-gradient-to-br from-[#FFC24B] to-[#E8641C] text-[#3D1A05] text-[11px] font-bold flex items-center justify-center border-2 border-white">{streak.current}</span>}
              </span>
              <span className="min-w-0">
                <span className="block font-display text-[19px] font-bold text-evergreen truncate">{name}</span>
                <span className="block text-[13px] text-[#B5651D] font-semibold">
                  {streak ? (streak.current ? `🔥 ${streak.current}-day coding streak` : 'Run code today to start a streak') : 'View your dashboard'}
                </span>
              </span>
            </button>
          ) : (
            <div className="pr-10">
              <p className="font-display text-[20px] font-bold text-evergreen">Welcome to CodeLekho</p>
              <p className="text-[13.5px] text-charcoal/60 mt-0.5">Every course is free. Learn, practise and get certified.</p>
              <div className="mt-3.5 grid grid-cols-2 gap-2.5">
                <button onClick={() => go(paths.register())} className="font-display h-11 rounded-lg bg-forest text-ivory text-[15px] font-semibold active:scale-[.98] transition">Join for free</button>
                <button onClick={() => go(paths.login())} className="font-display h-11 rounded-lg border border-forest text-forest text-[15px] font-semibold inline-flex items-center justify-center gap-1.5 active:scale-[.98] transition"><LogIn className="w-4 h-4" /> Log in</button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain pb-[calc(16px+env(safe-area-inset-bottom))]">
          {/* shortcut tiles */}
          <div className="flex gap-2.5 overflow-x-auto overscroll-x-contain snap-x scroll-px-5 px-5 pb-1 no-scrollbar">
            {tiles.map(t => (
              <button key={t.label} onClick={() => go(t.to)} className="snap-start shrink-0 w-[76px] rounded-2xl border border-brand-900/10 bg-white py-2.5 flex flex-col items-center gap-1.5 active:scale-95 transition shadow-[0_6px_14px_-10px_rgba(12,45,38,.35)]">
                <span className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.tone} text-white flex items-center justify-center`}><t.icon className="w-5 h-5" /></span>
                <span className="text-[11.5px] font-medium text-charcoal/75">{t.label}</span>
              </button>
            ))}
          </div>

          {/* search */}
          <form onSubmit={(e) => { e.preventDefault(); go(paths.courses(query.trim() ? { q: query.trim() } : undefined)); }} className="relative mx-5 mt-4">
            <input id="mobile-search" type="search" placeholder="What do you want to learn today?" value={query} onChange={(e) => setQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-cream border border-brand-900/10 text-[16px] outline-none focus:border-sage focus:bg-white" />
            <Search className="w-4 h-4 text-charcoal/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </form>

          {/* links */}
          <nav className="px-2.5 mt-3" aria-label="Main">
            <MenuRow icon={Home} label="Home" isActive={active('home')} onClick={() => go(paths.home())} />
            <MenuRow icon={BookOpen} label="Courses" expanded={section === 'courses'} onClick={() => toggle('courses')} />
            <MenuSub open={section === 'courses'}>
              {courses.map(c => (
                <button key={c.id} onClick={() => go(paths.course(c.id))} className="w-full flex items-center gap-2.5 px-2 h-11 rounded-lg text-left text-[14.5px] text-charcoal/85 active:bg-brand-50">
                  <TrackMark type={c.iconType} className="w-6 h-6 shrink-0" /><span className="truncate">{displayTitle(c.title)}</span>
                </button>
              ))}
              <button onClick={() => go(paths.courses())} className="w-full px-2 h-10 text-left text-[14px] font-semibold text-forest">View all courses</button>
            </MenuSub>
            <MenuRow icon={Target} label="Interview Prep" expanded={section === 'interview'} onClick={() => toggle('interview')} />
            <MenuSub open={section === 'interview'}>
              {INTERVIEW_SETS.map(s => (
                <button key={s.id} onClick={() => go(paths.interview(s.id))} className="w-full flex items-center justify-between gap-2 px-2 h-11 rounded-lg text-left text-[14.5px] text-charcoal/85 active:bg-brand-50">
                  <span className="truncate">{s.title}</span><span className="text-[12px] text-charcoal/45 shrink-0">{s.items.length}</span>
                </button>
              ))}
              <button onClick={() => go(paths.interview())} className="w-full px-2 h-10 text-left text-[14px] font-semibold text-forest">All study plans</button>
            </MenuSub>
            <MenuRow icon={Grid3X3} label="Categories" isActive={active('categories')} onClick={() => go(paths.categories())} />
            <MenuRow icon={Award} label="Verify certificate" isActive={active('verify')} onClick={() => go(paths.verify())} />

            <div className="my-2 mx-3 border-t border-brand-900/10" />
            <MenuRow icon={Info} label="About" isActive={active('about')} onClick={() => go(paths.about())} />
            <MenuRow icon={Mail} label="Contact" isActive={active('contact')} onClick={() => go(paths.contact())} />

            {signedIn && (
              <>
                <div className="my-2 mx-3 border-t border-brand-900/10" />
                <MenuRow icon={LayoutDashboard} label="My dashboard" isActive={active('dashboard')} onClick={() => go(paths.dashboard())} />
                <MenuRow icon={UserRound} label="Profile & settings" onClick={() => go(`${paths.dashboard()}?tab=profile`)} />
                <button onClick={() => { onClose(); onLogout(); }} className="w-full flex items-center gap-3.5 px-3 h-12 rounded-xl text-left text-[15.5px] text-rose-700 active:bg-rose-50">
                  <LogOut className="w-[19px] h-[19px]" /> Sign out
                </button>
              </>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}
