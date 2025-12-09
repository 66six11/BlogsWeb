import React from 'react';
import { View } from '../../types';
import { Book, Code, Music, User, Home } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface MobileNavProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ currentView, onViewChange }) => {
  const navItems = [
    { id: View.HOME, icon: Home, label: '首页' },
    { id: View.BLOG, icon: Book, label: '魔法书' },
    { id: View.PORTFOLIO, icon: Code, label: '作品' },
    { id: View.MUSIC, icon: Music, label: '旋律' },
    { id: View.ABOUT, icon: User, label: '关于' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden backdrop-blur-md border-t shadow-lg opacity-90 theme-bg-secondary theme-border-subtle">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-lg transition-all duration-300',
              currentView === item.id
                ? 'bg-white/10 theme-text-accent1'
                : 'theme-text-secondary'
            )}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
