export interface BlogPost {
    title: string;
    excerpt: string;
    content?: string;
    cover_image?: string;
    published_at?: string;
    updated_at?: string;
    tags?: string[];
    categories?: string[];
    author?: string;
    slug: string;
    path: string;
}

export interface DirectoryNode {
    name: string;
    path: string;
    type: 'file' | 'folder';
    children?: DirectoryNode[];
}

export enum View {
    HOME = 'home',
    BLOG = 'blog',
    PROJECTS = 'projects',
    ABOUT = 'about',
    POST = 'post',
    FOLDER_VIEW = 'folder_view'
}

export interface GitHubUser {
    login: string;
    name: string | null;
    bio: string | null;
    avatar_url: string;
    html_url: string;
    public_repos: number;
    followers: number;
    following: number;
}