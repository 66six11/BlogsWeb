import React, { ReactNode, useRef, useEffect } from 'react';
import { View } from '../../types';
import { BG_MEDIA_URL } from '../../constants';
import Scene3D from '../features/3d/Scene3D';
import TextParticleSystem from '../features/3d/TextParticleSystem';

export interface PageLayoutProps {
  children: ReactNode;
  currentView: View;
  musicAnalyser: AnalyserNode | null;
  showTextParticles: boolean;
  onTextParticlesComplete: () => void;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  currentView,
  musicAnalyser,
  showTextParticles,
  onTextParticlesComplete,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Ensure video plays
  useEffect(() => {
    if (videoRef.current) {
      const playVideo = async () => {
        try {
          await videoRef.current?.play();
        } catch (e) {
          console.log('Autoplay prevented by browser interaction policy.');
        }
      };
      playVideo();
    }
  }, []);

  return (
    <div className="min-h-screen selection:text-black font-sans relative theme-text-secondary selection-accent">
      {/* Background Video/Image */}
      <div className="fixed inset-0 overflow-hidden z-0 theme-bg-primary">
        {BG_MEDIA_URL.endsWith('.mp4') ? (
          <video ref={videoRef} autoPlay loop muted playsInline className="w-full h-full object-cover">
            <source src={BG_MEDIA_URL} type="video/mp4" />
          </video>
        ) : (
          <img src={BG_MEDIA_URL} className="w-full h-full object-cover opacity-70" alt="Magic Background" />
        )}
      </div>

      {/* 3D Particles Layer */}
      <div className="fixed inset-0 z-10 pointer-events-none">
        <Scene3D analyser={musicAnalyser || undefined} />
      </div>

      {/* Text Particle System */}
      <TextParticleSystem
        text="MagicDev"
        isVisible={showTextParticles}
        analyser={musicAnalyser || undefined}
        onComplete={onTextParticlesComplete}
      />

      {/* Dark Overlay */}
      <div
        className={`fixed inset-0 z-20 pointer-events-none transition-colors duration-1000 ${
          currentView === View.HOME ? '' : 'bg-overlay-dark'
        }`}
      />

      {/* Main Content */}
      {children}
    </div>
  );
};

export default PageLayout;
