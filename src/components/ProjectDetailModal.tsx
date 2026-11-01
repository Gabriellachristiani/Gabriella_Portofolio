import React, { useState } from 'react';
import { X, CheckCircle, ExternalLink, Calendar, Wrench, Layers, ChevronLeft, ChevronRight, BarChart2, ShieldCheck, Maximize2 } from 'lucide-react';
import { Project } from '../types/portfolio';

interface ProjectDetailModalProps {
  project: Project | null;
  onClose: () => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ project, onClose }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!project) return null;

  const categoryLabel =
    project.category === 'business-analysis'
      ? 'Business Analysis & Information Systems'
      : 'Data Analytics & Data Science';

  // Consolidate coverImage and gallery images
  const allImages: string[] = [];
  if (project.coverImage && project.coverImage.trim()) {
    allImages.push(project.coverImage);
  }
  if (Array.isArray(project.images)) {
    project.images.forEach((img) => {
      if (img && img.trim() && !allImages.includes(img)) {
        allImages.push(img);
      }
    });
  }

  const hasImages = allImages.length > 0;
  const currentImage = hasImages ? allImages[Math.min(activeImageIndex, allImages.length - 1)] : '';

  return (
    <>
      <div
        className="fixed inset-0 z-50 overflow-y-auto bg-[#3E2C22]/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-project-title"
      >
        <div
          className="relative bg-[#FFFCF7] rounded-[32px] max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-[#DCC9B3] shadow-2xl text-[#3E2C22]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-[#FFFCF7]/95 backdrop-blur-md px-6 sm:px-8 py-5 border-b border-[#DCC9B3] flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider font-semibold text-[#806047]">
              <span>{categoryLabel}</span>
              <span className="text-[#DCC9B3]">·</span>
              <span className="normal-case text-[#694B36] font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {project.date}
              </span>
              {project.score && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#F1E8DC] text-[#3E2C22] font-bold text-[11px]">
                  Score: {project.score}
                </span>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#F1E8DC] text-[#806047] hover:text-[#3E2C22] transition-colors"
              aria-label="Close case study"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 sm:p-8 space-y-8">
            {/* Title & Metadata */}
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-[#806047] mb-1">
                {project.organization || 'Featured Portfolio Project'} {project.role ? `· ${project.role}` : ''}
              </div>
              <h2
                id="modal-project-title"
                className="font-editorial text-3xl sm:text-4xl font-bold text-[#3E2C22] leading-tight mb-3"
              >
                {project.title}
              </h2>
              <p className="text-base sm:text-lg text-[#694B36] font-normal leading-relaxed">
                {project.tagline}
              </p>
            </div>

            {/* Screenshots Gallery & Lightbox Trigger */}
            {hasImages ? (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden border border-[#DCC9B3] bg-[#F1E8DC] aspect-video flex items-center justify-center group">
                  <img
                    src={currentImage}
                    alt={`${project.title} screenshot ${activeImageIndex + 1}`}
                    className="w-full h-full object-contain cursor-zoom-in"
                    onClick={() => setLightboxOpen(true)}
                  />

                  <button
                    onClick={() => setLightboxOpen(true)}
                    className="absolute top-3 right-3 p-2 rounded-full bg-[#FFFCF7]/90 text-[#3E2C22] hover:bg-[#FFFCF7] shadow-md transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1.5 text-xs font-semibold px-3"
                    title="Open Fullscreen Lightbox"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Expand</span>
                  </button>

                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setActiveImageIndex((prev) =>
                            prev === 0 ? allImages.length - 1 : prev - 1
                          )
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-[#FFFCF7]/85 hover:bg-[#FFFCF7] text-[#3E2C22] shadow-sm transition-colors"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() =>
                          setActiveImageIndex((prev) =>
                            prev === allImages.length - 1 ? 0 : prev + 1
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-[#FFFCF7]/85 hover:bg-[#FFFCF7] text-[#3E2C22] shadow-sm transition-colors"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {allImages.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {allImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-20 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                          idx === activeImageIndex
                            ? 'border-[#694B36] ring-1 ring-[#694B36]'
                            : 'border-[#DCC9B3] opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {/* Special Confidentiality Notice for BPKP project */}
            {project.id === 'proj-bpkp' && (
              <div className="p-4 rounded-2xl bg-[#F8F5EF] border border-[#DCC9B3] flex items-start gap-3 text-xs text-[#806047]">
                <ShieldCheck className="w-4 h-4 text-[#694B36] shrink-0 mt-0.5" />
                <span>
                  <strong>Governance Note:</strong> Internal government documents, confidential data, and proprietary infrastructure details have been strictly generalized and anonymized in accordance with public sector guidelines.
                </span>
              </div>
            )}

            {/* Aspect Metrics (for Thesis IndoBERT project) */}
            {project.aspectMetrics && project.aspectMetrics.length > 0 && (
              <div className="p-6 rounded-2xl bg-[#F8F5EF] border border-[#DCC9B3] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-[#806047] flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-[#694B36]" />
                    <span>Thesis Aspect-Based Sentiment Analysis Results (IndoBERT)</span>
                  </h3>
                  <span className="text-xs font-bold text-[#694B36]">
                    Overall Accuracy: 94.87% · F1: 94.93%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {project.aspectMetrics.map((aspect) => (
                    <div
                      key={aspect.aspect}
                      className="p-3.5 rounded-xl bg-[#FFFCF7] border border-[#DCC9B3]/80 space-y-1"
                    >
                      <div className="text-xs font-bold text-[#3E2C22]">{aspect.aspect}</div>
                      {aspect.scoreOrAccuracy && (
                        <div className="text-[11px] font-semibold text-[#806047]">
                          Aspect Accuracy: {aspect.scoreOrAccuracy}
                        </div>
                      )}
                      {aspect.sentimentDistribution && (
                        <div className="text-[11px] text-[#694B36]">
                          Distribution: {aspect.sentimentDistribution}
                        </div>
                      )}
                      {aspect.note && (
                        <div className="text-[10px] text-[#806047] leading-relaxed">
                          {aspect.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 1: Business Problem Statement */}
            <div className="p-6 rounded-2xl bg-[#FFFCF7] border border-[#DCC9B3]">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-[#806047] mb-2">
                01. The Problem & Business Context
              </h3>
              <p className="text-sm sm:text-base text-[#3E2C22] leading-relaxed">
                {project.problemStatement}
              </p>
            </div>

            {/* Section 2: Methodology & Execution */}
            <div className="p-6 rounded-2xl bg-[#FFFCF7] border border-[#DCC9B3]">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-[#806047] mb-2">
                02. Process & Analytical Methodology
              </h3>
              <p className="text-sm sm:text-base text-[#3E2C22] leading-relaxed">
                {project.methodology}
              </p>
            </div>

            {/* Section 3: Deliverables & Measurable Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-[#FFFCF7] border border-[#DCC9B3]">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-[#806047] mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#694B36]" />
                  <span>Key Deliverables</span>
                </h3>
                <ul className="space-y-2">
                  {project.deliverables.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#3E2C22]">
                      <CheckCircle className="w-4 h-4 text-[#806047] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 rounded-2xl bg-[#FFFCF7] border border-[#DCC9B3]">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-[#806047] mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#694B36]" />
                  <span>Results & Key Insights</span>
                </h3>
                <ul className="space-y-2">
                  {project.results.map((res, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#3E2C22]">
                      <span className="text-[#806047] font-bold text-base leading-none mt-1">―</span>
                      <span className="font-medium text-[#3E2C22]">{res}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Tools & Links Footer */}
            <div className="pt-6 border-t border-[#DCC9B3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#806047]">
                <span className="font-semibold text-[#3E2C22] flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-[#694B36]" />
                  Tools & Technologies:
                </span>
                {project.tools.map((tool, idx) => (
                  <React.Fragment key={tool}>
                    <span className="font-medium text-[#694B36]">{tool}</span>
                    {idx < project.tools.length - 1 && (
                      <span className="text-[#DCC9B3]" aria-hidden="true">
                        ·
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#694B36] hover:text-[#3E2C22] underline underline-offset-4"
                >
                  <span>Open External Resource</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && hasImages && (
        <div
          className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Top Bar */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white/90 z-10">
            <span className="text-xs uppercase tracking-wider font-semibold">
              {project.title} · Screenshot {activeImageIndex + 1} of {allImages.length}
            </span>
            <button
              onClick={() => setLightboxOpen(false)}
              className="p-2.5 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
              title="Close Fullscreen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Fullscreen Image */}
          <div className="relative max-w-5xl max-h-[85vh] flex items-center justify-center">
            <img
              src={currentImage}
              alt="fullscreen view"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            {allImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex((prev) =>
                      prev === 0 ? allImages.length - 1 : prev - 1
                    );
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex((prev) =>
                      prev === allImages.length - 1 ? 0 : prev + 1
                    );
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
