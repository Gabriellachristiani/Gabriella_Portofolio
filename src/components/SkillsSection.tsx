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

        {/* Part 2: Certifications Grid */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#806047] mb-6">
            <Award className="w-4 h-4 text-[#694B36]" />
            <span>Official Accredited Certifications</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {certifications.map((cert) => (
              <div
                key={cert.id}
                className="flex flex-col justify-between bg-[#FFFCF7] border border-[#DCC9B3] rounded-3xl p-7 hover:border-[#A58A73] hover:shadow-sm transition-all"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#F1E8DC] border border-[#DCC9B3] flex items-center justify-center text-[#694B36] mb-5">
                    <Award className="w-6 h-6" />
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#806047] mb-2 font-semibold">
                    <span>{cert.issuer}</span>
                    <span className="bg-[#F1E8DC] px-2 py-0.5 rounded-full text-[11px]">
                      {cert.period || cert.issueDate}
                    </span>
                  </div>

                  <h3 className="font-editorial text-2xl font-bold text-[#3E2C22] leading-snug mb-4">
                    {cert.title}
                  </h3>

                  <div className="space-y-1.5 mb-6">
                    <div className="text-[11px] uppercase tracking-wider font-semibold text-[#806047]">
                      Verified Skills:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cert.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#F8F5EF] text-[#3E2C22] border border-[#DCC9B3]/60"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {cert.credentialUrl && (
                  <div className="pt-4 border-t border-[#DCC9B3]/60">
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#694B36] hover:text-[#3E2C22] transition-colors"
                    >
                      <span>Verify Credential</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
