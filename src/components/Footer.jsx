import React from 'react';
import { Mail, MapPin, Phone, Instagram, Linkedin } from 'lucide-react';
import { paths } from '../router';

export default function Footer({ navigate }) {
  const link = (label, to) => (
    <li>
      <button 
        onClick={() => navigate(to)} 
        className="text-brand-200 hover:text-white transition-colors text-sm"
      >
        {label}
      </button>
    </li>
  );

  return (
    <footer className="bg-brand-950 text-white relative overflow-hidden">
      <span className="tri tri-orange absolute top-8 right-[12%] opacity-80 pointer-events-none" />
      <span className="tri tri-green absolute bottom-10 left-[8%] opacity-70 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12">
        {/* Top Contact Highlight Banner: 3 Pill Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 pb-12 border-b border-white/10">
          {/* Card 1: Email Us */}
          <a
            href="mailto:careers@arshithgroup.com"
            className="bg-white text-slate-900 border-2 border-[#093322] rounded-[24px] p-4 px-5 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:border-emerald-600 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-[#e6f7f0] border border-[#a7f3d0] flex items-center justify-center text-[#065f46] shrink-0 group-hover:bg-[#d1fae5] group-hover:scale-105 transition-all">
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 block leading-tight">
                EMAIL US
              </span>
              <span className="text-sm sm:text-[15px] font-black text-slate-900 truncate block mt-0.5 group-hover:text-emerald-700 transition-colors">
                careers@arshithgroup.com
              </span>
            </div>
          </a>

          {/* Card 2: Call Support */}
          <a
            href="tel:+918618471444"
            className="bg-white text-slate-900 border-2 border-[#093322] rounded-[24px] p-4 px-5 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:border-emerald-600 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-[#e6f7f0] border border-[#a7f3d0] flex items-center justify-center text-[#065f46] shrink-0 group-hover:bg-[#d1fae5] group-hover:scale-105 transition-all">
              <Phone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 block leading-tight">
                CALL SUPPORT
              </span>
              <span className="text-sm sm:text-[15px] font-black text-slate-900 truncate block mt-0.5 group-hover:text-emerald-700 transition-colors">
                +91 86184 71444
              </span>
            </div>
          </a>

          {/* Card 3: Headquarters */}
          <a
            href="https://maps.google.com/?q=Bengaluru,Karnataka,India"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-slate-900 border-2 border-[#093322] rounded-[24px] p-4 px-5 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:border-emerald-600 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-[#e6f7f0] border border-[#a7f3d0] flex items-center justify-center text-[#065f46] shrink-0 group-hover:bg-[#d1fae5] group-hover:scale-105 transition-all">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 block leading-tight">
                HEADQUARTERS
              </span>
              <span className="text-sm sm:text-[15px] font-black text-slate-900 truncate block mt-0.5 group-hover:text-emerald-700 transition-colors">
                Bengaluru, Karnataka, India
              </span>
            </div>
          </a>
        </div>

        {/* Navigation & Brand Grid */}
        <div className="pt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Info & Social Links */}
          <div className="space-y-4">
            <button onClick={() => navigate(paths.home())} aria-label="Home" className="block text-left">
              <img src="/arshith-bootcamp-logo-white.png" alt="Arshith Bootcamp" className="h-12 w-auto object-contain" />
            </button>
            <p className="text-sm text-brand-200 leading-relaxed max-w-xs">
              Learn today, build tomorrow. Structured courses, honest assessments and verifiable certificates.
            </p>
            {/* Social Media Circular Buttons */}
            <div className="pt-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-peach-400 mb-3">Connect With Us</p>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.instagram.com/arshithgroup/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full border border-emerald-500/50 bg-[#072418] hover:border-emerald-400 hover:bg-emerald-900/60 text-emerald-300 hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm"
                  title="Instagram: @arshithgroup"
                  aria-label="Instagram @arshithgroup"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="https://www.linkedin.com/company/arshith-group/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full border border-emerald-500/50 bg-[#072418] hover:border-emerald-400 hover:bg-emerald-900/60 text-emerald-300 hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm"
                  title="LinkedIn: Arshith Group"
                  aria-label="LinkedIn Arshith Group"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a
                  href="https://www.linkedin.com/in/farook-n-2bb2b5344/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full border border-emerald-500/50 bg-[#072418] hover:border-emerald-400 hover:bg-emerald-900/60 text-emerald-300 hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm"
                  title="LinkedIn: Farook N"
                  aria-label="LinkedIn Farook N"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Explore Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-peach-400 mb-4">Explore</h4>
            <ul className="space-y-2.5">
              {link('Home', paths.home())}
              {link('All courses', paths.courses())}
              {link('Categories', paths.categories())}
              {link('Verify a certificate', paths.verify())}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-peach-400 mb-4">Company</h4>
            <ul className="space-y-2.5">
              {link('About us', paths.about())}
              {link('Contact', paths.contact())}
              {link('My dashboard', paths.dashboard())}
              {link('Admin portal', paths.adminLogin())}
            </ul>
          </div>

          {/* Direct Contact Column */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-peach-400 mb-4">Contact</h4>
            <ul className="space-y-3.5 text-sm text-brand-200">
              <li>
                <a href="mailto:careers@arshithgroup.com" className="flex items-start gap-2.5 hover:text-white transition-colors group">
                  <Mail className="w-4 h-4 mt-0.5 text-peach-400 shrink-0 group-hover:text-emerald-300 transition-colors" />
                  <span className="break-all">careers@arshithgroup.com</span>
                </a>
              </li>
              <li>
                <a href="tel:+918618471444" className="flex items-center gap-2.5 hover:text-white transition-colors group">
                  <Phone className="w-4 h-4 text-peach-400 shrink-0 group-hover:text-emerald-300 transition-colors" />
                  <span>+91 86184 71444</span>
                </a>
              </li>
              <li>
                <a href="https://maps.google.com/?q=Bengaluru,Karnataka,India" target="_blank" rel="noopener noreferrer" className="flex items-start gap-2.5 hover:text-white transition-colors group">
                  <MapPin className="w-4 h-4 mt-0.5 text-peach-400 shrink-0 group-hover:text-emerald-300 transition-colors" />
                  <span>Bengaluru, Karnataka, India</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 text-xs text-brand-300 flex flex-col sm:flex-row gap-2 justify-between items-center">
          <span>© {new Date().getFullYear()} Arshith Bootcamp. All rights reserved.</span>
          <span>Made for learners, everywhere.</span>
        </div>
      </div>
    </footer>
  );
}
