import React from 'react';
import { BookOpen, Home, Target, UserRound } from 'lucide-react';
import { paths } from '../router';

/**
 * Phones: an app-style tab bar on the main browse pages (home, courses, categories, Interview Prep
 * list). Pages with their own bottom actions (lessons, a course, a question) do not show it.
 */
export const showsBottomBar = (route) =>
  ['home', 'courses', 'categories'].includes(route.name) || (route.name === 'interview' && !route.params?.setId);

export default function MobileBottomNav({ route, navigate, studentUser }) {
  if (!showsBottomBar(route)) return null;
  const tabs = [
    { id: 'home', label: 'Home', icon: Home, to: paths.home() },
    { id: 'courses', label: 'Courses', icon: BookOpen, to: paths.courses(), also: ['categories'] },
    { id: 'interview', label: 'Interview', icon: Target, to: paths.interview() },
    { id: 'me', label: studentUser ? 'My learning' : 'Sign in', icon: UserRound, to: studentUser ? paths.dashboard() : paths.login() }
  ];
  const activeId = tabs.find(t => t.id === route.name || t.also?.includes(route.name))?.id;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 px-3 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 bg-gradient-to-t from-[#F3F8F4] via-[#F3F8F4]/95 to-transparent" aria-label="Quick tabs">
      <div className="mx-auto max-w-md grid grid-cols-4 rounded-[22px] bg-pine-950 p-1.5 shadow-[0_18px_36px_-16px_rgba(5,31,32,.85)] ring-1 ring-white/5">
        {tabs.map(({ id, label, icon: Icon, to }) => {
          const on = id === activeId;
          return (
            <button key={id} onClick={() => navigate(to)} aria-current={on ? 'page' : undefined}
              className={`relative h-[52px] rounded-[16px] flex flex-col items-center justify-center gap-0.5 transition-colors duration-300 ${on ? 'text-pine-950' : 'text-pine-100/65 active:text-pine-100'}`}>
              {on && <span className="nav-pill absolute inset-0 rounded-[16px] bg-pine-100" aria-hidden="true" />}
              <Icon className={`relative w-5 h-5 transition-transform duration-300 ${on ? 'scale-110' : ''}`} strokeWidth={on ? 2.4 : 2} />
              <span className={`relative text-[10.5px] leading-none ${on ? 'font-bold' : 'font-medium'}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
