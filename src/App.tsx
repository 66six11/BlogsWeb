import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { View, BlogPost, DirectoryNode, GitHubUser } from './types';
import {
  APP_TITLE,
  AUTHOR_NAME,
  MOCK_POSTS,
  PROJECTS,
  BG_MEDIA_URL,
} from './constants';
import { MEDIA_CONFIG } from './config';
import PianoEditor from './components/features/music/PianoEditor';
import MagicChat from './components/features/chat/MagicChat';
import Scene3D from './components/features/3d/Scene3D';
import MusicPlayer from './components/features/music/MusicPlayer';
import ThemeToggle from './components/common/ThemeToggle';
import { CustomSparkleIcon, CustomWitchIcon, HexagramIcon } from './components/icons/CustomIcons';
import LoadingScreen from './components/common/LoadingScreen';
import TextParticleSystem from './components/features/3d/TextParticleSystem';
import FileTreeNode from './components/features/content/FileTreeNode';
import MarkdownRenderer from './components/features/content/MarkdownRenderer';

// Lazy load PreviewConsole only in preview mode to exclude from production builds
const PreviewConsole = lazy(() => import('./components/dev/PreviewConsole'));

import {
  fetchBlogPosts,
  fetchUserProfile,
  fetchBlogIndex,
  fetchPostContent,
  clearBlogCache,
} from './services/githubService';
import { isPreviewMode } from './data/mockData';
import {
  Book,
  Code,
  Music,
  User,
  Home,
  ChevronRight,
  Star,
  Palette,
  Terminal,
  Github,
  Folder,
  RefreshCcw,
  Loader2,
} from 'lucide-react';

// Welcome overlay transition duration (ms)
const WELCOME_TRANSITION_DURATION = 700;

// --- Main App Component ---
const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
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

  // Rotate loading tips
  useEffect(() => {
    if (!resourcesLoaded) {
      const tipInterval = setInterval(() => {
        setCurrentTipIndex((prevIndex) => (prevIndex + 1) % loadingTips.length);
      }, 3000);

      return () => clearInterval(tipInterval);
    }
  }, [resourcesLoaded, loadingTips.length]);

  // Callback when music player analyser is ready
  const handleAnalyserReady = useCallback((analyser: AnalyserNode) => {
    setMusicAnalyser(analyser);
  }, []);

  // Score playback state change callback
  const handleScorePlaybackChange = useCallback((isPlaying: boolean) => {
    setIsScorePlaying(isPlaying);
  }, []);

  // Check if we have a token by trying to fetch user profile
  const checkTokenAndLoadResources = async () => {
    try {
      const profile = await fetchUserProfile();
      const hasValidToken = profile !== null;
      setHasToken(hasValidToken);

      if (hasValidToken && profile) {
        setUserProfile(profile);
        if (profile.avatar_url) {
          const img = new Image();
          img.src = profile.avatar_url;
        }
      }

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
      setHasToken(false);
      setResourcesLoaded(true);
    }
  };

  const loadData = async () => {
    setIsLoadingPosts(true);
    setIsRateLimited(false);

    try {
      const { tree, allFiles, error } = await fetchBlogIndex(useMockData);

      if (error) {
        setIsRateLimited(true);
      }

      if (tree.length > 0) {
        setBlogDirectory(tree);
        const recentFiles = allFiles.slice(0, 5);
        const loadedPosts = await Promise.all(recentFiles.map((f) => fetchPostContent(f.path, useMockData)));
        setPosts(loadedPosts.filter((p): p is BlogPost => p !== null));
      } else {
        setPosts(MOCK_POSTS);
      }
    } catch (e) {
      console.error('Initialization Error', e);
      setPosts(MOCK_POSTS);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  useEffect(() => {
    checkTokenAndLoadResources();
  }, []);

  const handleRefresh = async () => {
    clearBlogCache();
    setBlogDirectory([]);
    setPosts([]);
    await loadData();
  };

  const handleToggleMockData = () => {
    setUseMockData(!useMockData);
    setPosts([]);
    setBlogDirectory([]);
    setSelectedPost(null);
    setTimeout(() => loadData(), 100);
  };

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
    // Try to find the post by title or filename
    const normalizedTarget = linkTarget.toLowerCase().trim();
    
    // First, search in already loaded posts with exact match or prefix match
    const existingPost = posts.find((p) => {
      const title = p.title.toLowerCase();
      const filename = p.path.split('/').pop()?.replace('.md', '').toLowerCase() || '';
      // Use exact match or check if the filename/title starts with the target
      return title === normalizedTarget || 
             filename === normalizedTarget || 
             title.startsWith(normalizedTarget) ||
             filename.startsWith(normalizedTarget);
    });

    if (existingPost) {
      setSelectedPost(existingPost);
      return;
    }

    // If not found in loaded posts, search in the directory tree
    const findInTree = (nodes: DirectoryNode[]): DirectoryNode | null => {
      for (const node of nodes) {
        if (node.type === 'file') {
          const filename = node.name.replace('.md', '').toLowerCase();
          // Use exact match or prefix match for better precision
          if (filename === normalizedTarget || filename.startsWith(normalizedTarget)) {
            return node;
          }
        }
        if (node.children) {
          const found = findInTree(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    const foundNode = findInTree(blogDirectory);
    if (foundNode) {
      await handleDirectorySelect(foundNode);
    } else {
      // Provide more helpful error message
      const availableTitles = posts.map(p => p.title).slice(0, 5).join(', ');
      console.warn(
        `Wiki link target '${linkTarget}' not found.`,
        posts.length > 0 ? `Available posts include: ${availableTitles}...` : 'No posts loaded yet.'
      );
    }
  };

  const renderNav = () => (
    <nav className="nav-bar fixed top-0 left-0 right-0 z-40 w-full backdrop-blur-md border-b shadow-lg opacity-90 theme-bg-secondary theme-border-subtle">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => {
            setCurrentView(View.HOME);
            setSelectedPost(null);
          }}
        >
          <div className=" from-purple-600 to-amber-500 p-1. 5 rounded-lg group-hover:rotate-[30deg] transition-transform shadow-[0_0_15px_rgba(251,191,36,0. 4)]">
            <HexagramIcon size={48} />
          </div>
          <span className="font-serif font-bold text-xl tracking-tight transition-colors drop-shadow-md theme-text-primary">
            {APP_TITLE}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-2 p-1 rounded-full  border-2 opacity-60 nav-button-pills-container">
            {[
              { id: View.HOME, icon: Home, label: '首页' },
              { id: View.BLOG, icon: Book, label: '魔法书' },
              { id: View.PORTFOLIO, icon: Code, label: '作品' },
              { id: View.MUSIC, icon: Music, label: '旋律' },
              { id: View.ABOUT, icon: User, label: '关于' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setSelectedPost(null);
                }}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full  transition-all duration-300 text-sm font-semibold
                    ${
                      currentView === item.id
                        ? 'bg-white/10  shadow-[0_0_10px_rgba(255,255,255,0.1)] border '
                        : 'hover:bg-white/5 theme-text-secondary'
                    }`}
              >
                <item.icon size={15} />
                {item.label}
              </button>
            ))}
          </div>

          <ThemeToggle />
          <MusicPlayer
            onAnalyserReady={handleAnalyserReady}
            autoPlayTrigger={!showWelcome}
            externalPause={isScorePlaying}
          />
        </div>
      </div>
    </nav>
  );

  // Mobile bottom navigation
  const renderMobileNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden backdrop-blur-md border-t shadow-lg opacity-90 theme-bg-secondary theme-border-subtle">
      <div className="flex justify-around items-center h-16 px-2">
        {[
          { id: View.HOME, icon: Home, label: '首页' },
          { id: View.BLOG, icon: Book, label: '魔法书' },
          { id: View.PORTFOLIO, icon: Code, label: '作品' },
          { id: View.MUSIC, icon: Music, label: '旋律' },
          { id: View.ABOUT, icon: User, label: '关于' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setCurrentView(item.id);
              setSelectedPost(null);
            }}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-lg transition-all duration-300
                            ${
                              currentView === item.id
                                ? 'bg-white/10 theme-text-accent1'
                                : 'theme-text-secondary'
                            }`}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center flex-1 text-center px-4 relative overflow-hidden w-full h-full">
      <div className="relative z-10 animate-fade-in-up backdrop-blur-md p-8 md:p-12 rounded-3xl border shadow-2xl max-w-4xl flex flex-col items-center theme-bg-secondary theme-border-subtle">
        <div
          className="w-32 h-32 mx-auto mb-8 relative group cursor-pointer"
          onClick={() => setCurrentView(View.ABOUT)}
          title="关于我"
        >
          <div className="absolute inset-0 rounded-full animate-spin-slow opacity-80 blur-md group-hover:blur-xl transition-all avatar-gradient-bg"></div>
          <img
            src={
              userProfile?.avatar_url ||
              'https://api.dicebear.com/7.x/avataaars/svg?seed=Elaina&clothing=graphicShirt&top=hat&hairColor=silverGray'
            }
            alt="Avatar"
            className="w-full h-full rounded-full border-4 relative z-10 object-cover hover:scale-105 transition-transform avatar-border"
          />
          <div className="absolute top-20 left-[calc(90%)] -translate-x-1/2 z-20">
            <CustomSparkleIcon
              size={42}
              className="drop-shadow-[0_0_10px_rgba(222,185,154,0.8)] animate-float theme-text-accent1"
            />
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] text-center theme-text-primary">
          {userProfile?.name || AUTHOR_NAME}
        </h1>
        <p className="text-xl md:text-2xl max-w-2xl mx-auto mb-10 font-light leading-relaxed drop-shadow-md text-center theme-text-secondary">
          {userProfile?.bio || '"一位用代码和色彩编织新世界的旅行者。"'}
          <br />
          <span className="text-base mt-3 block font-mono inline-block px-4 py-1 rounded-full border theme-text-accent1 accent-border-light">
            Unity • Graphic • C++ • Art
          </span>
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => setCurrentView(View.PORTFOLIO)}
            className="px-8 py-3 text-white rounded-lg font-bold shadow-[0_0_20px_rgba(124,133,235,0.4)] transition-all hover:scale-105 hover:opacity-90 flex items-center gap-2 border backdrop-blur-sm theme-btn-primary accent3-border"
          >
            <Code size={20} /> 查看项目
          </button>
          <button
            onClick={() => setCurrentView(View.BLOG)}
            className="px-8 py-3 rounded-lg font-bold border transition-all hover:scale-105 flex items-center gap-2 backdrop-blur-md hover:bg-white/10 theme-text-primary theme-border-subtle bg-white/10"
          >
            <Book size={20} /> 阅读魔法书
          </button>
        </div>
      </div>
    </div>
  );

  const renderBlog = () => {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 animate-fade-in-up relative z-10 w-full">
        {!selectedPost && (
          <div className="text-center mb-8 p-6 rounded-2xl backdrop-blur-sm border relative overflow-hidden opacity-80 theme-bg-secondary theme-border-subtle">
            {isRateLimited && (
              <div className="absolute top-0 left-0 right-0 bg-red-900/80 text-white text-xs py-1 animate-pulse border-b border-red-500">
                警告：魔法能量耗尽（GitHub 速率限制）。正在显示缓存/模拟内容。
              </div>
            )}
            <h2 className="text-4xl font-serif font-bold mb-2 flex items-center justify-center gap-3 mt-2 theme-text-primary">
              <Book className="theme-text-accent1" /> 魔女的魔法书
            </h2>
            <p className="theme-text-secondary">关于渲染、逻辑和神秘艺术的笔记。</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div
            className={`md:col-span-3 backdrop-blur-md rounded-xl border p-4 h-fit max-h-[80vh] overflow-y-auto sticky top-24 opacity-90 theme-bg-secondary theme-border-subtle ${
              selectedPost ? 'hidden md:block' : 'block'
            }`}
          >
            <div className="flex justify-between items-center mb-4 px-2 pb-2 border-b theme-border-subtle">
              <h3 className="font-bold flex items-center gap-2 theme-text-primary">
                <Folder size={16} className="theme-text-accent1" /> 档案库
              </h3>
              <button
                onClick={handleRefresh}
                title="刷新内容"
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors theme-text-secondary"
              >
                <RefreshCcw size={14} className={isLoadingPosts ? 'animate-spin' : ''} />
              </button>
            </div>

            {blogDirectory.length === 0 && !isLoadingPosts ? (
              <div className="text-sm px-2 italic theme-text-secondary">
                未找到咒语... <br />
                <span className="text-[10px] opacity-70">请检查连接或刷新。</span>
              </div>
            ) : null}

            {blogDirectory.length > 0 && (
              <div className="space-y-1">
                {blogDirectory.map((node) => (
                  <FileTreeNode key={node.path} node={node} onSelect={handleDirectorySelect} />
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-9">
            {isLoadingPosts && posts.length === 0 ? (
              <div className="text-center py-20 rounded-xl border opacity-80 theme-bg-secondary theme-border-subtle theme-text-accent1">
                <div className="flex items-center  justify-center ">
                  <HexagramIcon size={48} className="animate-pulse inline-block mr-2" />
                  <span>正在召唤卷轴...</span>
                </div>
              </div>
            ) : isFetchingContent ? (
              <div className="flex flex-col items-center justify-center py-20 rounded-xl border h-[60vh] opacity-80 theme-bg-secondary theme-border-subtle">
                <Loader2 className="animate-spin mb-4 theme-text-accent3" size={48} />
                <span className="theme-text-secondary">正在解读符文...</span>
              </div>
            ) : selectedPost ? (
              <article className="border rounded-2xl p-8 md:p-12 shadow-2xl backdrop-blur-md min-h-[60vh] animate-fade-in-up opacity-90 theme-bg-secondary theme-border-subtle">
                <button
                  onClick={() => setSelectedPost(null)}
                  className="mb-6 flex items-center transition-colors bg-black/20 px-4 py-2 rounded-full w-fit backdrop-blur-sm text-sm hover:opacity-80 theme-text-secondary"
                >
                  <ChevronRight className="rotate-180 mr-1" size={14} /> 返回
                </button>

                <header className="mb-8 pb-8 border-b theme-border-subtle">
                  <div className="flex gap-2 mb-4">
                    <span className="text-xs px-2 py-1 rounded border category-badge theme-text-accent3">
                      {selectedPost.category}
                    </span>
                    <span className="text-xs flex items-center theme-text-secondary">
                      {selectedPost.date}
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-5xl font-serif font-bold mb-6 leading-tight theme-text-primary">
                    {selectedPost.title}
                  </h1>
                  <div className="flex gap-2">
                    {selectedPost.tags.map((tag) => (
                      <span key={tag} className="text-xs font-mono theme-text-accent1">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </header>
                <MarkdownRenderer 
                  content={selectedPost.content}
                  onNavigate={handleWikiLinkNavigate}
                  basePath={selectedPost.path}
                  loadedPosts={posts}
                />
              </article>
            ) : (
              <div className="grid gap-6">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="group rounded-xl p-6 cursor-pointer transition-all duration-300 backdrop-blur-md border hover:shadow-[0_0_25px_rgba(222,185,154,0.15)] opacity-90 theme-bg-secondary theme-border-subtle"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-sm tracking-wider uppercase flex items-center gap-1 theme-text-accent1">
                        <Star size={10} fill="currentColor" /> {post.category}
                      </span>
                      <span className="text-sm theme-text-secondary">• {post.date}</span>
                    </div>
                    <h3 className="text-2xl font-serif font-bold mb-3 transition-colors theme-text-primary">
                      {post.title}
                    </h3>
                    <p className="leading-relaxed mb-4 text-sm line-clamp-3 theme-text-secondary">
                      {post.excerpt}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPortfolio = () => (
    <div className="max-w-6xl mx-auto py-12 px-4 animate-fade-in-up relative z-10">
      <div className="text-center mb-12 p-6 rounded-2xl backdrop-blur-sm border opacity-80 theme-bg-secondary theme-border-subtle">
        <h2 className="text-3xl font-serif font-bold mb-2 flex items-center justify-center gap-2 theme-text-primary">
          <Code size={30} className="theme-text-accent1" /> 魔法作品
        </h2>
        <p className="theme-text-secondary">用代码和咖啡创造的神器。</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {PROJECTS.map((project) => (
          <div
            key={project.id}
            className="group rounded-xl overflow-hidden border transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md theme-bg-secondary theme-border-subtle"
          >
            <div className="h-48 overflow-hidden relative">
              <div className="absolute inset-0 group-hover:bg-transparent transition-colors z-10 project-card-overlay" />
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2 font-serif transition-colors theme-text-primary">
                {project.title}
              </h3>
              <p className="text-sm mb-4 h-20 overflow-hidden pb-2 border-b theme-text-secondary theme-border-subtle">
                {project.description}
              </p>
              <div className="flex flex-wrap gap-2 mt-auto">
                {project.tech.map((t) => (
                  <span
                    key={t}
                    className="text-xs font-mono px-2 py-1 rounded border theme-text-secondary theme-bg-tertiary theme-border-subtle"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAbout = () => (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-fade-in-up relative z-10">
      <div className="backdrop-blur-md border rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden  theme-bg-secondary theme-border-subtle">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <CustomWitchIcon size={120} className="theme-text-accent1" />
        </div>

        <div className="flex flex-col md:flex-row gap-10 items-center">
          <div className="w-48 h-48 flex-shrink-0 relative">
            <div className="absolute inset-0 rounded-full animate-spin-slow opacity-80 blur-md group-hover:blur-xl transition-all avatar-gradient-bg"></div>
            <img
              src={
                userProfile?.avatar_url ||
                'https://api.dicebear.com/7.x/avataaars/svg?seed=Elaina&clothing=graphicShirt&top=hat&hairColor=silverGray'
              }
              alt="Profile"
              className="w-full h-full rounded-full object-cover border-4 shadow-xl relative z-10 about-profile-border"
            />
          </div>

          <div className="flex-1">
            <h2 className="text-4xl font-serif font-bold mb-4 theme-text-primary">关于旅行者</h2>
            <div className="space-y-4 leading-relaxed font-sans theme-text-secondary">
              {userProfile?.bio ? (
                <p>{userProfile.bio}</p>
              ) : (
                <>
                  <p>
                    你好！我是一名对{' '}
                    <strong className="theme-text-accent1">计算机图形学</strong>、
                    <strong className="theme-text-accent1">Unity</strong> 和{' '}
                    <strong className="theme-text-accent1">游戏引擎架构</strong>{' '}
                    充满热情的学生。
                  </p>
                  <p>
                    当我不在调试着色器或优化绘制调用时，我会花时间弹钢琴或绘制受我最喜欢的动漫《
                    <em className="theme-text-accent3">魔女之旅</em>
                    》启发的风景画。
                  </p>
                </>
              )}
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {userProfile?.html_url && (
                <a
                  href={userProfile.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-4 rounded-lg border flex items-center gap-3 hover:opacity-80 transition-colors opacity-80 theme-bg-primary theme-border-subtle"
                >
                  <Github className="theme-text-accent1" />
                  <div>
                    <h4 className="font-bold text-sm theme-text-primary">GitHub</h4>
                    <p className="text-xs theme-text-secondary">查看源码</p>
                  </div>
                </a>
              )}
              <div className="p-4 rounded-lg border flex items-center gap-3 opacity-80 theme-bg-primary theme-border-subtle">
                <Terminal className="theme-text-accent1" />
                <div>
                  <h4 className="font-bold text-sm theme-text-primary">编程语言</h4>
                  <p className="text-xs theme-text-secondary">C++, C#, HLSL, Python</p>
                </div>
              </div>
              <div className="p-4 rounded-lg border flex items-center gap-3 opacity-80 theme-bg-primary theme-border-subtle">
                <Palette className="theme-text-accent1" />
                <div>
                  <h4 className="font-bold text-sm theme-text-primary">工具</h4>
                  <p className="text-xs theme-text-secondary">Unity, Blender, Photoshop</p>
                </div>
              </div>
              <div className="p-4 rounded-lg border flex items-center gap-3 opacity-80 theme-bg-primary theme-border-subtle">
                <Music className="theme-text-accent1" />
                <div>
                  <h4 className="font-bold text-sm theme-text-primary">爱好</h4>
                  <p className="text-xs theme-text-secondary">钢琴即兴演奏</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMusic = () => (
    <div className="max-w-5xl mx-auto py-12 px-4 animate-fade-in-up relative z-10">
      <div className="text-center mb-8 p-6 rounded-2xl backdrop-blur-sm border opacity-80 theme-bg-secondary theme-border-subtle">
        <h2 className="text-3xl font-serif font-bold mb-2 theme-text-primary">吟游诗人作曲</h2>
        <p className="theme-text-secondary">
          创作一段旋律。即使是魔女也需要从学习中休息一下。
        </p>
      </div>

      <PianoEditor
        className="w-full"
        isVisible={currentView === View.MUSIC}
        onPlaybackChange={handleScorePlaybackChange}
      />

      <div className="mt-8 text-center max-w-2xl mx-auto p-4 rounded-xl border backdrop-blur-sm opacity-80 theme-bg-secondary theme-border-subtle">
        <p className="italic text-sm theme-text-secondary">
          "魔法不仅仅是施展咒语，更是聆听世界的节奏。"
        </p>
      </div>
    </div>
  );

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

      {/* Welcome Screen */}
      <LoadingScreen
        isVisible={showWelcome && loadingIndicatorVisible}
        currentTipIndex={currentTipIndex}
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
        className={`fixed inset-0 z-20 pointer-events-none transition-colors duration-1000 ${
          currentView === View.HOME ? '' : 'bg-overlay-dark'
        }`}
      />

      {/* Main Content */}
      <div className="relative z-30 flex flex-col min-h-screen">
        {renderNav()}

        <main
          className={`flex-1 w-full flex flex-col ${
            currentView === View.HOME ? 'pt-16 justify-center' : 'pt-16 pb-16 md:pb-8'
          }`}
        >
          {currentView === View.HOME && renderHome()}
          {currentView === View.BLOG && renderBlog()}
          {currentView === View.PORTFOLIO && renderPortfolio()}
          {currentView === View.ABOUT && renderAbout()}
          {currentView === View.MUSIC && renderMusic()}
        </main>

        <MagicChat />

        {renderMobileNav()}

        <footer className="backdrop-blur-md border-t py-2 text-center text-sm mt-auto opacity-90 theme-footer theme-bg-primary theme-border-subtle theme-text-secondary md:fixed md:bottom-0 md:left-0 md:right-0 md:z-40">
          <p>
            © {new Date().getFullYear()} {userProfile?.name || AUTHOR_NAME}. 灵感来自《魔女之旅》。
          </p>
          <div className="flex justify-center gap-4 mt-2 md:hidden">
            <a
              href={userProfile?.html_url || '#'}
              className="hover:opacity-80 transition-colors theme-footer-link"
            >
              GitHub
            </a>
            <a href="#" className="hover:opacity-80 transition-colors theme-footer-link">
              推特
            </a>
            <a href="#" className="hover:opacity-80 transition-colors theme-footer-link">
              ArtStation
            </a>
          </div>
          <div className="hidden md:block">
            <a
              href={userProfile?.html_url || '#'}
              className="mx-4 hover:opacity-80 transition-colors theme-footer-link"
            >
              GitHub
            </a>
            <a href="#" className="mx-4 hover:opacity-80 transition-colors theme-footer-link">
              推特
            </a>
            <a href="#" className="mx-4 hover:opacity-80 transition-colors theme-footer-link">
              ArtStation
            </a>
          </div>
        </footer>
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
    </div>
  );
};

export default App;
