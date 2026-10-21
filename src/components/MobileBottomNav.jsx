import React from 'react';
import { Home, BookOpen, GraduationCap, User } from 'lucide-react';
import { paths } from '../router';

export default function MobileBottomNav({ route, navigate, studentUser }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home, to: paths.home() },
    { id: 'courses', label: 'Courses', icon: BookOpen, to: paths.courses() },
    { id: 'dashboard', label: 'Learning', icon: GraduationCap, to: studentUser ? paths.dashboard() : paths.login(paths.dashboard()) },
    { id: 'account', label: studentUser ? 'Account' : 'Log in', icon: User, to: studentUser ? paths.dashboard() : paths.login() }
  ];
  const active = (id) => route.name === id || (id === 'courses' && route.name === 'course-details');

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 pb-[env(safe-area-inset-bottom)]" aria-label="Mobile">
      <div className="flex items-center justify-around h-16">
        {tabs.map(t => (
          <button key={t.id} onClick={() => navigate(t.to)} className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition ${active(t.id) ? 'text-peach-500' : 'text-slate-400'}`}>
            <t.icon className={`w-5 h-5 ${active(t.id) ? 'stroke-[2.4]' : ''}`} />
            <span className="text-[10px] font-semibold">{t.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
