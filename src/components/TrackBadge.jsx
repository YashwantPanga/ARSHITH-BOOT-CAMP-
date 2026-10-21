import React from 'react';
import { TRACKS } from '../data/meta';

/** Small brand mark for a track (Python / SQL / Web / AI), drawn in the site palette. */
export function TrackMark({ type, className = 'w-7 h-7' }) {
  switch (TRACKS[type]?.mark) {
    case 'py':
      return (
        <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
          <path d="M15.8 3c-5.6 0-5.3 2.4-5.3 2.4v2.5h5.4v.8H8.4S4.8 8.3 4.8 14s3.1 5.5 3.1 5.5h1.9v-2.7s-.1-3.1 3.1-3.1h5.3s3 0 3-2.9V5.9S21.7 3 15.8 3Zm-3 1.7a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" fill="#013A2B" />
          <path d="M16.2 29c5.6 0 5.3-2.4 5.3-2.4v-2.5h-5.4v-.8h7.5s3.6.4 3.6-5.3-3.1-5.5-3.1-5.5h-1.9v2.7s.1 3.1-3.1 3.1h-5.3s-3 0-3 2.9v4.9S10.3 29 16.2 29Zm3-1.7a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" fill="#426557" />
        </svg>
      );
    case 'sql':
      return (
        <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
          <ellipse cx="16" cy="7.5" rx="10" ry="3.8" fill="#013A2B" />
          <path d="M6 7.5v6c0 2.1 4.5 3.8 10 3.8s10-1.7 10-3.8v-6c0 2.1-4.5 3.8-10 3.8S6 9.6 6 7.5Z" fill="#426557" />
          <path d="M6 15.5v6c0 2.1 4.5 3.8 10 3.8s10-1.7 10-3.8v-6c0 2.1-4.5 3.8-10 3.8S6 17.6 6 15.5Z" fill="#013A2B" />
        </svg>
      );
    case 'web':
      return (
        <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
          <rect x="3" y="5" width="26" height="22" rx="4" fill="#013A2B" />
          <circle cx="7.5" cy="9" r="1.2" fill="#BCD1C6" /><circle cx="11" cy="9" r="1.2" fill="#BCD1C6" />
          <path d="m12.5 15-3.5 3.5 3.5 3.5M19.5 15l3.5 3.5-3.5 3.5M17.2 13.5l-2.4 10" stroke="#FBF8F1" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'ai':
      return (
        <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
          <circle cx="16" cy="16" r="12.5" fill="#013A2B" />
          <g stroke="#BCD1C6" strokeWidth="1.4"><path d="M10 12l6 4 6-4M10 20l6-4 6 4M16 9v14" /></g>
          {[[10, 12], [22, 12], [10, 20], [22, 20], [16, 9], [16, 23], [16, 16]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.9" fill="#FBF8F1" />)}
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 32 32" className={className} aria-hidden="true"><rect x="4" y="4" width="24" height="24" rx="6" fill="#013A2B" /></svg>
      );
  }
}

/** The white logo plate that overlaps the course image – mirrors the partner badges in the reference design. */
export default function TrackBadge({ type, label, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 bg-white rounded-xl px-3.5 py-2.5 shadow-[0_10px_24px_-12px_rgba(12,45,38,.45)] ring-1 ring-brand-900/5 ${className}`}>
      <TrackMark type={type} className="w-7 h-7 shrink-0" />
      <span className="font-display text-[19px] font-semibold text-brand-900 leading-none tracking-tight">{label || TRACKS[type]?.label || 'Course'}</span>
    </span>
  );
}
