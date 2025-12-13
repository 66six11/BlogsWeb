import React from 'react';
import { Book, ChevronRight, Folder, RefreshCcw, Loader2 } from 'lucide-react';
import { useBlogStore } from '../store/useBlogStore';
import FileTreeNode from '../components/features/content/FileTreeNode';
import ObsidianRenderer from '../components/features/content/ObsidianRenderer';
import { HexagramIcon } from '../components/icons/CustomIcons';

const BlogPage: React.FC = () => {
  const {
    posts,
    selectedPost,
    setSelectedPost,
    blogDirectory,
    isLoadingPosts,
    isFetchingContent,
    isRateLimited,
    refresh,
  } = useBlogStore();

  const handleWikiLinkNavigate = async (linkTarget: string) => {
    // Try to find the post by title or filename
    const normalizedTarget = linkTarget.toLowerCase().trim();
    
    // First, search in already loaded posts
    const existingPost = posts.find((p) => {
      const title = p.title.toLowerCase();
      const filename = p.path.split('/').pop()?.replace('.md', '').toLowerCase() || '';
      return title === normalizedTarget || filename === normalizedTarget || title.startsWith(normalizedTarget) || filename.startsWith(normalizedTarget);
    });
    
    if (existingPost) {
      setSelectedPost(existingPost);
      return;
    }
    
    // If not found in loaded posts, search in directory tree
    const findInTree = (nodes: any[]): any => {
      for (const node of nodes) {
        if (node.type === 'file') {
          const filename = node.name.replace('.md', '').toLowerCase();
          if (filename === normalizedTarget || filename.startsWith(normalizedTarget)) {
            return node;
          }
        }
        if (node.children && node.children.length > 0) {
          const found = findInTree(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    const foundNode = findInTree(blogDirectory);
    if (foundNode) {
      // Load the content for this node
      // This would trigger the existing loadPostContent action
    }
  };

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
          className={`md:col-span-3 backdrop-blur-md rounded-xl border p-4 h-fit max-h-[80vh] overflow-y-auto sticky top-24 opacity-90 theme-bg-secondary theme-border-subtle ${selectedPost ? 'hidden md:block' : 'block'}`}
        >
          <div className="flex justify-between items-center mb-4 px-2 pb-2 border-b theme-border-subtle">
            <h3 className="font-bold flex items-center gap-2 theme-text-primary">
              <Folder size={16} className="theme-text-accent1" /> 档案库
            </h3>
            <button
              onClick={refresh}
              title="刷新内容"
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors theme-text-secondary"
            >
              <RefreshCcw size={14} />
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
                <FileTreeNode key={node.path} node={node} onSelect={(node) => useBlogStore.getState().handleDirectorySelect(node)} />
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-9">
          {isLoadingPosts && posts.length === 0 ? (
            <div className="text-center py-20 rounded-xl border opacity-80 theme-bg-secondary theme-border-subtle theme-text-accent1">
              <div className="flex items-center justify-center ">
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
              <ObsidianRenderer 
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
                      <Book size={10} fill="currentColor" />
                      {post.category}
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

export default BlogPage;