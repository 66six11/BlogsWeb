import { Project } from './types';

// =================================================================================
// USER CONFIGURATION
// =================================================================================
// This file contains all user-configurable parameters for the site.
// =================================================================================

// =================================================================================
// SITE CONFIGURATION
// =================================================================================

export const SITE_CONFIG = {
  // Site title displayed in the header
  title: "魔法Dev",
  // Author name
  authorName: "66six11",
  // Author bio (fallback if GitHub profile bio is not available)
  authorBio: "\"一位用代码和色彩编织新世界的旅行者。\"",
  // Skills displayed on home page
  skills: "Unity • Graphic • C++ • Art",
};

// =================================================================================
// GITHUB CONFIGURATION
// =================================================================================

export const GITHUB_CONFIG = {
  // GitHub username for fetching user profile and blog content
  username: "66six11",
  // Repository name for blog content
  repo: "MyNotes",
  // Path inside the repo to look for blog posts (empty for root)
  blogPath: "",
};

// =================================================================================
// BLOG CONFIGURATION
// Configure which files and folders are displayed in the Blog (Grimoire) section.
// =================================================================================

// 1. INCLUDED FOLDERS
// Only files within these root folders will be scanned. 
// Leave empty [] to include ALL folders in the repository (except those excluded below).
export const BLOG_INCLUDED_FOLDERS: string[] = [
  "计算机图形学学习", 
  "unity引擎", 
  "代码设计", 
  "Model"
];

// 2. EXCLUDED FOLDERS
// These directories (and their contents) will be completely ignored, 
// even if they are inside an Included Folder.
// Useful for hiding system folders, templates, or drafts.
export const EXCLUDED_PATHS: string[] = [
  '.obsidian',
  '.idea',
  '.git',
  'attachments',
  'copilot-custom-prompts',
  'Excalidraw',
  'node_modules',
  'Model' // Hides the Model directory
];

// 3. EXCLUDED FILES
// Specific filenames to hide from the blog list.
export const EXCLUDED_FILES: string[] = [
  '@ref.md',
  'Obsidian语法.md', 
  '未命名.md'
];

// =================================================================================
// THEME CONFIGURATION
// =================================================================================

export const THEME_CONFIG = {
  // Light theme colors
  light: {
    // Main theme colors
    primary: '#F7F8F3',
    secondary: '#EBECF2',
    tertiary: '#e3d8d8',
    // Accent colors
    accent1: '#deb99a',
    accent2: '#7C85EB',
    accent3: '#c493b1',
  },
  // Dark theme colors
  dark: {
    // Main theme colors  
    primary: '#897b8c',
    secondary: '#4d4658',
    tertiary: '#3b3442',
    // Accent colors
    accent1: '#deb99a',
    accent2: '#c493b1',
    accent3: '#7C85EB',
  },
};

// =================================================================================
// ICON COLORS
// =================================================================================

export const ICON_COLORS = {
  // Primary icon color (used for sparkle icons, etc.)
  primary: '#F3D493',
  // Secondary icon color
  secondary: '#6979D9',
  // Accent icon color
  accent: '#F00608',
  // Default icon color
  default: '#fbbf24', // Amber/Gold
};

// =================================================================================
// MEDIA CONFIGURATION
// =================================================================================

export const MEDIA_CONFIG = {
  // Background video/image URL
  backgroundMedia: "/The Journey of Elaina.mp4",
  // Music configuration
  music: {
    // Folder path for music files (relative to public folder)
    folder: "/music",
    // List of music tracks - add more tracks here
    tracks: [
      { name: '文学', file: '上田麗奈 - リテラチュア (文学) (Anime Size)_H.mp3' }
    ],
    // Default volume (0-1)
    defaultVolume: 0.4,
    // Enable shuffle
    shuffle: false,
    // Enable loop
    loop: true,
    // Volume fade duration in milliseconds
    fadeDuration: 500,
  },
  // Scores configuration for sheet music
  scores: {
    folder: "/scores",
    // List of available score files
    files: ['sample.txt', 'chords-demo.txt', 'canon-in-d.txt']
  },
};

// =================================================================================
// PORTFOLIO CONFIGURATION
// =================================================================================

export const PORTFOLIO_PROJECTS: Project[] = [
  {
    id: 'p1',
    title: '自定义体素引擎',
    description: '一个用 C++ 和 Vulkan 编写的类 Minecraft 体素引擎。支持无限地形生成和动态光照。',
    image: 'https://picsum.photos/600/400?random=1',
    tech: ['C++', 'Vulkan', '计算着色器']
  },
  {
    id: 'p2',
    title: '旋律魔女',
    description: '一款用 Unity 制作的节奏游戏，通过弹奏钢琴和弦来施放咒语。',
    image: 'https://picsum.photos/600/400?random=2',
    tech: ['Unity', 'C#', 'MIDI']
  },
  {
    id: 'p3',
    title: '数字速写本',
    description: '专注于动漫背景和环境的数字绘画作品集。',
    image: 'https://picsum.photos/600/400?random=3',
    tech: ['Photoshop', 'Blender']
  }
];
