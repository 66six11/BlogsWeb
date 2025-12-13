import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useBlogStore } from '../../store/useBlogStore';
import { View } from '../../types';
import { APP_TITLE, AUTHOR_NAME } from '../../constants';
import { CustomSparkleIcon, HexagramIcon } from '../icons/CustomIcons';
import ThemeToggle from '../common/ThemeToggle';
import MusicPlayer from '../features/music/MusicPlayer';
import { Book, Code, Music, User, Home, Github, Terminal, Palette } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const {
    currentView,
    setCurrentView,
    userProfile,
    musicAnalyser,
    isScorePlaying,
    setMusicAnalyser,
  } = useAppStore();

  const renderNav = () => (
    <nav className="nav-bar fixed top-0 left-0 right-0 z-40 w-full backdrop-blur-md border-b shadow-lg opacity-90 theme-bg-secondary theme-border-subtle">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => {
            setCurrentView(View.HOME);
            useBlogStore.getState().setSelectedPost(null);
          }}
        >
          <div className="p-1.5 rounded-lg group-hover:rotate-[30deg] transition-transform">
            <HexagramIcon size={48} />
          </div>
          <span className="font-serif font-bold text-xl tracking-tight transition-colors drop-shadow-md theme-text-primary">
            {APP_TITLE}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-2 p-1 rounded-full border-2 opacity-60 nav-button-pills-container">
            {[
              { id: View.HOME, icon: Home, label: '首页' },
              { id: View.BLOG, icon: Book, label: '魔法书' },
              { id: View.PORTFOLIO, icon: Code, label: '作品' },
              { id: View.MUSIC, icon: Music, label: '旋律' },
              { id: View.ABOUT, icon: User, label: '关于' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  useBlogStore.getState().setSelectedPost(null);
                }}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all duration-300 text-sm font-semibold
                    ${currentView === item.id
                      ? 'bg-white/10 shadow-[0_0_10px_rgba(255,255,255,0.1)] border '
                      : 'hover:bg-white/5 theme-text-secondary'}`}
              >
                <item.icon size={15} />
                {item.label}
              </button>
            ))}
          </div>

          <ThemeToggle />
          <MusicPlayer
            onAnalyserReady={setMusicAnalyser}
            autoPlayTrigger={true}
            externalPause={isScorePlaying}
          />
        </div>
      </div>
    </nav>
  );

  const renderMobileNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden backdrop-blur-md border-t shadow-lg opacity-90 theme-bg-secondary theme-border-subtle">
      <div className="flex justify-around items-center h-16 px-2">
        {[
          { id: View.HOME, icon: Home, label: '首页' },
          { id: View.BLOG, icon: Book, label: '魔法书' },
          { id: View.PORTFOLIO, icon: Code, label: '作品' },
          { id: View.MUSIC, icon: Music, label: '旋律' },
          { id: View.ABOUT, icon: User, label: '关于' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setCurrentView(item.id);
              useBlogStore.getState().setSelectedPost(null);
            }}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-lg transition-all duration-300
                            ${currentView === item.id
                              ? 'bg-white/10 theme-text-accent1'
                              : 'theme-text-secondary'}`}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen selection:text-black font-sans relative theme-text-secondary selection-accent">
      {renderNav()}
      
      <main
        className={`flex-1 w-full flex flex-col ${currentView === View.HOME ? 'pt-16 justify-center' : 'pt-16 pb-16 md:pb-8'}`}
      >
        {children}
      </main>
      
      {renderMobileNav()}
      
      <footer className="backdrop-blur-md border-t py-2 text-center text-sm mt-auto opacity-90 theme-footer theme-bg-primary theme-border-subtle theme-text-secondary md:fixed md:bottom-0 md:left-0 md:right-0 md:z-40">
        <p>
          © {new Date().getFullYear()} {AUTHOR_NAME}. 灵感来自《魔女之旅》。
        </p>
        <div className="flex justify-center gap-4 mt-2 md:hidden">
          <a
            href={userProfile?.html_url || '#'}
            className="hover:opacity-80 transition-colors theme-footer-link"
          >
            GitHub
          </a>
          <a href="#" className="hover:opacity-80 transition-colors theme-footer-link">
            推特
          </a>
          <a href="#" className="hover:opacity-80 transition-colors theme-footer-link">
            ArtStation
          </a>
        </div>
        <div className="hidden md:block">
          <a
            href={userProfile?.html_url || '#'}
            className="mx-4 hover:opacity-80 transition-colors theme-footer-link"
          >
            GitHub
          </a>
          <a href="#" className="mx-4 hover:opacity-80 transition-colors theme-footer-link">
            推特
          </a>
          <a href="#" className="mx-4 hover:opacity-80 transition-colors theme-footer-link">
            ArtStation
          </a>
        </div>
      </footer>
    </div>
  );
};
