# API 接口文档

## 1. 概述

本文档详细说明 The Wandering Dev 项目中使用的 API 接口，包括内部 API 路由和外部 API 集成。

## 2. 内部 API 路由

### 2.1 Google Gemini API 集成

#### 2.1.1 聊天接口

- **端点**: `POST /api/gemini/chat`
- **方法**: POST
- **功能**: 与 Google Gemini API 进行聊天交互
- **请求体**:
  ```json
  {
    "message": "你好，我有一个问题...",
    "model": "gemini-1.5-flash" // 可选，默认值: gemini-1.5-flash
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "response": "你好！我是你的魔法助手，有什么可以帮助你的吗？",
    "model": "gemini-1.5-flash"
  }
  ```
- **错误响应**:
  ```json
  {
    "success": false,
    "error": "API 密钥无效或请求失败",
    "code": 500
  }
  ```

### 2.2 GitHub API 集成

#### 2.2.1 获取仓库信息

- **端点**: `GET /api/github/repo`
- **方法**: GET
- **功能**: 获取指定 GitHub 仓库的信息
- **查询参数**:
  - `owner`: 仓库所有者（必填）
  - `repo`: 仓库名称（必填）
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "name": "BlogsWeb",
      "description": "The Wandering Dev 个人博客和作品集网站",
      "stargazers_count": 10,
      "forks_count": 2,
      "html_url": "https://github.com/username/BlogsWeb"
    }
  }
  ```

#### 2.2.2 获取提交记录

- **端点**: `GET /api/github/commits`
- **方法**: GET
- **功能**: 获取指定 GitHub 仓库的提交记录
- **查询参数**:
  - `owner`: 仓库所有者（必填）
  - `repo`: 仓库名称（必填）
  - `path`: 文件路径（可选，默认: 整个仓库）
  - `per_page`: 每页数量（可选，默认: 10）
  - `page`: 页码（可选，默认: 1）
- **响应**:
  ```json
  {
    "success": true,
    "data": [
      {
        "sha": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
        "commit": {
          "message": "Add API documentation",
          "author": {
            "name": "Your Name",
            "email": "your.email@example.com",
            "date": "2025-12-13T10:00:00Z"
          }
        },
        "html_url": "https://github.com/username/BlogsWeb/commit/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
      }
    ]
  }
  ```

#### 2.2.3 获取文件内容

- **端点**: `GET /api/github/raw`
- **方法**: GET
- **功能**: 获取 GitHub 仓库中指定文件的原始内容
- **查询参数**:
  - `owner`: 仓库所有者（必填）
  - `repo`: 仓库名称（必填）
  - `path`: 文件路径（必填）
  - `ref`: 分支或标签名称（可选，默认: main）
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "content": "# 项目指南\n\n## 1. 项目概述...",
      "encoding": "base64",
      "sha": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0"
    }
  }
  ```

#### 2.2.4 获取仓库目录结构

- **端点**: `GET /api/github/tree`
- **方法**: GET
- **功能**: 获取 GitHub 仓库的目录结构
- **查询参数**:
  - `owner`: 仓库所有者（必填）
  - `repo`: 仓库名称（必填）
  - `path`: 目录路径（可选，默认: /）
  - `ref`: 分支或标签名称（可选，默认: main）
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "sha": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
      "tree": [
        {
          "path": "src",
          "mode": "040000",
          "type": "tree",
          "sha": "b1c2d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0",
          "url": "https://api.github.com/repos/username/BlogsWeb/git/trees/b1c2d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0"
        },
        {
          "path": "package.json",
          "mode": "100644",
          "type": "blob",
          "sha": "c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0",
          "size": 1234,
          "url": "https://api.github.com/repos/username/BlogsWeb/git/blobs/c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0"
        }
      ]
    }
  }
  ```

#### 2.2.5 获取用户信息

- **端点**: `GET /api/github/user`
- **方法**: GET
- **功能**: 获取 GitHub 用户信息
- **查询参数**:
  - `username`: GitHub 用户名（可选，默认: 从访问令牌获取）
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "login": "username",
      "name": "Your Name",
      "avatar_url": "https://avatars.githubusercontent.com/u/12345678?v=4",
      "bio": "The Wandering Dev",
      "public_repos": 10,
      "followers": 50,
      "following": 20
    }
  }
  ```

## 3. 外部 API 集成

### 3.1 Google Gemini API

#### 3.1.1 概述

Google Gemini API 是一个强大的 AI 语言模型 API，用于生成文本、回答问题和进行对话。项目中使用该 API 实现了魔法主题的 AI 聊天功能。

#### 3.1.2 认证方式

- 使用 API 密钥进行认证
- 环境变量: `VITE_GEMINI_API_KEY`
- 认证方式: 在请求头中添加 `Authorization: Bearer ${API_KEY}`

#### 3.1.3 支持的模型

- `gemini-1.5-flash`: 快速、经济的模型，适合大多数应用
- `gemini-1.5-pro`: 更强大的模型，适合复杂任务

#### 3.1.4 集成代码示例

```typescript
import { GoogleGenerativeAI } from '@google/genai';

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || '');

const generateResponse = async (message: string, model = 'gemini-1.5-flash') => {
  const geminiModel = genAI.getGenerativeModel({ model });
  
  try {
    const result = await geminiModel.generateContent(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
};
```

### 3.2 GitHub API

#### 3.2.1 概述

GitHub API 用于获取 GitHub 仓库信息、提交记录、文件内容和目录结构。项目中使用该 API 实现了博客系统和作品集展示功能。

#### 3.2.2 认证方式

- 使用个人访问令牌 (PAT) 进行认证
- 环境变量: `VITE_GITHUB_TOKEN`
- 认证方式: 在请求头中添加 `Authorization: Bearer ${TOKEN}`

#### 3.2.3 集成代码示例

```typescript
const fetchGitHubData = async (endpoint: string, params?: Record<string, string>) => {
  const token = process.env.VITE_GITHUB_TOKEN;
  const url = new URL(`https://api.github.com/${endpoint}`);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url.toString(), {
    headers,
    method: 'GET'
  });
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};
```

## 4. API 服务层

### 4.1 geminiService.ts

#### 4.1.1 功能

处理与 Google Gemini API 的交互，包括聊天功能和文本生成。

#### 4.1.2 主要方法

| 方法名 | 功能 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `generateChatResponse` | 生成聊天响应 | `message: string, model?: string` | `Promise<string>` |
| `generateText` | 生成文本内容 | `prompt: string, model?: string` | `Promise<string>` |
| `isGeminiConfigured` | 检查 Gemini API 是否配置 | 无 | `boolean` |

### 4.2 githubService.ts

#### 4.2.1 功能

处理与 GitHub API 的交互，包括获取仓库信息、提交记录、文件内容和目录结构。

#### 4.2.2 主要方法

| 方法名 | 功能 | 参数 | 返回值 |
| --- | --- | --- | --- |
| `fetchUserProfile` | 获取用户配置文件 | 无 | `Promise<any | null>` |
| `fetchRepoInfo` | 获取仓库信息 | `owner: string, repo: string` | `Promise<any>` |
| `fetchCommits` | 获取提交记录 | `owner: string, repo: string, path?: string` | `Promise<any[]>` |
| `fetchFileContent` | 获取文件内容 | `owner: string, repo: string, path: string` | `Promise<string>` |
| `fetchRepoTree` | 获取仓库目录结构 | `owner: string, repo: string, path?: string` | `Promise<any>` |
| `fetchBlogIndex` | 获取博客索引 | `useMockData?: boolean` | `Promise<any>` |
| `fetchPostContent` | 获取博客文章内容 | `path: string, useMockData?: boolean` | `Promise<BlogPost | null>` |
| `clearBlogCache` | 清除博客缓存 | 无 | `void` |

## 5. API 错误处理

### 5.1 错误类型

| 错误类型 | 状态码 | 描述 |
| --- | --- | --- |
| Bad Request | 400 | 请求参数无效 |
| Unauthorized | 401 | 认证失败或 API 密钥无效 |
| Forbidden | 403 | 权限不足 |
| Not Found | 404 | 请求的资源不存在 |
| Too Many Requests | 429 | API 请求频率限制 |
| Internal Server Error | 500 | 服务器内部错误 |
| Service Unavailable | 503 | 外部 API 服务不可用 |

### 5.2 错误处理策略

1. **客户端错误**:
   - 验证请求参数
   - 返回清晰的错误信息
   - 提供错误代码和描述

2. **服务器错误**:
   - 捕获并记录详细错误日志
   - 返回友好的错误信息给客户端
   - 实现重试机制（针对临时错误）

3. **外部 API 错误**:
   - 处理外部 API 返回的错误
   - 实现适当的重试逻辑
   - 提供备用方案（如使用模拟数据）

## 6. API 性能优化

### 6.1 缓存策略

- 实现客户端缓存：使用 `localStorage` 或 `sessionStorage` 缓存频繁访问的数据
- 实现服务器端缓存：使用 Redis 或其他缓存系统缓存 API 响应
- 设置适当的缓存过期时间

### 6.2 限流策略

- 实现客户端限流：限制对外部 API 的请求频率
- 处理外部 API 的限流响应：实现指数退避重试机制
- 监控 API 使用情况：记录请求次数和响应时间

### 6.3 优化建议

1. **批量请求**：将多个 API 请求合并为一个批量请求
2. **按需加载**：只请求当前需要的数据
3. **分页请求**：对大量数据使用分页加载
4. **压缩响应**：启用 gzip 压缩以减少传输数据大小
5. **CDN 加速**：使用 CDN 缓存静态资源

## 7. API 安全

### 7.1 最佳实践

1. **保护 API 密钥**：
   - 不要在客户端代码中暴露 API 密钥
   - 使用环境变量存储 API 密钥
   - 限制 API 密钥的权限范围

2. **验证请求**：
   - 验证请求参数的有效性
   - 验证请求来源
   - 防止 SQL 注入和 XSS 攻击

3. **保护响应**：
   - 不要在响应中包含敏感信息
   - 使用 HTTPS 加密传输
   - 设置适当的 CORS 头

4. **监控和日志**：
   - 记录 API 请求和响应
   - 监控 API 使用情况和性能
   - 检测和防止异常请求

## 8. 开发和测试

### 8.1 开发环境

- 使用 Vite 开发服务器
- 环境变量配置：`.env.local` 文件
- API 模拟：在开发模式下可使用模拟数据

### 8.2 测试

- **单元测试**：测试 API 服务层的核心功能
- **集成测试**：测试 API 路由和外部 API 集成
- **E2E 测试**：测试完整的 API 调用流程

### 8.3 调试工具

- 使用 Postman 或 Insomnia 测试 API 端点
- 使用 Chrome DevTools 监控网络请求
- 使用日志记录 API 请求和响应

---

**最后更新**: 2025-12-13
**版本**: 1.0.0