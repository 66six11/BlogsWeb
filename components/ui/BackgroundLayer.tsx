import React from 'react';
import { BG_MEDIA_URL } from '../../constants';
import Scene3D from '../Scene3D';

interface BackgroundLayerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  analyser?: AnalyserNode;
  pianoBeat?: number;
  isHome: boolean;
}

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
  videoRef,
  analyser,
  pianoBeat,
  isHome
}) => {
  return (
    <>
      {/* 1. Dynamic Background Video (Bottom) */}
      <div className="fixed inset-0 overflow-hidden bg-slate-950 z-0">
        {BG_MEDIA_URL.endsWith('.mp4') ? (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src={BG_MEDIA_URL} type="video/mp4" />
          </video>
        ) : (
          <img
            src={BG_MEDIA_URL}
            className="w-full h-full object-cover opacity-70"
            alt="Magic Background"
          />
        )}
      </div>

      {/* 2. 3D Particles Layer (Middle) */}
      <div className="fixed inset-0 z-10 pointer-events-none">
        <Scene3D analyser={analyser} pianoBeat={pianoBeat} />
      </div>

      {/* 3. Dark Overlay (Top of Backgrounds) - Hidden on Home */}
      <div className={`fixed inset-0 z-20 pointer-events-none transition-colors duration-1000 ${
        isHome ? 'bg-transparent' : 'bg-slate-950/60'
      }`} />
    </>
  );
};

export default BackgroundLayer;
