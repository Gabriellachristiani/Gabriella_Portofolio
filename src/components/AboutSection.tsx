import React from 'react';
import { GraduationCap, Award, Compass, Sparkles, CheckCircle2, BookOpen, Layers } from 'lucide-react';
import { Profile } from '../types/portfolio';

interface AboutSectionProps {
  profile: Profile | null;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ profile }) => {
  if (!profile) return null;

  return (
    <section id="about" className="py-20 sm:py-28 bg-[#F1E8DC]/50 border-t border-[#DCC9B3]/80 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-16">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#806047] mb-2">
              <span>01. Personal & Academic Journey</span>
            </div>
            <div className="flex items-center gap-3">
              <h2 className="font-editorial text-3xl sm:text-5xl lg:text-5xl font-bold tracking-tight text-[#3E2C22]">
                A Little About Me
              </h2>
              <span className="font-handwriting text-2xl text-[#806047] -rotate-3">
                (nice to meet you!)
              </span>
            </div>
          </div>
          <p className="text-sm sm:text-base text-[#694B36] max-w-md font-normal leading-relaxed">
            Combining an Information Systems degree with hands-on enterprise IT internship experience 
            at BPKP Headquarters and deep learning research.
          </p>
        </div>

        {/* Main Grid: Portrait & Story */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
          {/* Left Column: Visual Portrait & Education Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="relative rounded-3xl overflow-hidden border-2 border-[#DCC9B3] bg-[#FFFCF7] p-3 shadow-md">
              <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#E8DDD0] relative flex items-center justify-center">
                {profile.aboutPhotoUrl ? (
                  <img
                    src={profile.aboutPhotoUrl}
                    alt="Gabriella Christiani - About Me"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-6 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#FFFCF7] border border-[#DCC9B3] flex items-center justify-center text-[#694B36] mb-3 shadow-sm">
                      <GraduationCap className="w-8 h-8" />
                    </div>
                    <span className="font-editorial text-xl font-bold text-[#3E2C22]">
                      Information Systems
                    </span>
                    <span className="font-handwriting text-lg text-[#806047]">
                      Telkom University Purwokerto
                    </span>
                  </div>
                )}
              </div>

              {/* Quick stats ribbon */}
              <div className="mt-3 p-3 rounded-xl bg-[#F8F5EF] border border-[#DCC9B3]/60 flex items-center justify-between text-xs">
                <span className="text-[#806047] font-medium">Cumulative GPA:</span>
                <span className="font-bold text-[#3E2C22] bg-[#E8DDD0] px-2.5 py-0.5 rounded-full">
                  3.69 / 4.00 (Distinction)
                </span>
              </div>
            </div>

            {/* Visual Education Timeline */}
            <div className="bg-[#FFFCF7] border border-[#DCC9B3] rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#806047]">
                <BookOpen className="w-4 h-4 text-[#694B36]" />
                <span>Formal Education</span>
              </div>

              <div className="space-y-6 relative before:absolute before:inset-0 before:left-3 before:w-[1.5px] before:bg-[#DCC9B3]">
                {/* Telkom University */}
                <div className="relative pl-8">
                  <div className="absolute left-3 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#FFFCF7] border-2 border-[#694B36] top-1" />
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <h4 className="font-editorial text-lg font-bold text-[#3E2C22]">
                      Bachelor of Information Systems
                    </h4>
                    <span className="text-[11px] font-semibold text-[#806047]">2022 – 2026</span>
                  </div>
                  <div className="text-xs font-semibold text-[#694B36] mb-1.5">
                    Telkom University Purwokerto · GPA 3.69 / 4.00
                  </div>
                  <p className="text-xs text-[#806047] leading-relaxed">
                    Specialized in business process modeling (BPMN 2.0), enterprise requirements engineering, database warehousing, and undergraduate thesis research in NLP (IndoBERT).
                  </p>
                </div>

                {/* SMK Multimedia */}
                <div className="relative pl-8">
                  <div className="absolute left-3 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#FFFCF7] border-2 border-[#A58A73] top-1" />
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <h4 className="font-editorial text-lg font-bold text-[#3E2C22]">
                      Vocational High School Diploma
                    </h4>
                    <span className="text-[11px] font-semibold text-[#806047]">Graduated</span>
                  </div>
                  <div className="text-xs font-semibold text-[#694B36] mb-1.5">
                    SMK Multimedia
                  </div>
                  <p className="text-xs text-[#806047] leading-relaxed">
                    Built early expertise in digital media creation, UI/UX aesthetics, graphic composition, and user-centered design communication.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Biography & Analytical Identity */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-[#FFFCF7] border border-[#DCC9B3] rounded-3xl p-8 sm:p-10 shadow-sm space-y-6">
              <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[#3E2C22]">
                Bridging Business Vision & Data Precision
              </h3>

              <div className="space-y-4 text-sm sm:text-base text-[#694B36] leading-relaxed">
                {profile.bioParagraphs.map((para, idx) => (
                  <p key={idx} className="font-normal">
                    {para}
                  </p>
                ))}
              </div>

              {/* Areas of Interest Grid */}
              <div className="pt-6 border-t border-[#DCC9B3]/60 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#806047]">
                  <Compass className="w-4 h-4 text-[#694B36]" />
                  <span>Key Areas of Professional Interest</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(profile.areasOfInterest || [
                    'Business Process Analysis & BPMN 2.0',
                    'SOP Documentation & Governance',
                    'Requirements Elicitation & BRD Writing',
                    'Exploratory Data Analytics (Python/SQL)',
                    'Looker Studio & Excel BI Dashboards',
                    'NLP & Sentiment Modeling (IndoBERT)',
                  ]).map((interest) => (
                    <div key={interest} className="flex items-center gap-2.5 text-xs text-[#3E2C22] p-2.5 rounded-xl bg-[#F8F5EF] border border-[#DCC9B3]/50">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#806047] shrink-0" />
                      <span className="font-medium">{interest}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Professional Strengths */}
              <div className="pt-4 border-t border-[#DCC9B3]/60 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#806047]">
                  <Sparkles className="w-4 h-4 text-[#694B36]" />
                  <span>Core Professional Strengths</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(profile.professionalStrengths || [
                    'BPMN 2.0 Workflow Mapping',
                    'SOP Preparation',
                    'Cross-Functional Coordination',
                    'SQL Data Querying',
                    'IndoBERT Deep Learning NLP',
                    'Agile Sprints & User Stories',
                  ]).map((strength) => (
                    <span
                      key={strength}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#F1E8DC] text-[#3E2C22] border border-[#DCC9B3]"
                    >
                      {strength}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
