import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Eye, Hand, ScanFace, Smartphone, UserCheck, Users } from 'lucide-react';
import { handNearFace, matchPercent } from '../../utils/aiProctor';

/**
 * Live proctoring panel shown during the exam (bottom-right). The camera preview carries the
 * detections drawn on top - faces (green = you, red = someone else), phones (red) and hands
 * (amber) - and a row of status chips underneath. Collapses to a small badge.
 * live: latest analyzeFrame() result (or null while warming up).
 */
export default function ProctorPanel({ attachVideo, live, alert }) {
  const canvas = useRef(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !live) return;
    const ctx = c.getContext('2d');
    c.width = live.width; c.height = live.height;
    ctx.clearRect(0, 0, c.width, c.height);
    const lw = Math.max(2, live.width / 160);
    const box = (b, color, label) => {
      ctx.strokeStyle = color; ctx.lineWidth = lw;
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(b.x, b.y, b.width, b.height, lw * 3); else ctx.rect(b.x, b.y, b.width, b.height); ctx.stroke();
      if (label) {
        // the canvas is mirrored with the video, so flip text back to read normally
        ctx.save(); ctx.scale(-1, 1);
        ctx.font = `600 ${Math.round(lw * 6)}px DM Sans, system-ui, sans-serif`;
        const w = ctx.measureText(label).width + lw * 4;
        const x = -(b.x + b.width);
        ctx.fillStyle = color; ctx.fillRect(x, b.y - lw * 9, w, lw * 9);
        ctx.fillStyle = '#fff'; ctx.fillText(label, x + lw * 2, b.y - lw * 2.4);
        ctx.restore();
      }
    };
    live.faces.forEach((f, i) => box(f.box, f.same === false || i > 0 ? '#E11D48' : '#10B981', i > 0 ? 'Extra person' : f.same === false ? 'Not you' : f.distance != null ? `You ${matchPercent(f.distance)}%` : 'Face'));
    live.phones.forEach(p => box(p, '#E11D48', 'Phone'));
    live.hands.forEach(h => box(h, '#F59E0B', live.faces[0] && handNearFace(h, live.faces[0].box) ? 'Hand near face' : 'Hand'));
    // irises: cyan when the eyes are on the screen, red when looking down/away
    const off = live.gazeState && (live.gazeState.down || live.gazeState.away);
    (live.gaze?.irises || []).forEach(pt => {
      ctx.beginPath(); ctx.arc(pt.x, pt.y, lw * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = off ? '#E11D48' : '#22D3EE'; ctx.fill();
      ctx.lineWidth = lw * 0.8; ctx.strokeStyle = '#fff'; ctx.stroke();
    });
  }, [live]);

  const face = live?.faces[0];
  const chips = live ? [
    { icon: ScanFace, label: live.faces.length ? 'Face visible' : 'No face', bad: !live.faces.length },
    { icon: Users, label: `${Math.max(live.faces.length, live.meshFaces || 0, live.people)} ${Math.max(live.faces.length, live.meshFaces || 0, live.people) === 1 ? 'person' : 'people'}`, bad: Math.max(live.faces.length, live.meshFaces || 0) > 1 || live.people > 1 },
    { icon: UserCheck, label: face?.distance != null ? `Identity ${matchPercent(face.distance)}%` : 'Identity -', bad: face?.same === false },
    { icon: Smartphone, label: live.phones.length ? 'Phone seen' : 'No phone', bad: live.phones.length > 0 },
    { icon: Eye, label: !live.gazeState ? 'Eyes -' : live.gazeState.down ? 'Looking down' : live.gazeState.away ? 'Looking away' : 'Eyes on screen', bad: !!(live.gazeState?.down || live.gazeState?.away) },
    { icon: Hand, label: live.hands.length ? `${live.hands.length} hand${live.hands.length > 1 ? 's' : ''}` : 'No hands', warn: live.hands.length > 0 && face && live.hands.some(h => handNearFace(h, face.box)) }
  ] : [];
  const anyBad = !!alert;

  return (
    <div className={`fixed right-3 bottom-3 sm:right-5 sm:bottom-5 z-[115] w-[232px] rounded-2xl overflow-hidden bg-slate-950 shadow-2xl ring-2 transition-colors ${anyBad ? 'ring-rose-500 proctor-alert' : 'ring-mint-300/70'}`}>
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-white/90 bg-white/5">
        <span className={`w-2 h-2 rounded-full ${anyBad ? 'bg-rose-500' : 'bg-mint-300'} animate-pulse`} />
        AI proctoring {live ? 'live' : 'starting…'}
        {open ? <ChevronDown className="w-3.5 h-3.5 ml-auto" /> : <ChevronUp className="w-3.5 h-3.5 ml-auto" />}
      </button>
      <div className={open ? '' : 'hidden'}>
        <div className="relative aspect-[4/3] -scale-x-100">
          <video ref={attachVideo} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover" />
          <canvas ref={canvas} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
        </div>
        <div className="p-2 grid grid-cols-2 gap-1">
          {chips.map(({ icon: Icon, label, bad, warn }) => (
            <span key={label} className={`flex items-center gap-1 rounded-md px-1.5 py-1 text-[10.5px] font-medium ${bad ? 'bg-rose-500/20 text-rose-200' : warn ? 'bg-amber-400/20 text-amber-200' : 'bg-white/5 text-white/75'}`}>
              <Icon className="w-3 h-3 shrink-0" /> <span className="truncate">{label}</span>
            </span>
          ))}
          {!live && <span className="col-span-2 text-[10.5px] text-white/60 px-1">Warming up detection…</span>}
        </div>
      </div>
    </div>
  );
}
