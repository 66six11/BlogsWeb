import React from 'react';
import { Book, FileText, Calendar, User, ChevronRight } from 'lucide-react';
import { BlogPost } from '../types';

interface BlogPageProps {
    posts: BlogPost[];
    onSelectPost: (post: BlogPost) => void;
    isLoading: boolean;
}

const BlogPage: React.FC<BlogPageProps> = ({ posts, onSelectPost, isLoading }) => {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen theme-bg-primary">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen theme-bg-primary py-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold theme-text-primary mb-4 flex items-center justify-center gap-3">
                        <Book className="text-amber-400" />
                        技术博客
                    </h1>
                    <p className="text-lg theme-text-secondary max-w-2xl mx-auto">
                        探索技术深度，分享开发心得，记录成长历程
                    </p>
                </div>

                {/* Blog Posts Grid */}
                {posts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map((post, index) => (
                            <article
                                key={post.slug}
                                className="theme-card-primary rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group"
                                onClick={() => onSelectPost(post)}
                            >
                                {/* Cover Image */}
                                {post.cover_image && (
                                    <div className="h-48 overflow-hidden">
                                        <img
                                            src={post.cover_image}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>
                                )}

                                {/* Content */}
                                <div className="p-6">
                                    {/* Tags */}
                                    {post.tags && post.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {post.tags.slice(0, 3).map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="category-badge px-2 py-1 rounded-full text-xs theme-text-accent2"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Title */}
                                    <h2 className="text-xl font-bold theme-text-primary mb-3 line-clamp-2 group-hover:theme-text-accent1 transition-colors">
                                        {post.title}
                                    </h2>

                                    {/* Excerpt */}
                                    <p className="theme-text-secondary mb-4 line-clamp-3 leading-relaxed">
                                        {post.excerpt}
                                    </p>

                                    {/* Meta Info */}
                                    <div className="flex items-center justify-between text-sm theme-text-secondary">
                                        <div className="flex items-center gap-3">
                                            {post.author && (
                                                <span className="flex items-center gap-1">
                                                    <User size={14} />
                                                    {post.author}
                                                </span>
                                            )}
                                            {post.published_at && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    {new Date(post.published_at).toLocaleDateString('zh-CN')}
                                                </span>
                                            )}
                                        </div>
                                        <ChevronRight
                                            size={16}
                                            className="group-hover:translate-x-1 transition-transform"
                                        />
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <FileText className="mx-auto mb-4 text-6xl theme-text-secondary opacity-50" />
                        <h3 className="text-xl font-semibold theme-text-secondary mb-2">
                            暂无文章
                        </h3>
                        <p className="theme-text-secondary">
                            还没有发布任何文章，请稍后再来查看
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogPage;