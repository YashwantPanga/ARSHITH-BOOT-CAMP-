import React, { forwardRef, useId } from 'react';
import { svgToPngBlob, savePng } from '../../utils/shareCard';

/**
 * The college gift voucher the admin shares with a partner college: big "Gift", a "VOUCHER" ribbon,
 * the CodeLekho logo, the offer, and on the right a seal with the discount, a "COUPON" band, the code
 * and the validity date. Drawn as one SVG (1000 x 420) so it looks the same everywhere and can be
 * downloaded as a PNG (see downloadVoucherPng).
 */
export const THEMES = {
  emerald: { label: 'Emerald', bg: ['#1F7A57', '#0B3A2B'], right: ['#0D3A2D', '#14533F'], wave: '#FFFFFF', line: '#E5C88E', gift: '#FFFDF7', ribbon: ['#FBE3A6', '#C9A15A'], ribbonText: '#0C2D26', band: '#06231D', bandText: '#E5C88E', text: '#FFFDF7', soft: 'rgba(255,253,247,.72)', accent: '#E5C88E', seal: '#FFFDF7', sealText: '#0C3B2E', sealSub: '#B88A3E', rText: '#FFFDF7', rSoft: 'rgba(255,253,247,.65)', rAccent: '#E5C88E' },
  midnight: { label: 'Midnight', bg: ['#123A2F', '#04120D'], right: ['#0A2019', '#163F33'], wave: '#8EE3B5', line: '#E5C88E', gift: '#FFFDF7', ribbon: ['#FBE3A6', '#C9A15A'], ribbonText: '#06231D', band: '#E5C88E', bandText: '#06231D', text: '#FFFDF7', soft: 'rgba(255,253,247,.68)', accent: '#8EE3B5', seal: '#0F3A2D', sealText: '#F3D9A0', sealSub: '#8EE3B5', rText: '#FFFDF7', rSoft: 'rgba(255,253,247,.62)', rAccent: '#8EE3B5' },
  gold: { label: 'Gold', bg: ['#F7E3B5', '#D2AC66'], right: ['#B88A3E', '#8A6420'], wave: '#FFFFFF', line: '#0C2D26', gift: '#0C2D26', ribbon: ['#145A43', '#0C2D26'], ribbonText: '#F3D9A0', band: '#0C2D26', bandText: '#F3D9A0', text: '#0C2D26', soft: 'rgba(12,45,38,.72)', accent: '#0C2D26', seal: '#FFFDF7', sealText: '#0C2D26', sealSub: '#8A6420', rText: '#FFFDF7', rSoft: 'rgba(255,253,247,.7)', rAccent: '#F3D9A0' }
};

const fmt = (iso) => new Date(iso).toLocaleDateString('en-GB'); // 31/12/2026

const CollegeVoucher = forwardRef(function CollegeVoucher({ code, discountPct, college, endsAt, serial = '0001', covers = 'all courses', site = 'codelekho.com', theme = 'emerald', layout = 'landscape', className = '' }, ref) {
  const t = THEMES[theme] || THEMES.emerald;
  const id = `cv${useId().replace(/:/g, '')}`;
  const font = "Jost, 'Segoe UI', Arial, sans-serif";
  const label = `${discountPct}% CodeLekho gift voucher for ${college?.name || 'college'} students, code ${code}`;
  if (layout === 'portrait') {
    // phones: the same voucher as a tall printed coupon
    return (
      <svg ref={ref} viewBox="0 0 600 820" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={label}>
        <defs>
          <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={t.bg[0]} /><stop offset="1" stopColor={t.bg[1]} /></linearGradient>
          <linearGradient id={`${id}-r`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={t.right[0]} /><stop offset="1" stopColor={t.right[1]} /></linearGradient>
          <linearGradient id={`${id}-rib`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={t.ribbon[0]} /><stop offset="1" stopColor={t.ribbon[1]} /></linearGradient>
          <clipPath id={`${id}-clip`}><rect width="600" height="820" rx="30" /></clipPath>
          <clipPath id={`${id}-logo`}><circle cx="546" cy="60" r="24" /></clipPath>
          <filter id={`${id}-sh`} x="-10%" y="-10%" width="120%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity=".28" /></filter>
        </defs>
        <g clipPath={`url(#${id}-clip)`}>
          <rect width="600" height="820" fill={`url(#${id}-bg)`} />
          {[0, 1, 2, 3, 4].map(i => <path key={i} d={`M-40 ${180 + i * 60} C 100 ${100 + i * 55}, 240 ${330 + i * 40}, 360 ${220 + i * 50} S 520 ${120 + i * 45}, 640 ${190 + i * 55} L640 900 L-40 900 Z`} fill={t.wave} opacity={0.035 + i * 0.012} />)}
          {[0, 1, 2].map(i => <path key={`l${i}`} d={`M-40 ${140 + i * 80} C 130 ${70 + i * 70}, 260 ${300 + i * 50}, 380 ${190 + i * 60} S 540 ${90 + i * 60}, 640 ${150 + i * 70}`} fill="none" stroke={t.line} strokeOpacity=".22" strokeWidth="1.4" />)}

          <text x="44" y="74" fill={t.accent} fontFamily={font} fontSize="15" fontWeight="700" letterSpacing="3">{`FOR ${String(college?.name || 'PARTNER COLLEGE').toUpperCase()}`.slice(0, 34)}</text>
          {college?.logo && <><circle cx="546" cy="60" r="27" fill="#FFFDF7" /><image href={college.logo} x="522" y="36" width="48" height="48" clipPath={`url(#${id}-logo)`} preserveAspectRatio="xMidYMid meet" /></>}
          <text x="36" y="232" fill={t.gift} fontFamily={font} fontSize="158" fontWeight="800" letterSpacing="-3" filter={`url(#${id}-sh)`}>Gift</text>
          <path d="M0 254 H360 L334 306 H0 Z" fill={`url(#${id}-rib)`} />
          <text x="52" y="292" fill={t.ribbonText} fontFamily={font} fontSize="31" fontWeight="800" letterSpacing="9">VOUCHER</text>

          <circle cx="474" cy="186" r="96" fill="none" stroke={t.line} strokeOpacity=".5" strokeWidth="1.5" strokeDasharray="3 7" />
          <circle cx="474" cy="186" r="84" fill={t.seal} filter={`url(#${id}-sh)`} />
          <text x="474" y="200" textAnchor="middle" fill={t.sealText} fontFamily={font} fontSize={discountPct >= 100 ? 50 : 62} fontWeight="800" letterSpacing="-2">{discountPct}%</text>
          <text x="474" y="234" textAnchor="middle" fill={t.sealSub} fontFamily={font} fontSize="22" fontWeight="600">Discount</text>

          <rect x="44" y="340" width="168" height="78" rx="12" fill="#FFFDF7" />
          <image href="/codelekho-logo.svg" x="58" y="356" width="140" height="46" preserveAspectRatio="xMidYMid meet" />
          <text x="230" y="360" fill={t.soft} fontFamily={font} fontSize="14">Exclusive student offer</text>
          <text x="230" y="386" fill={t.text} fontFamily={font} fontSize="18" fontWeight="700">{discountPct}% off {covers}</text>
          <text x="230" y="410" fill={t.accent} fontFamily={font} fontSize="15" fontWeight="700">{site}</text>

          <path d="M0 500 L600 448 V820 H0 Z" fill={`url(#${id}-r)`} opacity=".95" />
          <path d="M0 500 L600 448" stroke={t.line} strokeOpacity=".55" strokeWidth="2" />
          {[0, 1, 2].map(i => <path key={`r${i}`} d={`M0 ${820 - i * 70} C 160 ${700 - i * 60}, 360 ${800 - i * 50}, 600 ${640 - i * 60}`} fill="none" stroke={t.line} strokeOpacity=".16" strokeWidth="1.2" />)}
          <path d="M0 540 H600 V592 H0 Z" fill={t.band} />
          <text x="300" y="576" textAnchor="middle" fill={t.bandText} fontFamily={font} fontSize="26" fontWeight="800" letterSpacing="12">• COUPON •</text>
          <rect x="56" y="622" width="488" height="74" rx="12" fill="none" stroke={t.rAccent} strokeWidth="2" strokeDasharray="8 6" />
          <text x="300" y="648" textAnchor="middle" fill={t.rSoft} fontFamily={font} fontSize="13" fontWeight="700" letterSpacing="4">CODE</text>
          <text x="300" y="682" textAnchor="middle" fill={t.rText} fontFamily="ui-monospace, 'Cascadia Mono', Consolas, monospace" fontSize="32" fontWeight="800" letterSpacing="5">{code}</text>
          <text x="300" y="746" textAnchor="middle" fill={t.rText} fontFamily={font} fontSize="21" fontWeight="700">Valid until : {fmt(endsAt)}</text>
          <text x="300" y="782" textAnchor="middle" fill={t.rSoft} fontFamily={font} fontSize="14">Voucher no.: {serial}-{code}</text>
        </g>
      </svg>
    );
  }
  return (
    <svg ref={ref} viewBox="0 0 1000 420" className={className} xmlns="http://www.w3.org/2000/svg" role="img" aria-label={label}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={t.bg[0]} /><stop offset="1" stopColor={t.bg[1]} /></linearGradient>
        <linearGradient id={`${id}-r`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={t.right[0]} /><stop offset="1" stopColor={t.right[1]} /></linearGradient>
        <linearGradient id={`${id}-rib`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={t.ribbon[0]} /><stop offset="1" stopColor={t.ribbon[1]} /></linearGradient>
        <clipPath id={`${id}-clip`}><rect width="1000" height="420" rx="26" /></clipPath>
        <clipPath id={`${id}-logo`}><circle cx="948" cy="52" r="26" /></clipPath>
        <filter id={`${id}-sh`} x="-10%" y="-10%" width="120%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity=".28" /></filter>
      </defs>

      <g clipPath={`url(#${id}-clip)`}>
        <rect width="1000" height="420" fill={`url(#${id}-bg)`} />
        {/* layered contour waves */}
        {[0, 1, 2, 3, 4, 5].map(i => (
          <path key={i} d={`M-40 ${150 + i * 48} C 120 ${70 + i * 52}, 260 ${290 + i * 30}, 430 ${170 + i * 44} S 700 ${40 + i * 40}, 1040 ${120 + i * 50} L1040 440 L-40 440 Z`} fill={t.wave} opacity={0.035 + i * 0.012} />
        ))}
        {[0, 1, 2].map(i => (
          <path key={`l${i}`} d={`M-40 ${110 + i * 70} C 160 ${40 + i * 60}, 300 ${260 + i * 40}, 470 ${150 + i * 50} S 760 ${30 + i * 50}, 1040 ${100 + i * 60}`} fill="none" stroke={t.line} strokeOpacity=".22" strokeWidth="1.4" />
        ))}

        {/* right panel on the diagonal */}
        <path d="M640 0 H1000 V420 H560 Z" fill={`url(#${id}-r)`} opacity=".94" />
        {[0, 1, 2, 3].map(i => <path key={`r${i}`} d={`M560 ${420 - i * 60} C 700 ${300 - i * 50}, 820 ${400 - i * 40}, 1000 ${260 - i * 55}`} fill="none" stroke={t.line} strokeOpacity=".16" strokeWidth="1.2" />)}
        <path d="M640 0 L560 420" stroke={t.line} strokeOpacity=".55" strokeWidth="2" />

        {/* left: Gift / VOUCHER */}
        <text x="48" y="64" fill={t.accent} fontFamily={font} fontSize="15" fontWeight="700" letterSpacing="4">{`FOR ${String(college?.name || 'PARTNER COLLEGE').toUpperCase()}`.slice(0, 46)}</text>
        <text x="40" y="196" fill={t.gift} fontFamily={font} fontSize="146" fontWeight="800" letterSpacing="-3" filter={`url(#${id}-sh)`}>Gift</text>
        <path d="M0 214 H352 L326 266 H0 Z" fill={`url(#${id}-rib)`} />
        <text x="58" y="252" fill={t.ribbonText} fontFamily={font} fontSize="31" fontWeight="800" letterSpacing="9">VOUCHER</text>

        {/* brand + offer */}
        <rect x="48" y="292" width="156" height="72" rx="12" fill="#FFFDF7" />
        <image href="/codelekho-logo.svg" x="60" y="306" width="132" height="44" preserveAspectRatio="xMidYMid meet" />
        <text x="226" y="310" fill={t.soft} fontFamily={font} fontSize="14">Exclusive student offer from CodeLekho</text>
        <text x="226" y="334" fill={t.text} fontFamily={font} fontSize="18" fontWeight="700">{discountPct}% off {covers}</text>
        <text x="226" y="357" fill={t.accent} fontFamily={font} fontSize="15" fontWeight="700">{site}</text>
        <text x="226" y="380" fill={t.soft} fontFamily={font} fontSize="13">Voucher no.: {serial}-{code}</text>

        {/* right: seal, coupon band, code, validity */}
        {college?.logo && <>
          <circle cx="948" cy="52" r="29" fill="#FFFDF7" />
          <image href={college.logo} x="922" y="26" width="52" height="52" clipPath={`url(#${id}-logo)`} preserveAspectRatio="xMidYMid meet" />
        </>}
        <circle cx="792" cy="140" r="104" fill="none" stroke={t.line} strokeOpacity=".5" strokeWidth="1.5" strokeDasharray="3 7" />
        <circle cx="792" cy="140" r="92" fill={t.seal} filter={`url(#${id}-sh)`} />
        <text x="792" y="156" textAnchor="middle" fill={t.sealText} fontFamily={font} fontSize={discountPct >= 100 ? 58 : 70} fontWeight="800" letterSpacing="-2">{discountPct}%</text>
        <text x="792" y="194" textAnchor="middle" fill={t.sealSub} fontFamily={font} fontSize="25" fontWeight="600">Discount</text>

        <path d="M594 262 H1000 V312 H584 Z" fill={t.band} />
        <text x="800" y="296" textAnchor="middle" fill={t.bandText} fontFamily={font} fontSize="25" fontWeight="800" letterSpacing="11">• COUPON •</text>

        <rect x="628" y="324" width="330" height="42" rx="9" fill="none" stroke={t.rAccent} strokeWidth="1.6" strokeDasharray="6 5" />
        <text x="793" y="352" textAnchor="middle" fontFamily="ui-monospace, 'Cascadia Mono', Consolas, monospace" fontSize="20" fontWeight="700" letterSpacing="3" fill={t.rText}><tspan fill={t.rSoft} fontSize="13" letterSpacing="3">CODE  </tspan>{code}</text>
        <text x="793" y="396" textAnchor="middle" fill={t.rText} fontFamily={font} fontSize="17" fontWeight="700">Valid until : {fmt(endsAt)}</text>
      </g>
    </svg>
  );
});

export default CollegeVoucher;

/** Saves the voucher SVG as a 2000 x 840 PNG. */
export async function downloadVoucherPng(svg, fileName) {
  savePng(await svgToPngBlob(svg, 2000, 840), fileName);
}
