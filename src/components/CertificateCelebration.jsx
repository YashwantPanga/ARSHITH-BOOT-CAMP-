import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

const COLORS = ['#013A2B', '#426557', '#5F8574', '#90B1A2', '#D9B44A', '#F3E3A6'];

/**
 * Celebration for passing the final assessment: a sunburst seal spins in, laurel branches draw
 * themselves around it, a miniature certificate rises out with a light sweep, and two side
 * cannons fire star-and-ribbon confetti in waves. Reduced-motion users get the static seal.
 */
export default function CertificateCelebration({ name, courseTitle, percentage }) {
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const fire = (opts) => confetti({ colors: COLORS, ticks: 260, gravity: 0.9, scalar: 1.05, zIndex: 300, ...opts });
    const timers = [
      setTimeout(() => fire({ particleCount: 70, angle: 60, spread: 58, startVelocity: 58, origin: { x: 0, y: 0.75 }, shapes: ['star', 'square'] }), 350),
      setTimeout(() => fire({ particleCount: 70, angle: 120, spread: 58, startVelocity: 58, origin: { x: 1, y: 0.75 }, shapes: ['star', 'square'] }), 500),
      setTimeout(() => fire({ particleCount: 120, spread: 360, startVelocity: 28, origin: { x: 0.5, y: 0.32 }, shapes: ['star'], scalar: 1.25 }), 1150),
      setTimeout(() => fire({ particleCount: 40, angle: 90, spread: 120, startVelocity: 40, origin: { x: 0.5, y: 1 }, shapes: ['circle'] }), 1900)
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const rays = Array.from({ length: 24 }, (_, i) => i * 15);
  const leaves = [0, 1, 2, 3, 4, 5];

  return (
    <div className="relative mx-auto w-[260px] h-[230px]" aria-hidden="true">
      {/* sunburst */}
      <svg viewBox="0 0 200 200" className="absolute left-1/2 top-0 -ml-[100px] w-[200px] h-[200px] cel-spin-slow opacity-70">
        {rays.map(a => <path key={a} d="M100 100 L96 4 L104 4 Z" fill={a % 30 ? '#F3E3A6' : '#D9B44A'} opacity="0.55" transform={`rotate(${a} 100 100)`} />)}
      </svg>

      {/* laurel branches */}
      <svg viewBox="0 0 200 200" className="absolute left-1/2 top-0 -ml-[100px] w-[200px] h-[200px]">
        {[1, -1].map(side => (
          <g key={side} transform={side === -1 ? 'translate(200 0) scale(-1 1)' : undefined}>
            <path d="M64 174 C22 156 8 112 20 64" fill="none" stroke="#426557" strokeWidth="3" strokeLinecap="round" className="cel-draw" style={{ '--len': 130 }} />
            {leaves.map(i => {
              const t = i / 5; const x = 58 - 38 * t - 6 * Math.sin(t * 3); const y = 170 - 100 * t;
              return <ellipse key={i} cx={x - 7} cy={y} rx="9" ry="4" fill="#5F8574" transform={`rotate(${-35 - 25 * t} ${x - 7} ${y})`} className="cel-rise" style={{ animationDelay: `${0.7 + i * 0.12}s` }} />;
            })}
          </g>
        ))}
      </svg>

      {/* seal */}
      <div className="cel-seal-in absolute left-1/2 top-[44px] -ml-[56px] w-[112px] h-[112px]">
        <svg viewBox="0 0 112 112" className="w-full h-full drop-shadow-[0_10px_18px_rgba(1,58,43,.45)]">
          <path d={Array.from({ length: 32 }, (_, i) => { const r = i % 2 ? 50 : 56; const a = (i / 32) * Math.PI * 2; return `${i ? 'L' : 'M'}${56 + r * Math.cos(a)} ${56 + r * Math.sin(a)}`; }).join(' ') + 'Z'} fill="#013A2B" />
          <circle cx="56" cy="56" r="42" fill="#D9B44A" />
          <circle cx="56" cy="56" r="36" fill="none" stroke="#013A2B" strokeWidth="1.2" strokeDasharray="2 3" />
          <path d="M40 57 L51 68 L73 45" fill="none" stroke="#013A2B" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" className="cel-draw" style={{ '--len': 60, animationDelay: '1s' }} />
        </svg>
        {/* ribbons */}
        <span className="absolute left-[30px] top-[96px] w-4 h-10 bg-forest [clip-path:polygon(0_0,100%_0,100%_100%,50%_80%,0_100%)] -rotate-12 -z-10" />
        <span className="absolute right-[30px] top-[96px] w-4 h-10 bg-sage [clip-path:polygon(0_0,100%_0,100%_100%,50%_80%,0_100%)] rotate-12 -z-10" />
      </div>

      {/* miniature certificate */}
      <div className="cel-rise absolute left-1/2 bottom-0 -ml-[110px] w-[220px] rounded-lg bg-ivory border border-[#D9B44A]/60 shadow-lg px-3 py-2 text-center overflow-hidden" style={{ animationDelay: '1.3s' }}>
        <span className="cel-shine pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/80 to-transparent" />
        <p className="text-[8px] font-bold tracking-[0.22em] uppercase text-sage">Certificate of completion</p>
        <p className="font-display text-[15px] leading-tight text-forest truncate">{name}</p>
        <p className="text-[9px] text-charcoal/60 truncate">{courseTitle}{percentage != null ? ` · ${percentage}%` : ''}</p>
      </div>
    </div>
  );
}
