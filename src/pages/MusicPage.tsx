import React from 'react';
import { View } from '../types';
import { Container, SectionHeader, Card } from '../components/ui';
import PianoEditor from '../components/features/music/PianoEditor';

export interface MusicPageProps {
  currentView: View;
  onPlaybackChange: (isPlaying: boolean) => void;
}

const MusicPage: React.FC<MusicPageProps> = ({ currentView, onPlaybackChange }) => {
  return (
    <Container maxWidth="5xl" className="py-12 animate-fade-in-up relative z-10">
      <SectionHeader
        title="吟游诗人作曲"
        description="创作一段旋律。即使是魔女也需要从学习中休息一下。"
        className="mb-8"
      />

      <PianoEditor
        className="w-full"
        isVisible={currentView === View.MUSIC}
        onPlaybackChange={onPlaybackChange}
      />

      <Card variant="glass" padding="md" className="mt-8 text-center max-w-2xl mx-auto">
        <p className="italic text-sm theme-text-secondary">
          "魔法不仅仅是施展咒语，更是聆听世界的节奏。"
        </p>
      </Card>
    </Container>
  );
};

export default MusicPage;
