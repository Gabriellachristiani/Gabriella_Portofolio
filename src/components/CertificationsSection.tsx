import React, { useState } from 'react';
import { Award, ExternalLink, CheckCircle, Maximize2, X, ChevronLeft, ChevronRight, FileCheck } from 'lucide-react';
import { Certification } from '../types/portfolio';

interface CertificationsSectionProps {
  certifications: Certification[];
}

export const CertificationsSection: React.FC<CertificationsSectionProps> = ({ certifications }) => {
  const [selectedCertIndex, setSelectedCertIndex] = useState<number | null>(null);

  const activeCert = selectedCertIndex !== null ? certifications[selectedCertIndex] : null;
  const activeCertImg = activeCert?.imageUrl || activeCert?.image;

  const handleOpenLightbox = (index: number) => {
    setSelectedCertIndex(index);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedCertIndex === null) return;
    setSelectedCertIndex((prev) => (prev === null || prev === 0 ? certifications.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedCertIndex === null) return;
    setSelectedCertIndex((prev) => (prev === null || prev === certifications.length - 1 ? 0 : prev + 1));
  };

  return (
    <section id="certifications" className="py-20 sm:py-28 bg-[#F1E8DC]/40 border-t border-[#DCC9B3]/80 relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#806047] mb-2">
              <span>05. Official Accreditations</span>
            </div>
            <div className="flex items-center gap-3">
              <h2 className="font-editorial text-3xl sm:text-5xl lg:text-5xl font-bold tracking-tight text-[#3E2C22]">
                Certifications & Credentials
              </h2>
              <span className="font-handwriting text-2xl text-[#806047] -rotate-2">
                (verified proof)
              </span>
            </div>
            <p className="mt-3 text-sm sm:text-base text-[#694B36] max-w-xl font-normal leading-relaxed">
              Nationally accredited and industry-certified proficiencies in data science (BNSP), 
              data analytics (Kampus Merdeka / BitLabs Academy), and professional English proficiency.
            </p>
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {certifications.map((cert, index) => {
            const certImg = cert.imageUrl || cert.image;
            return (
              <div
                key={cert.id}
                className="group flex flex-col justify-between bg-[#FFFCF7] border border-[#DCC9B3] rounded-[28px] overflow-hidden hover:border-[#A58A73] hover:shadow-lg transition-all duration-300"
              >
                <div>
                  {/* Certificate Image or Styled Header */}
                  {certImg ? (
                    <div
                      onClick={() => handleOpenLightbox(index)}
                      className="relative w-full aspect-[4/3] bg-[#F1E8DC] border-b border-[#DCC9B3] overflow-hidden cursor-zoom-in group/img"
                    >
                      <img
                        src={certImg}
                        alt={`${cert.title} Certificate`}
                        className="w-full h-full object-cover object-center group-hover/img:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-[#3E2C22]/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-3.5 py-1.5 rounded-full bg-[#FFFCF7]/95 text-xs font-bold text-[#3E2C22] shadow flex items-center gap-1.5">
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>View Certificate</span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-7 pb-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#F1E8DC] border border-[#DCC9B3] flex items-center justify-center text-[#694B36] mb-2">
                        <Award className="w-6 h-6" />
                      </div>
                    </div>
                  )}

                  {/* Body Content */}
                  <div className="p-7">
                    <div className="flex items-center justify-between text-xs text-[#806047] mb-2 font-semibold">
                      <span>{cert.issuer}</span>
                      <span className="bg-[#F1E8DC] px-2.5 py-0.5 rounded-full text-[11px]">
                        {cert.period || cert.issueDate}
                      </span>
                    </div>

                    <h3 className="font-editorial text-2xl font-bold text-[#3E2C22] leading-snug mb-4 group-hover:text-[#694B36] transition-colors">
                      {cert.title}
                    </h3>

                    {/* Verified Skills */}
                    <div className="space-y-2 mb-6">
                      <div className="text-[11px] uppercase tracking-wider font-semibold text-[#806047]">
                        Verified Competencies:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {cert.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#F8F5EF] text-[#3E2C22] border border-[#DCC9B3]/60 flex items-center gap-1.5"
                          >
                            <CheckCircle className="w-3 h-3 text-[#806047] shrink-0" />
                            <span>{skill}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Link / Verification */}
                <div className="px-7 py-4 bg-[#F8F5EF]/60 border-t border-[#DCC9B3]/70 flex items-center justify-between">
                  {certImg ? (
                    <button
                      type="button"
                      onClick={() => handleOpenLightbox(index)}
                      className="text-xs font-bold uppercase tracking-wider text-[#694B36] hover:text-[#3E2C22] transition-colors inline-flex items-center gap-1"
                    >
                      <span>Preview Image</span>
                      <Maximize2 className="w-3 h-3" />
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#806047] italic">Accredited Credential</span>
                  )}

                  {cert.credentialUrl && (
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#3E2C22] hover:text-[#694B36] transition-colors"
                    >
                      <span>Verify Credential</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fullscreen Certificate Lightbox */}
      {selectedCertIndex !== null && activeCert && (
        <div
          className="fixed inset-0 z-50 bg-[#3E2C22]/85 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in"
          onClick={() => setSelectedCertIndex(null)}
          role="dialog"
          aria-modal="true"
        >
          {/* Top Bar */}
          <div className="w-full max-w-4xl flex items-center justify-between text-white/95 mb-3 px-2">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-[#DCC9B3]">
                Certificate {selectedCertIndex + 1} of {certifications.length}
              </span>
              <h3 className="font-editorial text-lg sm:text-xl font-bold text-white">
                {activeCert.title}
              </h3>
            </div>
            <button
              onClick={() => setSelectedCertIndex(null)}
              className="p-2.5 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
              title="Close Fullscreen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Certificate Display Area */}
          <div
            className="relative w-full max-w-4xl bg-[#FFFCF7] rounded-3xl overflow-hidden shadow-2xl border border-[#DCC9B3] flex flex-col items-center max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-center bg-[#2A1E17] p-2 sm:p-4 overflow-hidden relative min-h-[300px]">
              {activeCertImg ? (
                <img
                  src={activeCertImg}
                  alt={activeCert.title}
                  className="max-h-[62vh] max-w-full object-contain rounded-lg shadow-md"
                />
              ) : (
                <div className="py-20 text-center text-white/80 space-y-3">
                  <Award className="w-16 h-16 mx-auto text-[#DCC9B3]" />
                  <p className="text-sm font-semibold">No direct certificate screenshot uploaded yet.</p>
                  <p className="text-xs text-white/60">Upload in the private administrator portal.</p>
                </div>
              )}

              {/* Prev / Next controls */}
              {certifications.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors shadow-lg"
                    aria-label="Previous certificate"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors shadow-lg"
                    aria-label="Next certificate"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Details Footer */}
            <div className="w-full p-5 sm:p-6 bg-[#FFFCF7] border-t border-[#DCC9B3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#806047]">
                  {activeCert.issuer} · {activeCert.period || activeCert.issueDate}
                </div>
                <div className="text-xs text-[#694B36] mt-1">
                  Verified Skills: {activeCert.skills.join(', ')}
                </div>
              </div>

              {activeCert.credentialUrl && (
                <a
                  href={activeCert.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#3E2C22] text-[#F8F5EF] hover:bg-[#694B36] transition-colors shrink-0"
                >
                  <span>Verify at Issuer</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
