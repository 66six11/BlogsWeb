
import { BlogPost, DirectoryNode } from '../types';
import { GITHUB_USERNAME, GITHUB_REPO, GITHUB_TOKEN } from '../constants';
import { BLOG_INCLUDED_FOLDERS, EXCLUDED_PATHS, EXCLUDED_FILES } from '../config';

const BASE_URL = 'https://api.github.com';
const CACHE_PREFIX = 'gh_cache_';
const CACHE_DURATION = 15 * 60 * 1000; // 15 Minutes Cache

const getHeaders = (): HeadersInit => {
  const h: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
  };
  if (GITHUB_TOKEN && GITHUB_TOKEN !== "undefined" && GITHUB_TOKEN.length > 0) {
    h['Authorization'] = `token ${GITHUB_TOKEN}`;
  }
  return h;
};

// --- Caching Helpers ---
export const clearBlogCache = () => {
    if (typeof window === 'undefined') return;
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
            localStorage.removeItem(key);
        }
    });
    console.log("Magic cache cleared.");
};

const getCache = <T>(key: string): T | null => {
    if (typeof window === 'undefined') return null;
    const json = localStorage.getItem(CACHE_PREFIX + key);
    if (!json) return null;
    try {
        const { timestamp, data } = JSON.parse(json);
        if (Date.now() - timestamp < CACHE_DURATION) {
            return data as T;
        }
        localStorage.removeItem(CACHE_PREFIX + key);
    } catch (e) {
        localStorage.removeItem(CACHE_PREFIX + key);
    }
    return null;
};

const setCache = (key: string, data: any) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
        timestamp: Date.now(),
        data
    }));
};

export interface GitHubUser {
  login: string;
  avatar_url: string;
  bio: string;
  name: string;
  html_url: string;
}

export const fetchUserProfile = async (): Promise<GitHubUser | null> => {
  if (!GITHUB_USERNAME) return null;

  // Try Cache
  const cached = getCache<GitHubUser>('profile');
  if (cached) return cached;

  try {
    const res = await fetch(`${BASE_URL}/users/${GITHUB_USERNAME}`, { headers: getHeaders() });
    
    if (res.status === 403) {
      console.warn("GitHub API rate limit exceeded. Using local fallback for profile.");
      return null;
    }
    
    if (res.status === 404) {
      console.warn(`GitHub user '${GITHUB_USERNAME}' not found.`);
      return null;
    }

    if (!res.ok) {
       return null;
    }
    const data = await res.json();
    setCache('profile', data);
    return data;
  } catch (error) {
    return null;
  }
};

// Helper to parse Obsidian-style Frontmatter
const parseFrontmatter = (content: string) => {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);
  
  const metadata: any = {};
  let body = content;

  if (match) {
    const frontmatterBlock = match[1];
    body = content.replace(frontmatterRegex, '').trim();
    
    frontmatterBlock.split('\n').forEach(line => {
      const [key, ...value] = line.split(':');
      if (key && value) {
        let val = value.join(':').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith('[') && val.endsWith(']')) {
             metadata[key.trim()] = val.slice(1, -1).split(',').map(s => s.trim());
        } else {
             metadata[key.trim()] = val;
        }
      }
    });
  }
  
  return { metadata, body };
};

const isExcluded = (path: string) => {
  const parts = path.split('/');
  const fileName = parts[parts.length - 1];

  // Check for specific excluded files
  if (EXCLUDED_FILES.includes(fileName)) {
    return true;
  }

  // Check for excluded directories
  return parts.some(part => 
    part.startsWith('.') || 
    EXCLUDED_PATHS.includes(part)
  );
};

// Check if a path belongs to the included folders list
const isIncludedFolder = (path: string) => {
    if (BLOG_INCLUDED_FOLDERS.length === 0) return true; // Include all if empty
    return BLOG_INCLUDED_FOLDERS.some(folder => path.startsWith(folder));
};

// Convert flat file list to tree
const buildTree = (files: any[]): DirectoryNode[] => {
    const root: DirectoryNode[] = [];

    files.forEach(file => {
        const parts = file.path.split('/');
        let currentLevel = root;

        parts.forEach((part: string, index: number) => {
            const isFile = index === parts.length - 1;
            
            // If it's a file but not .md, skip (already filtered upstream but double check)
            if (isFile && !part.endsWith('.md')) return;

            let existingNode = currentLevel.find(n => n.name === part);

            if (!existingNode) {
                const newNode: DirectoryNode = {
                    name: part.replace('.md', ''),
                    type: isFile ? 'file' : 'folder',
                    path: file.path,
                    children: [],
                    fileId: isFile ? file.sha : undefined
                };

                // Only add folders if they eventually contain files (this logic is partial here, 
                // but since we only iterate over valid files, we only create paths that lead to files)
                currentLevel.push(newNode);
                existingNode = newNode;
            }

            if (!isFile) {
                currentLevel = existingNode.children;
            }
        });
    });

    // Helper to sort: Folders first, then Files. Alphabetical.
    const sortNodes = (nodes: DirectoryNode[]) => {
        nodes.sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'folder' ? -1 : 1;
        });
        nodes.forEach(n => sortNodes(n.children));
    };

    sortNodes(root);
    return root;
};


export const fetchBlogIndex = async (): Promise<{ tree: DirectoryNode[], allFiles: any[] }> => {
    if (!GITHUB_USERNAME || !GITHUB_REPO) return { tree: [], allFiles: [] };

    // Try Cache for Tree
    const cached = getCache<{ tree: DirectoryNode[], allFiles: any[] }>('blog_index');
    if (cached) return cached;

    try {
        const headers = getHeaders();
        const repoRes = await fetch(`${BASE_URL}/repos/${GITHUB_USERNAME}/${GITHUB_REPO}`, { headers });
        if (!repoRes.ok) return { tree: [], allFiles: [] };
        
        const repoData = await repoRes.json();
        const defaultBranch = repoData.default_branch || 'main';

        const treeUrl = `${BASE_URL}/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/git/trees/${defaultBranch}?recursive=1`;
        const treeRes = await fetch(treeUrl, { headers });
        if (!treeRes.ok) return { tree: [], allFiles: [] };
        
        const treeData = await treeRes.json();
        if (!treeData.tree) return { tree: [], allFiles: [] };

        // Filter valid markdown files
        const mdFiles = treeData.tree.filter((item: any) => {
            return item.type === 'blob' && 
                   item.path.endsWith('.md') && 
                   !isExcluded(item.path) &&
                   isIncludedFolder(item.path);
        });

        const tree = buildTree(mdFiles);
        const result = { tree, allFiles: mdFiles };
        
        // Save to cache
        setCache('blog_index', result);
        
        return result;

    } catch (e) {
        console.error("Failed to fetch blog index", e);
        return { tree: [], allFiles: [] };
    }
};

export const fetchPostContent = async (path: string): Promise<BlogPost | null> => {
    try {
         // RAW content does NOT consume API rate limits (It uses a different CDN limit which is very high)
         // So we usually don't need to strictly cache this to save API calls, but caching helps performance.
         
         // Use the path as key
         const cacheKey = `post_${path}`;
         const cached = getCache<BlogPost>(cacheKey);
         if (cached) return cached;

         const branch = 'main'; 
         const rawUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/${branch}/${encodeURI(path)}`;
         
         const res = await fetch(rawUrl);
         if (!res.ok) return null;

         const rawText = await res.text();
         const { metadata, body } = parseFrontmatter(rawText);

         const pathParts = path.split('/');
         const fileName = pathParts[pathParts.length - 1].replace('.md', '');
         
         const post = {
             id: path, // Use path as ID
             title: metadata.title || fileName,
             date: metadata.date || 'Unknown Date',
             category: metadata.category || pathParts[0],
             tags: metadata.tags || [],
             excerpt: metadata.excerpt || body.substring(0, 100) + '...',
             content: body,
             path: path
         };

         setCache(cacheKey, post);
         return post;

    } catch (e) {
        return null;
    }
};

// Kept for backward compatibility / initial load of "Recent Posts"
export const fetchBlogPosts = async (): Promise<BlogPost[]> => {
    const { allFiles } = await fetchBlogIndex();
    // Fetch first 5
    const filesToFetch = allFiles.slice(0, 5);
    const posts = await Promise.all(filesToFetch.map(f => fetchPostContent(f.path)));
    return posts.filter((p): p is BlogPost => p !== null);
};
