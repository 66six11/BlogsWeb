import React from 'react';
import { Github, Mail, Heart, Coffee } from 'lucide-react';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="theme-footer mt-auto">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* About Section */}
                    <div>
                        <h3 className="text-lg font-semibold theme-text-primary mb-4">MagicDev</h3>
                        <p className="theme-text-secondary text-sm leading-relaxed">
                            一个充满创意的开发者博客，探索技术与艺术的无限可能
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold theme-text-primary mb-4">快速链接</h3>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className="theme-footer-link hover:opacity-80 transition-opacity text-sm">
                                    最新文章
                                </a>
                            </li>
                            <li>
                                <a href="#" className="theme-footer-link hover:opacity-80 transition-opacity text-sm">
                                    热门项目
                                </a>
                            </li>
                            <li>
                                <a href="#" className="theme-footer-link hover:opacity-80 transition-opacity text-sm">
                                    联系方式
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-lg font-semibold theme-text-primary mb-4">联系我</h3>
                        <div className="flex gap-3">
                            <a
                                href="https://github.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg theme-bg-secondary hover:theme-bg-tertiary transition-colors"
                                aria-label="GitHub"
                            >
                                <Github size={18} className="theme-text-secondary" />
                            </a>
                            <a
                                href="mailto:contact@example.com"
                                className="p-2 rounded-lg theme-bg-secondary hover:theme-bg-tertiary transition-colors"
                                aria-label="Email"
                            >
                                <Mail size={18} className="theme-text-secondary" />
                            </a>
                            <a
                                href="https://buymeacoffee.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg theme-bg-secondary hover:theme-bg-tertiary transition-colors"
                                aria-label="Buy Me a Coffee"
                            >
                                <Coffee size={18} className="theme-text-secondary" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-8 pt-6 border-t theme-border-subtle text-center">
                    <p className="theme-text-secondary text-sm">
                        © {currentYear} MagicDev. 用{' '}
                        <Heart size={14} className="inline text-red-400" /> 制作
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;