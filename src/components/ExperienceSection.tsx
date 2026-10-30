import React, { useState } from 'react';
import { Calendar, Building2, MapPin, ChevronDown, ChevronUp, Briefcase, CheckCircle2 } from 'lucide-react';
import { Experience } from '../types/portfolio';

interface ExperienceSectionProps {
  experiences: Experience[];
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({ experiences }) => {
  const [expandedId, setExpandedId] = useState<string | null>(experiences[0]?.id || null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section id="experience" className="py-20 sm:py-28 bg-[#F8F5EF] border-t border-[#DCC9B3]/80 relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-16">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#806047] mb-2">
              <span>02. Track Record</span>
            </div>
            <div className="flex items-center gap-3">
              <h2 className="font-editorial text-3xl sm:text-5xl lg:text-5xl font-bold tracking-tight text-[#3E2C22]">
                Professional Experience
              </h2>
              <span className="font-handwriting text-2xl text-[#806047] -rotate-2">
                (hands-on impact)
              </span>
            </div>
          </div>
          <p className="text-sm sm:text-base text-[#694B36] max-w-md font-normal leading-relaxed">
            Hands-on track record executing business process reviews, SOP documentation, research dashboards, 
            and system design coordination at government and university institutions.
          </p>
        </div>

        {/* Timeline Layout */}
        <div className="space-y-8 relative before:absolute before:inset-0 before:left-4 md:before:left-36 before:w-[2px] before:bg-[#DCC9B3]">
          {experiences.map((exp, idx) => {
            const isExpanded = expandedId === exp.id;
            return (
              <div
                key={exp.id || idx}
                className="relative flex flex-col md:flex-row gap-6 md:gap-12 pl-10 md:pl-0"
              >
                {/* Date Tag on Left (Desktop) */}
                <div className="md:w-36 shrink-0 md:text-right pt-2">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#694B36]">
                    <Calendar className="w-3.5 h-3.5 md:hidden" />
                    <span>{exp.period}</span>
                  </div>
                  <div className="text-[11px] font-medium text-[#806047] md:block mt-1">
                    {exp.division ? exp.division.split('—')[0].trim() : 'Official Role'}
                  </div>
                </div>

                {/* Timeline Node Marker */}
                <div className="absolute left-4 md:left-36 -translate-x-1/2 w-5 h-5 rounded-full bg-[#FFFCF7] border-2 border-[#694B36] flex items-center justify-center top-3 z-10 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-[#694B36]" />
                </div>

                {/* Experience Card */}
                <div className="flex-1 bg-[#FFFCF7] border border-[#DCC9B3] rounded-3xl p-6 sm:p-8 shadow-sm hover:border-[#A58A73] transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-3">
                    <div>
                      <div className="inline-block text-[11px] font-semibold uppercase tracking-wider text-[#806047] mb-1">
                        {exp.company}
                      </div>
                      <h3 className="font-editorial text-2xl font-bold text-[#3E2C22]">
                        {exp.role}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-medium text-[#806047]">
                      <MapPin className="w-3.5 h-3.5 text-[#694B36]" />
                      <span>{exp.location}</span>
                    </div>
                  </div>

                  <p className="text-sm text-[#694B36] leading-relaxed mb-5">
                    {exp.description}
                  </p>

                  {/* Key Responsibilities */}
                  <div className="space-y-3 mb-6 bg-[#F8F5EF] p-5 rounded-2xl border border-[#DCC9B3]/60">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#694B36] flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Key Responsibilities & Deliverables:</span>
                    </div>

                    <div className="space-y-2">
                      {exp.bulletPoints.map((point, pIdx) => (
                        <div key={pIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#3E2C22]">
                          <CheckCircle2 className="w-4 h-4 text-[#806047] shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Technologies & Tools */}
                  <div className="pt-4 border-t border-[#DCC9B3]/60 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[#806047]">
                    <span className="font-semibold text-[#3E2C22]">Focus Tools & Standards:</span>
                    {exp.technologies.map((tech, tIdx) => (
                      <React.Fragment key={tech}>
                        <span className="font-medium text-[#694B36]">{tech}</span>
                        {tIdx < exp.technologies.length - 1 && (
                          <span className="text-[#DCC9B3]" aria-hidden="true">
                            ·
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
