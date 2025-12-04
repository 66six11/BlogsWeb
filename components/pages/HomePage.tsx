import React from 'react';
import { Code, Book } from 'lucide-react';
import { CustomSparkleIcon } from '../CustomIcons';
import { AUTHOR_NAME } from '../../constants';
import { GitHubUser } from '../../services/githubService';
import { View } from '../../types';

interface HomePageProps {
  userProfile: GitHubUser | null;
  onNavigate: (view: View) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ userProfile, onNavigate }) => {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center px-4 relative overflow-hidden w-full h-full">
      <div className="relative z-10 animate-fade-in-up bg-slate-900/60 backdrop-blur-md p-8 md:p-12 rounded-3xl border border-white/10 shadow-2xl max-w-4xl flex flex-col items-center">
        <div className="w-32 h-32 mx-auto mb-8 relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-amber-400 rounded-full animate-spin-slow opacity-80 blur-md group-hover:blur-xl transition-all"></div>
          <img
            src={userProfile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Elaina&clothing=graphicShirt&top=hat&hairColor=silverGray"}
            alt="Avatar"
            className="w-full h-full rounded-full border-4 border-slate-900 relative z-10 bg-slate-800 object-cover"
          />
          <div className="absolute top-20 left-[calc(90%)] -translate-x-1/2 z-20">
            <CustomSparkleIcon size={42} className="text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)] animate-float" />
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] text-center">
          {userProfile?.name || AUTHOR_NAME}
        </h1>
        <p className="text-xl md:text-2xl text-slate-200 max-w-2xl mx-auto mb-10 font-light leading-relaxed drop-shadow-md text-center">
          {userProfile?.bio || "\"一位用代码和色彩编织新世界的旅行者。\""}
          <br />
          <span className="text-base text-amber-200/90 mt-3 block font-mono bg-black/20 inline-block px-4 py-1 rounded-full border border-amber-500/20">
            Unity • Graphic • C++ • Art
          </span>
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => onNavigate(View.PORTFOLIO)}
            className="px-8 py-3 bg-purple-600/90 hover:bg-purple-500 text-white rounded-lg font-bold shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all hover:scale-105 flex items-center gap-2 border border-purple-400/50 backdrop-blur-sm"
          >
            <Code size={20} /> 查看项目
          </button>
          <button
            onClick={() => onNavigate(View.BLOG)}
            className="px-8 py-3 bg-slate-100/10 hover:bg-slate-100/20 text-slate-100 rounded-lg font-bold border border-white/20 transition-all hover:scale-105 flex items-center gap-2 backdrop-blur-md"
          >
            <Book size={20} /> 阅读魔法书
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
