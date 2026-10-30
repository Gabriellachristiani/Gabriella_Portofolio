import React from 'react';
import { ArrowUp } from 'lucide-react';
import { Profile } from '../types/portfolio';

interface FooterProps {
  profile: Profile | null;
}

export const Footer: React.FC<FooterProps> = ({ profile }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#F8F5EF] border-t border-[#DCC9B3] py-16 text-[#694B36]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-12 border-b border-[#DCC9B3]/70">
          {/* Identity */}
          <div className="space-y-1.5">
            <h3 className="font-editorial text-2xl font-bold text-[#3E2C22]">
              Gabriella Christiani
            </h3>
            <p className="text-xs uppercase tracking-wider font-semibold text-[#806047]">
              Junior Business Analyst <span className="text-[#DCC9B3]">|</span> Junior Data Analyst
            </p>
            <p className="text-xs text-[#806047]">
              Bachelor of Information Systems, Telkom University Purwokerto (GPA 3.69)
            </p>
          </div>

          {/* Public Navigation */}
          <nav className="flex flex-wrap items-center gap-6 text-xs font-semibold text-[#694B36]">
            <a href="#hero" className="hover:text-[#3E2C22] transition-colors">
              Home
            </a>
            <a href="#about" className="hover:text-[#3E2C22] transition-colors">
              About
            </a>
            <a href="#experience" className="hover:text-[#3E2C22] transition-colors">
              Experience
            </a>
            <a href="#projects" className="hover:text-[#3E2C22] transition-colors">
              Projects
            </a>
            <a href="#skills-certifications" className="hover:text-[#3E2C22] transition-colors">
              Skills & Certifications
            </a>
            <a href="#contact" className="hover:text-[#3E2C22] transition-colors">
              Contact
            </a>
          </nav>

          {/* Back to top */}
          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#3E2C22] hover:text-[#694B36] transition-colors self-start md:self-auto"
            aria-label="Back to top"
          >
            <span>Back to Top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bottom statement & discreet admin access */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#806047] gap-4">
          <p>© {new Date().getFullYear()} Gabriella Christiani. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <p className="text-[11px] font-handwriting text-base text-[#694B36]">
              Crafted with warm editorial precision for business analysis & data analytics.
            </p>
            <span className="text-[#DCC9B3]">·</span>
            <a
              href="/admin"
              className="text-[11px] text-[#A58A73] hover:text-[#3E2C22] transition-colors underline underline-offset-2"
            >
              Admin Portal
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
