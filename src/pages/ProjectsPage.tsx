import React from 'react';
import { PROJECTS } from '../constants';
import { Code } from 'lucide-react';

const ProjectsPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto py-12 px-4 animate-fade-in-up relative z-10">
      <div className="text-center mb-12 p-6 rounded-2xl backdrop-blur-sm border opacity-80 theme-bg-secondary theme-border-subtle">
        <h2 className="text-3xl font-serif font-bold mb-2 flex items-center justify-center gap-2 theme-text-primary">
          <Code size={30} className="theme-text-accent1" /> 魔法作品
        </h2>
        <p className="theme-text-secondary">用代码和咖啡创造的神器。</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {PROJECTS.map((project) => (
          <div
            key={project.id}
            className="group rounded-xl overflow-hidden border transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md theme-bg-secondary theme-border-subtle"
          >
            <div className="h-48 overflow-hidden relative">
              <div className="absolute inset-0 group-hover:bg-transparent transition-colors z-10 project-card-overlay" />
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2 font-serif transition-colors theme-text-primary">
                {project.title}
              </h3>
              <p className="text-sm mb-4 h-20 overflow-hidden pb-2 border-b theme-text-secondary theme-border-subtle">
                {project.description}
              </p>
              <div className="flex flex-wrap gap-2 mt-auto">
                {project.tech.map((t) => (
                  <span
                    key={t}
                    className="text-xs font-mono px-2 py-1 rounded border theme-text-secondary theme-bg-tertiary theme-border-subtle"
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

export default ProjectsPage;