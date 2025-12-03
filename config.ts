
// =================================================================================
// USER CONFIGURATION
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
