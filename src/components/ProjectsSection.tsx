import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Layers, Award, Sparkles, ExternalLink } from 'lucide-react';
import { Project } from '../types/portfolio';
import { ProjectDetailModal } from './ProjectDetailModal';

interface ProjectsSectionProps {
  projects: Project[];
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({ projects }) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'business-analysis' | 'data-analytics'>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const filteredProjects = projects.filter((project) => {
    if (activeCategory === 'all') return true;
    return project.category === activeCategory;
  });

  const baCount = projects.filter((p) => p.category === 'business-analysis').length;
  const daCount = projects.filter((p) => p.category === 'data-analytics').length;

  return (
    <section id="projects" className="py-20 sm:py-28 bg-[#F1E8DC]/40 border-t border-[#DCC9B3]/80 relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#806047] mb-2">
              <span>03. Selected Portfolio Work</span>
            </div>
            <div className="flex items-center gap-3">
              <h2 className="font-editorial text-3xl sm:text-5xl lg:text-5xl font-bold tracking-tight text-[#3E2C22]">
                Projects & Case Studies
              </h2>
              <span className="font-handwriting text-2xl text-[#806047] -rotate-2">
                (deep dive)
              </span>
            </div>
            <p className="mt-3 text-sm sm:text-base text-[#694B36] max-w-xl font-normal leading-relaxed">
              Real-world initiatives spanning government system design (BPKP), Kampus Merdeka data analytics (RedDoorz), 
              undergraduate NLP research (IndoBERT), and sustainable capstone platforms (Plastani).
            </p>
          </div>

          {/* Interactive Category Segmented Filter */}
          <div className="inline-flex p-1.5 rounded-2xl bg-[#E8DDD0] border border-[#DCC9B3] self-start md:self-auto shadow-inner">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'all'
                  ? 'bg-[#FFFCF7] text-[#3E2C22] shadow-sm'
                  : 'text-[#694B36] hover:text-[#3E2C22]'
              }`}
            >
              All Projects ({projects.length})
            </button>
            <button
              onClick={() => setActiveCategory('business-analysis')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'business-analysis'
                  ? 'bg-[#FFFCF7] text-[#3E2C22] shadow-sm'
                  : 'text-[#694B36] hover:text-[#3E2C22]'
              }`}
            >
              Business Analysis ({baCount})
            </button>
            <button
              onClick={() => setActiveCategory('data-analytics')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'data-analytics'
                  ? 'bg-[#FFFCF7] text-[#3E2C22] shadow-sm'
                  : 'text-[#694B36] hover:text-[#3E2C22]'
              }`}
            >
              Data Analytics ({daCount})
            </button>
          </div>
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredProjects.map((project) => {
            const displayImage = project.coverImage || (project.images && project.images.length > 0 ? project.images[0] : null);
            return (
              <article
                key={project.id}
                className="group flex flex-col bg-[#FFFCF7] border border-[#DCC9B3] rounded-[28px] overflow-hidden hover:border-[#A58A73] hover:shadow-lg transition-all duration-300"
              >
                {/* Project Cover Image */}
                {displayImage ? (
                  <div
                    onClick={() => setSelectedProject(project)}
                    className="relative w-full aspect-[16/9] overflow-hidden bg-[#F1E8DC] border-b border-[#DCC9B3] cursor-pointer"
                  >
                    <img
                      src={displayImage}
                      alt={project.title}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#3E2C22]/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {project.images && project.images.length > 1 && (
                      <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-[#FFFCF7]/90 text-[11px] font-semibold text-[#3E2C22] shadow backdrop-blur-sm">
                        {project.images.length} screenshots
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    onClick={() => setSelectedProject(project)}
                    className="w-full h-32 bg-gradient-to-br from-[#F1E8DC] to-[#E8DDD0] border-b border-[#DCC9B3] flex items-center justify-between px-7 cursor-pointer group-hover:bg-[#E8DDD0] transition-colors"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#806047]">
                      <Layers className="w-4 h-4 text-[#694B36]" />
                      <span>{project.category === 'business-analysis' ? 'Business Analysis' : 'Data Analytics'}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#806047]">
                      Click to explore
                    </span>
                  </div>
                )}

                {/* Card Banner / Thumbnail Header */}
                <div className="p-7 pb-0">
                  <div className="flex items-center justify-between text-xs mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold uppercase tracking-wider text-[11px] text-[#806047]">
                        {project.category === 'business-analysis'
                          ? 'Business Analysis & IS'
                          : 'Data Analytics & NLP'}
                      </span>
                    {project.score && (
                      <span className="px-2 py-0.5 rounded-full bg-[#E8DDD0] text-[#3E2C22] font-bold text-[10px]">
                        ★ Score {project.score}
                      </span>
                    )}
                  </div>
                  <span className="font-medium text-[#806047]">{project.period || project.date}</span>
                </div>

                {project.organization && (
                  <div className="text-xs text-[#806047] font-semibold mb-1">
                    {project.organization}
                  </div>
                )}

                <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[#3E2C22] group-hover:text-[#694B36] transition-colors leading-snug mb-3">
                  {project.title}
                </h3>

                <p className="text-sm text-[#694B36] leading-relaxed mb-5">
                  {project.tagline}
                </p>

                {/* Key Impact / Highlights */}
                {project.results && project.results.length > 0 && (
                  <div className="mb-5 p-4 rounded-2xl bg-[#F8F5EF] border border-[#DCC9B3]/80 space-y-1.5">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-[#806047] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Key Outcome</span>
                    </div>
                    <p className="text-xs font-semibold text-[#3E2C22] leading-snug">
                      {project.results[0]}
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Card Footer */}
              <div className="mt-auto px-7 py-5 bg-[#F8F5EF]/60 border-t border-[#DCC9B3]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Tools (Clean text with separators) */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#806047]">
                  {project.tools.slice(0, 4).map((tool, idx) => (
                    <React.Fragment key={tool}>
                      <span className="font-medium text-[#694B36]">{tool}</span>
                      {idx < Math.min(project.tools.length, 4) - 1 && (
                        <span className="text-[#DCC9B3]" aria-hidden="true">
                          ·
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                  {project.tools.length > 4 && (
                    <span className="text-[11px] text-[#A58A73]">+{project.tools.length - 4} more</span>
                  )}
                </div>

                <button
                  onClick={() => setSelectedProject(project)}
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#3E2C22] group-hover:text-[#694B36] transition-colors self-start sm:self-auto"
                >
                  <span>Explore Case Study</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </article>
            );
          })}
        </div>

        {/* Modal for Deep Dive Case Study */}
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      </div>
    </section>
  );
};
