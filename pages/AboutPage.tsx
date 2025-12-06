import React from 'react';
import { ChevronRight, Github, Mail, Calendar, MapPin } from 'lucide-react';
import { GitHubUser } from '../types';

interface AboutPageProps {
    userProfile: GitHubUser | null;
}

const AboutPage: React.FC<AboutPageProps> = ({ userProfile }) => {
    if (!userProfile) {
        return (
            <div className="flex justify-center items-center min-h-screen theme-bg-primary">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen theme-bg-primary py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="theme-card-primary rounded-xl p-8 shadow-xl">
                    {/* Profile Header */}
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                        <img
                            src={userProfile.avatar_url}
                            alt={userProfile.name || userProfile.login}
                            className="w-32 h-32 rounded-full border-4 about-profile-border shadow-lg"
                        />
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl font-bold theme-text-primary mb-2">
                                {userProfile.name || userProfile.login}
                            </h1>
                            <p className="text-lg theme-text-secondary mb-4">
                                {userProfile.bio || '开发者与创作者'}
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                <span className="px-3 py-1 rounded-full text-sm theme-bg-tertiary theme-text-secondary">
                                    <Github size={16} className="inline mr-1" />
                                    {userProfile.login}
                                </span>
                                <span className="px-3 py-1 rounded-full text-sm theme-bg-tertiary theme-text-secondary">
                                    <Calendar size={16} className="inline mr-1" />
                                    {userProfile.public_repos} 个仓库
                                </span>
                                <span className="px-3 py-1 rounded-full text-sm theme-bg-tertiary theme-text-secondary">
                                    <MapPin size={16} className="inline mr-1" />
                                    在线
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-6">
                        <section>
                            <h2 className="text-2xl font-bold theme-text-primary mb-4">关于我</h2>
                            <p className="theme-text-secondary leading-relaxed">
                                我是一名充满热情的开发者，专注于创造优雅的解决方案和用户体验。
                                这个博客是我的数字花园，记录着我在技术探索、创意实现和思考过程中的点点滴滴。
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold theme-text-primary mb-4">技能与专长</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {['前端开发', 'React', 'TypeScript', 'Node.js', 'UI/UX设计', '创意编程'].map((skill) => (
                                    <div key={skill} className="theme-bg-secondary rounded-lg p-3 text-center">
                                        <span className="theme-text-accent1">{skill}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold theme-text-primary mb-4">联系方式</h2>
                            <div className="flex flex-col gap-3">
                                <a
                                    href={userProfile.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 theme-text-secondary hover:theme-text-accent1 transition-colors"
                                >
                                    <Github size={20} />
                                    <span>GitHub: {userProfile.login}</span>
                                    <ChevronRight size={16} className="ml-auto" />
                                </a>
                                <a
                                    href={`mailto:${userProfile.login}@example.com`}
                                    className="flex items-center gap-3 theme-text-secondary hover:theme-text-accent1 transition-colors"
                                >
                                    <Mail size={20} />
                                    <span>邮箱联系</span>
                                    <ChevronRight size={16} className="ml-auto" />
                                </a>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold theme-text-primary mb-4">更多关于我</h2>
                            <p className="theme-text-secondary leading-relaxed">
                                除了编程，我还热爱音乐、艺术和探索新技术。我相信技术与创意的结合能够创造出令人惊叹的作品。
                                这个博客不仅是技术分享的平台，也是我记录生活、表达想法的空间。
                            </p>
                            <p className="theme-text-secondary leading-relaxed mt-4">
                                欢迎你在这里浏览我的项目、阅读我的文章，或者直接与我联系。期待与志同道合的朋友交流！
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;