import React from 'react';
import { Code, ExternalLink, Github, Star, GitBranch } from 'lucide-react';

interface Project {
    id: string;
    title: string;
    description: string;
    image?: string;
    technologies: string[];
    githubUrl?: string;
    demoUrl?: string;
    stars?: number;
    forks?: number;
    featured?: boolean;
}

interface ProjectsPageProps {
    projects: Project[];
}

const ProjectsPage: React.FC<ProjectsPageProps> = ({ projects }) => {
    const featuredProjects = projects.filter(p => p.featured);
    const otherProjects = projects.filter(p => !p.featured);

    return (
        <div className="min-h-screen theme-bg-primary py-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold theme-text-primary mb-4 flex items-center justify-center gap-3">
                        <Code className="text-purple-400" />
                        项目展示
                    </h1>
                    <p className="text-lg theme-text-secondary max-w-2xl mx-auto">
                        探索我的创意作品，从实用工具到艺术实验
                    </p>
                </div>

                {/* Featured Projects */}
                {featuredProjects.length > 0 && (
                    <section className="mb-16">
                        <h2 className="text-2xl font-bold theme-text-primary mb-8 text-center">精选项目</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {featuredProjects.map((project) => (
                                <article
                                    key={project.id}
                                    className="theme-card-primary rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
                                >
                                    {/* Project Image */}
                                    {project.image && (
                                        <div className="h-64 overflow-hidden relative">
                                            <img
                                                src={project.image}
                                                alt={project.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="p-8">
                                        {/* Title */}
                                        <h3 className="text-2xl font-bold theme-text-primary mb-3 group-hover:theme-text-accent1 transition-colors">
                                            {project.title}
                                        </h3>

                                        {/* Description */}
                                        <p className="theme-text-secondary mb-6 leading-relaxed">
                                            {project.description}
                                        </p>

                                        {/* Technologies */}
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {project.technologies.map((tech) => (
                                                <span
                                                    key={tech}
                                                    className="px-3 py-1 rounded-full text-sm theme-bg-tertiary theme-text-accent3"
                                                >
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Links and Stats */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-3">
                                                {project.githubUrl && (
                                                    <a
                                                        href={project.githubUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 rounded-lg theme-bg-secondary hover:theme-bg-tertiary transition-colors group"
                                                        aria-label="GitHub Repository"
                                                    >
                                                        <Github size={18} className="theme-text-secondary group-hover:theme-text-primary" />
                                                    </a>
                                                )}
                                                {project.demoUrl && (
                                                    <a
                                                        href={project.demoUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 rounded-lg theme-bg-secondary hover:theme-bg-tertiary transition-colors group"
                                                        aria-label="Live Demo"
                                                    >
                                                        <ExternalLink size={18} className="theme-text-secondary group-hover:theme-text-primary" />
                                                    </a>
                                                )}
                                            </div>

                                            {/* Stats */}
                                            <div className="flex gap-4 text-sm theme-text-secondary">
                                                {project.stars !== undefined && (
                                                    <span className="flex items-center gap-1">
                                                        <Star size={14} className="text-amber-400" />
                                                        {project.stars}
                                                    </span>
                                                )}
                                                {project.forks !== undefined && (
                                                    <span className="flex items-center gap-1">
                                                        <GitBranch size={14} className="text-blue-400" />
                                                        {project.forks}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {/* Other Projects */}
                {otherProjects.length > 0 && (
                    <section>
                        <h2 className="text-2xl font-bold theme-text-primary mb-8 text-center">更多项目</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {otherProjects.map((project) => (
                                <article
                                    key={project.id}
                                    className="theme-card-primary rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
                                >
                                    {/* Title */}
                                    <h3 className="text-xl font-bold theme-text-primary mb-3 group-hover:theme-text-accent1 transition-colors">
                                        {project.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="theme-text-secondary mb-4 line-clamp-3 leading-relaxed">
                                        {project.description}
                                    </p>

                                    {/* Technologies */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {project.technologies.slice(0, 3).map((tech) => (
                                            <span
                                                key={tech}
                                                className="px-2 py-1 rounded-full text-xs theme-bg-tertiary theme-text-accent3"
                                            >
                                                {tech}
                                            </span>
                                        ))}
                                        {project.technologies.length > 3 && (
                                            <span className="px-2 py-1 rounded-full text-xs theme-bg-tertiary theme-text-secondary">
                                                +{project.technologies.length - 3}
                                            </span>
                                        )}
                                    </div>

                                    {/* Links */}
                                    <div className="flex gap-2">
                                        {project.githubUrl && (
                                            <a
                                                href={project.githubUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 rounded theme-bg-secondary hover:theme-bg-tertiary transition-colors"
                                                aria-label="GitHub Repository"
                                            >
                                                <Github size={16} className="theme-text-secondary" />
                                            </a>
                                        )}
                                        {project.demoUrl && (
                                            <a
                                                href={project.demoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 rounded theme-bg-secondary hover:theme-bg-tertiary transition-colors"
                                                aria-label="Live Demo"
                                            >
                                                <ExternalLink size={16} className="theme-text-secondary" />
                                            </a>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {/* Empty State */}
                {projects.length === 0 && (
                    <div className="text-center py-16">
                        <Code className="mx-auto mb-4 text-6xl theme-text-secondary opacity-50" />
                        <h3 className="text-xl font-semibold theme-text-secondary mb-2">
                            暂无项目
                        </h3>
                        <p className="theme-text-secondary">
                            项目正在准备中，请稍后再来查看
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectsPage;