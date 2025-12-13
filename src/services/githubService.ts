
import { BlogPost, DirectoryNode, GitHubUser } from '../types';
import { GITHUB_USERNAME, GITHUB_REPO } from '../constants';
import { BLOG_INCLUDED_FOLDERS, EXCLUDED_PATHS, EXCLUDED_FILES } from '../config';
import { mockBlogPosts } from '../data/mockData';
import { clearCache, getCache, setCache } from '../utils/cache';
import { parseFrontmatter } from '../utils/frontmatter';

const getHeaders = (): HeadersInit => ({
  'Accept': 'application/json',
});

// --- Caching Helpers ---
export { clearCache as clearBlogCache };

export const fetchUserProfile = async (): Promise<GitHubUser | null> => {
  if (!GITHUB_USERNAME) return null;

  // Try Cache
  const cached = getCache<GitHubUser>('profile');
  if (cached) return cached;

  try {
    const res = await fetch(`/api/github/user?username=${encodeURIComponent(GITHUB_USERNAME)}`, { headers: getHeaders() });
    
    // Rate Limit or Not Found
    if (!res.ok) {
        console.warn(`GitHub Profile Error: ${res.status} ${res.statusText}`);
        if (res.status === 403) {
             console.error("API Rate Limit Exceeded. Please provide a GITHUB_TOKEN.");
        }
        return null; 
    }

    const data = await res.json();
    setCache('profile', data);
    return data;
  } catch (error) {
    console.error("GitHub Profile Fetch Error", error);
    return null;
  }
};

const isExcluded = (path: string) => {
  const parts = path.split('/');
  const fileName = parts[parts.length - 1];

  if (EXCLUDED_FILES.includes(fileName)) return true;

  return parts.some(part => 
    part.startsWith('.') || 
    EXCLUDED_PATHS.includes(part)
  );
};

const isIncludedFolder = (path: string) => {
    if (BLOG_INCLUDED_FOLDERS.length === 0) return true; 
    return BLOG_INCLUDED_FOLDERS.some(folder => path.startsWith(folder));
};

const buildTree = (files: any[]): DirectoryNode[] => {
    const root: DirectoryNode[] = [];

    files.forEach(file => {
        const parts = file.path.split('/');
        let currentLevel = root;

        parts.forEach((part: string, index: number) => {
            const isFile = index === parts.length - 1;
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
                currentLevel.push(newNode);
                existingNode = newNode;
            }

            if (!isFile) {
                currentLevel = existingNode.children;
            }
        });
    });

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

export const fetchBlogIndex = async (useMockData = false): Promise<{ tree: DirectoryNode[], allFiles: any[], error?: boolean }> => {
    // Return mock data if requested
    if (useMockData) {
        const mockFiles = mockBlogPosts.map((post) => ({
            path: post.path,
            sha: post.id,
            type: 'blob'
        }));
        const tree = buildTree(mockFiles);
        return { tree, allFiles: mockFiles };
    }

    if (!GITHUB_USERNAME || !GITHUB_REPO) return { tree: [], allFiles: [] };

    // Try Cache
    const cached = getCache<{ tree: DirectoryNode[], allFiles: any[] }>('blog_index');
    if (cached) return cached;

    try {
        const headers = getHeaders();
        const repoRes = await fetch(`/api/github/repo?owner=${encodeURIComponent(GITHUB_USERNAME)}&repo=${encodeURIComponent(GITHUB_REPO)}`, { headers });
        if (!repoRes.ok) {
            console.warn(`Repo fetch failed: ${repoRes.status}`);
            return { tree: [], allFiles: [], error: true }; // Return error flag
        }
        
        const repoData = await repoRes.json();
        const defaultBranch = repoData.default_branch || 'main';

        const treeRes = await fetch(`/api/github/tree?owner=${encodeURIComponent(GITHUB_USERNAME)}&repo=${encodeURIComponent(GITHUB_REPO)}&branch=${encodeURIComponent(defaultBranch)}`, { headers });
        if (!treeRes.ok) {
             console.warn(`Tree fetch failed: ${treeRes.status}`);
             return { tree: [], allFiles: [], error: true };
        }
        
        const treeData = await treeRes.json();
        if (!treeData.tree) return { tree: [], allFiles: [] };

        const mdFiles = treeData.tree.filter((item: any) => {
            return item.type === 'blob' && 
                   item.path.endsWith('.md') && 
                   !isExcluded(item.path) &&
                   isIncludedFolder(item.path);
        });

        const tree = buildTree(mdFiles);
        const result = { tree, allFiles: mdFiles };
        
        setCache('blog_index', result);
        return result;

    } catch (e) {
        console.error("Failed to fetch blog index", e);
        return { tree: [], allFiles: [], error: true };
    }
};

// Fetch last commit date for a file
const fetchLastCommitDate = async (path: string): Promise<string | null> => {
    try {
        const cacheKey = `commit_${path}`;
        const cached = getCache<string>(cacheKey);
        if (cached) return cached;

        const response = await fetch(
            `/api/github/commits?owner=${encodeURIComponent(GITHUB_USERNAME)}&repo=${encodeURIComponent(GITHUB_REPO)}&path=${encodeURIComponent(path)}`,
            { headers: getHeaders() }
        );

        if (!response.ok) {
            console.warn(`Failed to fetch commit date for ${path}: ${response.status}`);
            return null;
        }

        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0 && data[0].commit?.author?.date) {
            const date = new Date(data[0].commit.author.date);
            const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
            setCache(cacheKey, formattedDate);
            return formattedDate;
        }
        
        return null;
    } catch (e) {
        console.error("Failed to fetch commit date", e);
        return null;
    }
};

export const fetchPostContent = async (path: string, useMockData = false): Promise<BlogPost | null> => {
    try {
         // Return mock data if requested
         if (useMockData) {
             const mockPost = mockBlogPosts.find(post => post.path === path);
             return mockPost || null;
         }

         const cacheKey = `post_${path}`;
         const cached = getCache<BlogPost>(cacheKey);
         if (cached) return cached;

         const branch = 'main'; 
         // 使用代理 URL 替代直接的 GitHub raw URL，避免 CORS 问题和网络连接问题
         const proxyUrl = `/api/github/raw?owner=${encodeURIComponent(GITHUB_USERNAME)}&repo=${encodeURIComponent(GITHUB_REPO)}&path=${encodeURIComponent(path)}`;
         
         const res = await fetch(proxyUrl);
         if (!res.ok) return null;

         const rawText = await res.text();
         const { metadata, body } = parseFrontmatter(rawText);

         const pathParts = path.split('/');
         const fileName = pathParts[pathParts.length - 1].replace('.md', '');
         
         // Fetch the last commit date from Git
         const gitDate = await fetchLastCommitDate(path);
         
         const post = {
             id: path, 
             title: metadata.title || fileName,
             date: gitDate || metadata.date || 'Unknown Date',
             category: metadata.category || pathParts[0],
             tags: metadata.tags || [],
             excerpt: metadata.excerpt || body.substring(0, 100) + '...',
             content: body,
             path: path,
             slug: metadata.slug || path.replace('.md', '').replace(/\//g, '-'),
             cover_image: metadata.cover_image,
             published_at: metadata.published_at || gitDate,
             updated_at: metadata.updated_at,
             author: metadata.author
         };

         setCache(cacheKey, post);
         return post;

    } catch (e) {
        return null;
    }
};

export const fetchBlogPosts = async (useMockData = false): Promise<BlogPost[]> => {
    // Return mock data if requested
    if (useMockData) {
        return mockBlogPosts;
    }

    const { allFiles } = await fetchBlogIndex(useMockData);
    const filesToFetch = allFiles.slice(0, 5);
    const posts = await Promise.all(filesToFetch.map(f => fetchPostContent(f.path, useMockData)));
    return posts.filter((p): p is BlogPost => p !== null);
};
