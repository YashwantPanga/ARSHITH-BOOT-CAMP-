import React from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import { paths } from '../router';

export default function Footer({ navigate }) {
  const link = (label, to) => (
    <li><button onClick={() => navigate(to)} className="text-brand-200 hover:text-white transition-colors text-sm">{label}</button></li>
  );

  return (
    <footer className="bg-brand-950 text-white relative overflow-hidden">
      <span className="tri tri-orange absolute top-8 right-[12%] opacity-80" />
      <span className="tri tri-green absolute bottom-10 left-[8%] opacity-70" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <button onClick={() => navigate(paths.home())} aria-label="Home">
            <img src="/arshith-bootcamp-logo-white.png" alt="Arshith Bootcamp" className="h-12 w-auto object-contain" />
          </button>
          <p className="text-sm text-brand-200 leading-relaxed max-w-xs">Learn today, build tomorrow. Structured courses, honest assessments and verifiable certificates.</p>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-peach-400 mb-4">Explore</h4>
          <ul className="space-y-2.5">
            {link('Home', paths.home())}
            {link('All courses', paths.courses())}
            {link('Categories', paths.categories())}
            {link('Verify a certificate', paths.verify())}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-peach-400 mb-4">Company</h4>
          <ul className="space-y-2.5">
            {link('About us', paths.about())}
            {link('Contact', paths.contact())}
            {link('My dashboard', paths.dashboard())}
            {link('Admin portal', paths.adminLogin())}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-peach-400 mb-4">Contact</h4>
          <ul className="space-y-3 text-sm text-brand-200">
            <li className="flex gap-2.5"><Mail className="w-4 h-4 mt-0.5 text-peach-400 shrink-0" />support@arshithbootcamp.com</li>
            <li className="flex gap-2.5"><Phone className="w-4 h-4 mt-0.5 text-peach-400 shrink-0" />+91 90000 00000</li>
            <li className="flex gap-2.5"><MapPin className="w-4 h-4 mt-0.5 text-peach-400 shrink-0" />Hyderabad, India</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 text-xs text-brand-300 flex flex-col sm:flex-row gap-2 justify-between">
          <span>© {new Date().getFullYear()} Arshith Bootcamp. All rights reserved.</span>
          <span>Made for learners, everywhere.</span>
        </div>
      </div>
    </footer>
  );
}
