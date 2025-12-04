import React from 'react';
import { CustomSparkleIcon } from '../CustomIcons';
import { Project } from '../../types';

interface PortfolioPageProps {
  projects: Project[];
}

export const PortfolioPage: React.FC<PortfolioPageProps> = ({ projects }) => {
  return (
    <div className="max-w-6xl mx-auto py-12 px-4 animate-fade-in-up relative z-10">
      <div className="text-center mb-12 bg-black/30 p-6 rounded-2xl backdrop-blur-sm border border-white/5">
        <h2 className="text-3xl font-serif font-bold text-white mb-2 flex items-center justify-center gap-2">
          <CustomSparkleIcon size={30} /> 魔法作品
        </h2>
        <p className="text-slate-300">用代码和咖啡创造的神器。</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map(project => (
          <div
            key={project.id}
            className="group bg-slate-900/80 rounded-xl overflow-hidden border border-white/10 hover:border-amber-400/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md"
          >
            <div className="h-48 overflow-hidden relative">
              <div className="absolute inset-0 bg-purple-900/20 group-hover:bg-transparent transition-colors z-10" />
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-100 mb-2 font-serif group-hover:text-amber-300 transition-colors">
                {project.title}
              </h3>
              <p className="text-slate-400 text-sm mb-4 h-20 overflow-hidden border-b border-white/5 pb-2">
                {project.description}
              </p>
              <div className="flex flex-wrap gap-2 mt-auto">
                {project.tech.map(t => (
                  <span
                    key={t}
                    className="text-xs font-mono text-slate-300 bg-white/5 px-2 py-1 rounded border border-white/5"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PortfolioPage;
