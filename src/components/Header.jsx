import React, { useEffect, useRef, useState } from 'react';
import { Search, Menu, X, LogOut, LayoutDashboard, ChevronRight, ChevronDown, ShieldCheck, Info, Mail, Grid3X3, BookOpen } from 'lucide-react';
import { Logo } from './ui';
import { TrackMark } from './TrackBadge';
import { paths } from '../router';
import { cleanText, displayTitle } from '../utils/textUtils';

const NAV = [
  { name: 'Home', id: 'home', to: paths.home(), icon: BookOpen },
  { name: 'All courses', id: 'courses', to: paths.courses(), icon: BookOpen },
  { name: 'Categories', id: 'categories', to: paths.categories(), icon: Grid3X3 },
  { name: 'Verify certificate', id: 'verify', to: paths.verify(), icon: ShieldCheck },
  { name: 'About', id: 'about', to: paths.about(), icon: Info },
  { name: 'Contact', id: 'contact', to: paths.contact(), icon: Mail }
];

export default function Header({ route, navigate, studentUser, onLogout, courses = [] }) {
  const [open, setOpen] = useState(false);
  const [explore, setExplore] = useState(false);
  const [query, setQuery] = useState(route.query?.q || '');
  const [scrolled, setScrolled] = useState(false);
  const exploreRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); setExplore(false); }, [route.name]);

  useEffect(() => {
    if (!explore) return undefined;
    const onDown = (e) => { if (exploreRef.current && !exploreRef.current.contains(e.target)) setExplore(false); };
    const onKey = (e) => { if (e.key === 'Escape') setExplore(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [explore]);

  const isActive = (id) => route.name === id || (id === 'courses' && route.name === 'course-details');
  const go = (to) => { setOpen(false); setExplore(false); navigate(to); };

  // Explore opens on hover with a mouse (short delay before closing so the pointer can travel into
  // the menu); click / tap / keyboard still toggle it.
  const hoverTimer = useRef(null);
  const openedByHover = useRef(false);
  const canHover = () => typeof window !== 'undefined' && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
  const hoverIn = () => { if (!canHover()) return; clearTimeout(hoverTimer.current); openedByHover.current = true; setExplore(true); };
  const hoverOut = () => { if (!canHover()) return; clearTimeout(hoverTimer.current); hoverTimer.current = setTimeout(() => { openedByHover.current = false; setExplore(false); }, 180); };
  useEffect(() => () => clearTimeout(hoverTimer.current), []);
  const submitSearch = (e) => {
    e.preventDefault();
    setOpen(false);
    navigate(paths.courses(query.trim() ? { q: query.trim() } : undefined));
  };
  const initials = (studentUser?.name || studentUser?.email || '?').split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className={`sticky top-0 z-50 bg-white/95 backdrop-blur-md transition-shadow duration-300 ${scrolled ? 'shadow-[0_8px_28px_-14px_rgba(1,58,43,.35)]' : 'border-b border-brand-900/5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-[78px] gap-4 lg:gap-6">
          <Logo onClick={() => go(paths.home())} />

          {/* Explore mega-menu */}
          <div ref={exploreRef} className="relative hidden md:block" onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
            <button onClick={() => setExplore(v => (openedByHover.current ? true : !v))} aria-expanded={explore} className={`h-12 px-4 rounded-lg flex items-center gap-2 text-[15px] font-medium transition ${explore ? 'bg-brand-900 text-ivory' : 'bg-brand-50 text-brand-900 hover:bg-brand-100'}`}>
              <Menu className="w-5 h-5" /> Explore <ChevronDown className={`w-4 h-4 transition-transform ${explore ? 'rotate-180' : ''}`} />
            </button>
            {explore && (
              <div className="absolute left-0 top-[calc(100%+10px)] before:absolute before:-top-3 before:inset-x-0 before:h-3 before:content-[''] w-[640px] bg-white rounded-2xl shadow-floating border border-brand-900/10 p-5 grid grid-cols-5 gap-5 animate-scale-in origin-top-left">
                <div className="col-span-3">
                  <p className="eyebrow mb-3">Courses</p>
                  <div className="space-y-1">
                    {courses.map(c => (
                      <button key={c.id} onClick={() => go(paths.course(c.id))} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-cream text-left transition">
                        <TrackMark type={c.iconType} className="w-8 h-8 shrink-0" />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-charcoal truncate">{displayTitle(c.title)}</span>
                          <span className="block text-xs text-charcoal/50">{c.modules?.length || 0} modules · {c.level}</span>
                        </span>
                      </button>
                    ))}
                    {courses.length === 0 && <p className="text-sm text-charcoal/50">Loading courses…</p>}
                  </div>
                </div>
                <div className="col-span-2 border-l border-brand-900/10 pl-5">
                  <p className="eyebrow mb-3">Navigate</p>
                  <div className="space-y-0.5">
                    {NAV.map(link => (
                      <button key={link.id} onClick={() => go(link.to)} className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-left transition ${isActive(link.id) ? 'bg-brand-50 text-brand-900 font-semibold' : 'text-charcoal/75 hover:bg-cream hover:text-brand-900'}`}>
                        <link.icon className="w-4 h-4 text-sage" />{link.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={submitSearch} className="relative flex-1 hidden md:block max-w-xl">
            <Search className="w-5 h-5 text-charcoal/40 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              placeholder="What do you want to learn today?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 text-[15px] bg-brand-50/70 border border-transparent rounded-lg outline-none placeholder:text-charcoal/45 focus:bg-white focus:border-sage focus:ring-4 focus:ring-brand-100 transition"
            />
          </form>

          <div className="hidden lg:flex items-center gap-3 ml-auto">
            {studentUser ? (
              <div className="flex items-center gap-2">
                <button onClick={() => go(paths.dashboard())} className={`flex items-center gap-2 pl-1.5 pr-4 py-1.5 rounded-full border transition ${route.name === 'dashboard' ? 'border-brand-900 bg-brand-50' : 'border-brand-900/15 hover:border-brand-300'}`}>
                  <span className="w-9 h-9 rounded-full bg-brand-900 text-ivory text-xs font-bold flex items-center justify-center">{initials}</span>
                  <span className="text-sm font-semibold text-brand-900 max-w-[120px] truncate">{studentUser.name || 'Dashboard'}</span>
                </button>
                <button onClick={onLogout} title="Sign out" className="p-2.5 rounded-full text-charcoal/50 hover:text-rose-700 hover:bg-rose-50 transition">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <button onClick={() => go(paths.register())} className="btn-primary h-12 px-6 rounded-lg text-[15px]">Sign up</button>
                <button onClick={() => go(paths.login())} className="btn-outline h-12 px-6 rounded-lg text-[15px]">Log in</button>
              </>
            )}
          </div>

          <div className="flex lg:hidden items-center gap-1 ml-auto">
            {studentUser ? (
              <button onClick={() => go(paths.dashboard())} className="w-9 h-9 rounded-full bg-brand-900 text-ivory text-xs font-bold flex items-center justify-center" aria-label="Dashboard">
                {initials}
              </button>
            ) : (
              <button onClick={() => go(paths.login())} className="btn-ghost px-3 py-2">Log in</button>
            )}
            <button onClick={() => setOpen(o => !o)} className="p-2.5 rounded-xl text-brand-900 hover:bg-brand-50" aria-label="Menu" aria-expanded={open}>
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-brand-900/10 bg-white px-4 pt-3 pb-6 space-y-3 animate-fade-in shadow-lg max-h-[calc(100vh-78px)] overflow-y-auto">
          <form onSubmit={submitSearch} className="relative md:hidden">
            <input type="search" placeholder="What do you want to learn today?" value={query} onChange={(e) => setQuery(e.target.value)} className="input pl-10" />
            <Search className="w-4 h-4 text-charcoal/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </form>
          <div className="grid gap-1">
            {NAV.map(link => (
              <button key={link.id} onClick={() => go(link.to)} className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold ${isActive(link.id) ? 'bg-brand-900 text-ivory' : 'text-charcoal hover:bg-brand-50'}`}>
                {link.name}<ChevronRight className="w-4 h-4 opacity-60" />
              </button>
            ))}
            {studentUser && (
              <button onClick={() => go(paths.dashboard())} className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-brand-900 bg-brand-50">
                <span className="flex items-center gap-2"><LayoutDashboard className="w-4 h-4 text-sage" />My Dashboard</span><ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="pt-3 border-t border-brand-900/10 grid gap-2">
            {studentUser ? (
              <button onClick={() => { setOpen(false); onLogout(); }} className="btn bg-rose-50 text-rose-700 hover:bg-rose-100">Sign out</button>
            ) : (
              <>
                <button onClick={() => go(paths.register())} className="btn-primary">Sign up free</button>
                <button onClick={() => go(paths.login())} className="btn-outline">Log in</button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
