import React, { useEffect, useRef, useState } from 'react';
import { Search, Menu, X, LogOut, LayoutDashboard, ChevronRight, ChevronDown, ShieldCheck, Info, Mail, Grid3X3, BookOpen, Target } from 'lucide-react';
import { Logo } from './ui';
import { TrackMark } from './TrackBadge';
import { paths } from '../router';
import { cleanText, displayTitle } from '../utils/textUtils';

const NAV = [
  { name: 'Home', id: 'home', to: paths.home(), icon: BookOpen },
  { name: 'All courses', id: 'courses', to: paths.courses(), icon: BookOpen },
  { name: 'Interview Prep', id: 'interview', to: paths.interview(), icon: Target },
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
  // the phone menu covers the page: keep the page behind it still
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

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
    <header className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${scrolled ? 'shadow-[0_8px_28px_-14px_rgba(1,58,43,.35)]' : 'border-b border-brand-900/5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 lg:h-[78px] gap-2 sm:gap-4 lg:gap-6">
          {/* phones: menu button on the left of the logo (Coursera-style mobile header) */}
          <button onClick={() => setOpen(o => !o)} className="lg:hidden -ml-1.5 p-2.5 rounded-xl text-brand-900 hover:bg-brand-50" aria-label="Menu" aria-expanded={open}>
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <Logo onClick={() => go(paths.home())} />

          {/* Explore mega-menu */}
          <div ref={exploreRef} className="relative hidden md:block" onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
            <button onClick={() => setExplore(v => (openedByHover.current ? true : !v))} aria-expanded={explore} className={`edu-nav h-12 px-1 flex items-center gap-1.5 transition-colors ${explore ? 'text-sage' : 'text-evergreen hover:text-sage'}`}>
              Explore <ChevronDown className={`w-4 h-4 transition-transform ${explore ? 'rotate-180' : ''}`} />
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

          <nav className="hidden xl:flex items-center gap-7" aria-label="Main">
            {NAV.filter(l => ['home', 'courses', 'interview', 'about', 'contact'].includes(l.id)).map(l => (
              <button key={l.id} onClick={() => go(l.to)} className={`edu-nav relative py-2 transition-colors ${isActive(l.id) ? 'text-sage after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-0.5 after:rounded after:bg-sage' : 'text-evergreen hover:text-sage'}`}>
                {l.id === 'courses' ? 'Courses' : l.name}
              </button>
            ))}
          </nav>

          <form onSubmit={submitSearch} className="relative flex-1 hidden md:block max-w-xl xl:max-w-[260px] xl:ml-auto">
            <Search className="w-5 h-5 text-charcoal/40 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              placeholder="What do you want to learn today?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 text-[15px] bg-cream border border-brand-900/10 rounded-full outline-none placeholder:text-charcoal/45 focus:bg-white focus:border-sage focus:ring-4 focus:ring-brand-100 transition"
            />
          </form>

          <div className="hidden lg:flex items-center gap-5 ml-auto xl:ml-2">
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
                <button onClick={() => go(paths.login())} className="font-display text-[17px] font-semibold text-evergreen hover:text-sage transition-colors">Log in</button>
                <button onClick={() => go(paths.register())} className="font-display h-12 px-7 rounded-md bg-forest text-ivory text-[15.5px] font-semibold border border-forest hover:bg-sage hover:border-sage transition-colors">Sign up</button>
              </>
            )}
          </div>

          <div className="flex lg:hidden items-center gap-1 ml-auto">
            <button onClick={() => { setOpen(true); setTimeout(() => document.getElementById('mobile-search')?.focus(), 60); }} className="p-2.5 rounded-xl text-brand-900 hover:bg-brand-50" aria-label="Search courses">
              <Search className="w-[22px] h-[22px]" />
            </button>
            {studentUser && (
              <button onClick={() => go(paths.dashboard())} className="w-9 h-9 rounded-full bg-brand-900 text-ivory text-xs font-bold flex items-center justify-center" aria-label="Dashboard">
                {initials}
              </button>
            )}
          </div>
        </div>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-50 bg-white flex flex-col animate-fade-in" role="dialog" aria-label="Menu">
          <div className="flex-1 overflow-y-auto px-5 pt-4 pb-4">
            <form onSubmit={submitSearch} className="relative md:hidden">
              <input id="mobile-search" type="search" placeholder="What do you want to learn today?" value={query} onChange={(e) => setQuery(e.target.value)} className="w-full h-11 pl-10 pr-4 rounded-full bg-cream border border-brand-900/10 text-[15px] outline-none focus:border-sage focus:bg-white" />
              <Search className="w-4 h-4 text-charcoal/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </form>
            <nav className="mt-3" aria-label="Main">
              {NAV.map(link => (
                <button key={link.id} onClick={() => go(link.to)} className={`w-full flex items-center justify-between py-3.5 text-left text-[16px] ${isActive(link.id) ? 'font-semibold text-forest' : 'text-charcoal'}`}>
                  {link.name}<ChevronRight className="w-4 h-4 text-charcoal/50" />
                </button>
              ))}
            </nav>
            <div className="my-2 border-t border-brand-900/10" />
            <p className="pt-2 text-[14px] text-charcoal/55">Not sure where to begin?</p>
            <button onClick={() => go(paths.courses())} className="w-full py-3 text-left text-[16px] text-charcoal">Browse free courses</button>
            {studentUser && (
              <>
                <div className="my-2 border-t border-brand-900/10" />
                <button onClick={() => go(paths.dashboard())} className="w-full flex items-center justify-between py-3.5 text-left text-[16px] text-charcoal">
                  <span className="flex items-center gap-2"><LayoutDashboard className="w-4 h-4 text-sage" />My dashboard</span><ChevronRight className="w-4 h-4 text-charcoal/50" />
                </button>
              </>
            )}
          </div>
          <div className="border-t border-brand-900/10 bg-cream px-5 pt-4 pb-[calc(16px+env(safe-area-inset-bottom))] grid gap-2.5">
            {studentUser ? (
              <button onClick={() => { setOpen(false); onLogout(); }} className="font-display h-12 rounded-md border border-rose-300 bg-white text-rose-700 text-[15.5px] font-semibold">Sign out</button>
            ) : (
              <>
                <button onClick={() => go(paths.register())} className="font-display h-12 rounded-md bg-forest text-ivory text-[15.5px] font-semibold">Join for Free</button>
                <button onClick={() => go(paths.login())} className="font-display h-12 rounded-md border border-forest text-forest bg-white text-[15.5px] font-semibold">Log In</button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
