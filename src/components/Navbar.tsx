import React, { useState } from 'react';
import { Download, Menu, X, ArrowUpRight } from 'lucide-react';
import { Profile } from '../types/portfolio';

interface NavbarProps {
  profile: Profile | null;
}

export const Navbar: React.FC<NavbarProps> = ({ profile }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const hasCv = Boolean(profile?.cvUrl && profile.cvUrl.trim().length > 0);

  const navLinks = [
    { name: 'About', href: '#about' },
    { name: 'Experience', href: '#experience' },
    { name: 'Projects', href: '#projects' },
    { name: 'Skills & Certifications', href: '#skills-certifications' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#F8F5EF]/95 backdrop-blur-md border-b border-[#DCC9B3]/60 transition-all">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
        {/* Full Name & Title Branding - Strictly no GCSS or artificial abbreviation */}
        <a href="#hero" className="group flex flex-col">
          <span className="font-editorial text-2xl sm:text-2xl font-bold tracking-tight text-[#3E2C22] group-hover:text-[#694B36] transition-colors">
            Gabriella Christiani
          </span>
          <span className="text-[11px] uppercase tracking-wider font-medium text-[#806047] flex items-center gap-1.5">
            <span>Junior Business Analyst</span>
            <span className="text-[#DCC9B3]">|</span>
            <span>Junior Data Analyst</span>
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-8 text-sm font-medium text-[#694B36]">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="hover:text-[#3E2C22] transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-[#694B36] after:scale-x-0 hover:after:scale-x-100 after:transition-transform"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Action Button - CV Download (Only if uploaded and published) */}
        <div className="hidden lg:flex items-center space-x-4">
          {hasCv ? (
            <a
              href="/api/public/cv/download"
              download
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-[#3E2C22] text-[#F8F5EF] hover:bg-[#694B36] transition-all duration-200 shadow-sm hover:shadow"
              title="Download Gabriella Christiani's Curriculum Vitae"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CV</span>
            </a>
          ) : (
            <a
              href="#contact"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-medium border border-[#DCC9B3] text-[#3E2C22] hover:bg-[#F1E8DC] transition-colors"
            >
              <span>Get in Touch</span>
              <ArrowUpRight className="w-3 h-3 text-[#806047]" />
            </a>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex lg:hidden items-center gap-3">
          {hasCv && (
            <a
              href="/api/public/cv/download"
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#3E2C22] text-[#F8F5EF]"
              aria-label="Download CV"
            >
              <Download className="w-3 h-3" />
              <span>CV</span>
            </a>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-[#3E2C22] hover:bg-[#F1E8DC] transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#DCC9B3] bg-[#F8F5EF] px-6 py-6 space-y-4 shadow-lg animate-in slide-in-from-top-2">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-[#3E2C22] hover:text-[#694B36] transition-colors py-1.5"
              >
                {link.name}
              </a>
            ))}
            {hasCv && (
              <div className="pt-2">
                <a
                  href="/api/public/cv/download"
                  download
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-xs font-semibold bg-[#3E2C22] text-[#F8F5EF] hover:bg-[#694B36] transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Curriculum Vitae</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
