import React from 'react';
import { useAppStore } from '../store/useAppStore';
import PianoEditor from '../components/features/music/PianoEditor';

const MusicPage: React.FC = () => {
  const { setIsScorePlaying } = useAppStore();

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 animate-fade-in-up relative z-10">
      <div className="text-center mb-8 p-6 rounded-2xl backdrop-blur-sm border opacity-80 theme-bg-secondary theme-border-subtle">
        <h2 className="text-3xl font-serif font-bold mb-2 theme-text-primary">吟游诗人作曲</h2>
        <p className="theme-text-secondary">
          创作一段旋律。即使是魔女也需要从学习中休息一下。
        </p>
      </div>

      <PianoEditor
        className="w-full"
        isVisible={true}
        onPlaybackChange={setIsScorePlaying}
      />

      <div className="mt-8 text-center max-w-2xl mx-auto p-4 rounded-xl border backdrop-blur-sm opacity-80 theme-bg-secondary theme-border-subtle">
        <p className="italic text-sm theme-text-secondary">
          "魔法不仅仅是施展咒语，更是聆听世界的节奏。"
        </p>
      </div>
    </div>
  );
};

export default MusicPage;