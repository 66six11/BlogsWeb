/**
 * 博客状态管理 - 使用 Zustand 实现博客系统的状态管理
 * @file src/store/useBlogStore.ts
 * @description 管理博客的核心状态，包括博客文章、目录结构、加载状态、限流状态和模拟数据状态
 * @created 2025-12-13
 */

import { create } from 'zustand';
import { BlogPost, DirectoryNode } from '../types';
import { fetchBlogIndex, fetchPostContent, clearBlogCache } from '../services/githubService';

/**
 * 博客状态接口定义
 * @interface BlogState
 * @description 定义了博客系统的全局状态和操作方法
 */
interface BlogState {
  // 博客文章状态
  posts: BlogPost[];                 // 博客文章列表
  setPosts: (posts: BlogPost[]) => void; // 设置博客文章列表
  addPost: (post: BlogPost) => void; // 添加单篇博客文章
  selectedPost: BlogPost | null;     // 当前选中的博客文章
  setSelectedPost: (post: BlogPost | null) => void; // 设置当前选中的博客文章
  
  // 目录状态
  blogDirectory: DirectoryNode[];    // 博客目录结构
  setBlogDirectory: (directory: DirectoryNode[]) => void; // 设置博客目录结构
  
  // 加载状态
  isLoadingPosts: boolean;           // 是否正在加载博客文章
  setIsLoadingPosts: (loading: boolean) => void; // 设置博客文章加载状态
  isFetchingContent: boolean;        // 是否正在获取文章内容
  setIsFetchingContent: (fetching: boolean) => void; // 设置文章内容获取状态
  isRateLimited: boolean;            // 是否达到API请求限制
  setIsRateLimited: (limited: boolean) => void; // 设置API请求限制状态
  
  // 模拟数据状态
  useMockData: boolean;              // 是否使用模拟数据
  setUseMockData: (useMock: boolean) => void; // 设置是否使用模拟数据
  
  // 操作方法
  loadData: () => Promise<void>;     // 加载博客数据
  refresh: () => Promise<void>;      // 刷新博客数据
  toggleMockData: () => Promise<void>; // 切换模拟数据开关
  loadPostContent: (path: string) => Promise<void>; // 加载文章内容
  handleDirectorySelect: (node: DirectoryNode) => Promise<void>; // 处理目录选择
}

/**
 * 博客状态管理器
 * @function useBlogStore
 * @description 使用 Zustand 创建的博客状态管理钩子
 */
export const useBlogStore = create<BlogState>((set, get) => ({
  // 博客文章状态初始值和操作方法
  posts: [],
  setPosts: (posts) => set({ posts }),
  addPost: (post) => set((state) => ({ 
    posts: [...state.posts, post] 
  })),
  selectedPost: null,
  setSelectedPost: (post) => set({ selectedPost: post }),
  
  // 目录状态初始值和操作方法
  blogDirectory: [],
  setBlogDirectory: (directory) => set({ blogDirectory: directory }),
  
  // 加载状态初始值和操作方法
  isLoadingPosts: false,
  setIsLoadingPosts: (loading) => set({ isLoadingPosts: loading }),
  isFetchingContent: false,
  setIsFetchingContent: (fetching) => set({ isFetchingContent: fetching }),
  isRateLimited: false,
  setIsRateLimited: (limited) => set({ isRateLimited: limited }),
  
  // 模拟数据状态初始值和操作方法
  useMockData: false,
  setUseMockData: (useMock) => set({ useMockData: useMock }),
  
  // 操作方法实现
  /**
   * 加载博客数据
   * @async
   * @description 1. 设置加载状态
   *              2. 重置限流状态
   *              3. 调用 GitHub API 获取博客索引
   *              4. 设置博客目录结构
   *              5. 加载最近的5篇博客文章
   *              6. 处理可能的API请求限制
   *              7. 重置加载状态
   */
  loadData: async () => {
    const { setIsLoadingPosts, setIsRateLimited, setBlogDirectory, setPosts, useMockData } = get();
    
    setIsLoadingPosts(true);
    setIsRateLimited(false);
    
    try {
      // 从 GitHub API 获取博客索引
      const { tree, allFiles, error } = await fetchBlogIndex(useMockData);
      
      // 处理API请求限制
      if (error) {
        setIsRateLimited(true);
      }
      
      // 设置博客目录结构和加载最近的5篇文章
      if (tree.length > 0) {
        setBlogDirectory(tree);
        const recentFiles = allFiles.slice(0, 5);
        const loadedPosts = await Promise.all(recentFiles.map((f: any) => fetchPostContent(f.path, useMockData)));
        setPosts(loadedPosts.filter((p): p is BlogPost => p !== null));
      }
    } catch (e) {
      console.error('博客数据初始化错误:', e);
      setPosts([]);
    } finally {
      setIsLoadingPosts(false);
    }
  },
  
  /**
   * 刷新博客数据
   * @async
   * @description 1. 清除博客缓存
   *              2. 重置目录结构和文章列表
   *              3. 重新加载博客数据
   */
  refresh: async () => {
    const { loadData, setBlogDirectory, setPosts } = get();
    
    clearBlogCache();
    setBlogDirectory([]);
    setPosts([]);
    await loadData();
  },
  
  /**
   * 切换模拟数据开关
   * @async
   * @description 1. 切换模拟数据状态
   *              2. 重置文章列表、目录结构和选中文章
   *              3. 延迟重新加载数据
   */
  toggleMockData: async () => {
    const { useMockData, setUseMockData, setPosts, setBlogDirectory, setSelectedPost, loadData } = get();
    
    setUseMockData(!useMockData);
    setPosts([]);
    setBlogDirectory([]);
    setSelectedPost(null);
    setTimeout(() => loadData(), 100);
  },
  
  /**
   * 加载文章内容
   * @async
   * @param {string} path - 文章文件路径
   * @description 1. 设置内容获取状态
   *              2. 调用API获取文章内容
   *              3. 重置内容获取状态
   *              4. 如果获取成功，添加到文章列表并设置为选中文章
   */
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
  
  /**
   * 处理目录选择
   * @async
   * @param {DirectoryNode} node - 选中的目录节点
   * @description 1. 仅处理文件类型节点
   *              2. 检查文章是否已存在于列表中
   *              3. 如果存在，直接设置为选中文章
   *              4. 如果不存在，加载文章内容
   */
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
