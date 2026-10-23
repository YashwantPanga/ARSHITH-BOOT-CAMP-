import React from 'react';
import { Home } from 'lucide-react';

/**
 * Floating "Home" button shown on every page except the home page. A forest-green orb with a
 * soft halo; on hover/focus it widens into a pill that reads "Home". Sits above the mobile
 * bottom navigation when that bar is shown.
 */
export default function HomeButton({ onClick, aboveBottomNav }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Go to home page"
      title="Home"
      className={`home-fab group fixed right-4 sm:right-6 z-40 flex items-center h-12 pl-[14px] pr-[14px] rounded-full text-ivory bg-gradient-to-br from-[#0B5A43] via-forest to-evergreen border border-white/15 shadow-[0_14px_30px_-12px_rgba(1,58,43,.75),inset_0_1px_0_rgba(255,255,255,.18)] hover:pr-5 focus-visible:pr-5 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 focus-visible:ring-offset-ivory ${aboveBottomNav ? 'bottom-[84px] md:bottom-6' : 'bottom-5 sm:bottom-6'}`}
    >
      <span className="home-fab-halo pointer-events-none absolute inset-0 rounded-full" aria-hidden="true" />
      <Home className="relative w-5 h-5 shrink-0 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" strokeWidth={2.2} />
      <span className="relative max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold tracking-wide opacity-0 group-hover:max-w-[60px] group-hover:ml-2 group-hover:opacity-100 group-focus-visible:max-w-[60px] group-focus-visible:ml-2 group-focus-visible:opacity-100 transition-all duration-300">Home</span>
    </button>
  );
}
