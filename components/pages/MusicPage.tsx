import React from 'react';
import PianoEditor from '../PianoEditor';

interface MusicPageProps {
  onBeat?: (intensity: number) => void;
}

export const MusicPage: React.FC<MusicPageProps> = ({ onBeat }) => {
  return (
    <div className="max-w-5xl mx-auto py-12 px-4 animate-fade-in-up relative z-10">
      <div className="text-center mb-8 bg-black/30 p-6 rounded-2xl backdrop-blur-sm border border-white/5">
        <h2 className="text-3xl font-serif font-bold text-white mb-2">吟游诗人作曲</h2>
        <p className="text-slate-300">创作一段旋律。即使是魔女也需要从学习中休息一下。</p>
      </div>

      <PianoEditor 
        className="w-full" 
        onBeat={onBeat}
      />

      <div className="mt-8 text-center max-w-2xl mx-auto bg-slate-900/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
        <p className="text-slate-400 italic text-sm">
          "魔法不仅仅是施展咒语，更是聆听世界的节奏。"
        </p>
      </div>
    </div>
  );
};

export default MusicPage;
