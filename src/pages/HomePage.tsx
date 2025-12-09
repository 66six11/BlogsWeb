import React from 'react';
import { View, GitHubUser } from '../types';
import { AUTHOR_NAME } from '../constants';
import { Code, Book } from 'lucide-react';
import { Card, Button, Badge, Avatar } from '../components/ui';
import { CustomSparkleIcon } from '../components/icons/CustomIcons';

export interface HomePageProps {
  userProfile: GitHubUser | null;
  onViewChange: (view: View) => void;
}

const HomePage: React.FC<HomePageProps> = ({ userProfile, onViewChange }) => {
  return (
    <div className="flex flex-col items-center justify-center flex-1 text-center px-4 relative overflow-hidden w-full h-full">
      <Card
        variant="glass"
        padding="lg"
        className="relative z-10 animate-fade-in-up max-w-4xl flex flex-col items-center shadow-2xl"
      >
        <div
          className="w-32 h-32 mx-auto mb-8 relative group cursor-pointer"
          onClick={() => onViewChange(View.ABOUT)}
          title="关于我"
        >
          <Avatar
            src={
              userProfile?.avatar_url ||
              'https://api.dicebear.com/7.x/avataaars/svg?seed=Elaina&clothing=graphicShirt&top=hat&hairColor=silverGray'
            }
            alt="Avatar"
            size="md"
            withGlow
          />
          <div className="absolute top-20 left-[calc(90%)] -translate-x-1/2 z-20">
            <CustomSparkleIcon
              size={42}
              className="drop-shadow-[0_0_10px_rgba(222,185,154,0.8)] animate-float theme-text-accent1"
            />
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] text-center theme-text-primary">
          {userProfile?.name || AUTHOR_NAME}
        </h1>
        <p className="text-xl md:text-2xl max-w-2xl mx-auto mb-10 font-light leading-relaxed drop-shadow-md text-center theme-text-secondary">
          {userProfile?.bio || '"一位用代码和色彩编织新世界的旅行者。"'}
          <br />
          <Badge variant="category" className="text-base mt-3 inline-block">
            Unity • Graphic • C++ • Art
          </Badge>
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Button variant="primary" onClick={() => onViewChange(View.PORTFOLIO)}>
            <Code size={20} /> 查看项目
          </Button>
          <Button variant="secondary" onClick={() => onViewChange(View.BLOG)}>
            <Book size={20} /> 阅读魔法书
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default HomePage;
