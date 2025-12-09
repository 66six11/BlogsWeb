import React from 'react';
import { BlogPost, DirectoryNode } from '../types';
import { Book, Folder, RefreshCcw, Star, ChevronRight, Loader2 } from 'lucide-react';
import { Container, Card, SectionHeader, Badge } from '../components/ui';
import { HexagramIcon } from '../components/icons/CustomIcons';
import FileTreeNode from '../components/features/content/FileTreeNode';
import ObsidianRenderer from '../components/features/content/ObsidianRenderer';

export interface BlogPageProps {
  posts: BlogPost[];
  blogDirectory: DirectoryNode[];
  selectedPost: BlogPost | null;
  isLoadingPosts: boolean;
  isFetchingContent: boolean;
  isRateLimited: boolean;
  onSelectPost: (post: BlogPost | null) => void;
  onDirectorySelect: (node: DirectoryNode) => void;
  onRefresh: () => void;
  onWikiLinkNavigate: (linkTarget: string) => void;
}

const BlogPage: React.FC<BlogPageProps> = ({
  posts,
  blogDirectory,
  selectedPost,
  isLoadingPosts,
  isFetchingContent,
  isRateLimited,
  onSelectPost,
  onDirectorySelect,
  onRefresh,
  onWikiLinkNavigate,
}) => {
  return (
    <Container maxWidth="7xl" className="py-8 animate-fade-in-up relative z-10">
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
        <Card
          variant="glass"
          padding="sm"
          className={`md:col-span-3 h-fit max-h-[80vh] overflow-y-auto sticky top-24 ${
            selectedPost ? 'hidden md:block' : 'block'
          }`}
        >
          <div className="flex justify-between items-center mb-4 px-2 pb-2 border-b theme-border-subtle">
            <h3 className="font-bold flex items-center gap-2 theme-text-primary">
              <Folder size={16} className="theme-text-accent1" /> 档案库
            </h3>
            <button
              onClick={onRefresh}
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
                <FileTreeNode key={node.path} node={node} onSelect={onDirectorySelect} />
              ))}
            </div>
          )}
        </Card>

        <div className="md:col-span-9">
          {isLoadingPosts && posts.length === 0 ? (
            <Card variant="glass" className="text-center py-20 theme-text-accent1">
              <div className="flex items-center justify-center">
                <HexagramIcon size={48} className="animate-pulse inline-block mr-2" />
                <span>正在召唤卷轴...</span>
              </div>
            </Card>
          ) : isFetchingContent ? (
            <Card variant="glass" className="flex flex-col items-center justify-center py-20 h-[60vh]">
              <Loader2 className="animate-spin mb-4 theme-text-accent3" size={48} />
              <span className="theme-text-secondary">正在解读符文...</span>
            </Card>
          ) : selectedPost ? (
            <Card variant="elevated" padding="lg" className="min-h-[60vh] animate-fade-in-up">
              <button
                onClick={() => onSelectPost(null)}
                className="mb-6 flex items-center transition-colors bg-black/20 px-4 py-2 rounded-full w-fit backdrop-blur-sm text-sm hover:opacity-80 theme-text-secondary"
              >
                <ChevronRight className="rotate-180 mr-1" size={14} /> 返回
              </button>

              <header className="mb-8 pb-8 border-b theme-border-subtle">
                <div className="flex gap-2 mb-4">
                  <Badge variant="category" className="theme-text-accent3">
                    {selectedPost.category}
                  </Badge>
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
                onNavigate={onWikiLinkNavigate}
                basePath={selectedPost.path}
                loadedPosts={posts}
              />
            </Card>
          ) : (
            <div className="grid gap-6">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  variant="interactive"
                  onClick={() => onSelectPost(post)}
                  className="cursor-pointer hover:shadow-[0_0_25px_rgba(222,185,154,0.15)]"
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
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Container>
  );
};

export default BlogPage;
