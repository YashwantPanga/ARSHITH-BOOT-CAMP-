import React, { useEffect, useRef, useState } from 'react';
import { Share2, Copy, Check, RotateCcw, QrCode } from 'lucide-react';

/**
 * Phones: the referral pass is "printed" by a small CodeLekho machine. Tap the gold button, the pass
 * feeds out of the slot (soft blur clearing as it prints), the machine drops away, a hand takes the pass
 * and the Share button appears. Once printed, later visits open on the finished pass.
 */
const MADE_KEY = 'cl_pass_printed';
const made = () => { try { return localStorage.getItem(MADE_KEY) === '1'; } catch { return false; } };
const markMade = () => { try { localStorage.setItem(MADE_KEY, '1'); } catch { /* ignore */ } };
const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function Pass({ code, firstName, discountPct, art }) {
  return (
    <div className="pass-card relative w-[248px] h-[318px] text-ivory">
      <div className="absolute inset-0 pass-shape bg-[linear-gradient(165deg,#24946C_0%,#13684C_45%,#0B3D2E_100%)]" />
      <div className="absolute inset-[7px] pass-shape border border-[#E5C88E]/45" />
      <div className="absolute inset-0 pass-shape bg-[radial-gradient(70%_45%_at_50%_30%,rgba(229,200,142,.22),transparent_70%)]" />
      <div className="relative h-full flex flex-col items-center px-5 pt-4 pb-5 text-center">
        <span className="text-[9.5px] font-bold tracking-[0.32em] text-[#E5C88E]/90">CODELEKHO · PASS</span>
        <div className="w-[170px] -mt-1">{art}</div>
        <p className="-mt-2 font-display text-[19px] font-bold leading-[1.15]">Hey friend, {discountPct}% off<br />your first course</p>
        <p className="mt-1 text-[11.5px] text-ivory/70">a gift from {firstName}</p>
        <div className="mt-auto w-full border-t border-dashed border-white/25 pt-2.5 flex items-center justify-between">
          <span className="text-[9.5px] font-bold tracking-[0.2em] text-ivory/55">CODE</span>
          <span className="ref-foil font-mono text-[20px] font-bold tracking-[0.14em]">{code}</span>
        </div>
      </div>
    </div>
  );
}


export default function ReferralTicket({ code, link, firstName = 'a friend', discountPct = 10, commissionPct = 10, art, qr, onShare }) {
  // idle -> printing -> handoff -> ready
  const [stage, setStage] = useState(() => (made() || reduced() ? 'ready' : 'idle'));
  const [copied, setCopied] = useState('');
  const [showQr, setShowQr] = useState(false);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const print = () => {
    if (stage === 'printing' || stage === 'handoff') return;
    try { navigator.vibrate?.(25); } catch { /* ignore */ }
    if (reduced()) { setStage('ready'); markMade(); return; }
    setStage('printing');
    timers.current.push(setTimeout(() => setStage('handoff'), 2300));
    timers.current.push(setTimeout(() => { setStage('ready'); markMade(); }, 3300));
  };
  const copy = async (what, text) => { try { await navigator.clipboard.writeText(text); setCopied(what); setTimeout(() => setCopied(''), 1400); } catch { /* blocked */ } };
  const out = stage === 'handoff' || stage === 'ready';

  return (
    <section className="md:hidden -mx-5 mt-5 relative overflow-hidden bg-[#06231D] text-ivory px-5 pt-7 pb-8">
      <div className="absolute inset-0 bg-[radial-gradient(60%_42%_at_50%_52%,rgba(36,148,108,.45),transparent_75%)]" aria-hidden="true" />
      <div className="relative text-center">
        <p className="font-display text-[21px] font-bold">Earn {commissionPct}% on every referral</p>
        <p className="mt-1 text-[13px] text-ivory/60">Your friends save {discountPct}% · no limit on what you earn</p>
      </div>

      <div className="relative mx-auto mt-6 h-[400px] w-[260px]">
        {/* the machine */}
        <div className={`pass-machine absolute left-1/2 top-2 -translate-x-1/2 w-[236px] h-[300px] rounded-[30px] bg-[linear-gradient(180deg,#FFFDF7,#ECE6D6)] shadow-[0_30px_60px_-24px_rgba(0,0,0,.8),inset_0_-6px_0_rgba(0,0,0,.06)] ${out ? 'is-gone' : ''}`}>
          <span className={`absolute left-5 top-5 w-2.5 h-2.5 rounded-full ${stage === 'printing' ? 'bg-[#E5C88E] animate-pulse' : 'bg-[#2BB673]'} shadow-[0_0_10px_currentColor]`} />
          <span className="absolute right-5 top-4 text-right text-[9px] font-bold leading-tight tracking-[0.14em] text-[#0C2D26]/30">CODELEKHO<br />PASSES</span>
          {/* slot */}
          <span className="absolute left-4 right-4 top-[62px] h-[10px] rounded-full bg-[#0C2D26] shadow-[inset_0_3px_4px_rgba(0,0,0,.6)]" />
          {/* button */}
          <button
            onClick={print}
            disabled={stage === 'printing'}
            className="pass-button absolute left-1/2 top-[132px] -translate-x-1/2 w-[104px] h-[104px] rounded-full bg-[radial-gradient(circle_at_35%_30%,#FFF1C9,#E5C88E_45%,#B88A3E)] shadow-[0_10px_0_#8A6420,0_18px_30px_-8px_rgba(0,0,0,.45)] active:translate-y-[6px] active:shadow-[0_4px_0_#8A6420] transition-[transform,box-shadow] duration-100 flex items-center justify-center"
            aria-label="Create my referral pass"
          >
            <span className="w-[62px] h-[62px] rounded-full border-2 border-[#8A6420]/30 flex items-center justify-center text-[#5C4313] text-[30px] font-light leading-none">+</span>
          </button>
          <span className="absolute left-0 right-0 bottom-6 text-center text-[11px] font-extrabold tracking-[0.22em] text-[#8A6420]">TAP TO CREATE</span>
        </div>

        {/* the pass: fed out of the slot, then handed over */}
        {stage !== 'idle' && (
          <div className={`absolute left-1/2 -translate-x-1/2 top-[73px] w-[260px] ${stage === 'printing' ? 'h-[340px] overflow-hidden' : 'overflow-visible'}`}>
            <div className={`pass-feed mx-auto w-[248px] ${stage === 'printing' ? 'is-printing' : 'is-out'} ${stage === 'ready' ? 'is-ready' : ''}`}>
              <div className="relative">
                <Pass code={code} firstName={firstName} discountPct={discountPct} art={art} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={`relative mt-2 flex flex-col items-center transition-all duration-500 ${stage === 'ready' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <button onClick={onShare} className="pass-share h-[52px] px-8 rounded-full bg-gradient-to-b from-[#2BB673] to-[#13684C] text-white font-display text-[16px] font-bold inline-flex items-center gap-2 shadow-[0_0_0_4px_rgba(43,182,115,.18),0_14px_30px_-10px_rgba(43,182,115,.8)]">
          <Share2 className="w-[18px] h-[18px]" /> Share pass
        </button>
        <p className="mt-3 text-[12px] text-ivory/55 text-center">You earn {commissionPct}% and your friend saves {discountPct}% on every course they buy</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button onClick={() => copy('code', code)} className="h-9 px-3.5 rounded-full bg-white/[.08] border border-white/15 text-[12.5px] font-semibold inline-flex items-center gap-1.5">{copied === 'code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied === 'code' ? 'Copied' : 'Code'}</button>
          <button onClick={() => copy('link', link)} className="h-9 px-3.5 rounded-full bg-white/[.08] border border-white/15 text-[12.5px] font-semibold inline-flex items-center gap-1.5">{copied === 'link' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied === 'link' ? 'Copied' : 'Link'}</button>
          {qr && <button onClick={() => setShowQr(v => !v)} className="h-9 px-3.5 rounded-full bg-white/[.08] border border-white/15 text-[12.5px] font-semibold inline-flex items-center gap-1.5"><QrCode className="w-3.5 h-3.5" /> QR</button>}
          <button onClick={() => { setStage('idle'); timers.current.push(setTimeout(print, 350)); }} className="h-9 px-3.5 rounded-full bg-white/[.08] border border-white/15 text-[12.5px] font-semibold inline-flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" /> Print again</button>
        </div>
        {showQr && qr && <img src={qr} alt={`QR code for ${link}`} className="mt-4 w-36 h-36 rounded-xl bg-white p-1.5" />}
      </div>
    </section>
  );
}
