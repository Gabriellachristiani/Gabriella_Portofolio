import React from 'react';
import { Award, ExternalLink, CheckCircle } from 'lucide-react';
import { Certification } from '../types/portfolio';

interface CertificationsSectionProps {
  certifications: Certification[];
}

export const CertificationsSection: React.FC<CertificationsSectionProps> = ({ certifications }) => {
  return (
    <section id="certifications" className="py-20 sm:py-28 bg-[#F5EFEB]/50 border-t border-[#E8DFD6]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#8C5E34] mb-3">
            <span>04. Professional Verification</span>
          </div>
          <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#2A1E17] mb-6">
            Certifications & Credentials
          </h2>
          <p className="text-base sm:text-lg text-[#6E5C50] leading-relaxed">
            Formally accredited proficiencies in business analysis frameworks, requirements engineering, 
            data warehousing, and enterprise business intelligence tooling.
          </p>
        </div>

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="flex flex-col justify-between bg-[#FFFFFF] border border-[#E8DFD6] rounded-2xl p-7 hover:border-[#D4B996] hover:shadow-sm transition-all"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#E8DFD6] flex items-center justify-center text-[#8C5E34] mb-6">
                  <Award className="w-6 h-6" />
                </div>

                <div className="flex items-center justify-between text-xs text-[#7D6B5D] mb-2 font-medium">
                  <span>{cert.issuer}</span>
                  <span>{cert.issueDate}</span>
                </div>

                <h3 className="font-editorial text-xl font-bold text-[#2A1E17] leading-snug mb-4">
                  {cert.title}
                </h3>

                {/* Skills verified (zero-pill inline format) */}
                <div className="space-y-2 mb-6">
                  <div className="text-[11px] uppercase tracking-wider font-semibold text-[#8C5E34]">
                    Verified Skills:
                  </div>
                  <ul className="space-y-1.5">
                    {cert.skills.map((skill) => (
                      <li key={skill} className="flex items-center gap-2 text-xs text-[#4A3B32]">
                        <CheckCircle className="w-3.5 h-3.5 text-[#8C5E34] shrink-0" />
                        <span>{skill}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {cert.credentialUrl && (
                <div className="pt-4 border-t border-[#F0E6DC]">
                  <a
                    href={cert.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C5E34] hover:text-[#5C3E26] transition-colors"
                  >
                    <span>Verify Credential</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
