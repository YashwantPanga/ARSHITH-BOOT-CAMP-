import React from 'react';
import { ArrowRight } from 'lucide-react';
import { paths } from '../router';

/**
 * Phones: a sticky full-width action bar at the bottom of the screen (Coursera-style) instead of a
 * tab bar - navigation lives in the header menu. Signed out it starts registration; signed in it
 * continues learning. Hidden on the course details page, which has its own enrol button.
 */
export default function MobileBottomNav({ route, navigate, studentUser }) {
  if (route.name === 'course-details') return null;
  const signedIn = !!studentUser;
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-brand-900/10 px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-10px_30px_-18px_rgba(1,58,43,.35)]">
      <button
        onClick={() => navigate(signedIn ? paths.dashboard() : paths.register())}
        className="w-full h-12 rounded-lg bg-brand-900 text-ivory text-[15.5px] font-semibold inline-flex items-center justify-center gap-2 active:scale-[.99] transition"
      >
        {signedIn ? 'Continue learning' : 'Start learning for free'} <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
