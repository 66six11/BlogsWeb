import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { CustomSparkleIcon } from '../components/icons/CustomIcons';
import { Code, Book } from 'lucide-react';

const HomePage: React.FC = () => {
  const { userProfile, setCurrentView } = useAppStore();

  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center px-4 relative overflow-hidden w-full h-full">
      <div className="relative z-10 animate-fade-in-up backdrop-blur-md p-8 md:p-12 rounded-3xl border shadow-2xl max-w-4xl flex flex-col items-center theme-bg-secondary theme-border-subtle">
        <div
          className="w-32 h-32 mx-auto mb-8 relative group cursor-pointer"
          onClick={() => setCurrentView('ABOUT')}
          title="关于我"
        >
          <div className="absolute inset-0 rounded-full animate-spin-slow opacity-80 blur-md group-hover:blur-xl transition-all avatar-gradient-bg"></div>
          <img
            src={
              userProfile?.avatar_url ||
              'https://api.dicebear.com/7.x/avataaars/svg?seed=Elaina&clothing=graphicShirt&top=hat&hairColor=silverGray'
            }
            alt="Avatar"
            className="w-full h-full rounded-full border-4 relative z-10 object-cover hover:scale-105 transition-transform avatar-border"
          />
          <div className="absolute top-20 left-[calc(90%)] -translate-x-1/2 z-20">
            <CustomSparkleIcon
              size={42}
              className="drop-shadow-[0_0_10px_rgba(222,185,154,0.8)] animate-float theme-text-accent1"
            />
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] text-center theme-text-primary">
          {userProfile?.name || 'Elaina'}
        </h1>
        <p className="text-xl md:text-2xl max-w-2xl mx-auto mb-10 font-light leading-relaxed drop-shadow-md text-center theme-text-secondary">
          {userProfile?.bio || '"一位用代码和色彩编织新世界的旅行者。"'}
          <br />
          <span className="text-base mt-3 block font-mono inline-block px-4 py-1 rounded-full border theme-text-accent1 accent-border-light">
            Unity • Graphic • C++ • Art
          </span>
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => setCurrentView('PORTFOLIO')}
            className="px-8 py-3 text-white rounded-lg font-bold shadow-[0_0_20px_rgba(124,133,235,0.4)] transition-all hover:scale-105 hover:opacity-90 flex items-center gap-2 border backdrop-blur-sm theme-btn-primary accent3-border"
          >
            <Code size={20} /> 查看项目
          </button>
          <button
            onClick={() => setCurrentView('BLOG')}
            className="px-8 py-3 rounded-lg font-bold border transition-all hover:scale-105 flex items-center gap-2 backdrop-blur-md hover:bg-white/10 theme-text-primary theme-border-subtle bg-white/10"
          >
            <Book size={20} /> 阅读魔法书
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
