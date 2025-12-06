
export enum View {
  HOME = 'HOME',
  BLOG = 'BLOG',
  ABOUT = 'ABOUT',
  MUSIC = 'MUSIC',
  PORTFOLIO = 'PORTFOLIO'
}

export interface BlogPost {
  id: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  excerpt: string;
  content: string; // Markdown content
  path?: string; // Virtual path for directory structure
}

export interface DirectoryNode {
  name: string;
  type: 'file' | 'folder';
  path: string; // Full path
  children: DirectoryNode[];
  fileId?: string; // SHA for files
}

export interface Note {
  pitch: number; // 0-11 (C to B) relative to octave
  octave: number; // 3-5
  startTime: number; // 16th note steps
  duration: number; // 16th note steps
  voice?: string; // Track/voice identifier for multi-track scores
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  tech: string[];
  link?: string;
}
