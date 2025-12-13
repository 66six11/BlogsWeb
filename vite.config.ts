import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  // 加载环境变量 (确保 .env.local 存在且包含密钥)
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
      // 代理配置：这是保护密钥的关键

      proxy: {
        "/api/github/user": {
          target: "https://api.github.com",
          changeOrigin: true,
          rewrite: (path) => {
            const url = new URL("http://localhost" + path);
            const username = url.searchParams.get("username");
            return `/users/${encodeURIComponent(username)}`;
          },
          // 在这里注入GitHub Token
          configure: (proxy, options) => {
            proxy.on("proxyReq", (proxyReq, req, res) => {
              if (env.GITHUB_TOKEN) {
                proxyReq.setHeader(
                  "Authorization",
                  `Bearer ${env.GITHUB_TOKEN}`
                );
              }
              // GitHub API需要的headers
              proxyReq.setHeader("Accept", "application/vnd.github+json");
              proxyReq.setHeader("User-Agent", "BlogsWeb-API");
            });
          },
        },
        "/api/github/repo": {
          target: "https://api.github.com",
          changeOrigin: true,
          rewrite: (path) => {
            const url = new URL("http://localhost" + path);
            const owner = url.searchParams.get("owner");
            const repo = url.searchParams.get("repo");
            return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
          },
          configure: (proxy, options) => {
            proxy.on("proxyReq", (proxyReq, req, res) => {
              if (env.GITHUB_TOKEN) {
                proxyReq.setHeader(
                  "Authorization",
                  `Bearer ${env.GITHUB_TOKEN}`
                );
              }
              proxyReq.setHeader("Accept", "application/vnd.github+json");
              proxyReq.setHeader("User-Agent", "BlogsWeb-API");
            });
          },
        },
        "/api/github/tree": {
          target: "https://api.github.com",
          changeOrigin: true,
          rewrite: (path) => {
            const url = new URL("http://localhost" + path);
            const owner = url.searchParams.get("owner");
            const repo = url.searchParams.get("repo");
            const branch = url.searchParams.get("branch");
            return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
          },
          configure: (proxy, options) => {
            proxy.on("proxyReq", (proxyReq, req, res) => {
              if (env.GITHUB_TOKEN) {
                proxyReq.setHeader(
                  "Authorization",
                  `Bearer ${env.GITHUB_TOKEN}`
                );
              }
              proxyReq.setHeader("Accept", "application/vnd.github+json");
              proxyReq.setHeader("User-Agent", "BlogsWeb-API");
            });
          },
        },
        "/api/github/commits": {
          target: "https://api.github.com",
          changeOrigin: true,
          rewrite: (path) => {
            const url = new URL("http://localhost" + path);
            const owner = url.searchParams.get("owner");
            const repo = url.searchParams.get("repo");
            const filePath = url.searchParams.get("path");
            return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?path=${encodeURIComponent(filePath)}&per_page=1`;
          },
          configure: (proxy, options) => {
            proxy.on("proxyReq", (proxyReq, req, res) => {
              if (env.GITHUB_TOKEN) {
                proxyReq.setHeader(
                  "Authorization",
                  `Bearer ${env.GITHUB_TOKEN}`
                );
              }
              proxyReq.setHeader("Accept", "application/vnd.github+json");
              proxyReq.setHeader("User-Agent", "BlogsWeb-API");
            });
          },
        },
        // 处理GitHub原始文件请求，用于图片和其他资源
        // 处理GitHub原始文件请求，用于图片和其他资源
        "/api/github/raw": {
          target: "https://raw.githubusercontent.com",
          changeOrigin: true,
          // 使用new URL构造函数处理路径，与其他代理配置保持一致
          rewrite: (path) => {
            // 使用完整URL解析，确保所有参数都被正确处理
            const url = new URL("http://localhost" + path);
            const owner = url.searchParams.get("owner") || "";
            const repo = url.searchParams.get("repo") || "";
            const filePath = url.searchParams.get("path") || "";

            // 构建目标路径，对所有参数进行URL编码
            return `/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/main/${encodeURIComponent(filePath)}`;
          },
          // 增加超时设置
          timeout: 60000,
          configure: (proxy, options) => {
            proxy.on("proxyReq", (proxyReq, req, res) => {
              if (env.GITHUB_TOKEN) {
                proxyReq.setHeader(
                  "Authorization",
                  `Bearer ${env.GITHUB_TOKEN}`
                );
              }
              proxyReq.setHeader("User-Agent", "BlogsWeb-API");
              proxyReq.setHeader("Accept", "*/*");
            });

            // 增加错误处理
            proxy.on("error", (err, req, res) => {
              console.error("GitHub raw proxy error:", err);
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({ error: "Failed to fetch content from GitHub" })
              );
            });
          },
        },
        // Gemini API 代理配置
        "/api/gemini": {
          target: "http://localhost:3000",
          changeOrigin: true,
          // 对于本地开发，我们需要一个后端服务器来处理Gemini请求
          // 这里我们配置Vite将请求转发到同一个端口的API路由
          // 实际部署时，Vercel会处理这些路由
          configure: (proxy, options) => {
            // 在本地开发时，我们需要启动一个后端服务器
            // 或者使用Vercel dev模式
            proxy.on("error", (err, req, res) => {
              console.error("Gemini API proxy error:", err);
            });
          },
        },
      },
    },
    plugins: [react(), tailwindcss()],
    // ✅ 只在 define 中放公开变量 (如有必要)
    // 如果没有公开变量，整个 define 块都可以删除
    define: {
      // 例如：应用版本号是安全的
      __APP_VERSION__: JSON.stringify("v1.0.0"),
      // ❌ 绝对不要在这里放 API KEY
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
