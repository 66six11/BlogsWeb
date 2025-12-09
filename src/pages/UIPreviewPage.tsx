import React from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Container,
  Avatar,
  SectionHeader,
} from '../components/ui';
import { Code, Book, Music, Star, Github, Terminal, Palette } from 'lucide-react';

const UIPreviewPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-8 theme-text-secondary">
      <Container maxWidth="7xl" className="space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            UI Component Library
          </h1>
          <p className="text-slate-400 text-lg">
            Preview of all refactored UI components based on actual project styles
          </p>
          <Badge variant="status">Development Mode Only</Badge>
        </div>

        {/* Button Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold border-b border-slate-700 pb-2 theme-text-primary">
            Buttons
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3 theme-text-primary">Variants</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">
                  <Code size={20} /> Primary Button
                </Button>
                <Button variant="secondary">
                  <Book size={20} /> Secondary Button
                </Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="icon" title="Icon Button">
                  <Star size={16} />
                </Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 theme-text-primary">Sizes</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Card Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold border-b border-slate-700 pb-2 theme-text-primary">
            Cards
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Glass Card</CardTitle>
                <CardDescription>Backdrop blur with semi-transparent background</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="theme-text-secondary">
                  This is the glass morphism card variant used throughout the application.
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="secondary">Learn More</Button>
              </CardFooter>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Elevated Card</CardTitle>
                <CardDescription>Card with shadow effect</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="theme-text-secondary">
                  This card has a shadow for elevation effect, used for blog posts.
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="primary">Action</Button>
              </CardFooter>
            </Card>

            <Card variant="interactive">
              <CardHeader>
                <CardTitle>Interactive Card</CardTitle>
                <CardDescription>Hover to see the effect</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="theme-text-secondary">
                  This card lifts up on hover, used for project cards.
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="ghost">Explore</Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Badge Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold border-b border-slate-700 pb-2 theme-text-primary">
            Badges
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-3 theme-text-primary">Variants</h3>
              <div className="flex flex-wrap gap-4 items-center">
                <Badge variant="category">Unity • Graphic • C++ • Art</Badge>
                <Badge variant="tag">#TypeScript</Badge>
                <Badge variant="tag">#React</Badge>
                <Badge variant="status">Online</Badge>
              </div>
            </div>

            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Badge Examples
                  <Badge variant="status">Active</Badge>
                </CardTitle>
                <CardDescription>Badges as used in the application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="theme-text-secondary">Category:</span>
                  <Badge variant="category">Graphics Programming</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="theme-text-secondary">Tags:</span>
                  <Badge variant="tag">#Unity</Badge>
                  <Badge variant="tag">#C++</Badge>
                  <Badge variant="tag">#HLSL</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="theme-text-secondary">Status:</span>
                  <Badge variant="status">Available</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Avatar Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold border-b border-slate-700 pb-2 theme-text-primary">
            Avatars
          </h2>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-3 theme-text-primary">Sizes</h3>
            <div className="flex flex-wrap items-end gap-8">
              <div className="text-center">
                <Avatar
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Elaina&clothing=graphicShirt&top=hat&hairColor=silverGray"
                  size="sm"
                  withGlow
                />
                <p className="mt-2 text-sm theme-text-secondary">Small</p>
              </div>
              <div className="text-center">
                <Avatar
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Elaina&clothing=graphicShirt&top=hat&hairColor=silverGray"
                  size="md"
                  withGlow
                />
                <p className="mt-2 text-sm theme-text-secondary">Medium</p>
              </div>
              <div className="text-center">
                <Avatar
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Elaina&clothing=graphicShirt&top=hat&hairColor=silverGray"
                  size="lg"
                  withGlow
                />
                <p className="mt-2 text-sm theme-text-secondary">Large</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section Header Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold border-b border-slate-700 pb-2 theme-text-primary">
            Section Headers
          </h2>
          
          <div className="space-y-6">
            <SectionHeader
              title="魔女的魔法书"
              description="关于渲染、逻辑和神秘艺术的笔记。"
              icon={Book}
              variant="centered"
            />
            
            <SectionHeader
              title="魔法作品"
              description="用代码和咖啡创造的神器。"
              icon={Code}
              variant="centered"
            />

            <SectionHeader
              title="吟游诗人作曲"
              description="创作一段旋律。"
              icon={Music}
              variant="centered"
            />
          </div>
        </section>

        {/* Container Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold border-b border-slate-700 pb-2 theme-text-primary">
            Containers
          </h2>
          
          <div className="space-y-4">
            <p className="theme-text-secondary">
              Container component provides responsive max-width and padding. Available sizes: sm, md, lg, xl, 2xl, 4xl, 5xl, 6xl, 7xl.
            </p>
            <Card variant="glass">
              <CardContent>
                <div className="bg-purple-900/20 p-4 rounded border border-purple-500/30">
                  <p className="text-center theme-text-secondary">This content is inside a Container with max-width</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Combination Example */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold border-b border-slate-700 pb-2 theme-text-primary">
            Real-World Example
          </h2>
          
          <Card variant="interactive" padding="none">
            <div className="h-48 overflow-hidden relative bg-gradient-to-br from-purple-900 to-blue-900">
              <div className="absolute inset-0 flex items-center justify-center">
                <Code size={64} className="text-purple-300 opacity-50" />
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2 font-serif theme-text-primary">
                Sample Project Card
              </h3>
              <p className="text-sm mb-4 theme-text-secondary">
                This demonstrates how the components work together in a project card layout.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="tag">#React</Badge>
                <Badge variant="tag">#TypeScript</Badge>
                <Badge variant="tag">#Tailwind</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Avatar
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Dev&clothing=graphicShirt"
                  size="sm"
                  withGlow={false}
                />
                <div>
                  <p className="text-sm font-semibold theme-text-primary">Developer</p>
                  <p className="text-xs theme-text-secondary">2 days ago</p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Info Section */}
        <section className="space-y-6">
          <Card variant="glass">
            <CardContent className="text-center py-8">
              <h3 className="text-2xl font-bold mb-4 theme-text-primary">
                ✨ All Components Use CVA
              </h3>
              <p className="theme-text-secondary mb-4">
                These components are built with class-variance-authority for type-safe variant management
                and are based on the actual styles used throughout the application.
              </p>
              <div className="flex justify-center gap-4">
                <Button variant="primary">
                  <Github size={16} /> View Source
                </Button>
                <Button variant="secondary">Documentation</Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </Container>
    </div>
  );
};

export default UIPreviewPage;
