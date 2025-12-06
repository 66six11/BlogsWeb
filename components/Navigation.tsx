import React from 'react';
import { Home, Book, Code, User } from 'lucide-react';
import { HexagramIcon } from '../components/CustomIcons';
import { View } from '../types';

interface NavigationProps {
    currentView: View;
    onViewChange: (view: View) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
    const navItems = [
        { id: View.HOME, label: '首页', icon: Home },
        { id: View.BLOG, label: '博客', icon: Book },
        { id: View.PROJECTS, label: '项目', icon: Code },
        { id: View.ABOUT, label: '关于', icon: User },
    ];

    return (
        <nav className="nav-bar fixed top-0 left-0 right-0 z-40 backdrop-blur-md border-b theme-border-subtle">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <HexagramIcon size={28} className="text-amber-400" />
                        <span className="text-xl font-bold theme-text-primary">MagicDev</span>
                    </div>

                    {/* Navigation Items */}
                    <div className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onViewChange(item.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                                        currentView === item.id
                                            ? 'theme-bg-tertiary theme-text-accent1 nav-button-active'
                                            : 'theme-text-secondary hover:theme-text-primary hover:theme-bg-secondary'
                                    }`}
                                >
                                    <Icon size={18} />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button className="p-2 rounded-lg theme-text-secondary hover:theme-text-primary hover:theme-bg-secondary">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className="md:hidden py-4 border-t theme-border-subtle">
                    <div className="grid grid-cols-2 gap-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onViewChange(item.id)}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                                        currentView === item.id
                                            ? 'theme-bg-tertiary theme-text-accent1 nav-button-active'
                                            : 'theme-text-secondary hover:theme-text-primary hover:theme-bg-secondary'
                                    }`}
                                >
                                    <Icon size={18} />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;