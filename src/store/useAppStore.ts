/**
 * 应用状态管理 - 使用 Zustand 实现全局状态管理
 * @file src/store/useAppStore.ts
 * @description 管理应用的核心状态，包括视图切换、用户信息、加载状态、欢迎界面、文字粒子效果和音乐状态
 * @created 2025-12-13
 */

import { create } from 'zustand';
import { View } from '../types';
import { fetchUserProfile } from '../services/githubService';

/**
 * 应用状态接口定义
 * @interface AppState
 * @description 定义了应用的全局状态和操作方法
 */
interface AppState {
  // 视图状态
  currentView: View;           // 当前激活的视图
  setCurrentView: (view: View) => void; // 设置当前视图
  
  // 用户状态
  userProfile: any | null;     // 用户配置文件
  hasToken: boolean | null;    // 是否有有效的访问令牌
  loadUserProfile: () => Promise<void>; // 加载用户配置文件
  
  // 加载状态
  resourcesLoaded: boolean;    // 资源是否加载完成
  setResourcesLoaded: (loaded: boolean) => void; // 设置资源加载状态
  loadingIndicatorVisible: boolean; // 加载指示器是否可见
  setLoadingIndicatorVisible: (visible: boolean) => void; // 设置加载指示器可见性
  
  // 欢迎界面状态
  showWelcome: boolean;        // 是否显示欢迎界面
  setShowWelcome: (show: boolean) => void; // 设置欢迎界面显示状态
  welcomeFading: boolean;      // 欢迎界面是否正在淡出
  setWelcomeFading: (fading: boolean) => void; // 设置欢迎界面淡出状态
  
  // 文字粒子效果状态
  showTextParticles: boolean;  // 是否显示文字粒子效果
  setShowTextParticles: (show: boolean) => void; // 设置文字粒子效果显示状态
  textParticlesComplete: boolean; // 文字粒子效果是否完成
  setTextParticlesComplete: (complete: boolean) => void; // 设置文字粒子效果完成状态
  
  // 音乐状态
  musicAnalyser: AnalyserNode | null; // 音乐分析器实例
  setMusicAnalyser: (analyser: AnalyserNode | null) => void; // 设置音乐分析器
  isScorePlaying: boolean;     // 乐谱是否正在播放
  setIsScorePlaying: (playing: boolean) => void; // 设置乐谱播放状态
}

/**
 * 应用状态管理器
 * @function useAppStore
 * @description 使用 Zustand 创建的全局状态管理钩子
 */
export const useAppStore = create<AppState>((set) => ({
  // 视图状态初始值和操作方法
  currentView: View.HOME,      // 初始视图为首页
  setCurrentView: (view) => set({ currentView: view }), // 更新当前视图
  
  // 用户状态初始值和操作方法
  userProfile: null,           // 初始用户配置文件为空
  hasToken: null,              // 初始令牌状态未知
  loadUserProfile: async () => {
    try {
      // 尝试从 GitHub API 获取用户配置文件
      const profile = await fetchUserProfile();
      // 根据是否获取到配置文件判断令牌是否有效
      const hasValidToken = profile !== null;
      // 更新用户配置文件和令牌状态
      set({ userProfile: profile, hasToken: hasValidToken });
    } catch (error) {
      console.error('加载用户配置文件失败:', error);
      // 加载失败时设置令牌无效
      set({ hasToken: false });
    }
  },
  
  // 加载状态初始值和操作方法
  resourcesLoaded: false,      // 初始资源未加载完成
  setResourcesLoaded: (loaded) => set({ resourcesLoaded: loaded }), // 更新资源加载状态
  loadingIndicatorVisible: true, // 初始加载指示器可见
  setLoadingIndicatorVisible: (visible) => set({ loadingIndicatorVisible: visible }), // 更新加载指示器可见性
  
  // 欢迎界面状态初始值和操作方法
  showWelcome: true,           // 初始显示欢迎界面
  setShowWelcome: (show) => set({ showWelcome: show }), // 更新欢迎界面显示状态
  welcomeFading: false,        // 初始欢迎界面未在淡出
  setWelcomeFading: (fading) => set({ welcomeFading: fading }), // 更新欢迎界面淡出状态
  
  // 文字粒子效果状态初始值和操作方法
  showTextParticles: false,    // 初始不显示文字粒子效果
  setShowTextParticles: (show) => set({ showTextParticles: show }), // 更新文字粒子效果显示状态
  textParticlesComplete: false, // 初始文字粒子效果未完成
  setTextParticlesComplete: (complete) => set({ textParticlesComplete: complete }), // 更新文字粒子效果完成状态
  
  // 音乐状态初始值和操作方法
  musicAnalyser: null,         // 初始音乐分析器为空
  setMusicAnalyser: (analyser) => set({ musicAnalyser: analyser }), // 更新音乐分析器
  isScorePlaying: false,       // 初始乐谱未在播放
  setIsScorePlaying: (playing) => set({ isScorePlaying: playing }), // 更新乐谱播放状态
}));
