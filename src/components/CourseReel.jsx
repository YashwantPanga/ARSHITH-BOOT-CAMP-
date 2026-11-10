import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Play } from 'lucide-react';

/**
 * Home: "Start today" section with an arched, endlessly drifting row of tall cards (like the inside of a
 * cylinder: centre cards upright, edge cards taller and leaning). The row scrolls right to left, can be
 * dragged or flung, and coasts back into its slow drift. Every card plays a free Pexels stock clip
 * (coding, students), loaded only once the section comes near the screen.
 */

// Free stock clips from Pexels (pexels.com/license: free to use, no attribution needed), 540x960,
// served from public/reel so the site does not depend on Pexels' servers.
const CARDS = [
  { video: '/reel/html-code.mp4', label: 'HTML code on a monitor' },
  { video: '/reel/student-laptop.mp4', label: 'Student on a laptop' },
  { video: '/reel/neon-setup.mp4', label: 'Neon coding setup' },
  { video: '/reel/typing-top.mp4', label: 'Typing on a laptop' },
  { video: '/reel/hands-typing.mp4', label: 'Hands typing' },
  { video: '/reel/library-study.mp4', label: 'Studying in a library' },
  { video: '/reel/code-screen.mp4', label: 'Code on screen' },
  { video: '/reel/stairs-laptop.mp4', label: 'Learning on the go' },
  { video: '/reel/keyboard.mp4', label: 'Mechanical keyboard' },
  { video: '/reel/desk-setup.mp4', label: 'Desk setup' }
];

/* ---------- the arched row ---------- */

const PITCH = 196;           // units between card centres
const SPEED = 50;            // units per second, right to left
const N = CARDS.length;
const TOTAL = N * PITCH;

/** Rounded quad: left edge from yL0 to yL1, right edge from yR0 to yR1, in a box `w` wide. */
function quadPath(w, yL0, yL1, yR0, yR1, r) {
  const k = r / w;
  return `path('M 0 ${yL0 + r} Q 0 ${yL0} ${r} ${yL0 + (yR0 - yL0) * k} L ${w - r} ${yR0 - (yR0 - yL0) * k} Q ${w} ${yR0} ${w} ${yR0 + r} `
    + `L ${w} ${yR1 - r} Q ${w} ${yR1} ${w - r} ${yR1 - (yR1 - yL1) * k} L ${r} ${yL1 + (yR1 - yL1) * k} Q 0 ${yL1} 0 ${yL1 - r} Z')`;
}

export default function CourseReel({ onExploreClick }) {
  const bandRef = useRef(null);
  const cardRefs = useRef([]);
  const [near, setNear] = useState(false); // load the videos only when the section is close to the screen

  useEffect(() => {
    const band = bandRef.current;
    if (!band || near) return undefined;
    if (!('IntersectionObserver' in window)) { setNear(true); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } }, { rootMargin: '600px 0px' });
    io.observe(band);
    return () => io.disconnect();
  }, [near]);

  useEffect(() => {
    const band = bandRef.current;
    if (!band) return undefined;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let offset = 0;            // units; grows leftwards
    let vel = 0;               // units per second from a fling
    let drag = null;           // { x, offset, t, lastX, lastT }
    let last = performance.now();
    let raf = 0;

    const layout = () => {
      const W = band.clientWidth;
      const phone = W <= 820;
      const u = phone ? W / 640 : W / 1440;
      const H = band.clientHeight;
      const centreY = H / 2;
      for (let i = 0; i < N; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        let t = ((i * PITCH - offset) % TOTAL + TOTAL) % TOTAL;
        if (t > TOTAL / 2) t -= TOTAL;
        const x = t * (1 + 0.083 * (t / 706) ** 2);           // pushed outward towards the edges
        const d = Math.abs(x) / 706;
        const w = 170 + 48 * d * d;
        const xl = x - w / 2; const xr = x + w / 2;
        const hL = 280 + 92 * (Math.abs(xl) / 706) ** 2.6;
        const hR = 280 + 92 * (Math.abs(xr) / 706) ** 2.6;
        const cy = centreY / u - 12 * d * d;
        const top = cy - Math.max(hL, hR) / 2;
        const pxW = w * u;
        const yL0 = (cy - hL / 2 - top) * u; const yL1 = (cy + hL / 2 - top) * u;
        const yR0 = (cy - hR / 2 - top) * u; const yR1 = (cy + hR / 2 - top) * u;
        const boxH = Math.max(hL, hR) * u;
        const left = W / 2 + xl * u;
        if (left > W + 40 || left + pxW < -40) { el.style.visibility = 'hidden'; continue; }
        el.style.visibility = 'visible';
        el.style.transform = `translate3d(${left}px, ${top * u}px, 0)`;
        el.style.width = `${pxW}px`;
        el.style.height = `${boxH}px`;
        el.style.clipPath = quadPath(pxW, yL0, yL1, yR0, yR1, 15 * u);
      }
    };

    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!drag && document.visibilityState === 'visible') {
        if (Math.abs(vel) > 1) { offset += vel * dt; vel *= Math.pow(0.05, dt); }   // coast, losing ~95% per second
        else vel = 0;
        if (!reduced) offset += SPEED * dt;
      }
      layout();
      raf = requestAnimationFrame(frame);
    };

    const unit = () => { const W = band.clientWidth; return W <= 820 ? W / 640 : W / 1440; };
    const down = (e) => {
      drag = { x: e.clientX, offset, lastX: e.clientX, lastT: performance.now(), v: 0 };
      vel = 0;
      band.setPointerCapture?.(e.pointerId);
      band.classList.add('is-grabbing');
    };
    const move = (e) => {
      if (!drag) return;
      const u = unit();
      offset = drag.offset - (e.clientX - drag.x) / u;          // follows the pointer 1:1
      const now = performance.now();
      const dts = Math.max(0.001, (now - drag.lastT) / 1000);
      drag.v = -((e.clientX - drag.lastX) / u) / dts;
      drag.lastX = e.clientX; drag.lastT = now;
    };
    const up = () => {
      if (!drag) return;
      vel = Math.max(-3000, Math.min(3000, drag.v || 0));
      drag = null;
      band.classList.remove('is-grabbing');
    };
    band.addEventListener('pointerdown', down);
    band.addEventListener('pointermove', move);
    band.addEventListener('pointerup', up);
    band.addEventListener('pointercancel', up);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      band.removeEventListener('pointerdown', down);
      band.removeEventListener('pointermove', move);
      band.removeEventListener('pointerup', up);
      band.removeEventListener('pointercancel', up);
    };
  }, []);

  return (
    <section className="course-reel relative overflow-hidden py-14 sm:py-20">
      <div className="relative max-w-3xl mx-auto px-4 text-center">
        <span className="reel-in inline-flex items-center gap-2 h-9 px-4 rounded-full bg-[#DAE7C7] text-forest text-[14px] font-semibold" style={{ '--d': '0s' }}>Courses from ₹99 · learn at your own pace</span>
        <h2 className="mt-5 font-display text-[36px] sm:text-[54px] lg:text-[64px] font-bold leading-[1.04] tracking-[-0.035em] text-evergreen">
          <span className="reel-in block" style={{ '--d': '.1s' }}>Start today.</span>
          <span className="reel-in block tracking-[-0.022em]" style={{ '--d': '.2s' }}>Finish with a certificate.</span>
        </h2>
        <p className="reel-in mt-4 text-[16px] sm:text-[18px] leading-relaxed text-charcoal/65 max-w-xl mx-auto" style={{ '--d': '.3s' }}>
          Practical courses, real assessments and a credential with your exact score and a unique ID employers can verify online.
        </p>
      </div>

      {/* the arched, draggable row */}
      <div ref={bandRef} className="reel-band relative mt-8 sm:mt-10 h-[250px] md:h-[420px] select-none touch-pan-y" aria-label="Course highlights">
        {CARDS.map((c, i) => {
          return (
            <div key={c.label} ref={(el) => { cardRefs.current[i] = el; }} className="reel-card absolute left-0 top-0 overflow-hidden bg-[#E6EFE9]" style={{ visibility: 'hidden' }}>
              {near && (
                <video className="reel-video absolute inset-0 w-full h-full object-cover" src={c.video} muted loop playsInline autoPlay preload="auto"
                  onLoadedData={(e) => e.currentTarget.classList.add('is-ready')} aria-label={c.label} />
              )}
              <span className="reel-play absolute left-3 bottom-3 w-8 h-8 rounded-full bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center text-white"><Play className="w-3.5 h-3.5 fill-current" /></span>
            </div>
          );
        })}
      </div>

      <div className="relative mt-8 sm:mt-10 flex justify-center">
        <span className="reel-in relative inline-flex p-[7px] rounded-full border-2 border-dashed border-forest/40" style={{ '--d': '.45s' }}>
          <button onClick={onExploreClick} className="h-[54px] px-7 rounded-full bg-forest text-ivory font-display text-[16px] font-semibold inline-flex items-center gap-2 hover:bg-evergreen transition-colors">
            Choose your course <ArrowRight className="w-4 h-4" />
          </button>
        </span>
      </div>
    </section>
  );
}
