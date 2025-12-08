import React from 'react';
import {
    Info, CheckCircle, AlertTriangle, XCircle, Bug, HelpCircle,
    List, Quote, Clipboard, FileText, CheckSquare, Square, ExternalLink
} from 'lucide-react';
import { markdownTheme } from '../../../styles/markdownTheme';

import { BlogPost } from '../../../types';

interface MarkdownRendererProps {
    content: string;
    onNavigate?: (path: string) => void; // 处理内部链接点击
    basePath?: string; // 当前文件的基础路径，用于解析相对链接
    embedDepth?: number; // 嵌套深度，防止循环嵌入
    loadedPosts?: BlogPost[]; // 已加载的文章列表，用于文章嵌入
}

interface CalloutStyles {
    color: string;
    icon: React.ReactNode;
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
    }
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
    content, 
    onNavigate, 
    basePath, 
    embedDepth = 0, 
    loadedPosts = [] 
}) => {
    const mathRef = React.useRef<HTMLDivElement>(null);

    // Typeset math after component mounts or updates
    React.useEffect(() => {
        if (window.MathJax && window.MathJax.typesetPromise && mathRef.current) {
            window.MathJax.typesetPromise([mathRef.current]).catch((err) => {
                console.error('MathJax typesetting failed:', err);
            });
        }
    }, [content]);

    const renderMath = (latex: string, isDisplay: boolean) => {
        // Return LaTeX with delimiters, MathJax will process it
        if (isDisplay) {
            return <div className="flex justify-center my-4">{"\\[" + latex + "\\]"}</div>;
        } else {
            return <span className="inline">{"\\(" + latex + "\\)"}</span>;
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

    const parseInline = (text: string) => {
        // 1. Inline Math $...$
        const parts = text.split(/(\$[^$\n]+?\$)/g);

        return parts.map((part, index) => {
            if (part.startsWith('$') && part.endsWith('$')) {
                return <span key={`math-${index}`} className="inline">{renderMath(part.slice(1, -1), false)}</span>;
            }

            // 2. Standard Markdown Links [text](url) - process before wiki links
            const linkRegex = /(\[([^\]]+)\]\(([^)]+)\))/g;
            const linkParts: React.ReactNode[] = [];
            let lastIndex = 0;
            let match;
            let linkCount = 0;

            while ((match = linkRegex.exec(part)) !== null) {
                // Add text before the link
                if (match.index > lastIndex) {
                    const textBefore = part.substring(lastIndex, match.index);
                    linkParts.push(
                        <React.Fragment key={`text-${index}-${linkCount}`}>
                            {parseInlineWithoutLinks(textBefore)}
                        </React.Fragment>
                    );
                }

                // Add the link
                const linkText = match[2];
                const linkUrl = match[3];
                linkParts.push(
                    <a
                        key={`link-${index}-${linkCount}`}
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

            // If we found links, process the remaining text
            if (linkParts.length > 0) {
                if (lastIndex < part.length) {
                    linkParts.push(
                        <React.Fragment key={`text-${index}-end`}>
                            {parseInlineWithoutLinks(part.substring(lastIndex))}
                        </React.Fragment>
                    );
                }
                return <React.Fragment key={`inline-${index}`}>{linkParts}</React.Fragment>;
            }

            // 3. No standard links found, process wiki links and formatting
            return <React.Fragment key={`inline-${index}`}>{parseInlineWithoutLinks(part)}</React.Fragment>;
        });
    };

    // Helper function to parse inline elements except standard markdown links
    const parseInlineWithoutLinks = (text: string) => {
        // Obsidian Wiki Links [[...]] - must come before bold/italic parsing
        // Match [[link]] or [[link|display text]] but NOT ![[image]]
        const wikiLinkRegex = /(\[\[[^\]]+\]\])/g;
        const wikiLinkParts = text.split(wikiLinkRegex);
        return (
            <>
                {wikiLinkParts.map((wlp, wlIdx) => {
                    // Check if this is a wiki link (starts with [[ and ends with ]]) 
                    // AND not preceded by ! (check the original text context)
                    const isWikiLink = wlp.startsWith('[[') && wlp.endsWith(']]');
                    // Check if previous part ends with ! to exclude ![[image]]
                    const prevPart = wlIdx > 0 ? wikiLinkParts[wlIdx - 1] : '';
                    const isImageEmbed = prevPart.endsWith('!');
                    
                    if (isWikiLink && !isImageEmbed) {
                        const innerContent = wlp.slice(2, -2); // Remove [[ and ]]
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

                    // Bold **...**
                    const boldParts = wlp.split(/(\*\*.*?\*\*)/g);
                    return (
                        <React.Fragment key={wlIdx}>
                            {boldParts.map((bp, bIdx) => {
                                if (bp.startsWith('**') && bp.endsWith('**')) {
                                    return <strong key={bIdx}
                                        className={`${markdownTheme.text.bold} font-semibold`}>{bp.slice(2, -2)}</strong>;
                                }
                                // Italic *...*
                                const italicParts = bp.split(/(\*.*?\*)/g);
                                return (
                                    <React.Fragment key={bIdx}>
                                        {italicParts.map((ip, iIdx) => {
                                            if (ip.startsWith('*') && ip.endsWith('*') && ip.length > 2) {
                                                return <em key={iIdx} className={markdownTheme.text.italic}>{ip.slice(1, -1)}</em>;
                                            }
                                            return <span key={iIdx}>{ip}</span>;
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
            <div key={key} className={`my-6 overflow-x-auto rounded-lg border ${markdownTheme.border.table} shadow-lg`}>
                <table className={`min-w-full divide-y ${markdownTheme.border.table} ${markdownTheme.background.table}`}>
                    <thead className={markdownTheme.background.tableHeader}>
                        <tr>
                            {headers.map((h, i) => (
                                <th key={i}
                                    className={`px-6 py-3 text-left text-xs font-bold text-amber-400 uppercase tracking-wider border-b ${markdownTheme.border.table}`}>
                                    {parseInline(h)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {bodyRows.map((row, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-transparent' : markdownTheme.background.tableRowAlt}>
                                {row.map((cell, cIdx) => (
                                    <td key={cIdx}
                                        className={`px-6 py-4 whitespace-nowrap text-sm ${markdownTheme.text.primary} border-r border-slate-800/50 last:border-0`}>
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

    // Helper function to render simple text (for callouts and blockquotes)
    const renderSimpleText = (text: string): React.ReactNode => {
        const lines = text.split('\n');
        return lines.map((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={idx} className="h-4" />;
            return (
                <p key={idx} className={`my-2 ${markdownTheme.text.primary} leading-relaxed`}>
                    {parseInline(trimmed)}
                </p>
            );
        });
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
                            className={`absolute right-2 top-2 text-xs ${markdownTheme.text.secondary} font-mono select-none`}>{lang}</span>}
                        <pre
                            className={`${markdownTheme.background.codeBlock} border ${markdownTheme.border.codeBlock} p-4 rounded-lg overflow-x-auto text-sm font-mono ${markdownTheme.text.code} shadow-inner`}>
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
                                    className={`my-6 overflow-x-auto text-center py-2 ${markdownTheme.background.math} rounded border ${markdownTheme.border.math}`}>
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
                                    className={`text-3xl font-serif font-bold ${markdownTheme.text.heading1} mt-8 mb-4 border-b ${markdownTheme.border.heading1} pb-2 flex items-center gap-2`}>
                                    {content}</h1>);
                                break;
                            case 2:
                                result.push(<h2 key={key}
                                    className={`text-2xl font-serif font-bold ${markdownTheme.text.heading2} mt-6 mb-3 pl-3 border-l-4 ${markdownTheme.border.heading2}`}>{content}</h2>);
                                break;
                            case 3:
                                result.push(<h3 key={key}
                                    className={`text-xl font-bold ${markdownTheme.text.heading3} mt-5 mb-2`}>{content}</h3>);
                                break;
                            case 4:
                                result.push(<h4 key={key}
                                    className={`text-lg font-bold ${markdownTheme.text.heading4} mt-4 mb-2 flex items-center gap-2`}>
                                    <div className="w-1.5 h-1.5 rounded-full  bg-amber-400" />
                                    {content}</h4>);
                                break;
                            default:
                                result.push(<h5 key={key} className={`font-bold ${markdownTheme.text.heading5} mt-3`}>{content}</h5>);
                        }
                        i++;
                        continue;
                    }

                    // D. Obsidian Embeds ![[...]] - handle both images and articles
                    if (trimmed.match(/!\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/)) {
                        const match = trimmed.match(/!\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/);
                        if (match) {
                            const embedName = match[1];
                            
                            // Check if it's an image file (common image extensions)
                            const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp'];
                            const isImage = imageExtensions.some(ext => embedName.toLowerCase().endsWith(ext));
                            
                            if (isImage) {
                                // Render as image
                                const encodedName = encodeURIComponent(embedName);
                                const imageUrl = `https://raw.githubusercontent.com/66six11/BlogsWeb/main/attachments/${encodedName}`;
                                result.push(
                                    <div key={key} className="my-6 flex flex-col items-center">
                                        <img
                                            src={imageUrl}
                                            alt={embedName}
                                            className={`max-w-full md:max-w-lg rounded-lg border ${markdownTheme.border.image} shadow-lg opacity-100`}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                        <span className={`text-xs ${markdownTheme.text.secondary} mt-2 italic`}>{embedName}</span>
                                    </div>
                                );
                            } else {
                                // Render as article embed
                                if (embedDepth >= 1) {
                                    // Max depth reached, render as a link block only
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
                                    // Render embedded article content
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
                                                    <MarkdownRenderer 
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
                                        // Article not found, render as link
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

                    // E. Standard Images ![...](...)  - handle optional |size in alt text
                    // Obsidian size formats can be: |100, |100x200, |small, etc.
                    const imgMatch = line.match(/^!\[(\|[^\]]*)?([^\]]*?)?\]\((.*?)\)/);
                    if (imgMatch) {
                        // imgMatch[1] is the optional size prefix (e.g., "|300", "|100x200", etc.)
                        // imgMatch[2] is the actual alt text, imgMatch[3] is the URL
                        const altText = imgMatch[2] || '';
                        const imageUrl = imgMatch[3];
                        result.push(
                            <div key={key} className="my-6 flex flex-col items-center">
                                <img src={imageUrl} alt={altText}
                                    className={`max-w-full rounded-lg border ${markdownTheme.border.image} shadow-lg opacity-100`} />
                                {altText &&
                                    <span className={`text-xs ${markdownTheme.text.secondary} mt-2 italic`}>{altText}</span>}
                            </div>
                        );
                        i++;
                        continue;
                    }

                    // F. Obsidian Callouts & Blockquotes
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
                                // Empty line - might be inside quote or separator
                                emptyLineCount++;
                                // If we see 2 consecutive empty lines, or 1 empty line followed by non-quote, break
                                if (emptyLineCount >= 1 && j + 1 < lines.length) {
                                    const nextLine = lines[j + 1].trim();
                                    if (!nextLine.startsWith('>')) {
                                        // Next line is not a quote, stop here
                                        break;
                                    } else if (nextLine.startsWith('> [!')) {
                                        // Next line is a new callout, stop here
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
                            const calloutMatch = firstLineContent.match(/^\[!([^\]]+)\](.*)/);

                            if (calloutMatch) {
                                // Obsidian Callout
                                const calloutType = calloutMatch[1];
                                const calloutTitle = calloutMatch[2].trim();
                                const bodyContent = quoteLines.slice(1).map(l => l.replace(/^>\s?/, '')).join('\n');
                                const styles = getCalloutStyles(calloutType);

                                result.push(
                                    <div key={key} className={`my-6 rounded-lg border p-4 ${styles.color}`}>
                                        <div className="flex items-start gap-3 mb-2">
                                            {styles.icon}
                                            <div className="font-bold text-lg">{calloutTitle || calloutType}</div>
                                        </div>
                                        <div className="pl-9">
                                            {renderSimpleText(bodyContent)}
                                        </div>
                                    </div>
                                );
                            } else {
                                // Standard Blockquote
                                const bodyContent = quoteLines.map(l => l.replace(/^>\s?/, '')).join('\n');
                                result.push(
                                    <div key={key}
                                        className={`my-6 border-l-4 ${markdownTheme.border.blockquote} pl-4 py-2 ${markdownTheme.background.blockquote} italic ${markdownTheme.text.primary}`}>
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
                        // Collect all consecutive list items (including empty lines between them)
                        while (j < lines.length) {
                            const line = lines[j];
                            const lineTrimmed = line.trim();
                            // Continue if it's a list item or an empty line
                            if (lineTrimmed.match(/^([-*+]|\d+\.)/) || lineTrimmed === '') {
                                listLines.push(line);
                                j++;
                            } else if (line.match(/^\s+/) && listLines.length > 0) {
                                // Also include indented continuation lines
                                listLines.push(line);
                                j++;
                            } else {
                                break;
                            }
                        }

                        // Parse list items with proper nesting support
                        const parseListItems = (lines: string[], baseIndent: number = 0): React.ReactNode => {
                            const items: Array<{ type: 'ul' | 'ol', content: string, children: string[], indent: number }> = [];
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
                                
                                // Skip items that are too indented (they belong to parent)
                                if (indent < baseIndent) {
                                    break;
                                }
                                
                                // Skip items that are too deeply indented (will be processed as children)
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
                                
                                // Collect child items (items with greater indentation)
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
                                
                                items.push({ type, content, children, indent, isTask, taskChecked } as any);
                                idx = k;
                            }
                            
                            // Group consecutive items by type
                            const groups: Array<{ type: 'ul' | 'ol', items: typeof items }> = [];
                            let currentGroup: typeof items = [];
                            let currentType: 'ul' | 'ol' | null = null;
                            
                            for (const item of items) {
                                if (currentType === null || currentType === item.type) {
                                    currentType = item.type;
                                    currentGroup.push(item);
                                } else {
                                    if (currentGroup.length > 0) {
                                        groups.push({ type: currentType, items: currentGroup });
                                    }
                                    currentType = item.type;
                                    currentGroup = [item];
                                }
                            }
                            
                            if (currentGroup.length > 0 && currentType !== null) {
                                groups.push({ type: currentType, items: currentGroup });
                            }
                            
                            return (
                                <>
                                    {groups.map((group, gIdx) => {
                                        const ListTag = group.type === 'ul' ? 'ul' : 'ol';
                                        const className = group.type === 'ul'
                                            ? 'list-disc pl-6 space-y-1'
                                            : 'list-decimal pl-6 space-y-1';
                                        
                                        return (
                                            <ListTag key={gIdx} className={className}>
                                                {group.items.map((item: any, iIdx) => (
                                                    <li key={iIdx} className={item.isTask ? "flex items-start gap-2" : markdownTheme.text.primary}>
                                                        {item.isTask && (
                                                            item.taskChecked ? (
                                                                <CheckSquare size={15} className={`${markdownTheme.callout.tip.icon} mt-0.5`} />
                                                            ) : (
                                                                <Square size={15} className={`${markdownTheme.text.secondary} mt-0.5`} />
                                                            )
                                                        )}
                                                        <span className={markdownTheme.text.primary}>{parseInline(item.content)}</span>
                                                        {item.children.length > 0 && (
                                                            <div className="mt-1">
                                                                {parseListItems(item.children, item.indent + 2)}
                                                            </div>
                                                        )}
                                                    </li>
                                                ))}
                                            </ListTag>
                                        );
                                    })}
                                </>
                            );
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
                            {parseInline(trimmed)}
                        </p>
                    );
                    i++;
                }
            }
        });

        return result;
    };

    return <div ref={mathRef} className="markdown-content">{parseBlocks()}</div>;
};

// Export the component for reuse
export default MarkdownRenderer;