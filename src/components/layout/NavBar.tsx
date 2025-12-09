import React from 'react';
import { View } from '../../types';
import { Book, Code, Music, User, Home } from 'lucide-react';
import ThemeToggle from '../common/ThemeToggle';
import MusicPlayer from '../features/music/MusicPlayer';
import { CustomSparkleIcon } from '../icons/CustomIcons';
import { NavButton } from './NavButton';
import { APP_TITLE } from '../../constants';

export interface NavBarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  onAnalyserReady: (analyser: AnalyserNode | null) => void;
  autoPlayTrigger: boolean;
  externalPause: boolean;
}

const NavBar: React.FC<NavBarProps> = ({
  currentView,
  onViewChange,
  onAnalyserReady,
  autoPlayTrigger,
  externalPause,
}) => {
  const navItems = [
    { id: View.HOME, icon: Home, label: '首页' },
    { id: View.BLOG, icon: Book, label: '魔法书' },
    { id: View.PORTFOLIO, icon: Code, label: '作品' },
    { id: View.MUSIC, icon: Music, label: '旋律' },
    { id: View.ABOUT, icon: User, label: '关于' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b shadow-md opacity-90 theme-bg-primary theme-border-subtle">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <div
          className="flex items-center gap-2 text-xl font-serif font-bold cursor-pointer group theme-text-primary"
          onClick={() => onViewChange(View.HOME)}
        >
          <CustomSparkleIcon
            size={28}
            className="drop-shadow-[0_0_8px_rgba(222,185,154,0.6)] group-hover:rotate-[360deg] transition-transform duration-700 theme-text-accent1"
          />
          <span className="hidden sm:inline">{APP_TITLE}</span>
        </div>

        <div className="hidden md:flex items-center gap-2">
          {navItems.map((item) => (
            <NavButton
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={currentView === item.id}
              onClick={() => onViewChange(item.id)}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <MusicPlayer
            onAnalyserReady={onAnalyserReady}
            autoPlayTrigger={autoPlayTrigger}
            externalPause={externalPause}
          />
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
