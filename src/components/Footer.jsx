import React from 'react';
import { Mail, MapPin, Phone, Instagram, Linkedin } from 'lucide-react';
import { paths } from '../router';

export default function Footer({ navigate }) {
  const link = (label, to) => (
    <li>
      <button 
        onClick={() => navigate(to)} 
        className="text-charcoal/75 hover:text-leaf-dark transition-colors text-[15px] leading-8"
      >
        {label}
      </button>
    </li>
  );

  return (
    <footer className="bg-cream text-charcoal relative overflow-hidden border-t border-brand-900/10">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Navigation & Brand Grid */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Info & Social Links */}
          <div className="space-y-4">
            <div>
              <button onClick={() => navigate(paths.home())} aria-label="Home" className="block text-left">
                <img src="/codelekho-logo.svg" alt="CodeLekho" className="h-8 w-auto object-contain" />
              </button>
              {/* endorsement line, like "A TATA Enterprise" */}
              <a
                href="https://arshithgroup.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-2.5 inline-flex items-baseline gap-1.5 whitespace-nowrap text-[11px] uppercase tracking-[0.18em] transition-colors"
              >
                <span className="font-medium text-charcoal/50">A Product of</span>
                <span className="font-bold text-forest group-hover:text-leaf-dark transition-colors">Arshith Group</span>
              </a>
            </div>
            <p className="text-[15px] text-charcoal/70 leading-relaxed max-w-xs">
              Learn today, build tomorrow. Structured courses, honest assessments and verifiable certificates.
            </p>
            {/* Social Media Circular Buttons */}
            <div className="pt-2">
              <p className="font-display text-[15px] font-semibold text-evergreen mb-3">Connect With Us</p>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.instagram.com/arshithgroup/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full border border-brand-900/15 bg-white text-forest hover:bg-forest hover:border-forest hover:text-ivory flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 shadow-sm"
                  title="Instagram: @arshithgroup"
                  aria-label="Instagram @arshithgroup"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="https://www.linkedin.com/company/arshith-group/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full border border-brand-900/15 bg-white text-forest hover:bg-forest hover:border-forest hover:text-ivory flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 shadow-sm"
                  title="LinkedIn: Arshith Group"
                  aria-label="LinkedIn Arshith Group"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a
                  href="https://www.linkedin.com/in/farook-n-2bb2b5344/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full border border-brand-900/15 bg-white text-forest hover:bg-forest hover:border-forest hover:text-ivory flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 shadow-sm"
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
            <h4 className="font-display text-[20px] font-bold text-evergreen mb-5">Explore</h4>
            <ul className="space-y-2.5">
              {link('Home', paths.home())}
              {link('All courses', paths.courses())}
              {link('Interview Prep', paths.interview())}
              {link('Categories', paths.categories())}
              {link('Verify a certificate', paths.verify())}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-display text-[20px] font-bold text-evergreen mb-5">Company</h4>
            <ul className="space-y-2.5">
              {link('About us', paths.about())}
              {link('Contact', paths.contact())}
              {link('Terms of Use', paths.terms())}
              {link('Privacy Policy', paths.privacy())}
              {link('Refund Policy', paths.refunds())}
              {link('My dashboard', paths.dashboard())}
            </ul>
          </div>

          {/* Direct Contact Column */}
          <div>
            <h4 className="font-display text-[20px] font-bold text-evergreen mb-5">Contact</h4>
            <ul className="space-y-4 text-[15px] text-charcoal/75">
              <li>
                <a href="mailto:codelekho@arshithgroup.com" className="flex items-start gap-2.5 hover:text-sage transition-colors group">
                  <Mail className="w-4 h-4 mt-0.5 text-sage shrink-0 group-hover:text-forest transition-colors" />
                  <span className="break-all">codelekho@arshithgroup.com</span>
                </a>
              </li>
              <li>
                <a href="tel:+918217729744" className="flex items-center gap-2.5 hover:text-sage transition-colors group">
                  <Phone className="w-4 h-4 text-sage shrink-0 group-hover:text-forest transition-colors" />
                  <span>+91 82177 29744</span>
                </a>
              </li>
              <li>
                <a href="https://maps.google.com/?q=Bengaluru,Karnataka,India" target="_blank" rel="noopener noreferrer" className="flex items-start gap-2.5 hover:text-sage transition-colors group">
                  <MapPin className="w-4 h-4 mt-0.5 text-sage shrink-0 group-hover:text-forest transition-colors" />
                  <span>Bengaluru, Karnataka, India</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-forest">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 text-[13px] text-ivory/75 flex flex-col md:flex-row gap-3 md:gap-6 justify-between items-center text-center md:text-left">
          <span>© 2026 Arshith Group. All rights reserved. Course content, code and certificates may not be copied or redistributed.</span>
          <span className="flex items-center gap-4 shrink-0">
            <button onClick={() => navigate(paths.terms())} className="hover:text-ivory transition-colors">Terms of Use</button>
            <span className="text-ivory/30">|</span>
            <button onClick={() => navigate(paths.privacy())} className="hover:text-ivory transition-colors">Privacy Policy</button>
            <span className="text-ivory/30">|</span>
            <button onClick={() => navigate(paths.refunds())} className="hover:text-ivory transition-colors">Refunds</button>
          </span>
        </div>
      </div>
    </footer>
  );
}
