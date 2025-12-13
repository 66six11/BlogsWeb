import { create } from 'zustand';
import { View } from '../types';
import { fetchUserProfile } from '../services/githubService';

interface AppState {
  // View state
  currentView: View;
  setCurrentView: (view: View) => void;
  
  // User state
  userProfile: any | null;
  hasToken: boolean | null;
  loadUserProfile: () => Promise<void>;
  
  // Loading state
  resourcesLoaded: boolean;
  setResourcesLoaded: (loaded: boolean) => void;
  loadingIndicatorVisible: boolean;
  setLoadingIndicatorVisible: (visible: boolean) => void;
  
  // Welcome state
  showWelcome: boolean;
  setShowWelcome: (show: boolean) => void;
  welcomeFading: boolean;
  setWelcomeFading: (fading: boolean) => void;
  
  // Text particles state
  showTextParticles: boolean;
  setShowTextParticles: (show: boolean) => void;
  textParticlesComplete: boolean;
  setTextParticlesComplete: (complete: boolean) => void;
  
  // Music state
  musicAnalyser: AnalyserNode | null;
  setMusicAnalyser: (analyser: AnalyserNode | null) => void;
  isScorePlaying: boolean;
  setIsScorePlaying: (playing: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // View state
  currentView: View.HOME,
  setCurrentView: (view) => set({ currentView: view }),
  
  // User state
  userProfile: null,
  hasToken: null,
  loadUserProfile: async () => {
    try {
      const profile = await fetchUserProfile();
      const hasValidToken = profile !== null;
      set({ userProfile: profile, hasToken: hasValidToken });
    } catch (error) {
      console.error('Failed to load user profile:', error);
      set({ hasToken: false });
    }
  },
  
  // Loading state
  resourcesLoaded: false,
  setResourcesLoaded: (loaded) => set({ resourcesLoaded: loaded }),
  loadingIndicatorVisible: true,
  setLoadingIndicatorVisible: (visible) => set({ loadingIndicatorVisible: visible }),
  
  // Welcome state
  showWelcome: true,
  setShowWelcome: (show) => set({ showWelcome: show }),
  welcomeFading: false,
  setWelcomeFading: (fading) => set({ welcomeFading: fading }),
  
  // Text particles state
  showTextParticles: false,
  setShowTextParticles: (show) => set({ showTextParticles: show }),
  textParticlesComplete: false,
  setTextParticlesComplete: (complete) => set({ textParticlesComplete: complete }),
  
  // Music state
  musicAnalyser: null,
  setMusicAnalyser: (analyser) => set({ musicAnalyser: analyser }),
  isScorePlaying: false,
  setIsScorePlaying: (playing) => set({ isScorePlaying: playing }),
}));
