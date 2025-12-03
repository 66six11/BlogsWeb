import React, {useState, useEffect, useRef, useCallback} from 'react';
import {createRoot} from 'react-dom/client';
import {View, BlogPost, DirectoryNode} from './types';
import {
    APP_TITLE,
    AUTHOR_NAME,
    MOCK_POSTS,
    PROJECTS,
    BGM_URL,
    BG_MEDIA_URL,
    GITHUB_USERNAME,
    GITHUB_REPO
} from './constants';
import PianoEditor from './components/PianoEditor';
import MagicChat from './components/MagicChat';
import Scene3D from './components/Scene3D';
import {CustomSparkleIcon, CustomWitchIcon,HexagramIcon} from './components/CustomIcons';

import {
    fetchBlogPosts,
    fetchUserProfile,
    fetchBlogIndex,
    fetchPostContent,
    clearBlogCache,
    GitHubUser
} from './services/githubService';
import {
    Book, Code, Music, User, Home, Feather,
    ChevronRight, ChevronDown, Star, Coffee, Palette, Terminal,
    Volume2, VolumeX, Github, Folder, FileText, Loader2,
    RefreshCcw,
    Info, AlertTriangle, CheckCircle, XCircle, HelpCircle,
    Bug, Quote, CheckSquare, Square,
    List, Clipboard
} from 'lucide-react';

declare global {
    interface Window {
        katex: any;
    }
}

// --- Error Boundary ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
    constructor(props: any) {
        super(props);
        this.state = {hasError: false, error: null};
    }

    static getDerivedStateFromError(error: Error) {
        return {hasError: true, error};
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error("Uncaught Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-8 text-center">
                    <h1 className="text-4xl font-serif text-amber-500 mb-4">发生了魔法事故</h1>
                    <p className="text-slate-300 mb-6 max-w-lg">
                        渲染咒语执行时出了问题。
                        <br/>
                        <span className="text-xs font-mono text-red-300 mt-2 block bg-black/30 p-2 rounded">
                    {this.state.error?.message}
                </span>
                    </p>
                    <button
                        onClick={() => {
                            localStorage.clear();
                            window.location.reload();
                        }}
                        className="px-6 py-2 bg-purple-600 rounded hover:bg-purple-500 transition-colors"
                    >
                        重置并重新加载魔法书
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

// --- Robust Markdown Renderer ---
const SimpleMarkdown: React.FC<{ content: string }> = ({content}) => {

    const renderMath = (latex: string, isDisplay: boolean) => {
        if (!window.katex) return <span className="font-mono text-xs text-amber-300">{latex}</span>;
        try {
            const html = window.katex.renderToString(latex, {
                displayMode: isDisplay,
                throwOnError: false
            });
            return <span dangerouslySetInnerHTML={{__html: html}}/>;
        } catch (e) {
            return <span className="text-red-400 font-mono text-xs">{latex}</span>;
        }
    };

    const getCalloutStyles = (type: string) => {
        const t = type.toLowerCase();
        switch (t) {
            case 'note':
            case 'info':
            case 'todo':
                return {
                    color: 'border-blue-500 bg-blue-500/10 text-blue-200',
                    icon: <Info size={18} className="text-blue-400"/>
                };
            case 'tip':
            case 'done':
            case 'success':
                return {
                    color: 'border-emerald-500 bg-emerald-500/10 text-emerald-200',
                    icon: <CheckCircle size={18} className="text-emerald-400"/>
                };
            case 'warning':
            case 'attention':
            case 'caution':
                return {
                    color: 'border-orange-500 bg-orange-500/10 text-orange-200',
                    icon: <AlertTriangle size={18} className="text-orange-400"/>
                };
            case 'fail':
            case 'failure':
            case 'error':
            case 'danger':
            case 'missing':
                return {
                    color: 'border-red-500 bg-red-500/10 text-red-200',
                    icon: <XCircle size={18} className="text-red-400"/>
                };
            case 'bug':
                return {
                    color: 'border-red-500 bg-red-500/10 text-red-200',
                    icon: <Bug size={18} className="text-red-400"/>
                };
            case 'question':
            case 'help':
            case 'faq':
                return {
                    color: 'border-amber-500 bg-amber-500/10 text-amber-200',
                    icon: <HelpCircle size={18} className="text-amber-400"/>
                };
            case 'example':
                return {
                    color: 'border-purple-500 bg-purple-500/10 text-purple-200',
                    icon: <List size={18} className="text-purple-400"/>
                };
            case 'quote':
            case 'cite':
                return {
                    color: 'border-slate-500 bg-slate-500/10 text-slate-300',
                    icon: <Quote size={18} className="text-slate-400"/>
                };
            case 'summary':
            case 'abstract':
                return {
                    color: 'border-cyan-500 bg-cyan-500/10 text-cyan-200',
                    icon: <Clipboard size={18} className="text-cyan-400"/>
                };
            default:
                return {
                    color: 'border-slate-600 bg-slate-800/50 text-slate-300',
                    icon: <FileText size={18} className="text-slate-400"/>
                };
        }
    };

    const parseInline = (text: string) => {
        // 1. Inline Math $...$
        const parts = text.split(/(\$[^$\n]+?\$)/g);

        return parts.map((part, index) => {
            if (part.startsWith('$') && part.endsWith('$')) {
                return <span key={index} className="mx-1">{renderMath(part.slice(1, -1), false)}</span>;
            }

            // 2. Bold **...**
            const boldParts = part.split(/(\*\*.*?\*\*)/g);
            return (
                <React.Fragment key={index}>
                    {boldParts.map((bp, bIdx) => {
                        if (bp.startsWith('**') && bp.endsWith('**')) {
                            return <strong key={bIdx}
                                           className="text-amber-200 font-semibold">{bp.slice(2, -2)}</strong>;
                        }
                        // 3. Italic *...*
                        const italicParts = bp.split(/(\*.*?\*)/g);
                        return (
                            <React.Fragment key={bIdx}>
                                {italicParts.map((ip, iIdx) => {
                                    if (ip.startsWith('*') && ip.endsWith('*') && ip.length > 2) {
                                        return <em key={iIdx} className="text-purple-200">{ip.slice(1, -1)}</em>;
                                    }
                                    return <span key={iIdx}>{ip}</span>;
                                })}
                            </React.Fragment>
                        );
                    })}
                </React.Fragment>
            );
        });
    };

    const renderTable = (lines: string[], key: string) => {
        if (lines.length < 2) return null;

        const parseRow = (row: string) => {
            let content = row.trim();
            if (content.startsWith('|')) content = content.substring(1);
            if (content.endsWith('|')) content = content.substring(0, content.length - 1);
            return content.split('|').map(c => c.trim());
        };

        const headers = parseRow(lines[0]);
        const bodyRows = lines.slice(2).map(parseRow);

        return (
            <div key={key} className="my-6 overflow-x-auto rounded-lg border border-slate-700 shadow-lg">
                <table className="min-w-full divide-y divide-slate-700 bg-slate-900/50">
                    <thead className="bg-slate-900">
                    <tr>
                        {headers.map((h, i) => (
                            <th key={i}
                                className="px-6 py-3 text-left text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-slate-700">
                                {parseInline(h)}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                    {bodyRows.map((row, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-transparent' : 'bg-slate-800/20'}>
                            {row.map((cell, cIdx) => (
                                <td key={cIdx}
                                    className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 border-r border-slate-800/50 last:border-0">
                                    {parseInline(cell)}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        );
    };

    // Main Block Parser
    const parseBlocks = () => {
        // 1. Split by Code Blocks first (triple backticks)
        const codeSplit = content.split(/(```[\s\S]*?```)/g);
        const result: React.ReactNode[] = [];

        codeSplit.forEach((section, secIdx) => {
            if (section.startsWith('```')) {
                // Render Code Block
                const langMatch = section.match(/^```([a-z]*)\n/);
                const lang = langMatch ? langMatch[1] : '';
                const codeContent = section.replace(/^```[a-z]*\n/, '').replace(/```$/, '');
                result.push(
                    <div key={`code-${secIdx}`} className="relative group my-6">
                        {lang && <span
                            className="absolute right-2 top-2 text-xs text-slate-500 font-mono select-none">{lang}</span>}
                        <pre
                            className="bg-slate-950/80 border border-slate-700/50 p-4 rounded-lg overflow-x-auto text-sm font-mono text-purple-200 shadow-inner">
                <code>{codeContent.trim()}</code>
                </pre>
                    </div>
                );
            } else {
                // Render Standard Markdown Blocks
                const lines = section.split('\n');
                let i = 0;
                while (i < lines.length) {
                    const line = lines[i];
                    const trimmed = line.trim();
                    const key = `block-${secIdx}-${i}`;

                    if (!trimmed) {
                        result.push(<div key={key} className="h-4"/>);
                        i++;
                        continue;
                    }

                    // A. Block Math $$...$$
                    if (trimmed.startsWith('$$')) {
                        let mathContent = trimmed.replace('$$', '');
                        let j = i;
                        let foundEnd = false;

                        if (trimmed.endsWith('$$') && trimmed.length > 2) {
                            mathContent = trimmed.slice(2, -2);
                            foundEnd = true;
                        } else {
                            // Search for end
                            j++;
                            while (j < lines.length) {
                                const nextLine = lines[j];
                                if (nextLine.trim().endsWith('$$')) {
                                    mathContent += '\n' + nextLine.trim().replace('$$', '');
                                    foundEnd = true;
                                    break;
                                }
                                mathContent += '\n' + nextLine;
                                j++;
                            }
                        }

                        if (foundEnd) {
                            result.push(
                                <div key={key}
                                     className="my-6 overflow-x-auto text-center py-2 bg-slate-950/30 rounded border border-white/5">
                                    {renderMath(mathContent, true)}
                                </div>
                            );
                            i = j + 1;
                            continue;
                        }
                    }

                    // B. Tables
                    if (trimmed.startsWith('|')) {
                        const nextLine = lines[i + 1]?.trim();
                        if (nextLine && nextLine.startsWith('|') && /^[|\s-:]+$/.test(nextLine)) {
                            // It is a table
                            const tableLines = [line];
                            tableLines.push(lines[i + 1]);
                            let j = i + 2;
                            while (j < lines.length && lines[j].trim().startsWith('|')) {
                                tableLines.push(lines[j]);
                                j++;
                            }
                            result.push(renderTable(tableLines, key));
                            i = j;
                            continue;
                        }
                    }

                    // C. Headers
                    const headerMatch = line.match(/^((#{1,6})\s+(.*))/);
                    if (headerMatch) {
                        const level = headerMatch[2].length;
                        const text = headerMatch[3];
                        const content = parseInline(text);

                        switch (level) {
                            case 1:
                                result.push(<h1 key={key}
                                                className="text-3xl font-serif font-bold text-slate-100 mt-8 mb-4 border-b border-amber-500/30 pb-2 flex items-center gap-2">
                                    <CustomSparkleIcon size={28}/> {content}</h1>);
                                break;
                            case 2:
                                result.push(<h2 key={key}
                                                className="text-2xl font-serif font-bold text-slate-200 mt-6 mb-3 pl-3 border-l-4 border-purple-500">{content}</h2>);
                                break;
                            case 3:
                                result.push(<h3 key={key}
                                                className="text-xl font-bold text-purple-200 mt-5 mb-2">{content}</h3>);
                                break;
                            case 4:
                                result.push(<h4 key={key}
                                                className="text-lg font-bold text-amber-200/80 mt-4 mb-2 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400"/>
                                    {content}</h4>);
                                break;
                            default:
                                result.push(<h5 key={key} className="font-bold text-slate-300 mt-3">{content}</h5>);
                        }
                        i++;
                        continue;
                    }

                    // D. Obsidian Images ![[...]]
                    if (trimmed.match(/!\[\[(.*?)\]\]/)) {
                        const match = trimmed.match(/!\[\[(.*?)\]\]/);
                        if (match) {
                            const imageName = match[1];
                            const encodedName = encodeURIComponent(imageName);
                            // Use GitHub raw content
                            const imageUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/main/attachments/${encodedName}`;
                            result.push(
                                <div key={key} className="my-6 flex flex-col items-center">
                                    <img
                                        src={imageUrl}
                                        alt={imageName}
                                        className="max-w-full md:max-w-lg rounded-lg border border-white/10 shadow-lg"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                    <span className="text-xs text-slate-500 mt-2 italic">{imageName}</span>
                                </div>
                            );
                            i++;
                            continue;
                        }
                    }

                    // E. Standard Images ![...](...)
                    const imgMatch = line.match(/^!\[(.*?)\]\((.*?)\)/);
                    if (imgMatch) {
                        result.push(
                            <div key={key} className="my-6 flex flex-col items-center">
                                <img src={imgMatch[2]} alt={imgMatch[1]}
                                     className="max-w-full rounded-lg border border-white/10 shadow-lg"/>
                                {imgMatch[1] &&
                                    <span className="text-xs text-slate-500 mt-2 italic">{imgMatch[1]}</span>}
                            </div>
                        );
                        i++;
                        continue;
                    }

                    // F. Obsidian Callouts & Blockquotes
                    if (line.startsWith('>')) {
                        const quoteLines = [];
                        let j = i;
                        while (j < lines.length && (lines[j].trim().startsWith('>') || lines[j].trim() === '')) {
                            if (lines[j].trim().startsWith('>')) {
                                quoteLines.push(lines[j]);
                            } else if (lines[j].trim() === '' && quoteLines.length > 0) {
                                break;
                            } else {
                                break;
                            }
                            j++;
                        }

                        if (quoteLines.length > 0) {
                            const firstLineContent = quoteLines[0].replace(/^>\s*/, '');
                            const calloutMatch = firstLineContent.match(/^\[!(.*?)\]\s*(.*)/);

                            if (calloutMatch) {
                                const type = calloutMatch[1];
                                const title = calloutMatch[2] || type.toUpperCase();
                                const styles = getCalloutStyles(type);

                                const bodyContent = quoteLines.slice(1).map(l => l.replace(/^>\s?/, '')).join('\n');

                                result.push(
                                    <div key={key}
                                         className={`my-6 rounded-lg border-l-4 ${styles.color} p-4 shadow-sm`}>
                                        <div className="flex items-center gap-2 font-bold mb-2">
                                            {styles.icon}
                                            <span>{title}</span>
                                        </div>
                                        <div className="text-sm opacity-90">
                                            <SimpleMarkdown content={bodyContent}/>
                                        </div>
                                    </div>
                                );
                            } else {
                                // Standard Blockquote
                                const bodyContent = quoteLines.map(l => l.replace(/^>\s?/, '')).join('\n');
                                result.push(
                                    <div key={key}
                                         className="border-l-4 border-amber-500/80 pl-4 py-2 my-4 italic text-slate-300 bg-amber-500/5 rounded-r">
                                        <SimpleMarkdown content={bodyContent}/>
                                    </div>
                                );
                            }
                            i = j;
                            continue;
                        }
                    }

                    // G. Lists & Task Lists
                    if (trimmed.match(/^(\*|-)\s/)) {
                        const taskMatch = trimmed.match(/^(\*|-)\s+\[([ xX])\]\s+(.*)/);
                        if (taskMatch) {
                            const isChecked = taskMatch[2].toLowerCase() === 'x';
                            const taskText = taskMatch[3];
                            result.push(
                                <div key={key} className="flex gap-3 ml-2 mb-1 items-start group">
                                    <div
                                        className="mt-1 flex-shrink-0 text-slate-400 group-hover:text-amber-400 transition-colors">
                                        {isChecked ? <CheckSquare size={16} className="text-emerald-400"/> :
                                            <Square size={16}/>}
                                    </div>
                                    <span
                                        className={`leading-relaxed ${isChecked ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                                 {parseInline(taskText)}
                             </span>
                                </div>
                            );
                        } else {
                            result.push(
                                <div key={key} className="flex gap-2 ml-4 mb-1">
                                    <span className="text-amber-400 mt-1.5 text-[10px] flex-shrink-0">●</span>
                                    <span className="flex-1 leading-relaxed">{parseInline(trimmed.substring(2))}</span>
                                </div>
                            );
                        }
                        i++;
                        continue;
                    }

                    // H. Horizontal Rule
                    if (trimmed.match(/^---$/)) {
                        result.push(<hr key={key} className="border-white/10 my-8"/>);
                        i++;
                        continue;
                    }

                    // I. Paragraph
                    result.push(
                        <p key={key} className="mb-3 text-slate-300 leading-relaxed">
                            {parseInline(line)}
                        </p>
                    );
                    i++;
                }
            }
        });

        return result;
    };

    return (
        <div className="space-y-1 text-slate-200 leading-relaxed font-sans markdown-content">
            {parseBlocks()}
        </div>
    );
};

// --- Tree Node Component ---
const FileTreeNode: React.FC<{
    node: DirectoryNode;
    onSelect: (node: DirectoryNode) => void;
    depth?: number
}> = ({node, onSelect, depth = 0}) => {
    const [isOpen, setIsOpen] = useState(false);
    const isFolder = node.type === 'folder';

    return (
        <div className="select-none">
            <div
                className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer transition-colors hover:bg-white/5 ${depth > 0 ? 'ml-3' : ''} border-l border-transparent hover:border-amber-500/30`}
                onClick={() => {
                    if (isFolder) setIsOpen(!isOpen);
                    else onSelect(node);
                }}
            >
                <span className="opacity-70 text-amber-400">
                    {isFolder ? (
                        isOpen ? <Folder size={16} fill="currentColor" fillOpacity={0.2}/> : <Folder size={16}/>
                    ) : (
                        <FileText size={15} className="text-slate-400"/>
                    )}
                </span>
                <span
                    className={`text-sm truncate ${isFolder ? 'font-bold text-slate-200' : 'text-slate-400 hover:text-purple-300'}`}>
                    {node.name}
                </span>
            </div>
            {isFolder && isOpen && (
                <div className="border-l border-slate-700/50 ml-2.5">
                    {node.children.map(child => (
                        <FileTreeNode key={child.path} node={child} onSelect={onSelect} depth={depth + 1}/>
                    ))}
                </div>
            )}
        </div>
    );
};


// --- Main App Component ---
const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>(View.HOME);
    const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

    // Data State
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [blogDirectory, setBlogDirectory] = useState<DirectoryNode[]>([]);
    const [userProfile, setUserProfile] = useState<GitHubUser | null>(null);
    const [isLoadingPosts, setIsLoadingPosts] = useState(false);
    const [isFetchingContent, setIsFetchingContent] = useState(false);
    const [isRateLimited, setIsRateLimited] = useState(false);

    // Audio State
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const [analyserReady, setAnalyserReady] = useState(false);

    // Video Ref
    const videoRef = useRef<HTMLVideoElement>(null);

    // --- Initialization Effects ---
    const loadData = async () => {
        setIsLoadingPosts(true);
        setIsRateLimited(false);

        try {
            // Fetch User
            const profile = await fetchUserProfile();
            if (profile) setUserProfile(profile);

            // Fetch Blog Directory & Index
            const {tree, allFiles, error} = await fetchBlogIndex();

            if (error) {
                // Potential rate limit or network error
                // We check if tree is empty as a secondary sign
                setIsRateLimited(true);
            }

            if (tree.length > 0) {
                setBlogDirectory(tree);
                const recentFiles = allFiles.slice(0, 5);
                const loadedPosts = await Promise.all(recentFiles.map(f => fetchPostContent(f.path)));
                setPosts(loadedPosts.filter((p): p is BlogPost => p !== null));
            } else {
                setPosts(MOCK_POSTS);
            }
        } catch (e) {
            console.error("Initialization Error", e);
            setPosts(MOCK_POSTS);
        } finally {
            setIsLoadingPosts(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleRefresh = async () => {
        clearBlogCache();
        setBlogDirectory([]);
        setPosts([]);
        await loadData();
    };

    // Initialize Audio
    useEffect(() => {
        const audio = new Audio(BGM_URL);
        audio.loop = true;
        audio.volume = 0.4;
        audio.crossOrigin = "anonymous";
        audioRef.current = audio;
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Ensure video plays
    useEffect(() => {
        if (videoRef.current) {
            // Attempt to play immediately
            const playVideo = async () => {
                try {
                    await videoRef.current?.play();
                } catch (e) {
                    console.log("Autoplay prevented by browser interaction policy.");
                }
            };
            playVideo();
        }
    }, []);

    const toggleMusic = async () => {
        if (!audioRef.current) return;

        if (isMusicPlaying) {
            audioRef.current.pause();
            setIsMusicPlaying(false);
        } else {
            if (!audioContextRef.current) {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                const ctx = new AudioContextClass();
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 256;

                const source = ctx.createMediaElementSource(audioRef.current);
                source.connect(analyser);
                analyser.connect(ctx.destination);

                audioContextRef.current = ctx;
                analyserRef.current = analyser;
                setAnalyserReady(true);
            }

            if (audioContextRef.current?.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            audioRef.current.play().catch(e => console.log("Play failed:", e));
            setIsMusicPlaying(true);
        }
    };

    useEffect(() => {
        window.scrollTo({top: 0, behavior: 'smooth'});
    }, [currentView, selectedPost]);

    const handleDirectorySelect = async (node: DirectoryNode) => {
        if (node.type !== 'file') return;

        // Check if we already have this post loaded
        const existingPost = posts.find(p => p.path === node.path || p.id === node.fileId);
        if (existingPost) {
            setSelectedPost(existingPost);
            return;
        }

        // Lazy load
        setIsFetchingContent(true);
        const newPost = await fetchPostContent(node.path);
        setIsFetchingContent(false);

        if (newPost) {
            setPosts(prev => [...prev, newPost]);
            setSelectedPost(newPost);
        }
    };

    const renderNav = () => (
        <nav className="sticky top-0 z-40 w-full bg-slate-900/60 backdrop-blur-md border-b border-white/10 shadow-lg">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                <div
                    className="flex items-center gap-2 cursor-pointer group"
                    onClick={() => {
                        setCurrentView(View.HOME);
                        setSelectedPost(null);
                    }}
                >
                    <div className=" from-purple-600 to-amber-500 p-1. 5 rounded-lg group-hover:rotate-[30deg] transition-transform shadow-[0_0_15px_rgba(251,191,36,0. 4)]">
                        <HexagramIcon size={48}/>
                    </div>
                    <span
                        className="font-serif font-bold text-xl tracking-tight text-slate-100 group-hover:text-amber-200 transition-colors drop-shadow-md">
            {APP_TITLE}
          </span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex gap-2 bg-slate-950/40 p-1 rounded-full border border-white/5">
                        {[
                            {id: View.HOME, icon: Home, label: '首页'},
                            {id: View.BLOG, icon: Book, label: '魔法书'},
                            {id: View.PORTFOLIO, icon: Code, label: '作品'},
                            {id: View.MUSIC, icon: Music, label: '旋律'},
                            {id: View.ABOUT, icon: User, label: '关于'},
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setCurrentView(item.id);
                                    setSelectedPost(null);
                                }}
                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all duration-300 text-sm font-semibold
                    ${currentView === item.id
                                    ? 'bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)] border border-amber-400/30'
                                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                                }`}
                            >
                                <item.icon size={15}/>
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={toggleMusic}
                        className={`p-2 rounded-full transition-all duration-300 border ${
                            isMusicPlaying
                                ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse'
                                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                        title="背景音乐"
                    >
                        {isMusicPlaying ? <Volume2 size={18}/> : <VolumeX size={18}/>}
                    </button>
                </div>
            </div>
        </nav>
    );

    const renderHome = () => (
        <div
            className="flex flex-col items-center justify-center flex-1 text-center px-4 relative overflow-hidden w-full h-full">
            <div
                className="relative z-10 animate-fade-in-up bg-slate-900/60 backdrop-blur-md p-8 md:p-12 rounded-3xl border border-white/10 shadow-2xl max-w-4xl flex flex-col items-center">
                <div className="w-32 h-32 mx-auto mb-8 relative group">
                    <div
                        className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-amber-400 rounded-full animate-spin-slow opacity-80 blur-md group-hover:blur-xl transition-all"></div>
                    <img
                        src={userProfile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Elaina&clothing=graphicShirt&top=hat&hairColor=silverGray"}
                        alt="Avatar"
                        className="w-full h-full rounded-full border-4 border-slate-900 relative z-10 bg-slate-800 object-cover"
                    />
                    <div className="absolute top-20 left-[calc(90%)] -translate-x-1/2 z-20">
                        <CustomSparkleIcon size={42}
                                           className="text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)] animate-float"/>
                    </div>
                </div>

                <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] text-center">
                    {userProfile?.name || AUTHOR_NAME}
                </h1>
                <p className="text-xl md:text-2xl text-slate-200 max-w-2xl mx-auto mb-10 font-light leading-relaxed drop-shadow-md text-center">
                    {userProfile?.bio || "\"一位用代码和色彩编织新世界的旅行者。\""}
                    <br/>
                    <span
                        className="text-base text-amber-200/90 mt-3 block font-mono bg-black/20 inline-block px-4 py-1 rounded-full border border-amber-500/20">
            Unity • Graphic • C++ • Art
          </span>
                </p>

                <div className="flex flex-wrap justify-center gap-4">
                    <button
                        onClick={() => setCurrentView(View.PORTFOLIO)}
                        className="px-8 py-3 bg-purple-600/90 hover:bg-purple-500 text-white rounded-lg font-bold shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all hover:scale-105 flex items-center gap-2 border border-purple-400/50 backdrop-blur-sm"
                    >
                        <Code size={20}/> 查看项目
                    </button>
                    <button
                        onClick={() => setCurrentView(View.BLOG)}
                        className="px-8 py-3 bg-slate-100/10 hover:bg-slate-100/20 text-slate-100 rounded-lg font-bold border border-white/20 transition-all hover:scale-105 flex items-center gap-2 backdrop-blur-md"
                    >
                        <Book size={20}/> 阅读魔法书
                    </button>
                </div>
            </div>
        </div>
    );

    const renderBlog = () => {
        return (
            <div className="max-w-7xl mx-auto py-8 px-4 animate-fade-in-up relative z-10 w-full">
                {/* Header */}
                {!selectedPost && (
                    <div
                        className="text-center mb-8 bg-black/30 p-6 rounded-2xl backdrop-blur-sm border border-white/5 relative overflow-hidden">
                        {/* Rate Limit Warning */}
                        {isRateLimited && (
                            <div
                                className="absolute top-0 left-0 right-0 bg-red-900/80 text-white text-xs py-1 animate-pulse border-b border-red-500">
                                警告：魔法能量耗尽（GitHub 速率限制）。正在显示缓存/模拟内容。
                            </div>
                        )}
                        <h2 className="text-4xl font-serif font-bold text-white mb-2 flex items-center justify-center gap-3 mt-2">
                            <Book className="text-amber-400"/> 魔女的魔法书
                        </h2>
                        <p className="text-slate-300">关于渲染、逻辑和神秘艺术的笔记。</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

                    {/* Sidebar (Tree) - Hidden on mobile if post is selected, or collapsible */}
                    <div
                        className={`md:col-span-3 bg-slate-900/80 backdrop-blur-md rounded-xl border border-white/10 p-4 h-fit max-h-[80vh] overflow-y-auto sticky top-24 ${selectedPost ? 'hidden md:block' : 'block'}`}>
                        <div className="flex justify-between items-center mb-4 px-2 border-b border-white/10 pb-2">
                            <h3 className="font-bold text-slate-200 flex items-center gap-2">
                                <Folder size={16} className="text-amber-400"/> 档案库
                            </h3>
                            <button onClick={handleRefresh} title="刷新内容"
                                    className="p-1.5 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
                                <RefreshCcw size={14} className={isLoadingPosts ? 'animate-spin' : ''}/>
                            </button>
                        </div>

                        {blogDirectory.length === 0 && !isLoadingPosts ? (
                            <div className="text-slate-500 text-sm px-2 italic">
                                未找到咒语... <br/>
                                <span className="text-[10px] opacity-70">请检查连接或刷新。</span>
                            </div>
                        ) : null}

                        {blogDirectory.length > 0 && (
                            <div className="space-y-1">
                                {blogDirectory.map(node => (
                                    <FileTreeNode key={node.path} node={node} onSelect={handleDirectorySelect}/>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Content Area */}
                    <div className="md:col-span-9">
                        {isLoadingPosts && posts.length === 0 ? (
                            <div
                                className="text-center text-amber-400 py-20 bg-slate-900/50 rounded-xl border border-white/5">
                                <CustomSparkleIcon className="animate-spin inline-block mr-2"/> 正在召唤卷轴...
                            </div>
                        ) : isFetchingContent ? (
                            <div
                                className="flex flex-col items-center justify-center py-20 bg-slate-900/50 rounded-xl border border-white/5 h-[60vh]">
                                <Loader2 className="animate-spin text-purple-400 mb-4" size={48}/>
                                <span className="text-slate-300">正在解读符文...</span>
                            </div>
                        ) : selectedPost ? (
                            <article
                                className="bg-slate-900/80 border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl backdrop-blur-md min-h-[60vh] animate-fade-in-up">
                                <button
                                    onClick={() => setSelectedPost(null)}
                                    className="mb-6 flex items-center text-slate-300 hover:text-amber-400 transition-colors bg-black/20 px-4 py-2 rounded-full w-fit backdrop-blur-sm text-sm"
                                >
                                    <ChevronRight className="rotate-180 mr-1" size={14}/> 返回
                                </button>

                                <header className="mb-8 border-b border-white/10 pb-8">
                                    <div className="flex gap-2 mb-4">
                                <span
                                    className="bg-purple-500/20 text-purple-200 text-xs px-2 py-1 rounded border border-purple-400/30">
                                {selectedPost.category}
                                </span>
                                        <span className="text-slate-400 text-xs flex items-center">
                                {selectedPost.date}
                                </span>
                                    </div>
                                    <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6 leading-tight">
                                        {selectedPost.title}
                                    </h1>
                                    <div className="flex gap-2">
                                        {selectedPost.tags.map(tag => (
                                            <span key={tag}
                                                  className="text-xs text-amber-500/80 font-mono">#{tag}</span>
                                        ))}
                                    </div>
                                </header>
                                <SimpleMarkdown content={selectedPost.content}/>
                            </article>
                        ) : (
                            <div className="grid gap-6">
                                {posts.map(post => (
                                    <div
                                        key={post.id}
                                        onClick={() => setSelectedPost(post)}
                                        className="group bg-slate-900/70 hover:bg-slate-800/80 border border-white/10 hover:border-amber-400/50 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-[0_0_25px_rgba(251,191,36,0.15)] backdrop-blur-md"
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                    <span
                                        className="text-amber-400 font-bold text-sm tracking-wider uppercase flex items-center gap-1">
                                        <Star size={10} fill="currentColor"/> {post.category}
                                    </span>
                                            <span className="text-slate-500 text-sm">• {post.date}</span>
                                        </div>
                                        <h3 className="text-2xl font-serif font-bold text-slate-100 mb-3 group-hover:text-purple-300 transition-colors">
                                            {post.title}
                                        </h3>
                                        <p className="text-slate-400 leading-relaxed mb-4 text-sm line-clamp-3">
                                            {post.excerpt}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderPortfolio = () => (
        <div className="max-w-6xl mx-auto py-12 px-4 animate-fade-in-up relative z-10">
            <div className="text-center mb-12 bg-black/30 p-6 rounded-2xl backdrop-blur-sm border border-white/5">
                <h2 className="text-3xl font-serif font-bold text-white mb-2 flex items-center justify-center gap-2">
                    <CustomSparkleIcon size={30}/> 魔法作品
                </h2>
                <p className="text-slate-300">用代码和咖啡创造的神器。</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {PROJECTS.map(project => (
                    <div key={project.id}
                         className="group bg-slate-900/80 rounded-xl overflow-hidden border border-white/10 hover:border-amber-400/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md">
                        <div className="h-48 overflow-hidden relative">
                            <div
                                className="absolute inset-0 bg-purple-900/20 group-hover:bg-transparent transition-colors z-10"/>
                            <img
                                src={project.image}
                                alt={project.title}
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                            />
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-slate-100 mb-2 font-serif group-hover:text-amber-300 transition-colors">{project.title}</h3>
                            <p className="text-slate-400 text-sm mb-4 h-20 overflow-hidden border-b border-white/5 pb-2">
                                {project.description}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-auto">
                                {project.tech.map(t => (
                                    <span key={t}
                                          className="text-xs font-mono text-slate-300 bg-white/5 px-2 py-1 rounded border border-white/5">
                    {t}
                  </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderAbout = () => (
        <div className="max-w-4xl mx-auto py-12 px-4 animate-fade-in-up relative z-10">
            <div
                className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
                {/* Decorative Corner */}
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <CustomWitchIcon size={120} className="text-amber-400"/>
                </div>

                <div className="flex flex-col md:flex-row gap-10 items-center">
                    <div className="w-48 h-48 flex-shrink-0 relative">
                        <div
                            className="absolute inset-0 bg-amber-400 rounded-full blur-lg opacity-20 animate-pulse"></div>
                        <img
                            src={userProfile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Elaina&clothing=graphicShirt&top=hat&hairColor=silverGray"}
                            alt="Profile"
                            className="w-full h-full rounded-full object-cover border-4 border-slate-200 shadow-xl relative z-10"
                        />
                    </div>

                    <div className="flex-1">
                        <h2 className="text-4xl font-serif font-bold text-white mb-4">关于旅行者</h2>
                        <div className="space-y-4 text-slate-300 leading-relaxed font-sans">
                            {userProfile?.bio ? (
                                <p>{userProfile.bio}</p>
                            ) : (
                                <>
                                    <p>
                                        你好！我是一名对 <strong className="text-amber-300">计算机图形学</strong>、<strong
                                        className="text-amber-300">Unity</strong> 和 <strong
                                        className="text-amber-300">游戏引擎架构</strong> 充满热情的学生。
                                    </p>
                                    <p>
                                        当我不在调试着色器或优化绘制调用时，我会花时间弹钢琴或绘制受我最喜欢的动漫《<em
                                        className="text-purple-300">魔女之旅</em>》启发的风景画。
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-4">
                            {userProfile?.html_url && (
                                <a href={userProfile.html_url} target="_blank" rel="noreferrer"
                                   className="bg-slate-950/50 p-4 rounded-lg border border-white/10 flex items-center gap-3 hover:bg-slate-800 transition-colors">
                                    <Github className="text-amber-400"/>
                                    <div>
                                        <h4 className="font-bold text-slate-200 text-sm">GitHub</h4>
                                        <p className="text-xs text-slate-500">查看源码</p>
                                    </div>
                                </a>
                            )}
                            <div
                                className="bg-slate-950/50 p-4 rounded-lg border border-white/10 flex items-center gap-3">
                                <Terminal className="text-amber-400"/>
                                <div>
                                    <h4 className="font-bold text-slate-200 text-sm">编程语言</h4>
                                    <p className="text-xs text-slate-500">C++, C#, HLSL, Python</p>
                                </div>
                            </div>
                            <div
                                className="bg-slate-950/50 p-4 rounded-lg border border-white/10 flex items-center gap-3">
                                <Palette className="text-amber-400"/>
                                <div>
                                    <h4 className="font-bold text-slate-200 text-sm">工具</h4>
                                    <p className="text-xs text-slate-500">Unity, Blender, Photoshop</p>
                                </div>
                            </div>
                            <div
                                className="bg-slate-950/50 p-4 rounded-lg border border-white/10 flex items-center gap-3">
                                <Music className="text-amber-400"/>
                                <div>
                                    <h4 className="font-bold text-slate-200 text-sm">爱好</h4>
                                    <p className="text-xs text-slate-500">钢琴即兴演奏</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderMusic = () => (
        <div className="max-w-5xl mx-auto py-12 px-4 animate-fade-in-up relative z-10">
            <div className="text-center mb-8 bg-black/30 p-6 rounded-2xl backdrop-blur-sm border border-white/5">
                <h2 className="text-3xl font-serif font-bold text-white mb-2">吟游诗人作曲</h2>
                <p className="text-slate-300">创作一段旋律。即使是魔女也需要从学习中休息一下。</p>
            </div>

            <PianoEditor className="w-full"/>

            <div
                className="mt-8 text-center max-w-2xl mx-auto bg-slate-900/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                <p className="text-slate-400 italic text-sm">
                    "魔法不仅仅是施展咒语，更是聆听世界的节奏。"
                </p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen text-slate-200 selection:bg-amber-400 selection:text-black font-sans relative">

            {/* --- Background Stack --- */}

            {/* 1. Dynamic Background Video (Bottom) */}
            <div className="fixed inset-0 overflow-hidden bg-slate-950 z-0">
                {BG_MEDIA_URL.endsWith('.mp4') ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                    >
                        <source src={BG_MEDIA_URL} type="video/mp4"/>
                    </video>
                ) : (
                    <img
                        src={BG_MEDIA_URL}
                        className="w-full h-full object-cover opacity-70"
                        alt="Magic Background"
                    />
                )}
            </div>

            {/* 2. 3D Particles Layer (Middle) */}
            <div className="fixed inset-0 z-10 pointer-events-none">
                <Scene3D analyser={analyserRef.current || undefined}/>
            </div>

            {/* 3. Dark Overlay (Top of Backgrounds) - Hidden on Home */}
            <div className={`fixed inset-0 z-20 pointer-events-none transition-colors duration-1000 ${
                currentView === View.HOME ? 'bg-transparent' : 'bg-slate-950/60'
            }`}/>

            {/* --- Main Content (Above All Backgrounds) --- */}
            <div className="relative z-30 flex flex-col min-h-screen">
                {renderNav()}

                {/* Updated Main Container with Flex logic */}
                <main
                    className={`flex-1 w-full flex flex-col ${currentView === View.HOME ? 'justify-center' : 'pb-24'}`}>
                    {currentView === View.HOME && renderHome()}
                    {currentView === View.BLOG && renderBlog()}
                    {currentView === View.PORTFOLIO && renderPortfolio()}
                    {currentView === View.ABOUT && renderAbout()}
                    {currentView === View.MUSIC && renderMusic()}
                </main>

                <MagicChat/>

                <footer
                    className="bg-slate-950/80 backdrop-blur-md border-t border-white/5 py-8 text-center text-slate-500 text-sm mt-auto">
                    <p>© {new Date().getFullYear()} {userProfile?.name || AUTHOR_NAME}. 灵感来自《魔女之旅》。</p>
                    <div className="flex justify-center gap-4 mt-2">
                        <a href={userProfile?.html_url || "#"}
                           className="hover:text-amber-400 transition-colors">GitHub</a>
                        <a href="#" className="hover:text-amber-400 transition-colors">推特</a>
                        <a href="#" className="hover:text-amber-400 transition-colors">ArtStation</a>
                    </div>
                </footer>
            </div>
        </div>
    );
};

const root = createRoot(document.getElementById('root')!);
root.render(
    <ErrorBoundary>
        <App/>
    </ErrorBoundary>
);
