import React from 'react';
import { Award, CheckCircle, ExternalLink, Sparkles, Terminal, FileCheck, Palette } from 'lucide-react';
import { Certification, Profile } from '../types/portfolio';

interface SkillsSectionProps {
  certifications: Certification[];
  profile: Profile | null;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({ certifications, profile }) => {
  const competencies = profile?.coreCompetencies || [
    {
      category: 'Business Analysis',
      skills: [
        'Business Process Analysis',
        'SOP Documentation',
        'Workflow Review',
        'System Design Coordination',
        'Stakeholder Coordination',
        'User Stories & Acceptance Criteria',
      ],
    },
    {
      category: 'Data Analytics',
      skills: [
        'Microsoft Excel',
        'SQL',
        'Python',
        'Looker Studio',
        'Data Visualization',
        'Data Analysis',
      ],
    },
    {
      category: 'Design & Productivity',
      skills: [
        'Figma',
        'Microsoft Office',
        'Google Workspace',
        'Lucidchart',
        'Miro',
      ],
    },
  ];

  return (
    <section id="skills-certifications" className="py-20 sm:py-28 bg-[#F8F5EF] border-t border-[#DCC9B3]/80 relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-16">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#806047] mb-2">
              <span>04. Competency & Credentials</span>
            </div>
            <div className="flex items-center gap-3">
              <h2 className="font-editorial text-3xl sm:text-5xl lg:text-5xl font-bold tracking-tight text-[#3E2C22]">
                Skills & Certifications
              </h2>
              <span className="font-handwriting text-2xl text-[#806047] -rotate-2">
                (verified proficiency)
              </span>
            </div>
          </div>
          <p className="text-sm sm:text-base text-[#694B36] max-w-md font-normal leading-relaxed">
            Standardized competencies across business process modeling, quantitative analytics, and official certifications.
          </p>
        </div>

        {/* Part 1: Visual Skills Groups */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {competencies.map((group) => {
            const isBA = group.category.includes('Business');
            const isDA = group.category.includes('Data');
            return (
              <div
                key={group.category}
                className="bg-[#FFFCF7] border border-[#DCC9B3] rounded-3xl p-7 shadow-sm hover:border-[#A58A73] transition-all space-y-5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F1E8DC] border border-[#DCC9B3] flex items-center justify-center text-[#694B36]">
                    {isBA ? (
                      <FileCheck className="w-5 h-5" />
                    ) : isDA ? (
                      <Terminal className="w-5 h-5" />
                    ) : (
                      <Palette className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-editorial text-xl font-bold text-[#3E2C22]">
                      {group.category}
                    </h3>
                    <span className="text-[11px] font-semibold text-[#806047] uppercase tracking-wider">
                      Core Toolset
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-[#DCC9B3]/50">
                  {group.skills.map((skill) => (
                    <div
                      key={skill}
                      className="flex items-center gap-2.5 text-xs sm:text-sm text-[#3E2C22] p-2 rounded-xl hover:bg-[#F8F5EF] transition-colors"
                    >
                      <CheckCircle className="w-4 h-4 text-[#806047] shrink-0" />
                      <span className="font-medium">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Transition Callout to Certifications Gallery */}
        <div className="p-8 rounded-3xl bg-[#FFFCF7] border border-[#DCC9B3] flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F1E8DC] border border-[#DCC9B3] flex items-center justify-center text-[#694B36] shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-editorial text-2xl font-bold text-[#3E2C22]">
                Accredited Professional Certifications
              </h3>
              <p className="text-sm text-[#694B36] mt-1">
                Explore official credentials including BNSP Associate Data Scientist, BitLabs Academy, and TOEFL EPrT with verified certificate image proofs.
              </p>
            </div>
          </div>
          <a
            href="#certifications"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#3E2C22] text-[#F8F5EF] hover:bg-[#694B36] transition-colors shrink-0"
          >
            <span>View Certificate Gallery ({certifications.length})</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
};
