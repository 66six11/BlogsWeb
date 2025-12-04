import React from 'react';
import { View } from '../../types';
import { Home, Book, Code, Music, User } from 'lucide-react';
import { HexagramIcon } from '../CustomIcons';
import { APP_TITLE } from '../../constants';

interface NavBarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  isMusicPlaying: boolean;
  onToggleMusic: () => void;
}

export const NavBar: React.FC<NavBarProps> = ({
  currentView,
  onViewChange,
  isMusicPlaying,
  onToggleMusic
}) => {
  const navItems = [
    { id: View.HOME, icon: Home, label: '首页' },
    { id: View.BLOG, icon: Book, label: '魔法书' },
    { id: View.PORTFOLIO, icon: Code, label: '作品' },
    { id: View.MUSIC, icon: Music, label: '旋律' },
    { id: View.ABOUT, icon: User, label: '关于' },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full bg-slate-900/60 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => onViewChange(View.HOME)}
        >
          <div className="from-purple-600 to-amber-500 p-1.5 rounded-lg group-hover:rotate-[30deg] transition-transform shadow-[0_0_15px_rgba(251,191,36,0.4)]">
            <HexagramIcon size={48} />
          </div>
          <span className="font-serif font-bold text-xl tracking-tight text-slate-100 group-hover:text-amber-200 transition-colors drop-shadow-md">
            {APP_TITLE}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-2 bg-slate-950/40 p-1 rounded-full border border-white/5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all duration-300 text-sm font-semibold
                  ${currentView === item.id
                    ? 'bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)] border border-amber-400/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                  }`}
              >
                <item.icon size={15} />
                {item.label}
              </button>
            ))}
          </div>

          <button
            onClick={onToggleMusic}
            className={`p-2 rounded-full transition-all duration-300 border ${
              isMusicPlaying
                ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse'
                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="背景音乐"
          >
            {isMusicPlaying ? <Music size={18} /> : <Music size={18} className="opacity-50" />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
