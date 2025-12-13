/**
 * 应用主组件 - 管理应用整体布局和核心功能
 * @file src/core/App.tsx
 * @description 应用的核心组件，负责管理页面路由、背景媒体、3D场景、欢迎界面和状态管理
 * @created 2025-12-13
 */

import React, { useEffect, useRef } from 'react';
import { View } from '../types';
import { BG_MEDIA_URL } from '../constants';
import { MEDIA_CONFIG } from '../config';
import Scene3D from '../components/features/3d/Scene3D';
import LoadingScreen from '../components/common/LoadingScreen';
import MagicChat from '../components/features/chat/MagicChat';
import { Layout } from '../components/layout/Layout';
import { useAppStore } from '../store/useAppStore';
import { useBlogStore } from '../store/useBlogStore';

// Lazy load pages for better initial performance
const HomePage = React.lazy(() => import('../pages/HomePage'));
const BlogPage = React.lazy(() => import('../pages/BlogPage'));
const PortfolioPage = React.lazy(() => import('../pages/ProjectsPage'));
const AboutPage = React.lazy(() => import('../pages/AboutPage'));
const MusicPage = React.lazy(() => import('../pages/MusicPage'));

// Lazy load PreviewConsole only in preview mode to exclude from production builds
const PreviewConsole = React.lazy(() => import('../components/dev/PreviewConsole'));

import { isPreviewMode } from '../data/mockData';

/** 欢迎界面过渡动画持续时间 (毫秒) */
const WELCOME_TRANSITION_DURATION = 700;

/**
 * 应用主内容组件
 * 负责渲染应用的核心布局、背景、3D场景、欢迎界面和页面路由
 */
const AppContent: React.FC = () => {
  /** 从应用状态管理中获取所需状态和方法 */
  const {
    currentView,         // 当前激活的视图
    resourcesLoaded,     // 资源是否加载完成
    setResourcesLoaded,  // 设置资源加载状态
    loadingIndicatorVisible, // 加载指示器是否可见
    setLoadingIndicatorVisible, // 设置加载指示器可见性
    showWelcome,         // 是否显示欢迎界面
    welcomeFading,       // 欢迎界面是否正在淡出
    setWelcomeFading,    // 设置欢迎界面淡出状态
    showTextParticles,   // 是否显示文字粒子效果
    setShowTextParticles, // 设置文字粒子效果显示状态
    setTextParticlesComplete, // 设置文字粒子效果完成状态
    musicAnalyser,       // 音乐分析器实例
    loadUserProfile,     // 加载用户配置文件
  } = useAppStore();

  /** 从博客状态管理中获取所需状态 */
  const { useMockData } = useBlogStore();

  /** 视频元素引用 - 用于控制背景视频播放 */
  const videoRef = useRef<HTMLVideoElement>(null);

  /** 加载提示数组 - 显示在欢迎界面的加载提示 */
  const loadingTips = [
    '魔女祈祷中...',
    '正在施展渲染魔法...',
    '初始化魔法引擎...',
    '翻找魔法书籍...',
    '正在绘制法阵...',
    '构建魔法世界传送门...',
    '准备进入次元...',
  ];

  /**
   * 检查令牌并预加载资源
   * @async
   * @description 1. 尝试加载用户配置文件
   *              2. 预加载背景媒体（视频或图片）
   *              3. 预加载音乐曲目
   *              4. 设置资源加载完成状态
   */
  const checkTokenAndLoadResources = async () => {
    try {
      // 加载用户配置文件
      await loadUserProfile();

      // 预加载背景媒体
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

      // 预加载音乐曲目
      if (MEDIA_CONFIG.music.tracks.length > 0) {
        MEDIA_CONFIG.music.tracks.forEach((track) => {
          const audio = new Audio();
          audio.src = `${MEDIA_CONFIG.music.folder}/${track.file}`;
          audio.preload = 'auto';
        });
      }

      // 设置资源加载完成状态
      setResourcesLoaded(true);
    } catch (e) {
      console.error('资源预加载失败:', e);
      // 即使加载失败，也设置资源加载完成状态，允许应用继续运行
      setResourcesLoaded(true);
    }
  };

  /**
   * 组件挂载时执行资源预加载
   */
  useEffect(() => {
    checkTokenAndLoadResources();
  }, []);

  /**
   * 确保背景视频自动播放
   * @description 处理浏览器自动播放策略限制
   */
  useEffect(() => {
    if (videoRef.current) {
      const playVideo = async () => {
        try {
          await videoRef.current?.play();
        } catch (e) {
          console.log('浏览器自动播放策略阻止了视频播放:', e);
        }
      };
      playVideo();
    }
  }, []);

  /**
   * 处理进入网站的逻辑
   * @description 1. 设置欢迎界面淡出
   *              2. 延迟显示文字粒子效果
   *              3. 延迟隐藏加载指示器
   */
  const handleEnterSite = () => {
    setWelcomeFading(true);

    // 延迟显示文字粒子效果
    setTimeout(() => {
      setShowTextParticles(true);
    }, WELCOME_TRANSITION_DURATION / 2);

    // 延迟隐藏加载指示器
    setTimeout(() => {
      setLoadingIndicatorVisible(false);
    }, WELCOME_TRANSITION_DURATION);
  };

  /**
   * 处理文字粒子效果完成事件
   */
  const handleTextParticlesComplete = () => {
    setTextParticlesComplete(true);
  };

  return (
    <div className="relative min-h-screen">
      {/* 背景视频/图片层 - 最底层 */}
      <div className="fixed inset-0 overflow-hidden z-0 theme-bg-primary">
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
            alt="魔法背景" 
          />
        )}
      </div>

      {/* 3D粒子图层 - 位于背景之上 */}
      <div className="fixed inset-0 z-10 pointer-events-none">
        <Scene3D analyser={musicAnalyser || undefined} />
      </div>

      {/* 欢迎加载界面 - 位于3D图层之上 */}
      <LoadingScreen
        isVisible={showWelcome && loadingIndicatorVisible}
        currentTipIndex={0}
        loadingTips={loadingTips}
        resourcesLoaded={resourcesLoaded}
        welcomeFading={welcomeFading}
        onEnter={handleEnterSite}
      />
        
      {/* 深色覆盖层 - 根据当前视图动态显示 */}
      <div
        className={`fixed inset-0 z-20 pointer-events-none transition-colors duration-1000 ${currentView === View.HOME ? '' : 'bg-overlay-dark'}`}
      />

      {/* 主内容区域 - 位于最上层 */}
      <div className="relative z-30 flex flex-col min-h-screen">
        {/* 布局组件 - 包含导航和页脚 */}
        <Layout>
          {/* 懒加载页面内容 - 显示当前激活的页面 */}
          <React.Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
            {currentView === View.HOME && <HomePage />}
            {currentView === View.BLOG && <BlogPage />}
            {currentView === View.PORTFOLIO && <PortfolioPage />}
            {currentView === View.ABOUT && <AboutPage />}
            {currentView === View.MUSIC && <MusicPage />}
          </React.Suspense>
        </Layout>

        {/* AI聊天组件 - 固定在右下角 */}
        <MagicChat />
        
        {/* 预览控制台 - 仅在预览模式下显示 */}
        {isPreviewMode() && (
          <React.Suspense fallback={null}>
            <PreviewConsole
              useMockData={useMockData}
              onToggleMockData={() => useBlogStore.getState().toggleMockData()}
              onRefresh={() => useBlogStore.getState().refresh()}
            />
          </React.Suspense>
        )}
      </div>
    </div>
  );
};

export default AppContent;
