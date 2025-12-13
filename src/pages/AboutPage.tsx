import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { CustomWitchIcon } from '../components/icons/CustomIcons';
import { Github, Terminal, Palette, Music } from 'lucide-react';

const AboutPage: React.FC = () => {
  const { userProfile } = useAppStore();

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-fade-in-up relative z-10">
      <div className="backdrop-blur-md border rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden theme-bg-secondary theme-border-subtle">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <CustomWitchIcon size={120} className="theme-text-accent1" />
        </div>

        <div className="flex flex-col md:flex-row gap-10 items-center">
          <div className="w-48 h-48 flex-shrink-0 relative">
            <div className="absolute inset-0 rounded-full animate-spin-slow opacity-80 blur-md group-hover:blur-xl transition-all avatar-gradient-bg"></div>
            <img
              src={
                userProfile?.avatar_url ||
                'https://api.dicebear.com/7.x/avataaars/svg?seed=Elaina&clothing=graphicShirt&top=hat&hairColor=silverGray'
              }
              alt="Profile"
              className="w-full h-full rounded-full object-cover border-4 shadow-xl relative z-10 about-profile-border"
            />
          </div>

          <div className="flex-1">
            <h2 className="text-4xl font-serif font-bold mb-4 theme-text-primary">关于旅行者</h2>
            <div className="space-y-4 leading-relaxed font-sans theme-text-secondary">
              {userProfile?.bio ? (
                <p>{userProfile.bio}</p>
              ) : (
                <>
                  <p>
                    你好！我是一名对{' '}
                    <strong className="theme-text-accent1">计算机图形学</strong>、
                    <strong className="theme-text-accent1">Unity</strong> 和{' '}
                    <strong className="theme-text-accent1">游戏引擎架构</strong>{' '}
                    充满热情的学生。
                  </p>
                  <p>
                    当我不在调试着色器或优化绘制调用时，我会花时间弹钢琴或绘制受我最喜欢的动漫《
                    <em className="theme-text-accent3">魔女之旅</em>
                    》启发的风景画。
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
                  className="p-4 rounded-lg border flex items-center gap-3 hover:opacity-80 transition-colors opacity-80 theme-bg-primary theme-border-subtle"
                >
                  <Github className="theme-text-accent1" />
                  <div>
                    <h4 className="font-bold text-sm theme-text-primary">GitHub</h4>
                    <p className="text-xs theme-text-secondary">查看源码</p>
                  </div>
                </a>
              )}
              <div className="p-4 rounded-lg border flex items-center gap-3 opacity-80 theme-bg-primary theme-border-subtle">
                <Terminal className="theme-text-accent1" />
                <div>
                  <h4 className="font-bold text-sm theme-text-primary">编程语言</h4>
                  <p className="text-xs theme-text-secondary">C++, C#, HLSL, Python</p>
                </div>
              </div>
              <div className="p-4 rounded-lg border flex items-center gap-3 opacity-80 theme-bg-primary theme-border-subtle">
                <Palette className="theme-text-accent1" />
                <div>
                  <h4 className="font-bold text-sm theme-text-primary">工具</h4>
                  <p className="text-xs theme-text-secondary">Unity, Blender, Photoshop</p>
                </div>
              </div>
              <div className="p-4 rounded-lg border flex items-center gap-3 opacity-80 theme-bg-primary theme-border-subtle">
                <Music className="theme-text-accent1" />
                <div>
                  <h4 className="font-bold text-sm theme-text-primary">爱好</h4>
                  <p className="text-xs theme-text-secondary">钢琴即兴演奏</p>
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