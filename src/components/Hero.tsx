import React from 'react';
import { ArrowDown, Download, Sparkles, GraduationCap, ArrowUpRight, BarChart3, Workflow } from 'lucide-react';
import { Profile } from '../types/portfolio';
import { EditorialHandIcon } from './EditorialHandIcon';

interface HeroProps {
  profile: Profile | null;
}

export const Hero: React.FC<HeroProps> = ({ profile }) => {
  const hasCv = Boolean(profile?.cvUrl && profile.cvUrl.trim().length > 0);

  return (
    <section id="hero" className="relative pt-10 pb-20 sm:pt-16 sm:pb-28 overflow-hidden bg-[#F8F5EF]">
      {/* Subtle organic warm background dots */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.035] bg-[radial-gradient(#3E2C22_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Text & Editorial Introduction */}
          <div className="lg:col-span-7 space-y-6">
            {/* Playful Handwritten Greeting with Bespoke Hand-Drawn Illustration */}
            <div className="inline-flex items-center gap-2.5">
              <span className="font-handwriting text-2xl sm:text-3xl text-[#806047] font-semibold -rotate-2 inline-block">
                Hello, I'm Gabriella Christiani
              </span>
              <EditorialHandIcon className="w-8 h-8 sm:w-9 sm:h-9" />
            </div>

            {/* Expressive Editorial Headline */}
            <h1 className="font-editorial text-4xl sm:text-6xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-[#3E2C22] leading-[1.08]">
              Turning <span className="italic font-normal text-[#694B36]">Data</span> Into Insights.{' '}
              Transforming <span className="italic font-normal text-[#694B36]">Ideas</span> Into Solutions.
            </h1>

            {/* Professional Title Badge & Status */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F1E8DC] border border-[#DCC9B3] text-xs font-semibold text-[#694B36]">
                <span className="w-2 h-2 rounded-full bg-[#806047] animate-pulse" />
                <span>Junior Business Analyst</span>
                <span className="text-[#A58A73]">·</span>
                <span>Junior Data Analyst</span>
              </div>
              <div className="text-xs text-[#806047] font-medium flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-[#694B36]" />
                <span>Telkom University Purwokerto (GPA 3.69)</span>
              </div>
            </div>

            {/* Supporting Description */}
            <p className="text-base sm:text-lg text-[#694B36] font-normal leading-relaxed max-w-xl">
              An Information Systems graduate passionate about business analysis, data analytics, 
              and technology-driven solutions. Experienced in business process modeling (BPMN 2.0), 
              requirements documentation, and deep data analytics in Python, SQL, and Looker Studio.
            </p>

            {/* Interactive Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <a
                href="#projects"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#3E2C22] text-[#F8F5EF] hover:bg-[#694B36] transition-all duration-200 shadow-sm hover:shadow"
              >
                <span>View My Work</span>
                <ArrowDown className="w-3.5 h-3.5" />
              </a>

              {hasCv && (
                <a
                  href="/api/public/cv/download"
                  download
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-full text-xs font-semibold uppercase tracking-wider border border-[#3E2C22] text-[#3E2C22] hover:bg-[#3E2C22] hover:text-[#F8F5EF] transition-all duration-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CV</span>
                </a>
              )}

              <a
                href="#about"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-full text-xs font-medium text-[#694B36] hover:text-[#3E2C22] hover:bg-[#F1E8DC] transition-colors"
              >
                <span>A Little About Me</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#806047]" />
              </a>
            </div>
          </div>

          {/* Right Column: Editorial Portrait Composition */}
          <div className="lg:col-span-5 relative flex justify-center">
            {/* Layered Decorative Elements */}
            <div className="relative w-full max-w-sm sm:max-w-md aspect-[4/5] rounded-[32px] overflow-hidden border-2 border-[#DCC9B3] bg-[#F1E8DC] shadow-xl p-2.5">
              {/* Inner Frame */}
              <div className="w-full h-full rounded-[24px] overflow-hidden bg-[#E8DDD0] relative flex items-center justify-center">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt="Gabriella Christiani"
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-[#F1E8DC] to-[#DCC9B3]/40">
                    {/* Artistic Editorial Portrait Placeholder */}
                    <div className="w-28 h-28 rounded-full border-2 border-[#A58A73] bg-[#FFFCF7] flex items-center justify-center text-[#694B36] shadow-sm mb-4">
                      <Workflow className="w-12 h-12 stroke-[1.5]" />
                    </div>
                    <span className="font-editorial text-2xl font-bold text-[#3E2C22] mb-1">
                      Gabriella Christiani
                    </span>
                    <span className="font-handwriting text-xl text-[#806047]">
                      Information Systems Graduate
                    </span>
                    <p className="text-xs text-[#806047] mt-3 max-w-[200px] leading-relaxed">
                      Portrait photo can be uploaded anytime in the private admin portal.
                    </p>
                  </div>
                )}

                {/* Floating Decorative Sticker 1 (Top Right) */}
                <div className="absolute top-4 right-4 bg-[#FFFCF7]/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#DCC9B3] shadow-md flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#806047]" />
                  <span className="text-[11px] font-semibold text-[#3E2C22]">Information Systems '26</span>
                </div>

                {/* Floating Decorative Sticker 2 (Bottom Left) */}
                <div className="absolute bottom-4 left-4 bg-[#FFFCF7]/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-[#DCC9B3] shadow-md space-y-0.5">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-[#806047]">
                    Academic Excellence
                  </div>
                  <div className="text-xs font-bold text-[#3E2C22] flex items-center gap-1">
                    <span>GPA 3.69 / 4.00</span>
                    <span className="text-[#A58A73]">·</span>
                    <span className="text-[11px] font-normal text-[#806047]">Telkom University</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Handwritten note floating on side */}
            <div className="hidden sm:block absolute -bottom-6 -right-2 bg-[#FFFCF7] border border-[#DCC9B3] px-4 py-2 rounded-2xl shadow-sm rotate-2">
              <span className="font-handwriting text-xl text-[#694B36]">
                Ready for Junior BA & DA opportunities! ✨
              </span>
            </div>
          </div>
        </div>

        {/* Scroll down indicator */}
        <div className="mt-16 sm:mt-24 pt-8 border-t border-[#DCC9B3]/60 flex items-center justify-between text-xs text-[#806047]">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#806047]" />
            <span className="font-medium">Purwokerto & Jakarta, Indonesia</span>
          </div>

          <a
            href="#about"
            className="inline-flex items-center gap-2 font-medium hover:text-[#3E2C22] transition-colors"
          >
            <span>Scroll to Discover</span>
            <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
          </a>
        </div>
      </div>
    </section>
  );
};
