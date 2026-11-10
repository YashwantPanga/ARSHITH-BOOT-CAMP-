import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Play } from 'lucide-react';

/**
 * Home: "Start today" section with an arched, endlessly drifting row of tall cards on the inside of a
 * cylinder (CSS 3D: centre cards upright, side cards closer, taller and leaning). The row scrolls right to left, can be
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

// The cards sit on the inside of a cylinder seen from a little behind its axis, so the centre cards
// look upright and the side cards come closer (taller) and lean. Only CSS 3D transforms change per
// frame, which the graphics card handles without repainting the videos.
const PITCH = 196;           // units between card centres (along the cylinder)
const SPEED = 50;            // units per second, right to left
const RADIUS = 900;          // cylinder radius, units
const PERSPECTIVE = 1200;    // units
const CARD_W = 170;
const CARD_H = 280;
const N = CARDS.length;
const TOTAL = N * PITCH;

export default function CourseReel({ onExploreClick }) {
  const bandRef = useRef(null);
  const cardRefs = useRef([]);
  const videoRefs = useRef([]);
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
    let drag = null;
    let last = performance.now();
    let raf = 0;
    let u = 1;
    let onScreen = false;      // is the band itself in the viewport?
    const shown = new Array(N).fill(null);

    // sizes change only on resize; per frame we touch transform alone
    const size = () => {
      const W = band.clientWidth;
      u = W <= 820 ? W / 640 : W / 1440;
      band.style.perspective = `${PERSPECTIVE * u}px`;
      cardRefs.current.forEach(el => {
        if (!el) return;
        el.style.width = `${CARD_W * u}px`;
        el.style.height = `${CARD_H * u}px`;
        el.style.marginLeft = `${(-CARD_W / 2) * u}px`;
        el.style.marginTop = `${(-CARD_H / 2) * u}px`;
        el.style.borderRadius = `${15 * u}px`;
      });
    };

    const play = (i, on) => {
      const v = videoRefs.current[i];
      if (!v) return;
      if (on && onScreen) { if (v.paused) v.play().catch(() => {}); } else if (!v.paused) v.pause();
    };

    const layout = () => {
      const halfW = band.clientWidth / 2;
      for (let i = 0; i < N; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        let t = ((i * PITCH - offset) % TOTAL + TOTAL) % TOTAL;
        if (t > TOTAL / 2) t -= TOTAL;
        const a = t / RADIUS;                                  // angle around the cylinder
        const x = RADIUS * Math.sin(a);
        const z = RADIUS * (1 - Math.cos(a));                  // side cards come towards the viewer
        const scale = PERSPECTIVE / (PERSPECTIVE - z);
        const visible = Math.abs(a) < 1.3 && Math.abs(x * scale * u) - CARD_W * scale * u < halfW + 20;
        if (visible !== shown[i]) {
          shown[i] = visible;
          el.style.visibility = visible ? 'visible' : 'hidden';
          play(i, visible);
        }
        if (!visible) continue;
        el.style.transform = `translate3d(${(x * u).toFixed(2)}px, ${(-12 * (x / 706) ** 2 * u).toFixed(2)}px, ${(z * u).toFixed(2)}px) rotateY(${(-a).toFixed(4)}rad)`;
      }
    };

    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!drag && document.visibilityState === 'visible') {
        if (Math.abs(vel) > 1) { offset += vel * dt; vel *= Math.pow(0.05, dt); }   // coast, losing ~95% per second
        else vel = 0;
        if (!reduced && onScreen) offset += SPEED * dt;
      }
      if (onScreen || drag) layout();
      raf = requestAnimationFrame(frame);
    };

    // only animate and play while the row is on screen
    const io = 'IntersectionObserver' in window
      ? new IntersectionObserver(([e]) => {
          onScreen = e.isIntersecting;
          shown.fill(null);                                    // re-apply play/pause on the next layout
          if (!onScreen) videoRefs.current.forEach(v => v && !v.paused && v.pause());
        }, { rootMargin: '100px 0px' })
      : null;
    if (io) io.observe(band); else onScreen = true;

    const down = (e) => {
      drag = { x: e.clientX, offset, lastX: e.clientX, lastT: performance.now(), v: 0 };
      vel = 0;
      band.setPointerCapture?.(e.pointerId);
      band.classList.add('is-grabbing');
    };
    const move = (e) => {
      if (!drag) return;
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
    size();
    window.addEventListener('resize', size);
    band.addEventListener('pointerdown', down);
    band.addEventListener('pointermove', move);
    band.addEventListener('pointerup', up);
    band.addEventListener('pointercancel', up);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      window.removeEventListener('resize', size);
      band.removeEventListener('pointerdown', down);
      band.removeEventListener('pointermove', move);
      band.removeEventListener('pointerup', up);
      band.removeEventListener('pointercancel', up);
    };
  }, [near]);

  return (
    <section className="course-reel relative z-[2] overflow-hidden bg-ivory py-14 sm:py-20">
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
            <div key={c.label} ref={(el) => { cardRefs.current[i] = el; }} className="reel-card absolute left-1/2 top-1/2 overflow-hidden bg-[#E6EFE9]" style={{ visibility: 'hidden' }}>
              {near && (
                <video ref={(v) => { videoRefs.current[i] = v; }} className="reel-video absolute inset-0 w-full h-full object-cover" src={c.video} muted loop playsInline preload="auto"
                  onLoadedData={(e) => e.currentTarget.classList.add('is-ready')} aria-label={c.label} />
              )}
              <span className="reel-play absolute left-3 bottom-3 w-8 h-8 rounded-full bg-black/25 border border-white/40 flex items-center justify-center text-white"><Play className="w-3.5 h-3.5 fill-current" /></span>
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
