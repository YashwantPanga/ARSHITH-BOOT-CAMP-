import React, { forwardRef, useId } from 'react';

/**
 * The image sent with a referral share (WhatsApp etc.): CodeLekho logo, "Hey friend, 10% OFF", who it
 * is from, the code and the link. 1080 x 1350 (portrait, the size chat apps show best).
 */
const ReferralShareCard = forwardRef(function ReferralShareCard({ code, link, firstName = 'A friend', discountPct = 10 }, ref) {
  const id = `rs${useId().replace(/:/g, '')}`;
  const font = "Jost, 'Segoe UI', Arial, sans-serif";
  const shortLink = String(link || '').replace(/^https?:\/\//, '');
  return (
    <svg ref={ref} viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`CodeLekho invite from ${firstName}: ${discountPct}% off with code ${code}`}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1F7A57" /><stop offset=".55" stopColor="#0E4433" /><stop offset="1" stopColor="#06231D" /></linearGradient>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF1C9" /><stop offset=".5" stopColor="#E5C88E" /><stop offset="1" stopColor="#B88A3E" /></linearGradient>
        <radialGradient id={`${id}-glow`} cx="78%" cy="18%" r="55%"><stop offset="0" stopColor="#E5C88E" stopOpacity=".28" /><stop offset="1" stopColor="#E5C88E" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="1080" height="1350" fill={`url(#${id}-bg)`} />
      <rect width="1080" height="1350" fill={`url(#${id}-glow)`} />
      {[0, 1, 2, 3, 4].map(i => <path key={i} d={`M-40 ${760 + i * 110} C 220 ${640 + i * 100}, 420 ${940 + i * 70}, 660 ${780 + i * 90} S 960 ${600 + i * 90}, 1120 ${700 + i * 100} L1120 1400 L-40 1400 Z`} fill="#FFFFFF" opacity={0.03 + i * 0.01} />)}
      <rect x="40" y="40" width="1000" height="1270" rx="44" fill="none" stroke="#E5C88E" strokeOpacity=".45" strokeWidth="2" />

      <rect x="96" y="104" width="330" height="96" rx="48" fill="#FFFDF7" />
      <image href="/codelekho-logo.svg" x="126" y="120" width="270" height="64" preserveAspectRatio="xMidYMid meet" />
      <text x="984" y="164" textAnchor="end" fill="#E5C88E" fontFamily={font} fontSize="28" fontWeight="700" letterSpacing="6">REFER &amp; EARN</text>

      <text x="96" y="330" fill="#E5C88E" fontFamily={font} fontSize="34" fontWeight="700" letterSpacing="8">{`A GIFT FROM ${String(firstName).toUpperCase()}`.slice(0, 32)}</text>
      <text x="90" y="452" fill="#FFFDF7" fontFamily={font} fontSize="104" fontWeight="800" letterSpacing="-2">Hey friend,</text>
      <text x="84" y="672" fill={`url(#${id}-gold)`} fontFamily={font} fontSize="250" fontWeight="800" letterSpacing="-8">{discountPct}%</text>
      <text x="96" y="772" fill="#FFFDF7" fontFamily={font} fontSize="76" fontWeight="700">OFF your first course</text>

      <rect x="96" y="850" width="888" height="190" rx="28" fill="#FFFFFF" fillOpacity=".06" stroke="#E5C88E" strokeWidth="3" strokeDasharray="14 10" />
      <text x="540" y="912" textAnchor="middle" fill="#FFFDF7" fillOpacity=".7" fontFamily={font} fontSize="30" fontWeight="700" letterSpacing="10">USE MY CODE</text>
      <text x="540" y="1002" textAnchor="middle" fill="#F3D9A0" fontFamily="ui-monospace, 'Cascadia Mono', Consolas, monospace" fontSize="86" fontWeight="800" letterSpacing="14">{code}</text>

      <text x="540" y="1112" textAnchor="middle" fill="#FFFDF7" fillOpacity=".85" fontFamily={font} fontSize="34" fontWeight="600">{shortLink}</text>
      <path d="M40 1190 H1040 V1266 C1040 1290 1020 1310 996 1310 H84 C60 1310 40 1290 40 1266 Z" fill="#E5C88E" />
      <text x="540" y="1262" textAnchor="middle" fill="#0C2D26" fontFamily={font} fontSize="34" fontWeight="800" letterSpacing="4">LEARN · PRACTISE · GET CERTIFIED</text>
    </svg>
  );
});

export default ReferralShareCard;
