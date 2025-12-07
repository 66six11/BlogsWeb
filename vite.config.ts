import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    // 加载环境变量 (确保 .env.local 存在且包含密钥)
    const env = loadEnv(mode, process.cwd(), '');

    return {
        server: {
            port: 3000,
            host: '0.0.0.0',
            // 代理配置：直接代理到GitHub API
            proxy: {
                '/api/github/user': {
                    target: 'https://api.github.com',
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api\/github\/user\?username=/, '/users/'),
                    // 在这里注入GitHub Token
                    configure: (proxy, options) => {
                        proxy.on('proxyReq', (proxyReq, req, res) => {
                            if (env.GITHUB_TOKEN) {
                                proxyReq.setHeader('Authorization', `Bearer ${env.GITHUB_TOKEN}`);
                            }
                            // GitHub API需要的headers
                            proxyReq.setHeader('Accept', 'application/vnd.github+json');
                            proxyReq.setHeader('User-Agent', 'BlogsWeb-API');
                        });
                    },
                },
                '/api/github/repo': {
                    target: 'https://api.github.com',
                    changeOrigin: true,
                    rewrite: (path) => {
                        const url = new URL('http://localhost' + path);
                        const owner = url.searchParams.get('owner');
                        const repo = url.searchParams.get('repo');
                        return `/repos/${owner}/${repo}`;
                    },
                    configure: (proxy, options) => {
                        proxy.on('proxyReq', (proxyReq, req, res) => {
                            if (env.GITHUB_TOKEN) {
                                proxyReq.setHeader('Authorization', `Bearer ${env.GITHUB_TOKEN}`);
                            }
                            proxyReq.setHeader('Accept', 'application/vnd.github+json');
                            proxyReq.setHeader('User-Agent', 'BlogsWeb-API');
                        });
                    },
                },
                '/api/github/tree': {
                    target: 'https://api.github.com',
                    changeOrigin: true,
                    rewrite: (path) => {
                        const url = new URL('http://localhost' + path);
                        const owner = url.searchParams.get('owner');
                        const repo = url.searchParams.get('repo');
                        const branch = url.searchParams.get('branch');
                        return `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
                    },
                    configure: (proxy, options) => {
                        proxy.on('proxyReq', (proxyReq, req, res) => {
                            if (env.GITHUB_TOKEN) {
                                proxyReq.setHeader('Authorization', `Bearer ${env.GITHUB_TOKEN}`);
                            }
                            proxyReq.setHeader('Accept', 'application/vnd.github+json');
                            proxyReq.setHeader('User-Agent', 'BlogsWeb-API');
                        });
                    },
                },
                '/api/github/commits': {
                    target: 'https://api.github.com',
                    changeOrigin: true,
                    rewrite: (path) => {
                        const url = new URL('http://localhost' + path);
                        const owner = url.searchParams.get('owner');
                        const repo = url.searchParams.get('repo');
                        const filePath = url.searchParams.get('path');
                        return `/repos/${owner}/${repo}/commits?path=${filePath}&per_page=1`;
                    },
                    configure: (proxy, options) => {
                        proxy.on('proxyReq', (proxyReq, req, res) => {
                            if (env.GITHUB_TOKEN) {
                                proxyReq.setHeader('Authorization', `Bearer ${env.GITHUB_TOKEN}`);
                            }
                            proxyReq.setHeader('Accept', 'application/vnd.github+json');
                            proxyReq.setHeader('User-Agent', 'BlogsWeb-API');
                        });
                    },
                }
            }
        },
        plugins: [react(), tailwindcss()],
        // ✅ 只在 define 中放公开变量 (如有必要)
        // 如果没有公开变量，整个 define 块都可以删除
        define: {
            // 例如：应用版本号是安全的
            '__APP_VERSION__': JSON.stringify('v1.0.0'),
            // ❌ 绝对不要在这里放 API KEY
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        }
    };
});