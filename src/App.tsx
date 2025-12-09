import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { View, BlogPost, DirectoryNode, GitHubUser } from './types';
import LoadingScreen from './components/common/LoadingScreen';
import MagicChat from './components/features/chat/MagicChat';
import NavBar from './components/layout/NavBar';
import MobileNav from './components/layout/MobileNav';
import Footer from './components/layout/Footer';
import PageLayout from './components/layout/PageLayout';
import HomePage from './pages/HomePage';
import BlogPage from './pages/BlogPage';
import PortfolioPage from './pages/PortfolioPage';
import AboutPage from './pages/AboutPage';
import MusicPage from './pages/MusicPage';
import {
  fetchBlogPosts,
  fetchUserProfile,
  fetchBlogIndex,
  fetchPostContent,
  clearBlogCache,
} from './services/githubService';
import { isPreviewMode } from './data/mockData';

// Lazy load PreviewConsole only in preview mode to exclude from production builds
const PreviewConsole = lazy(() => import('./components/dev/PreviewConsole'));

// Welcome overlay transition duration (ms)
const WELCOME_TRANSITION_DURATION = 700;

const App: React.FC = () => {
  // View State
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  // Welcome/Loading State
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeFading, setWelcomeFading] = useState(false);
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [resourcesLoaded, setResourcesLoaded] = useState(false);
  const [loadingIndicatorVisible, setLoadingIndicatorVisible] = useState(true);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [showTextParticles, setShowTextParticles] = useState(false);
  const [textParticlesComplete, setTextParticlesComplete] = useState(false);

  // Data State
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [blogDirectory, setBlogDirectory] = useState<DirectoryNode[]>([]);
  const [userProfile, setUserProfile] = useState<GitHubUser | null>(null);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isFetchingContent, setIsFetchingContent] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [useMockData, setUseMockData] = useState(false);

  // Audio State
  const [musicAnalyser, setMusicAnalyser] = useState<AnalyserNode | null>(null);
  const [isScorePlaying, setIsScorePlaying] = useState(false);

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

  // Rotate loading tips
  useEffect(() => {
    if (!resourcesLoaded) {
      const tipInterval = setInterval(() => {
        setCurrentTipIndex((prevIndex) => (prevIndex + 1) % loadingTips.length);
      }, 3000);
      return () => clearInterval(tipInterval);
    }
  }, [resourcesLoaded, loadingTips.length]);

  // Check for GitHub token
  useEffect(() => {
    const token = import.meta.env.VITE_GITHUB_TOKEN;
    setHasToken(!!token);
  }, []);

  // Simulate resource loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setResourcesLoaded(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleAnalyserReady = (analyser: AnalyserNode | null) => {
    setMusicAnalyser(analyser);
  };

  const handleScorePlaybackChange = (isPlaying: boolean) => {
    setIsScorePlaying(isPlaying);
  };

  const loadData = async () => {
    try {
      const [fetchedPosts, directory] = await Promise.all([
        fetchBlogPosts(useMockData),
        fetchBlogIndex(useMockData),
      ]);

      setPosts(fetchedPosts);
      setBlogDirectory(directory);
      setIsRateLimited(false);
    } catch (err: any) {
      if (err.message?.includes('rate limit')) {
        setIsRateLimited(true);
        console.warn('Rate limited. Using cached/mock data.');
        const [fetchedPosts, directory] = await Promise.all([
          fetchBlogPosts(true),
          fetchBlogIndex(true),
        ]);
        setPosts(fetchedPosts);
        setBlogDirectory(directory);
      }
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handleToggleMockData = () => {
    setUseMockData((prev) => !prev);
    setPosts([]);
    setBlogDirectory([]);
    setSelectedPost(null);
    clearBlogCache();
    setTimeout(() => loadData(), 100);
  };

  const handleRefresh = () => {
    setPosts([]);
    setBlogDirectory([]);
    setSelectedPost(null);
    clearBlogCache();
    setTimeout(() => loadData(), 100);
  };

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

  // Load user profile on initial load
  useEffect(() => {
    const loadUserProfile = async () => {
      if (hasToken !== null) {
        try {
          const profile = await fetchUserProfile();
          if (profile) setUserProfile(profile);
        } catch (e) {
          console.error('Error loading user profile', e);
        }
      }
    };
    loadUserProfile();
  }, [hasToken]);

  // Load blog data only when on the blog page
  useEffect(() => {
    if (currentView === View.BLOG && blogDirectory.length === 0 && posts.length === 0) {
      setIsLoadingPosts(true);
      loadData();
    }
  }, [currentView]);

  const handleDirectorySelect = useCallback(async (node: DirectoryNode) => {
    if (node.type !== 'file') return;

    const existingPost = posts.find((p) => p.path === node.path || p.id === node.fileId);
    if (existingPost) {
      setSelectedPost(existingPost);
      return;
    }

    setIsFetchingContent(true);
    const newPost = await fetchPostContent(node.path, useMockData);
    setIsFetchingContent(false);

    if (newPost) {
      setPosts((prev) => [...prev, newPost]);
      setSelectedPost(newPost);
    }
  }, [posts, useMockData]);

  // Handle wiki link navigation from markdown content
  const handleWikiLinkNavigate = async (linkTarget: string) => {
    const normalizedTarget = linkTarget.toLowerCase().trim();
    
    // Search in already loaded posts
    const existingPost = posts.find((p) => {
      const title = p.title.toLowerCase();
      const filename = p.path.split('/').pop()?.replace('.md', '').toLowerCase() || '';
      return title === normalizedTarget || 
             filename === normalizedTarget || 
             title.startsWith(normalizedTarget) ||
             filename.startsWith(normalizedTarget);
    });

    if (existingPost) {
      setSelectedPost(existingPost);
      return;
    }

    // Search in the directory tree
    const findInTree = (nodes: DirectoryNode[]): DirectoryNode | null => {
      for (const node of nodes) {
        if (node.type === 'file') {
          const filename = node.name.replace('.md', '').toLowerCase();
          if (filename === normalizedTarget || filename.startsWith(normalizedTarget)) {
            return node;
          }
        } else if (node.children) {
          const found = findInTree(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    const targetNode = findInTree(blogDirectory);
    if (targetNode) {
      await handleDirectorySelect(targetNode);
    }
  };

  const handleViewChange = (view: View) => {
    setCurrentView(view);
    setSelectedPost(null);
  };

  return (
    <PageLayout
      currentView={currentView}
      musicAnalyser={musicAnalyser}
      showTextParticles={showTextParticles}
      onTextParticlesComplete={handleTextParticlesComplete}
    >
      {/* Welcome Screen */}
      <LoadingScreen
        isVisible={showWelcome && loadingIndicatorVisible}
        currentTipIndex={currentTipIndex}
        loadingTips={loadingTips}
        resourcesLoaded={resourcesLoaded}
        welcomeFading={welcomeFading}
        onEnter={handleEnterSite}
      />

      {/* Main Content */}
      <div className="relative z-30 flex flex-col min-h-screen">
        <NavBar
          currentView={currentView}
          onViewChange={handleViewChange}
          onAnalyserReady={handleAnalyserReady}
          autoPlayTrigger={!showWelcome}
          externalPause={isScorePlaying}
        />

        <main
          className={`flex-1 w-full flex flex-col ${
            currentView === View.HOME ? 'pt-16 justify-center' : 'pt-16 pb-16 md:pb-8'
          }`}
        >
          {currentView === View.HOME && (
            <HomePage userProfile={userProfile} onViewChange={handleViewChange} />
          )}
          {currentView === View.BLOG && (
            <BlogPage
              posts={posts}
              blogDirectory={blogDirectory}
              selectedPost={selectedPost}
              isLoadingPosts={isLoadingPosts}
              isFetchingContent={isFetchingContent}
              isRateLimited={isRateLimited}
              onSelectPost={setSelectedPost}
              onDirectorySelect={handleDirectorySelect}
              onRefresh={handleRefresh}
              onWikiLinkNavigate={handleWikiLinkNavigate}
            />
          )}
          {currentView === View.PORTFOLIO && <PortfolioPage />}
          {currentView === View.ABOUT && <AboutPage userProfile={userProfile} />}
          {currentView === View.MUSIC && (
            <MusicPage currentView={currentView} onPlaybackChange={handleScorePlaybackChange} />
          )}
        </main>

        <MagicChat />
        <MobileNav currentView={currentView} onViewChange={handleViewChange} />
        <Footer userProfile={userProfile} />
      </div>

      {/* Preview Console - Only visible in preview mode */}
      {isPreviewMode() && (
        <Suspense fallback={null}>
          <PreviewConsole
            useMockData={useMockData}
            onToggleMockData={handleToggleMockData}
            onRefresh={handleRefresh}
          />
        </Suspense>
      )}
    </PageLayout>
  );
};

export default App;
