import React, { useEffect, useRef } from 'react';
import { ArrowRight, Play } from 'lucide-react';

/**
 * Home: "Start today" section with an arched, endlessly drifting row of tall cards (like the inside of a
 * cylinder: centre cards upright, edge cards taller and leaning). The row scrolls right to left, can be
 * dragged or flung, and coasts back into its slow drift. Cards play free Pexels stock clips (coding,
 * students) plus two live scenes (code typing, a certificate being stamped).
 */

/* ---------- live card scenes ---------- */

function CodeScene() {
  const lines = [
    ['kw', 'def '], ['fn', 'grade'], ['op', '(score):'],
    ['br'], ['sp', '    '], ['kw', 'if '], ['op', 'score >= '], ['num', '70'], ['op', ':'],
    ['br'], ['sp', '        '], ['kw', 'return '], ['str', '"Certified"'],
    ['br'], ['sp', '    '], ['kw', 'return '], ['str', '"Keep going"'],
    ['br'], ['br'], ['fn', 'print'], ['op', '(grade('], ['num', '86'], ['op', '))']
  ];
  const rows = [[]];
  lines.forEach(t => (t[0] === 'br' ? rows.push([]) : rows[rows.length - 1].push(t)));
  return (
    <div className="absolute inset-0 bg-[#0C2D26] p-[9%] font-mono text-[#E9F1EC]">
      <div className="flex gap-1.5 mb-[10%]"><i className="w-2 h-2 rounded-full bg-[#5F8574]" /><i className="w-2 h-2 rounded-full bg-[#90B1A2]" /><i className="w-2 h-2 rounded-full bg-[#BCD1C6]" /></div>
      <div className="reel-code text-[10.5px] leading-[1.75]">
        {rows.map((r, k) => (
          <div key={k} className="reel-type whitespace-pre overflow-hidden" style={{ '--d': `${k * 0.45}s` }}>
            {r.length ? r.map(([t, v], j) => <span key={j} className={t === 'sp' ? '' : `tok-${t}`}>{v}</span>) : ' '}
          </div>
        ))}
        <div className="reel-type mt-[12%] text-[#A8D8B9]" style={{ '--d': '2.9s' }}>Certified</div>
      </div>
    </div>
  );
}

function CertScene() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-[#0E5C45] to-[#013A2B] p-[10%] flex items-center justify-center">
      <div className="relative w-full rounded-lg bg-[#FBF8F1] p-3 shadow-xl">
        <p className="text-[7px] font-bold tracking-[0.2em] text-sage">CODELEKHO</p>
        <p className="mt-1 font-display text-[12px] font-semibold text-evergreen leading-tight">Certificate of Completion</p>
        <div className="mt-2 h-1 w-3/4 rounded bg-brand-100" /><div className="mt-1 h-1 w-1/2 rounded bg-brand-100" />
        <div className="mt-3 flex items-end justify-between">
          <span className="grid grid-cols-4 gap-[2px] w-8" aria-hidden="true">
            {[1,0,1,1,0,1,0,1,1,1,0,0,1,0,1,1].map((b, k) => <i key={k} className={`aspect-square ${b ? 'bg-evergreen' : 'bg-transparent'}`} />)}
          </span>
          <span className="reel-stamp px-1.5 py-0.5 rounded border-2 border-[#2F7A5C] text-[#2F7A5C] text-[9px] font-bold tracking-[0.12em] -rotate-12">VERIFIED</span>
        </div>
      </div>
    </div>
  );
}

// Free stock clips from Pexels (pexels.com/license: free to use, no attribution needed), 360x640 files.
const V = (path) => `https://videos.pexels.com/video-files/${path}`;
const CARDS = [
  { video: V('34459460/14601221_360_640_25fps.mp4'), label: 'HTML code on a monitor' },
  { video: V('6145960/6145960-sd_360_640_24fps.mp4'), label: 'Student on a laptop' },
  { video: V('33315143/14188172_360_640_25fps.mp4'), label: 'Neon coding setup' },
  { scene: CodeScene, label: 'Live code' },
  { video: V('12893579/12893579-sd_360_640_24fps.mp4'), label: 'Hands typing' },
  { video: V('8198819/8198819-sd_360_640_25fps.mp4'), label: 'Studying in a library' },
  { video: V('33314914/14188112_360_640_25fps.mp4'), label: 'Code on screen' },
  { scene: CertScene, label: 'Certificate' },
  { video: V('38993329/16589274_360_640_25fps.mp4'), label: 'Mechanical keyboard' },
  { video: V('32259631/13758054_360_640_25fps.mp4'), label: 'Desk setup' }
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
          const Scene = c.scene;
          return (
            <div key={c.label} ref={(el) => { cardRefs.current[i] = el; }} className="reel-card absolute left-0 top-0 overflow-hidden bg-[#E6EFE9]" style={{ visibility: 'hidden' }}>
              {Scene ? <Scene /> : (
                <video className="reel-video absolute inset-0 w-full h-full object-cover" src={c.video} muted loop playsInline autoPlay preload="metadata"
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
