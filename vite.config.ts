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
            // 代理配置：这是保护密钥的关键
            proxy: {
                '/api': {
                    // 假设您的后端服务或 Vercel Function 运行在另一个端口 (例如 3001)
                    // 注意：Vite 自己占用了 3000，目标不能也是 3000，否则会冲突
                    target: 'http://localhost:3001',
                    changeOrigin: true,
                    // 如果后端不需要 /api 前缀，可以在这里重写
                    // rewrite: (path) => path.replace(/^\/api/, ''),

                    // 🔥 关键点：在这里注入密钥
                    // 这样密钥只存在于 Node.js 内存中，从未发送给浏览器
                    configure: (proxy, options) => {
                        proxy.on('proxyReq', (proxyReq, req, res) => {
                            // 针对 Gemini API 或 GitHub API 添加特定的 Header
                            // 这里的逻辑取决于您的后端 API 需要怎么接收密钥

                            // 示例 1: 如果是直接透传给后端，通过 Header 传递
                            if (env.GEMINI_API_KEY) {
                                proxyReq.setHeader('x-gemini-api-key', env.GEMINI_API_KEY);
                            }
                            if (env.GITHUB_TOKEN) {
                                proxyReq.setHeader('Authorization', `Bearer ${env.GITHUB_TOKEN}`);
                            }
                        });
                    },
                },
                '/api/gemini': {
                    target: 'https://generativelanguage.googleapis.com',
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api\/gemini/, '/v1beta/models/gemini-2.5-flash:generateContent'),
                    configure: (proxy, options) => {
                        proxy.on('proxyReq', (proxyReq, req, res) => {
                            if (env.GEMINI_API_KEY) {
                                // 通过查询参数添加API密钥，这是Gemini API的标准方式
                                const keyParam = `?key=${env.GEMINI_API_KEY}`;
                                proxyReq.path = proxyReq.path + keyParam;
                            }
                            proxyReq.setHeader('Content-Type', 'application/json');
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