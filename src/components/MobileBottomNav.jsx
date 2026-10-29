import React from 'react';
import { BookOpen, Home, LayoutDashboard, LogIn, Target } from 'lucide-react';
import { paths } from '../router';

/** Routes where the phone tab bar is hidden (pages with their own bottom actions or an editor). */
export const hidesTabBar = (route) => route.name === 'course-details' || route.name === 'learning' || (route.name === 'interview' && route.params.itemId);

/**
 * Phones: an app-style bottom tab bar - Home, Courses, Interview Prep and the learner's dashboard
 * (or Log in). The active tab gets a filled pill and a small bounce.
 */
export default function MobileBottomNav({ route, navigate, studentUser }) {
  if (hidesTabBar(route)) return null;
  const tabs = [
    { id: 'home', label: 'Home', icon: Home, to: paths.home(), on: route.name === 'home' },
    { id: 'courses', label: 'Courses', icon: BookOpen, to: paths.courses(), on: ['courses', 'categories'].includes(route.name) },
    { id: 'interview', label: 'Interview', icon: Target, to: paths.interview(), on: route.name === 'interview', badge: 'NEW' },
    studentUser
      ? { id: 'me', label: 'My learning', icon: LayoutDashboard, to: paths.dashboard(), on: route.name === 'dashboard' }
      : { id: 'me', label: 'Log in', icon: LogIn, to: paths.login(), on: route.name === 'login' }
  ];
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-brand-900/10 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_-18px_rgba(1,58,43,.35)]" aria-label="Main">
      <div className="grid grid-cols-4 h-[64px]">
        {tabs.map(t => (
          <button key={t.id} id={`tab-${t.id}`} onClick={() => navigate(t.to)} aria-current={t.on ? 'page' : undefined}
            className="relative flex flex-col items-center justify-center gap-0.5 active:scale-95 transition">
            {t.on && <span className="absolute top-0 inset-x-6 h-[3px] rounded-b-full bg-forest" />}
            <span className={`relative w-12 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${t.on ? 'bg-brand-100 tab-pop' : ''}`}>
              <t.icon className={`w-[21px] h-[21px] ${t.on ? 'text-forest' : 'text-charcoal/50'}`} strokeWidth={t.on ? 2.4 : 2} />
              {t.badge && <span className="absolute -top-1 -right-1 px-1 rounded bg-[#E8641C] text-white text-[8px] font-extrabold tracking-wider leading-[13px]">{t.badge}</span>}
            </span>
            <span className={`text-[11px] ${t.on ? 'font-bold text-forest' : 'font-medium text-charcoal/55'}`}>{t.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
