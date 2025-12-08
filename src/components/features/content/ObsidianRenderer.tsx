import React from 'react';
import {
    Info, CheckCircle, AlertTriangle, XCircle, Bug, HelpCircle,
    List, Quote, Clipboard, FileText, CheckSquare, Square, ExternalLink,
    ChevronDown, ChevronRight
} from 'lucide-react';
import { markdownTheme } from '../../../styles/markdownTheme';
import { BlogPost } from '../../../types';

interface ObsidianRendererProps {
    content: string;
    onNavigate?: (path: string) => void;
    basePath?: string;
    embedDepth?: number;
    loadedPosts?: BlogPost[];
}

interface CalloutStyles {
    color: string;
    icon: React.ReactNode;
}

interface FrontMatter {
    [key: string]: any;
}

// Declare MathJax type for TypeScript
declare global {
    interface Window {
        MathJax?: {
            typesetPromise?: (elements?: HTMLElement[]) => Promise<void>;
            tex2svgPromise?: (latex: string, options?: any) => Promise<HTMLElement>;
            startup?: {
                promise?: Promise<void>;
            };
        };
        mermaid?: {
            initialize: (config: any) => void;
            run: (config?: any) => Promise<void>;
        };
    }
}

const ObsidianRenderer: React.FC<ObsidianRendererProps> = ({
    content,
    onNavigate,
    basePath,
    embedDepth = 0,
    loadedPosts = []
}) => {
    const mathRef = React.useRef<HTMLDivElement>(null);
    const mermaidRef = React.useRef<number>(0);
    const [collapsedCallouts, setCollapsedCallouts] = React.useState<Set<string>>(new Set());

    // Initialize Mermaid
    React.useEffect(() => {
        if (typeof window !== 'undefined' && !window.mermaid) {
            // Load mermaid dynamically
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
            script.async = true;
            script.onload = () => {
                window.mermaid?.initialize({
                    startOnLoad: false,
                    theme: 'dark',
                    themeVariables: {
                        primaryColor: '#7c3aed',
                        primaryTextColor: '#e2e8f0',
                        primaryBorderColor: '#6d28d9',
                        lineColor: '#94a3b8',
                        secondaryColor: '#f59e0b',
                        tertiaryColor: '#10b981',
                        background: '#0f172a',
                        mainBkg: '#1e293b',
                        secondBkg: '#334155',
                    }
                });
            };
            document.head.appendChild(script);
        }
    }, []);

    // Typeset math and render mermaid diagrams after component mounts or updates
    React.useEffect(() => {
        if (window.MathJax && window.MathJax.typesetPromise && mathRef.current) {
            window.MathJax.typesetPromise([mathRef.current]).catch((err) => {
                console.error('MathJax typesetting failed:', err);
            });
        }

        // Render all mermaid diagrams
        if (window.mermaid && mathRef.current) {
            const mermaidElements = mathRef.current.querySelectorAll('.mermaid-diagram');
            if (mermaidElements.length > 0) {
                window.mermaid.run({ nodes: Array.from(mermaidElements) as any }).catch((err) => {
                    console.error('Mermaid rendering failed:', err);
                });
            }
        }
    }, [content]);

    // Parse YAML front matter
    const parseFrontMatter = (text: string): { frontMatter: FrontMatter | null, contentWithoutFrontMatter: string } => {
        const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
        const match = text.match(frontMatterRegex);

        if (!match) {
            return { frontMatter: null, contentWithoutFrontMatter: text };
        }

        const yamlContent = match[1];
        const contentWithoutFrontMatter = text.slice(match[0].length);

        // Simple YAML parser (handles basic cases)
        const frontMatter: FrontMatter = {};
        const lines = yamlContent.split('\n');
        let currentKey: string | null = null;
        let currentArray: any[] = [];

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            // Array item
            if (trimmed.startsWith('-')) {
                const value = trimmed.slice(1).trim();
                currentArray.push(value);
            } else if (trimmed.includes(':')) {
                // Save previous array if exists
                if (currentKey && currentArray.length > 0) {
                    frontMatter[currentKey] = currentArray;
                    currentArray = [];
                }

                const [key, ...valueParts] = trimmed.split(':');
                const value = valueParts.join(':').trim();
                currentKey = key.trim();

                if (value) {
                    // Direct value
                    frontMatter[currentKey] = value;
                    currentKey = null;
                }
            }
        }

        // Save last array if exists
        if (currentKey && currentArray.length > 0) {
            frontMatter[currentKey] = currentArray;
        }

        return { frontMatter, contentWithoutFrontMatter };
    };

    const renderFrontMatter = (frontMatter: FrontMatter) => {
        return (
            <div className={`mb-8 p-6 rounded-lg border ${markdownTheme.border.blockquote} ${markdownTheme.background.blockquote}`}>
                <h3 className={`text-lg font-bold mb-4 ${markdownTheme.text.heading3}`}>文档属性</h3>
                <div className="space-y-2">
                    {Object.entries(frontMatter).map(([key, value]) => (
                        <div key={key} className="flex flex-wrap gap-2 items-start">
                            <span className={`font-bold ${markdownTheme.text.secondary} min-w-[80px]`}>{key}:</span>
                            {Array.isArray(value) ? (
                                <div className="flex flex-wrap gap-2">
                                    {value.map((item, idx) => (
                                        <span key={idx} className={`text-xs px-2 py-1 rounded border ${markdownTheme.text.accent1}`}>
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <span className={markdownTheme.text.primary}>{String(value)}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderMath = (latex: string, isDisplay: boolean) => {
        if (isDisplay) {
            return <div className="flex justify-center my-4">{"\\[" + latex + "\\]"}</div>;
        } else {
            return <span style={{ display: 'inline' }}>{"\\(" + latex + "\\)"}</span>;
        }
    };

    const getCalloutStyles = (type: string): CalloutStyles => {
        const t = type.toLowerCase();
        switch (t) {
            case 'note':
            case 'info':
            case 'todo':
                return {
                    color: `${markdownTheme.callout.note.border} ${markdownTheme.callout.note.bg} ${markdownTheme.callout.note.text}`,
                    icon: <Info size={18} className={markdownTheme.callout.note.icon} />
                };
            case 'tip':
            case 'done':
            case 'success':
                return {
                    color: `${markdownTheme.callout.tip.border} ${markdownTheme.callout.tip.bg} ${markdownTheme.callout.tip.text}`,
                    icon: <CheckCircle size={18} className={markdownTheme.callout.tip.icon} />
                };
            case 'warning':
            case 'attention':
            case 'caution':
                return {
                    color: `${markdownTheme.callout.warning.border} ${markdownTheme.callout.warning.bg} ${markdownTheme.callout.warning.text}`,
                    icon: <AlertTriangle size={18} className={markdownTheme.callout.warning.icon} />
                };
            case 'fail':
            case 'failure':
            case 'error':
            case 'danger':
            case 'missing':
                return {
                    color: `${markdownTheme.callout.error.border} ${markdownTheme.callout.error.bg} ${markdownTheme.callout.error.text}`,
                    icon: <XCircle size={18} className={markdownTheme.callout.error.icon} />
                };
            case 'bug':
                return {
                    color: `${markdownTheme.callout.error.border} ${markdownTheme.callout.error.bg} ${markdownTheme.callout.error.text}`,
                    icon: <Bug size={18} className={markdownTheme.callout.error.icon} />
                };
            case 'question':
            case 'help':
            case 'faq':
                return {
                    color: `${markdownTheme.callout.question.border} ${markdownTheme.callout.question.bg} ${markdownTheme.callout.question.text}`,
                    icon: <HelpCircle size={18} className={markdownTheme.callout.question.icon} />
                };
            case 'example':
                return {
                    color: `${markdownTheme.callout.example.border} ${markdownTheme.callout.example.bg} ${markdownTheme.callout.example.text}`,
                    icon: <List size={18} className={markdownTheme.callout.example.icon} />
                };
            case 'quote':
            case 'cite':
                return {
                    color: `${markdownTheme.callout.quote.border} ${markdownTheme.callout.quote.bg} ${markdownTheme.callout.quote.text}`,
                    icon: <Quote size={18} className={markdownTheme.callout.quote.icon} />
                };
            case 'summary':
            case 'abstract':
                return {
                    color: `${markdownTheme.callout.summary.border} ${markdownTheme.callout.summary.bg} ${markdownTheme.callout.summary.text}`,
                    icon: <Clipboard size={18} className={markdownTheme.callout.summary.icon} />
                };
            default:
                return {
                    color: `${markdownTheme.callout.default.border} ${markdownTheme.callout.default.bg} ${markdownTheme.callout.default.text}`,
                    icon: <FileText size={18} className={markdownTheme.callout.default.icon} />
                };
        }
    };

    const toggleCallout = (calloutId: string) => {
        setCollapsedCallouts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(calloutId)) {
                newSet.delete(calloutId);
            } else {
                newSet.add(calloutId);
            }
            return newSet;
        });
    };

    // Enhanced inline parser with all Obsidian text formats
    const parseInlineFormats = (text: string): React.ReactNode => {
        // Priority order: code > math > links > highlight > strikethrough > bold-italic > bold > italic

        // 1. Inline code `...`
        const codeParts = text.split(/(`[^`]+`)/g);
        return (
            <>
                {codeParts.map((part, idx) => {
                    if (part.startsWith('`') && part.endsWith('`')) {
                        return (
                            <code key={idx} className={`${markdownTheme.background.inlineCode} ${markdownTheme.text.code} px-1.5 py-0.5 rounded text-sm font-mono`}>
                                {part.slice(1, -1)}
                            </code>
                        );
                    }

                    // 2. Inline Math $...$
                    const mathParts = part.split(/(\$[^$\n]+?\$)/g);
                    return (
                        <React.Fragment key={idx}>
                            {mathParts.map((mp, mpIdx) => {
                                if (mp.startsWith('$') && mp.endsWith('$')) {
                                    return <React.Fragment key={mpIdx}>{renderMath(mp.slice(1, -1), false)}</React.Fragment>;
                                }

                                // 3. Standard Markdown Links [text](url)
                                const linkRegex = /(\[([^\]]+)\]\(([^)]+)\))/g;
                                const linkParts: React.ReactNode[] = [];
                                let lastIndex = 0;
                                let match;
                                let linkCount = 0;

                                while ((match = linkRegex.exec(mp)) !== null) {
                                    if (match.index > lastIndex) {
                                        linkParts.push(
                                            <React.Fragment key={`text-${mpIdx}-${linkCount}`}>
                                                {parseWikiLinksAndFormats(mp.substring(lastIndex, match.index))}
                                            </React.Fragment>
                                        );
                                    }

                                    const linkText = match[2];
                                    const linkUrl = match[3];
                                    linkParts.push(
                                        <a
                                            key={`link-${mpIdx}-${linkCount}`}
                                            href={linkUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`${markdownTheme.text.link} underline inline-flex items-center gap-1`}
                                        >
                                            {linkText}
                                            <ExternalLink size={12} className="inline" />
                                        </a>
                                    );

                                    lastIndex = match.index + match[0].length;
                                    linkCount++;
                                }

                                if (linkParts.length > 0) {
                                    if (lastIndex < mp.length) {
                                        linkParts.push(
                                            <React.Fragment key={`text-${mpIdx}-end`}>
                                                {parseWikiLinksAndFormats(mp.substring(lastIndex))}
                                            </React.Fragment>
                                        );
                                    }
                                    return <React.Fragment key={mpIdx}>{linkParts}</React.Fragment>;
                                }

                                return <React.Fragment key={mpIdx}>{parseWikiLinksAndFormats(mp)}</React.Fragment>;
                            })}
                        </React.Fragment>
                    );
                })}
            </>
        );
    };

    const parseWikiLinksAndFormats = (text: string): React.ReactNode => {
        // 1. Obsidian Wiki Links [[...]]
        const wikiLinkRegex = /(\[\[[^\]]+\]\])/g;
        const wikiLinkParts = text.split(wikiLinkRegex);

        return (
            <>
                {wikiLinkParts.map((wlp, wlIdx) => {
                    const isWikiLink = wlp.startsWith('[[') && wlp.endsWith(']]');
                    const prevPart = wlIdx > 0 ? wikiLinkParts[wlIdx - 1] : '';
                    const isImageEmbed = prevPart.endsWith('!');

                    if (isWikiLink && !isImageEmbed) {
                        const innerContent = wlp.slice(2, -2);
                        const pipeSplit = innerContent.split('|');
                        const linkTarget = pipeSplit[0].trim();
                        const displayText = pipeSplit.length > 1 ? pipeSplit[1].trim() : linkTarget;

                        return (
                            <button
                                key={wlIdx}
                                onClick={() => onNavigate?.(linkTarget)}
                                className={`${markdownTheme.text.linkInternal} underline decoration-dotted cursor-pointer inline-flex items-center gap-1 font-medium`}
                                title={`导航到: ${linkTarget}`}
                            >
                                <ExternalLink size={12} className="inline" />
                                {displayText}
                            </button>
                        );
                    }

                    // 2. Parse text formats (highlight, strikethrough, bold, italic, tags)
                    return <React.Fragment key={wlIdx}>{parseTextFormats(wlp)}</React.Fragment>;
                })}
            </>
        );
    };

    const parseTextFormats = (text: string): React.ReactNode => {
        // 1. Highlight ==...==
        const highlightParts = text.split(/(==.+?==)/g);
        return (
            <>
                {highlightParts.map((hp, hpIdx) => {
                    if (hp.startsWith('==') && hp.endsWith('==')) {
                        return (
                            <mark key={hpIdx} className="bg-amber-500/30 text-amber-100 px-1 rounded">
                                {hp.slice(2, -2)}
                            </mark>
                        );
                    }

                    // 2. Strikethrough ~~...~~
                    const strikethroughParts = hp.split(/(~~.+?~~)/g);
                    return (
                        <React.Fragment key={hpIdx}>
                            {strikethroughParts.map((sp, spIdx) => {
                                if (sp.startsWith('~~') && sp.endsWith('~~')) {
                                    return (
                                        <del key={spIdx} className="opacity-60">
                                            {sp.slice(2, -2)}
                                        </del>
                                    );
                                }

                                // 3. Bold-Italic ***...***
                                const boldItalicParts = sp.split(/(\*\*\*.+?\*\*\*)/g);
                                return (
                                    <React.Fragment key={spIdx}>
                                        {boldItalicParts.map((bip, bipIdx) => {
                                            if (bip.startsWith('***') && bip.endsWith('***')) {
                                                return (
                                                    <strong key={bipIdx} className={`${markdownTheme.text.bold} font-semibold`}>
                                                        <em className={markdownTheme.text.italic}>{bip.slice(3, -3)}</em>
                                                    </strong>
                                                );
                                            }

                                            // 4. Bold **...**
                                            const boldParts = bip.split(/(\*\*.+?\*\*)/g);
                                            return (
                                                <React.Fragment key={bipIdx}>
                                                    {boldParts.map((bp, bpIdx) => {
                                                        if (bp.startsWith('**') && bp.endsWith('**')) {
                                                            return (
                                                                <strong key={bpIdx} className={`${markdownTheme.text.bold} font-semibold`}>
                                                                    {bp.slice(2, -2)}
                                                                </strong>
                                                            );
                                                        }

                                                        // 5. Italic *...*
                                                        const italicParts = bp.split(/(\*.+?\*)/g);
                                                        return (
                                                            <React.Fragment key={bpIdx}>
                                                                {italicParts.map((ip, ipIdx) => {
                                                                    if (ip.startsWith('*') && ip.endsWith('*') && ip.length > 2) {
                                                                        return <em key={ipIdx} className={markdownTheme.text.italic}>{ip.slice(1, -1)}</em>;
                                                                    }

                                                                    // 6. Tags #tag
                                                                    return <React.Fragment key={ipIdx}>{parseTagsAndComments(ip)}</React.Fragment>;
                                                                })}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            );
                                        })}
                                    </React.Fragment>
                                );
                            })}
                        </React.Fragment>
                    );
                })}
            </>
        );
    };

    const parseTagsAndComments = (text: string): React.ReactNode => {
        // Remove Obsidian comments %%...%%
        let cleanedText = text.replace(/%%[\s\S]*?%%/g, '');

        // Parse tags #tag (word boundary required)
        const tagRegex = /(#[a-zA-Z0-9_\u4e00-\u9fa5]+)/g;
        const parts = cleanedText.split(tagRegex);

        return (
            <>
                {parts.map((part, idx) => {
                    if (part.startsWith('#') && part.length > 1) {
                        return (
                            <span key={idx} className={`${markdownTheme.text.accent1} font-mono text-sm`}>
                                {part}
                            </span>
                        );
                    }
                    return <span key={idx}>{part}</span>;
                })}
            </>
        );
    };

    const renderTable = (lines: string[], key: string) => {
        if (lines.length < 2) return null;

        const parseRow = (row: string) => {
            let content = row.trim();
            if (content.startsWith('|')) content = content.substring(1);
            if (content.endsWith('|')) content = content.substring(0, content.length - 1);
            // Handle escaped pipes \|
            return content.split(/(?<!\\)\|/).map(c => c.trim().replace(/\\\|/g, '|'));
        };

        const parseAlignment = (alignRow: string): ('left' | 'center' | 'right')[] => {
            const cells = parseRow(alignRow);
            return cells.map(cell => {
                if (cell.startsWith(':') && cell.endsWith(':')) return 'center';
                if (cell.endsWith(':')) return 'right';
                return 'left';
            });
        };

        const headers = parseRow(lines[0]);
        const alignments = parseAlignment(lines[1]);
        const bodyRows = lines.slice(2).map(parseRow);

        return (
            <div key={key} className={`my-6 overflow-x-auto rounded-lg border ${markdownTheme.border.table} shadow-lg`}>
                <table className={`min-w-full divide-y ${markdownTheme.border.table} ${markdownTheme.background.table}`}>
                    <thead className={markdownTheme.background.tableHeader}>
                        <tr>
                            {headers.map((h, i) => (
                                <th key={i}
                                    style={{ textAlign: alignments[i] || 'left' }}
                                    className={`px-6 py-3 text-xs font-bold text-amber-400 uppercase tracking-wider border-b ${markdownTheme.border.table}`}>
                                    {parseInlineFormats(h)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {bodyRows.map((row, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-transparent' : markdownTheme.background.tableRowAlt}>
                                {row.map((cell, cIdx) => (
                                    <td key={cIdx}
                                        style={{ textAlign: alignments[cIdx] || 'left' }}
                                        className={`px-6 py-4 whitespace-nowrap text-sm ${markdownTheme.text.primary} border-r border-slate-800/50 last:border-0`}>
                                        {parseInlineFormats(cell)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderSimpleText = (text: string): React.ReactNode => {
        const lines = text.split('\n');
        return lines.map((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={idx} className="h-4" />;
            return (
                <p key={idx} className={`my-2 ${markdownTheme.text.primary} leading-relaxed`}>
                    {parseInlineFormats(trimmed)}
                </p>
            );
        });
    };

    const parseBlocks = (contentToParse: string) => {
        // Remove HTML comments - use multiple passes to ensure complete removal
        let cleanedContent = contentToParse;
        let previousContent;
        do {
            previousContent = cleanedContent;
            cleanedContent = cleanedContent.replace(/<!--[\s\S]*?-->/g, '');
        } while (previousContent !== cleanedContent);
        
        // Split by code blocks
        const codeSplit = cleanedContent.split(/(```[\s\S]*?```)/g);
        const result: React.ReactNode[] = [];

        codeSplit.forEach((section, secIdx) => {
            if (section.startsWith('```')) {
                const langMatch = section.match(/^```([a-z]*)\n/);
                const lang = langMatch ? langMatch[1] : '';
                const codeContent = section.replace(/^```[a-z]*\n/, '').replace(/```$/, '');

                // Check if it's a mermaid diagram
                if (lang === 'mermaid') {
                    mermaidRef.current += 1;
                    result.push(
                        <div key={`mermaid-${secIdx}`} className={`my-6 p-4 rounded-lg border ${markdownTheme.border.codeBlock} ${markdownTheme.background.codeBlock} overflow-x-auto`}>
                            <div className="mermaid-diagram">
                                {codeContent.trim()}
                            </div>
                        </div>
                    );
                } else {
                    result.push(
                        <div key={`code-${secIdx}`} className="relative group my-6">
                            {lang && <span className={`absolute right-2 top-2 text-xs ${markdownTheme.text.secondary} font-mono select-none`}>{lang}</span>}
                            <pre className={`${markdownTheme.background.codeBlock} border ${markdownTheme.border.codeBlock} p-4 rounded-lg overflow-x-auto text-sm font-mono ${markdownTheme.text.code} shadow-inner`}>
                                <code>{codeContent.trim()}</code>
                            </pre>
                        </div>
                    );
                }
            } else {
                const lines = section.split('\n');
                let i = 0;
                while (i < lines.length) {
                    const line = lines[i];
                    const trimmed = line.trim();
                    const key = `block-${secIdx}-${i}`;

                    if (!trimmed) {
                        result.push(<div key={key} className="h-4" />);
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
                                <div key={key} className={`my-6 overflow-x-auto text-center py-2 ${markdownTheme.background.math} rounded border ${markdownTheme.border.math}`}>
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
                        const content = parseInlineFormats(text);
                        // Generate anchor ID from header text
                        const anchorId = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-');

                        switch (level) {
                            case 1:
                                result.push(<h1 key={key} id={anchorId} className={`text-3xl font-serif font-bold ${markdownTheme.text.heading1} mt-8 mb-4 border-b ${markdownTheme.border.heading1} pb-2 flex items-center gap-2`}>{content}</h1>);
                                break;
                            case 2:
                                result.push(<h2 key={key} id={anchorId} className={`text-2xl font-serif font-bold ${markdownTheme.text.heading2} mt-6 mb-3 pl-3 border-l-4 ${markdownTheme.border.heading2}`}>{content}</h2>);
                                break;
                            case 3:
                                result.push(<h3 key={key} id={anchorId} className={`text-xl font-bold ${markdownTheme.text.heading3} mt-5 mb-2`}>{content}</h3>);
                                break;
                            case 4:
                                result.push(<h4 key={key} id={anchorId} className={`text-lg font-bold ${markdownTheme.text.heading4} mt-4 mb-2 flex items-center gap-2`}><div className="w-1.5 h-1.5 rounded-full bg-amber-400" />{content}</h4>);
                                break;
                            default:
                                result.push(<h5 key={key} id={anchorId} className={`font-bold ${markdownTheme.text.heading5} mt-3`}>{content}</h5>);
                        }
                        i++;
                        continue;
                    }

                    // D. Obsidian Embeds ![[...]]
                    if (trimmed.match(/!\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/)) {
                        const match = trimmed.match(/!\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/);
                        if (match) {
                            const embedName = match[1];
                            const sizeSpec = match[2];

                            const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp'];
                            const isImage = imageExtensions.some(ext => embedName.toLowerCase().endsWith(ext));

                            if (isImage) {
                                const encodedName = encodeURIComponent(embedName);
                                const imageUrl = `https://raw.githubusercontent.com/66six11/BlogsWeb/main/attachments/${encodedName}`;
                                
                                // Parse size specification
                                let widthStyle = {};
                                let heightStyle = {};
                                if (sizeSpec) {
                                    const sizeMatch = sizeSpec.match(/^(\d+)(?:x(\d+))?$/);
                                    if (sizeMatch) {
                                        const width = sizeMatch[1];
                                        const height = sizeMatch[2];
                                        widthStyle = { width: `${width}px` };
                                        if (height) {
                                            heightStyle = { height: `${height}px` };
                                        }
                                    }
                                }

                                result.push(
                                    <div key={key} className="my-6 flex flex-col items-center">
                                        <img
                                            src={imageUrl}
                                            alt={embedName}
                                            style={{ ...widthStyle, ...heightStyle }}
                                            className={`max-w-full md:max-w-lg rounded-lg border ${markdownTheme.border.image} shadow-lg opacity-100`}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                        <span className={`text-xs ${markdownTheme.text.secondary} mt-2 italic`}>{embedName}</span>
                                    </div>
                                );
                            } else {
                                // Article embed
                                if (embedDepth >= 1) {
                                    result.push(
                                        <div key={key} className={`my-4 p-4 rounded-lg border ${markdownTheme.border.blockquote} ${markdownTheme.background.blockquote}`}>
                                            <div className="flex items-center gap-2">
                                                <ExternalLink size={16} className={markdownTheme.text.linkInternal} />
                                                <button
                                                    onClick={() => onNavigate?.(embedName)}
                                                    className={`${markdownTheme.text.linkInternal} underline font-medium hover:opacity-80`}
                                                >
                                                    {embedName}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                } else {
                                    const normalizedTarget = embedName.toLowerCase().trim();
                                    const embeddedPost = loadedPosts.find((p) => {
                                        const title = p.title.toLowerCase();
                                        const filename = p.path?.split('/').pop()?.replace('.md', '').toLowerCase() || '';
                                        return title === normalizedTarget ||
                                            filename === normalizedTarget ||
                                            title.startsWith(normalizedTarget) ||
                                            filename.startsWith(normalizedTarget);
                                    });

                                    if (embeddedPost) {
                                        result.push(
                                            <div key={key} className={`my-6 p-6 rounded-lg border-2 ${markdownTheme.border.blockquote} ${markdownTheme.background.blockquote}`}>
                                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/50">
                                                    <h3 className={`text-lg font-bold ${markdownTheme.text.heading3}`}>
                                                        {embeddedPost.title}
                                                    </h3>
                                                    <button
                                                        onClick={() => onNavigate?.(embedName)}
                                                        className={`${markdownTheme.text.linkInternal} flex items-center gap-1 text-sm hover:opacity-80 transition-opacity`}
                                                    >
                                                        <span>查看全文</span>
                                                        <ExternalLink size={14} />
                                                    </button>
                                                </div>
                                                <div className="embedded-content">
                                                    <ObsidianRenderer
                                                        content={embeddedPost.content}
                                                        onNavigate={onNavigate}
                                                        basePath={basePath}
                                                        embedDepth={embedDepth + 1}
                                                        loadedPosts={loadedPosts}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        result.push(
                                            <div key={key} className={`my-4 p-4 rounded-lg border ${markdownTheme.border.blockquote} ${markdownTheme.background.blockquote}`}>
                                                <div className="flex items-center gap-2">
                                                    <ExternalLink size={16} className={markdownTheme.text.secondary} />
                                                    <button
                                                        onClick={() => onNavigate?.(embedName)}
                                                        className={`${markdownTheme.text.linkInternal} underline font-medium hover:opacity-80`}
                                                    >
                                                        {embedName}
                                                    </button>
                                                    <span className={`text-xs ${markdownTheme.text.secondary} italic`}>(点击加载)</span>
                                                </div>
                                            </div>
                                        );
                                    }
                                }
                            }
                            i++;
                            continue;
                        }
                    }

                    // E. Standard Images ![...](...)
                    const imgMatch = line.match(/^!\[([^\]]*?)?\]\((.*?)\)/);
                    if (imgMatch) {
                        const altText = imgMatch[1] || '';
                        const imageUrl = imgMatch[2];
                        result.push(
                            <div key={key} className="my-6 flex flex-col items-center">
                                <img src={imageUrl} alt={altText} className={`max-w-full rounded-lg border ${markdownTheme.border.image} shadow-lg opacity-100`} />
                                {altText && <span className={`text-xs ${markdownTheme.text.secondary} mt-2 italic`}>{altText}</span>}
                            </div>
                        );
                        i++;
                        continue;
                    }

                    // F. Obsidian Callouts & Blockquotes (with nested support)
                    if (trimmed.startsWith('>')) {
                        const quoteLines = [];
                        let j = i;
                        let emptyLineCount = 0;

                        while (j < lines.length) {
                            const currentLine = lines[j].trim();

                            if (currentLine.startsWith('>')) {
                                quoteLines.push(lines[j]);
                                emptyLineCount = 0;
                                j++;
                            } else if (currentLine === '' && quoteLines.length > 0) {
                                emptyLineCount++;
                                if (emptyLineCount >= 1 && j + 1 < lines.length) {
                                    const nextLine = lines[j + 1].trim();
                                    if (!nextLine.startsWith('>')) {
                                        break;
                                    } else if (nextLine.startsWith('> [!')) {
                                        break;
                                    }
                                }
                                quoteLines.push(lines[j]);
                                j++;
                            } else {
                                break;
                            }
                        }

                        if (quoteLines.length > 0) {
                            const firstLineContent = quoteLines[0].replace(/^>\s*/, '');
                            const calloutMatch = firstLineContent.match(/^\[!([^\]]+)\]([-+])?(.*)/);

                            if (calloutMatch) {
                                // Obsidian Callout with optional fold indicator
                                const calloutType = calloutMatch[1];
                                const foldIndicator = calloutMatch[2]; // '-' or '+'
                                const calloutTitle = calloutMatch[3].trim();
                                const bodyContent = quoteLines.slice(1).map(l => l.replace(/^>\s?/, '')).join('\n');
                                const styles = getCalloutStyles(calloutType);
                                const calloutId = `${key}-${calloutType}`;

                                const isCollapsible = foldIndicator !== undefined;
                                const defaultCollapsed = foldIndicator === '-';
                                // If in set, it means user toggled it, so invert the default
                                const isCollapsed = collapsedCallouts.has(calloutId) 
                                    ? !defaultCollapsed 
                                    : defaultCollapsed;

                                result.push(
                                    <div key={key} className={`my-6 rounded-lg border p-4 ${styles.color}`}>
                                        <div
                                            className={`flex items-start gap-3 mb-2 ${isCollapsible ? 'cursor-pointer' : ''}`}
                                            onClick={isCollapsible ? () => toggleCallout(calloutId) : undefined}
                                        >
                                            {styles.icon}
                                            <div className="font-bold text-lg flex-1">{calloutTitle || calloutType}</div>
                                            {isCollapsible && (
                                                isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />
                                            )}
                                        </div>
                                        {!isCollapsed && (
                                            <div className="pl-9">
                                                {/* Support nested callouts by recursively parsing blocks */}
                                                {/* Check if content has nested blockquotes/callouts (starts with > at line beginning) */}
                                                {/^>\s*(\[!|>)/m.test(bodyContent)
                                                    ? parseBlocks(bodyContent)
                                                    : renderSimpleText(bodyContent)
                                                }
                                            </div>
                                        )}
                                    </div>
                                );
                            } else {
                                // Standard Blockquote
                                const bodyContent = quoteLines.map(l => l.replace(/^>\s?/, '')).join('\n');
                                result.push(
                                    <div key={key} className={`my-6 border-l-4 ${markdownTheme.border.blockquote} pl-4 py-2 ${markdownTheme.background.blockquote} italic ${markdownTheme.text.primary}`}>
                                        {renderSimpleText(bodyContent)}
                                    </div>
                                );
                            }
                            i = j;
                            continue;
                        }
                    }

                    // G. Lists & Task Lists
                    if (trimmed.match(/^(\s*[-*+]|\s*\d+\.)/)) {
                        const listLines = [];
                        let j = i;
                        while (j < lines.length) {
                            const line = lines[j];
                            const lineTrimmed = line.trim();
                            if (lineTrimmed.match(/^([-*+]|\d+\.)/) || lineTrimmed === '') {
                                listLines.push(line);
                                j++;
                            } else if (line.match(/^\s+/) && listLines.length > 0) {
                                listLines.push(line);
                                j++;
                            } else {
                                break;
                            }
                        }

                        interface ListItem {
                            type: 'ul' | 'ol';
                            content: string;
                            children: string[];
                            indent: number;
                            isTask?: boolean;
                            taskChecked?: boolean;
                        }

                        // Helper to calculate minimum indentation of child items
                        const getMinChildIndent = (children: string[]): number => {
                            const childIndents = children
                                .map(line => {
                                    if (!line.trim()) return Infinity;
                                    const match = line.match(/^(\s*)/);
                                    return match ? match[1].length : 0;
                                })
                                .filter(indent => indent !== Infinity);
                            return childIndents.length > 0 ? Math.min(...childIndents) : 0;
                        };

                        const parseListItems = (lines: string[], baseIndent: number = 0): React.ReactNode => {
                            const items: ListItem[] = [];
                            let idx = 0;

                            while (idx < lines.length) {
                                const line = lines[idx];
                                const trimmed = line.trim();

                                if (!trimmed) {
                                    idx++;
                                    continue;
                                }

                                const indentMatch = line.match(/^(\s*)/);
                                const indent = indentMatch ? indentMatch[1].length : 0;

                                if (indent < baseIndent) {
                                    break;
                                }

                                if (indent > baseIndent) {
                                    idx++;
                                    continue;
                                }

                                const taskMatch = trimmed.match(/^[-*+]\s*\[(.)\]\s*(.*)/);
                                const orderedMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
                                const unorderedMatch = trimmed.match(/^[-*+]\s*(.*)/);

                                let content = '';
                                let type: 'ul' | 'ol' = 'ul';
                                let isTask = false;
                                let taskChecked = false;

                                if (taskMatch) {
                                    isTask = true;
                                    taskChecked = taskMatch[1] !== ' ';
                                    content = taskMatch[2];
                                    type = 'ul';
                                } else if (orderedMatch) {
                                    content = orderedMatch[2];
                                    type = 'ol';
                                } else if (unorderedMatch) {
                                    content = unorderedMatch[1];
                                    type = 'ul';
                                }

                                const children: string[] = [];
                                let k = idx + 1;
                                while (k < lines.length) {
                                    const childLine = lines[k];
                                    const childTrimmed = childLine.trim();
                                    if (!childTrimmed) {
                                        k++;
                                        continue;
                                    }
                                    const childIndent = (childLine.match(/^(\s*)/) || ['', ''])[1].length;
                                    if (childIndent > indent) {
                                        children.push(childLine);
                                        k++;
                                    } else {
                                        break;
                                    }
                                }

                                items.push({ type, content, children, indent, isTask, taskChecked });
                                idx = k;
                            }

                            // Group consecutive items of the same type, but preserve structure
                            const renderGroups: React.ReactNode[] = [];
                            let i = 0;
                            
                            while (i < items.length) {
                                const currentItem = items[i];
                                const currentType = currentItem.type;
                                const group: typeof items = [currentItem];
                                
                                // Look ahead to group consecutive items of same type
                                let j = i + 1;
                                while (j < items.length && items[j].type === currentType) {
                                    group.push(items[j]);
                                    j++;
                                }
                                
                                const ListTag = currentType === 'ul' ? 'ul' : 'ol';
                                const className = currentType === 'ul'
                                    ? 'list-disc pl-6 space-y-1'
                                    : 'list-decimal pl-6 space-y-1';
                                
                                renderGroups.push(
                                    <ListTag key={i} className={className}>
                                        {group.map((item: ListItem, iIdx) => (
                                            <li key={iIdx} className={item.isTask ? "flex items-start gap-2" : markdownTheme.text.primary}>
                                                {item.isTask && (
                                                    item.taskChecked ? (
                                                        <CheckSquare size={15} className={`${markdownTheme.callout.tip.icon} mt-0.5`} />
                                                    ) : (
                                                        <Square size={15} className={`${markdownTheme.text.secondary} mt-0.5`} />
                                                    )
                                                )}
                                                <span className={markdownTheme.text.primary}>{parseInlineFormats(item.content)}</span>
                                                {item.children.length > 0 && (
                                                    <div className="mt-1">
                                                        {parseListItems(item.children, getMinChildIndent(item.children))}
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ListTag>
                                );
                                
                                i = j;
                            }

                            return <>{renderGroups}</>;
                        };

                        result.push(
                            <div key={key} className="my-4">
                                {parseListItems(listLines, 0)}
                            </div>
                        );
                        i = j;
                        continue;
                    }

                    // H. Horizontal Rule
                    if (trimmed.match(/^[-*_]{3,}$/)) {
                        result.push(<hr key={key} className={`my-8 border-t ${markdownTheme.border.horizontalRule}`} />);
                        i++;
                        continue;
                    }

                    // I. Paragraph
                    result.push(
                        <p key={key} className={`my-3 ${markdownTheme.text.primary} leading-relaxed`}>
                            {parseInlineFormats(trimmed)}
                        </p>
                    );
                    i++;
                }
            }
        });

        return result;
    };

    // Main render function
    const { frontMatter, contentWithoutFrontMatter } = parseFrontMatter(content);

    return (
        <div ref={mathRef} className="markdown-content obsidian-content">
            {frontMatter && renderFrontMatter(frontMatter)}
            {parseBlocks(contentWithoutFrontMatter)}
        </div>
    );
};

export default ObsidianRenderer;
