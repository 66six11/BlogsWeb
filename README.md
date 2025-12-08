<div align="center">
# 🌟 BlogsWeb - MagicDev Portfolio

<p align="center">
  <em>一个充满魔法的个人博客与作品展示网站 / A magical personal blog and portfolio website</em>
</p>

[![React](https://img.shields.io/badge/React-19.2.0-61dafb?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646cff?style=flat&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.17-06b6d4?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat&logo=vercel)](https://vercel.com)

[English](#english) | [中文](#中文)

</div>

---

## 中文

### 📖 项目简介

BlogsWeb (MagicDev) 是一个深受《魔女之旅》动漫启发的个人博客与作品集网站。它融合了现代 Web 技术与魔法主题的视觉设计，提供了沉浸式的浏览体验。

### ✨ 功能特性

- 📝 **博客文章展示** - 支持 Markdown 渲染，包括数学公式（KaTeX）、代码高亮和自定义提示框
- 🎵 **魔法音乐播放器** - 支持 ABC 记谱法解析和播放
- 🎹 **钢琴编辑器** - 交互式音乐创作工具，支持实时播放和导出
- 💬 **AI 聊天功能** - 基于 Google Gemini API 的智能对话助手
- 🌐 **3D 场景渲染** - 使用 Three.js 实现的粒子动画系统
- 🌙 **深色/浅色主题** - 优雅的主题切换，带平滑过渡动画
- ✨ **文字粒子动画** - 动态文字形成与分散特效
- 📱 **响应式设计** - 完美适配桌面端和移动端

### 🛠️ 技术栈

#### 前端框架
- **React 19.2.0** - 最新版本的 React，支持并发渲染
- **TypeScript 5.8.2** - 类型安全的 JavaScript 超集
- **Vite 6.2.0** - 下一代前端构建工具

#### UI & 样式
- **Tailwind CSS 4.1.17** - 实用优先的 CSS 框架
- **Lucide React** - 精美的图标库

#### 3D & 动画
- **Three.js 0.160.0** - WebGL 3D 库
- **Tone.js 14.7.77** - Web Audio 框架

#### 其他技术
- **abcjs** - ABC 音乐记谱法解析器
- **Google Gemini API** - AI 聊天功能
- **Vercel** - 部署平台

### 📁 项目结构

```
BlogsWeb/
├── src/
│   ├── components/           # React 组件
│   │   ├── common/           # 通用组件
│   │   │   ├── ThemeToggle.tsx
│   │   │   ├── LoadingScreen.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── layout/           # 布局组件
│   │   │   ├── Navigation.tsx
│   │   │   └── Footer.tsx
│   │   ├── features/         # 功能组件
│   │   │   ├── music/        # 音乐相关
│   │   │   │   ├── MusicPlayer.tsx
│   │   │   │   ├── PianoEditor.tsx
│   │   │   │   └── ScoreParser.ts
│   │   │   ├── chat/         # AI 聊天
│   │   │   │   └── MagicChat.tsx
│   │   │   ├── 3d/           # 3D 渲染
│   │   │   │   ├── Scene3D.tsx
│   │   │   │   └── TextParticleSystem.tsx
│   │   │   └── content/      # 内容展示
│   │   │       ├── MarkdownRenderer.tsx
│   │   │       ├── WaveText.tsx
│   │   │       └── FileTreeNode.tsx
│   │   └── icons/            # 图标组件
│   │       ├── CustomIcons.tsx
│   │       └── LayeredCharacterIcon.tsx
│   ├── pages/                # 页面组件
│   │   ├── AboutPage.tsx
│   │   ├── BlogPage.tsx
│   │   └── ProjectsPage.tsx
│   ├── services/             # API 服务
│   │   ├── githubService.ts
│   │   └── geminiService.ts
│   ├── types/                # TypeScript 类型定义
│   │   └── index.ts
│   ├── config/               # 配置文件
│   │   └── index.ts
│   ├── constants/            # 常量定义
│   │   └── index.ts
│   ├── styles/               # 样式文件
│   │   └── index.css
│   ├── App.tsx               # 主应用组件
│   └── main.tsx              # 应用入口
├── api/                      # Vercel Serverless Functions
│   ├── gemini/
│   └── github/
├── public/                   # 静态资源
│   ├── music/                # 音乐文件
│   ├── scores/               # 乐谱文件
│   └── [媒体文件]
├── index.html                # HTML 模板
├── vite.config.ts            # Vite 配置
├── tsconfig.json             # TypeScript 配置
├── tailwind.config.js        # Tailwind 配置
└── vercel.json               # Vercel 配置
```

### 🚀 快速开始

#### 环境要求

- **Node.js** >= 18.0.0
- **npm** 或 **pnpm**

#### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/66six11/BlogsWeb.git
   cd BlogsWeb
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   
   创建 `.env.local` 文件并添加以下内容：
   ```env
   # Google Gemini API Key (用于 AI 聊天功能)
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   
   # GitHub Token (可选，用于提高 API 速率限制)
   GITHUB_TOKEN=your_github_token_here
   ```

4. **运行开发服务器**
   ```bash
   npm run dev
   ```
   
   应用将在 `http://localhost:3000` 启动

5. **构建生产版本**
   ```bash
   npm run build
   ```

6. **预览生产构建**
   ```bash
   npm run preview
   ```

### 🌐 部署到 Vercel

#### 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/66six11/BlogsWeb)

#### 手动部署

1. 在 [Vercel](https://vercel.com) 创建新项目
2. 连接你的 GitHub 仓库
3. 配置环境变量（`VITE_GEMINI_API_KEY`、`GITHUB_TOKEN`）
4. 点击部署

Vercel 会自动检测 Vite 项目并使用正确的构建设置。

### 🎨 自定义配置

#### 修改网站信息

编辑 `src/config/index.ts`:

```typescript
export const SITE_CONFIG = {
  title: "你的网站标题",
  authorName: "你的名字",
  authorBio: "你的简介",
  skills: "你的技能",
};

export const GITHUB_CONFIG = {
  username: "你的GitHub用户名",
  repo: "博客内容仓库",
  blogPath: "",
};
```

#### 修改主题颜色

编辑 `src/config/index.ts` 中的 `THEME_CONFIG`:

```typescript
export const THEME_CONFIG = {
  light: {
    primary: '#F7F8F3',
    // ...
  },
  dark: {
    primary: '#897b8c',
    // ...
  },
};
```

### 📝 博客内容管理

博客内容通过 GitHub 仓库管理。在 `src/config/index.ts` 中配置：

```typescript
// 只显示这些文件夹中的内容
export const BLOG_INCLUDED_FOLDERS: string[] = [
  "计算机图形学学习", 
  "unity引擎", 
  "代码设计"
];

// 排除这些路径
export const EXCLUDED_PATHS: string[] = [
  '.obsidian',
  '.git',
  'attachments'
];

// 排除特定文件
export const EXCLUDED_FILES: string[] = [
  '@ref.md',
  'Obsidian语法.md'
];
```

### 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

### 🙏 致谢

- 灵感来源：动漫《魔女之旅》
- 图标：[Lucide Icons](https://lucide.dev/)
- 字体：Google Fonts

---

## English

### 📖 Project Overview

BlogsWeb (MagicDev) is a personal blog and portfolio website inspired by the anime "Wandering Witch: The Journey of Elaina." It combines modern web technologies with a magical-themed visual design to provide an immersive browsing experience.

### ✨ Features

- 📝 **Blog Post Display** - Markdown rendering with KaTeX math, code highlighting, and custom callouts
- 🎵 **Magic Music Player** - ABC notation parser and playback
- 🎹 **Piano Editor** - Interactive music composition tool with real-time playback and export
- 💬 **AI Chat** - Intelligent conversational assistant powered by Google Gemini API
- 🌐 **3D Scene Rendering** - Particle animation system built with Three.js
- 🌙 **Dark/Light Theme** - Elegant theme switching with smooth transitions
- ✨ **Text Particle Animation** - Dynamic text formation and dispersion effects
- 📱 **Responsive Design** - Perfect adaptation for desktop and mobile devices

### 🛠️ Tech Stack

#### Frontend Framework
- **React 19.2.0** - Latest React with concurrent rendering
- **TypeScript 5.8.2** - Type-safe JavaScript superset
- **Vite 6.2.0** - Next-generation frontend build tool

#### UI & Styling
- **Tailwind CSS 4.1.17** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library

#### 3D & Animation
- **Three.js 0.160.0** - WebGL 3D library
- **Tone.js 14.7.77** - Web Audio framework

#### Other Technologies
- **abcjs** - ABC music notation parser
- **Google Gemini API** - AI chat functionality
- **Vercel** - Deployment platform

### 📁 Project Structure

```
BlogsWeb/
├── src/
│   ├── components/           # React components
│   │   ├── common/           # Common components
│   │   │   ├── ThemeToggle.tsx
│   │   │   ├── LoadingScreen.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── layout/           # Layout components
│   │   │   ├── Navigation.tsx
│   │   │   └── Footer.tsx
│   │   ├── features/         # Feature components
│   │   │   ├── music/        # Music-related
│   │   │   │   ├── MusicPlayer.tsx
│   │   │   │   ├── PianoEditor.tsx
│   │   │   │   └── ScoreParser.ts
│   │   │   ├── chat/         # AI Chat
│   │   │   │   └── MagicChat.tsx
│   │   │   ├── 3d/           # 3D rendering
│   │   │   │   ├── Scene3D.tsx
│   │   │   │   └── TextParticleSystem.tsx
│   │   │   └── content/      # Content display
│   │   │       ├── MarkdownRenderer.tsx
│   │   │       ├── WaveText.tsx
│   │   │       └── FileTreeNode.tsx
│   │   └── icons/            # Icon components
│   │       ├── CustomIcons.tsx
│   │       └── LayeredCharacterIcon.tsx
│   ├── pages/                # Page components
│   │   ├── AboutPage.tsx
│   │   ├── BlogPage.tsx
│   │   └── ProjectsPage.tsx
│   ├── services/             # API services
│   │   ├── githubService.ts
│   │   └── geminiService.ts
│   ├── types/                # TypeScript type definitions
│   │   └── index.ts
│   ├── config/               # Configuration files
│   │   └── index.ts
│   ├── constants/            # Constants
│   │   └── index.ts
│   ├── styles/               # Style files
│   │   └── index.css
│   ├── App.tsx               # Main app component
│   └── main.tsx              # Application entry point
├── api/                      # Vercel Serverless Functions
│   ├── gemini/
│   └── github/
├── public/                   # Static assets
│   ├── music/                # Music files
│   ├── scores/               # Score files
│   └── [media files]
├── index.html                # HTML template
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.js        # Tailwind configuration
└── vercel.json               # Vercel configuration
```

### 🚀 Quick Start

#### Prerequisites

- **Node.js** >= 18.0.0
- **npm** or **pnpm**

#### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/66six11/BlogsWeb.git
   cd BlogsWeb
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file and add:
   ```env
   # Google Gemini API Key (for AI chat feature)
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   
   # GitHub Token (optional, for higher API rate limits)
   GITHUB_TOKEN=your_github_token_here
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```
   
   The app will start at `http://localhost:3000`

5. **Build for production**
   ```bash
   npm run build
   ```

6. **Preview production build**
   ```bash
   npm run preview
   ```

### 🌐 Deploy to Vercel

#### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/66six11/BlogsWeb)

#### Manual Deployment

1. Create a new project on [Vercel](https://vercel.com)
2. Connect your GitHub repository
3. Configure environment variables (`VITE_GEMINI_API_KEY`, `GITHUB_TOKEN`)
4. Click Deploy

Vercel will automatically detect the Vite project and use the correct build settings.

### 🎨 Customization

#### Modify Site Information

Edit `src/config/index.ts`:

```typescript
export const SITE_CONFIG = {
  title: "Your Site Title",
  authorName: "Your Name",
  authorBio: "Your Bio",
  skills: "Your Skills",
};

export const GITHUB_CONFIG = {
  username: "YourGitHubUsername",
  repo: "BlogContentRepo",
  blogPath: "",
};
```

#### Modify Theme Colors

Edit `THEME_CONFIG` in `src/config/index.ts`:

```typescript
export const THEME_CONFIG = {
  light: {
    primary: '#F7F8F3',
    // ...
  },
  dark: {
    primary: '#897b8c',
    // ...
  },
};
```

### 📝 Blog Content Management

Blog content is managed through a GitHub repository. Configure in `src/config/index.ts`:

```typescript
// Only show content from these folders
export const BLOG_INCLUDED_FOLDERS: string[] = [
  "Computer Graphics", 
  "Unity Engine", 
  "Code Design"
];

// Exclude these paths
export const EXCLUDED_PATHS: string[] = [
  '.obsidian',
  '.git',
  'attachments'
];

// Exclude specific files
export const EXCLUDED_FILES: string[] = [
  '@ref.md',
  'ObsidianSyntax.md'
];
```

### 📄 License

MIT License - See [LICENSE](LICENSE) file for details

### 🙏 Acknowledgments

- Inspired by: Anime "Wandering Witch: The Journey of Elaina"
- Icons: [Lucide Icons](https://lucide.dev/)
- Fonts: Google Fonts

---

<div align="center">
  Made with ✨ magic and 💙 love
</div>
