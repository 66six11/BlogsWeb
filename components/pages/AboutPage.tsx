import React from 'react';
import { Github, Terminal, Palette, Music } from 'lucide-react';
import { CustomWitchIcon } from '../CustomIcons';
import { GitHubUser } from '../../services/githubService';

interface AboutPageProps {
  userProfile: GitHubUser | null;
}

export const AboutPage: React.FC<AboutPageProps> = ({ userProfile }) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-fade-in-up relative z-10">
      <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
        {/* Decorative Corner */}
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <CustomWitchIcon size={120} className="text-amber-400" />
        </div>

        <div className="flex flex-col md:flex-row gap-10 items-center">
          <div className="w-48 h-48 flex-shrink-0 relative">
            <div className="absolute inset-0 bg-amber-400 rounded-full blur-lg opacity-20 animate-pulse"></div>
            <img
              src={userProfile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Elaina&clothing=graphicShirt&top=hat&hairColor=silverGray"}
              alt="Profile"
              className="w-full h-full rounded-full object-cover border-4 border-slate-200 shadow-xl relative z-10"
            />
          </div>

          <div className="flex-1">
            <h2 className="text-4xl font-serif font-bold text-white mb-4">关于旅行者</h2>
            <div className="space-y-4 text-slate-300 leading-relaxed font-sans">
              {userProfile?.bio ? (
                <p>{userProfile.bio}</p>
              ) : (
                <>
                  <p>
                    你好！我是一名对 <strong className="text-amber-300">计算机图形学</strong>、<strong className="text-amber-300">Unity</strong> 和 <strong className="text-amber-300">游戏引擎架构</strong> 充满热情的学生。
                  </p>
                  <p>
                    当我不在调试着色器或优化绘制调用时，我会花时间弹钢琴或绘制受我最喜欢的动漫《<em className="text-purple-300">魔女之旅</em>》启发的风景画。
                  </p>
                </>
              )}
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {userProfile?.html_url && (
                <a
                  href={userProfile.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-slate-950/50 p-4 rounded-lg border border-white/10 flex items-center gap-3 hover:bg-slate-800 transition-colors"
                >
                  <Github className="text-amber-400" />
                  <div>
                    <h4 className="font-bold text-slate-200 text-sm">GitHub</h4>
                    <p className="text-xs text-slate-500">查看源码</p>
                  </div>
                </a>
              )}
              <div className="bg-slate-950/50 p-4 rounded-lg border border-white/10 flex items-center gap-3">
                <Terminal className="text-amber-400" />
                <div>
                  <h4 className="font-bold text-slate-200 text-sm">编程语言</h4>
                  <p className="text-xs text-slate-500">C++, C#, HLSL, Python</p>
                </div>
              </div>
              <div className="bg-slate-950/50 p-4 rounded-lg border border-white/10 flex items-center gap-3">
                <Palette className="text-amber-400" />
                <div>
                  <h4 className="font-bold text-slate-200 text-sm">工具</h4>
                  <p className="text-xs text-slate-500">Unity, Blender, Photoshop</p>
                </div>
              </div>
              <div className="bg-slate-950/50 p-4 rounded-lg border border-white/10 flex items-center gap-3">
                <Music className="text-amber-400" />
                <div>
                  <h4 className="font-bold text-slate-200 text-sm">爱好</h4>
                  <p className="text-xs text-slate-500">钢琴即兴演奏</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
