import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { View } from '../types';
import { BG_MEDIA_URL } from '../constants';
import { MEDIA_CONFIG } from '../config';
import Scene3D from '../components/features/3d/Scene3D';
import LoadingScreen from '../components/common/LoadingScreen';
import TextParticleSystem from '../components/features/3d/TextParticleSystem';
import MagicChat from '../components/features/chat/MagicChat';
import { Layout } from '../components/layout/Layout';
import { useAppStore } from '../store/useAppStore';
import { useBlogStore } from '../store/useBlogStore';

// Lazy load pages
const HomePage = lazy(() => import('../pages/HomePage'));
const BlogPage = lazy(() => import('../pages/BlogPage'));
const PortfolioPage = lazy(() => import('../pages/ProjectsPage'));
const AboutPage = lazy(() => import('../pages/AboutPage'));
const MusicPage = lazy(() => import('../pages/MusicPage'));

// Lazy load PreviewConsole only in preview mode to exclude from production builds
const PreviewConsole = lazy(() => import('../components/dev/PreviewConsole'));

import { isPreviewMode } from '../data/mockData';

// Welcome overlay transition duration (ms)
const WELCOME_TRANSITION_DURATION = 700;

const AppContent: React.FC = () => {
  const {
    currentView,
    resourcesLoaded,
    setResourcesLoaded,
    loadingIndicatorVisible,
    setLoadingIndicatorVisible,
    showWelcome,
    setShowWelcome,
    welcomeFading,
    setWelcomeFading,
    showTextParticles,
    setShowTextParticles,
    textParticlesComplete,
    setTextParticlesComplete,
    musicAnalyser,
    loadUserProfile,
  } = useAppStore();

  const { useMockData } = useBlogStore();

  // Video Ref
  const videoRef = useRef<HTMLVideoElement>(null);

  // Loading tips array
  const loadingTips = [
    '魔女祈祷中...',
    '正在施展渲染魔法...',
    '初始化魔法引擎...',
    '翻找魔法书籍...',
    '正在绘制法阵...',
    '构建魔法世界传送门...',
    '准备进入次元...',
  ];

  // Check if we have a token by trying to fetch user profile
  const checkTokenAndLoadResources = async () => {
    try {
      // Load user profile
      await loadUserProfile();

      // Load background media
      if (BG_MEDIA_URL) {
        if (BG_MEDIA_URL.endsWith('.mp4')) {
          const video = document.createElement('video');
          video.preload = 'auto';
          video.src = BG_MEDIA_URL;
        } else {
          const img = new Image();
          img.src = BG_MEDIA_URL;
        }
      }

      // Preload music tracks
      if (MEDIA_CONFIG.music.tracks.length > 0) {
        MEDIA_CONFIG.music.tracks.forEach((track) => {
          const audio = new Audio();
          audio.src = `${MEDIA_CONFIG.music.folder}/${track.file}`;
          audio.preload = 'auto';
        });
      }

      setResourcesLoaded(true);
    } catch (e) {
      console.error('Error checking token or preloading resources', e);
      setResourcesLoaded(true);
    }
  };

  useEffect(() => {
    checkTokenAndLoadResources();
  }, []);

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

  const handleEnterSite = () => {
    setWelcomeFading(true);

    setTimeout(() => {
      setShowTextParticles(true);
    }, WELCOME_TRANSITION_DURATION / 2);

    setTimeout(() => {
      setLoadingIndicatorVisible(false);
    }, WELCOME_TRANSITION_DURATION);
  };

  const handleTextParticlesComplete = () => {
    setTextParticlesComplete(true);
  };

  return (
    <div className="relative min-h-screen">
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

      {/* Welcome Screen */}
      <LoadingScreen
        isVisible={showWelcome && loadingIndicatorVisible}
        currentTipIndex={0}
        loadingTips={loadingTips}
        resourcesLoaded={resourcesLoaded}
        welcomeFading={welcomeFading}
        onEnter={handleEnterSite}
      />

      {/* Text Particle System */}
      <TextParticleSystem
        text="MagicDev"
        isVisible={showTextParticles}
        analyser={musicAnalyser || undefined}
        onComplete={handleTextParticlesComplete}
      />

      {/* Dark Overlay */}
      <div
        className={`fixed inset-0 z-20 pointer-events-none transition-colors duration-1000 ${currentView === View.HOME ? '' : 'bg-overlay-dark'}`}
      />

      {/* Main Content */}
      <div className="relative z-30 flex flex-col min-h-screen">
        <Layout>
          <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
            {currentView === View.HOME && <HomePage />}
            {currentView === View.BLOG && <BlogPage />}
            {currentView === View.PORTFOLIO && <PortfolioPage />}
            {currentView === View.ABOUT && <AboutPage />}
            {currentView === View.MUSIC && <MusicPage />}
          </Suspense>
        </Layout>

        <MagicChat />

        {/* Preview Console - Only visible in preview mode */}
        {isPreviewMode() && (
          <Suspense fallback={null}>
            <PreviewConsole
              useMockData={useMockData}
              onToggleMockData={() => useBlogStore.getState().toggleMockData()}
              onRefresh={() => useBlogStore.getState().refresh()}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default AppContent;
