import React from 'react';
import { Code } from 'lucide-react';
import { PROJECTS } from '../constants';
import { Container, Card, SectionHeader, Badge } from '../components/ui';

const PortfolioPage: React.FC = () => {
  return (
    <Container maxWidth="6xl" className="py-12 animate-fade-in-up relative z-10">
      <SectionHeader
        title="魔法作品"
        description="用代码和咖啡创造的神器。"
        icon={Code}
        className="mb-12"
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {PROJECTS.map((project) => (
          <Card key={project.id} variant="interactive" padding="none">
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
                  <Badge key={t} variant="tag">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Container>
  );
};

export default PortfolioPage;
