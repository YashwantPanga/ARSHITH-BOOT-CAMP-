import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { paths } from '../router';

/**
 * Phones, home page only: a sticky full-width action bar at the bottom of the screen. Signed out it
 * starts registration; signed in it continues learning. Other pages have their own actions.
 * It slides in once the hero (which has the same button) has scrolled away.
 */
export const showsBottomBar = (route) => route.name === 'home';

export default function MobileBottomNav({ route, navigate, studentUser }) {
  const [shown, setShown] = useState(false);
  const active = showsBottomBar(route);
  useEffect(() => {
    if (!active) return undefined;
    const onScroll = () => setShown(window.scrollY > 640);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [active]);
  if (!active) return null;
  const signedIn = !!studentUser;
  return (
    <div aria-hidden={!shown} className={`md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-brand-900/10 px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-10px_30px_-18px_rgba(1,58,43,.35)] transition-transform duration-300 ease-out ${shown ? 'translate-y-0' : 'translate-y-full pointer-events-none'}`}>
      <button
        onClick={() => navigate(signedIn ? paths.dashboard() : paths.register())}
        tabIndex={shown ? 0 : -1} className="w-full h-12 rounded-lg bg-brand-900 text-ivory text-[15.5px] font-semibold inline-flex items-center justify-center gap-2 active:scale-[.99] transition"
      >
        {signedIn ? 'Continue learning' : 'Start learning for free'} <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
