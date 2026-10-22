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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {/* Navigation & Brand Grid */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
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
