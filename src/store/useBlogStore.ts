import { create } from 'zustand';
import { BlogPost, DirectoryNode } from '../types';
import { fetchBlogIndex, fetchPostContent, clearBlogCache } from '../services/githubService';

interface BlogState {
  // Blog posts state
  posts: BlogPost[];
  setPosts: (posts: BlogPost[]) => void;
  addPost: (post: BlogPost) => void;
  selectedPost: BlogPost | null;
  setSelectedPost: (post: BlogPost | null) => void;
  
  // Directory state
  blogDirectory: DirectoryNode[];
  setBlogDirectory: (directory: DirectoryNode[]) => void;
  
  // Loading state
  isLoadingPosts: boolean;
  setIsLoadingPosts: (loading: boolean) => void;
  isFetchingContent: boolean;
  setIsFetchingContent: (fetching: boolean) => void;
  isRateLimited: boolean;
  setIsRateLimited: (limited: boolean) => void;
  
  // Mock data state
  useMockData: boolean;
  setUseMockData: (useMock: boolean) => void;
  
  // Actions
  loadData: () => Promise<void>;
  refresh: () => Promise<void>;
  toggleMockData: () => Promise<void>;
  loadPostContent: (path: string) => Promise<void>;
  handleDirectorySelect: (node: DirectoryNode) => Promise<void>;
}

export const useBlogStore = create<BlogState>((set, get) => ({
  // Blog posts state
  posts: [],
  setPosts: (posts) => set({ posts }),
  addPost: (post) => set((state) => ({ 
    posts: [...state.posts, post] 
  })),
  selectedPost: null,
  setSelectedPost: (post) => set({ selectedPost: post }),
  
  // Directory state
  blogDirectory: [],
  setBlogDirectory: (directory) => set({ blogDirectory: directory }),
  
  // Loading state
  isLoadingPosts: false,
  setIsLoadingPosts: (loading) => set({ isLoadingPosts: loading }),
  isFetchingContent: false,
  setIsFetchingContent: (fetching) => set({ isFetchingContent: fetching }),
  isRateLimited: false,
  setIsRateLimited: (limited) => set({ isRateLimited: limited }),
  
  // Mock data state
  useMockData: false,
  setUseMockData: (useMock) => set({ useMockData: useMock }),
  
  // Actions
  loadData: async () => {
    const { setIsLoadingPosts, setIsRateLimited, setBlogDirectory, setPosts, useMockData } = get();
    
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
        const loadedPosts = await Promise.all(recentFiles.map((f: any) => fetchPostContent(f.path, useMockData)));
        setPosts(loadedPosts.filter((p): p is BlogPost => p !== null));
      }
    } catch (e) {
      console.error('Initialization Error', e);
      setPosts([]);
    } finally {
      setIsLoadingPosts(false);
    }
  },
  
  refresh: async () => {
    const { loadData, setBlogDirectory, setPosts } = get();
    
    clearBlogCache();
    setBlogDirectory([]);
    setPosts([]);
    await loadData();
  },
  
  toggleMockData: async () => {
    const { useMockData, setUseMockData, setPosts, setBlogDirectory, setSelectedPost, loadData } = get();
    
    setUseMockData(!useMockData);
    setPosts([]);
    setBlogDirectory([]);
    setSelectedPost(null);
    setTimeout(() => loadData(), 100);
  },
  
  loadPostContent: async (path: string) => {
    const { setIsFetchingContent, addPost, setSelectedPost, useMockData } = get();
    
    setIsFetchingContent(true);
    const newPost = await fetchPostContent(path, useMockData);
    setIsFetchingContent(false);
    
    if (newPost) {
      addPost(newPost);
      setSelectedPost(newPost);
    }
  },
  
  handleDirectorySelect: async (node: DirectoryNode) => {
    if (node.type !== 'file') return;
    
    const { posts, setSelectedPost, loadPostContent } = get();
    const existingPost = posts.find((p) => p.path === node.path || p.id === node.fileId);
    
    if (existingPost) {
      setSelectedPost(existingPost);
      return;
    }
    
    await loadPostContent(node.path);
  },
}));
