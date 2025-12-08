import React from 'react';
import {
    Info, CheckCircle, AlertTriangle, XCircle, Bug, HelpCircle,
    List, Quote, Clipboard, FileText, CheckSquare, Square, ExternalLink
} from 'lucide-react';
import { markdownTheme } from '../../../styles/markdownTheme';

interface MarkdownRendererProps {
    content: string;
    onNavigate?: (filename: string) => void;
}

interface CalloutStyles {
    color: string;
    icon: React.ReactNode;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, onNavigate }) => {
    const renderMath = (latex: string, isDisplay: boolean) => {
        if (!window.katex) return <span className="font-mono text-xs text-amber-300">{latex}</span>;
        try {
            const html = window.katex.renderToString(latex, {
                displayMode: isDisplay,
                throwOnError: false,
                trust: true,
                strict: false,
                macros: {
                    "\\boldsymbol": "\\mathbf",
                    "\\R": "\\mathbb{R}",
                    "\\N": "\\mathbb{N}",
                    "\\Z": "\\mathbb{Z}",
                    "\\C": "\\mathbb{C}",
                    "\\Q": "\\mathbb{Q}",
                }
            });
            return <span dangerouslySetInnerHTML={{ __html: html }} />;
        } catch (e) {
            return <span className="text-red-400 font-mono text-xs">{latex}</span>;
        }
    };

    const getCalloutStyles = (type: string): CalloutStyles => {
        const t = type.toLowerCase();
        switch (t) {
            case 'note':
            case 'info':
            case 'todo':
                return {
                    color: 'border-blue-500 bg-blue-500/10 text-blue-200',
                    icon: <Info size={18} className="text-blue-400" />
                };
            case 'tip':
            case 'done':
            case 'success':
                return {
                    color: 'border-emerald-500 bg-emerald-500/10 text-emerald-200',
                    icon: <CheckCircle size={18} className="text-emerald-400" />
                };
            case 'warning':
            case 'attention':
            case 'caution':
                return {
                    color: 'border-orange-500 bg-orange-500/10 text-orange-200',
                    icon: <AlertTriangle size={18} className="text-orange-400" />
                };
            case 'fail':
            case 'failure':
            case 'error':
            case 'danger':
            case 'missing':
                return {
                    color: 'border-red-500 bg-red-500/10 text-red-200',
                    icon: <XCircle size={18} className="text-red-400" />
                };
            case 'bug':
                return {
                    color: 'border-red-500 bg-red-500/10 text-red-200',
                    icon: <Bug size={18} className="text-red-400" />
                };
            case 'question':
            case 'help':
            case 'faq':
                return {
                    color: 'border-amber-500 bg-amber-500/10 text-amber-200',
                    icon: <HelpCircle size={18} className="text-amber-400" />
                };
            case 'example':
                return {
                    color: 'border-purple-500 bg-purple-500/10 text-purple-200',
                    icon: <List size={18} className="text-purple-400" />
                };
            case 'quote':
            case 'cite':
                return {
                    color: 'border-slate-500 bg-slate-500/10 text-slate-300',
                    icon: <Quote size={18} className="text-slate-400" />
                };
            case 'summary':
            case 'abstract':
                return {
                    color: 'border-cyan-500 bg-cyan-500/10 text-cyan-200',
                    icon: <Clipboard size={18} className="text-cyan-400" />
                };
            default:
                return {
                    color: 'border-slate-600 bg-slate-800/50 text-slate-300',
                    icon: <FileText size={18} className="text-slate-400" />
                };
        }
    };

    const parseInline = (text: string) => {
        const elements: React.ReactNode[] = [];
        let remaining = text;
        let elementKey = 0;

        while (remaining.length > 0) {
            // 1. Inline Math $...$
            const mathMatch = remaining.match(/^\$([^$\n]+?)\$/);
            if (mathMatch) {
                elements.push(
                    <span key={elementKey++} className="mx-1">
                        {renderMath(mathMatch[1], false)}
                    </span>
                );
                remaining = remaining.slice(mathMatch[0].length);
                continue;
            }

            // 2. Wiki links [[filename]] or [[filename|display text]]
            const wikiMatch = remaining.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
            if (wikiMatch) {
                const filename = wikiMatch[1];
                const displayText = wikiMatch[2] || filename;
                if (onNavigate) {
                    elements.push(
                        <button
                            key={elementKey++}
                            onClick={() => onNavigate(filename)}
                            className={`${markdownTheme.text.link} cursor-pointer inline-flex items-center gap-1`}
                        >
                            {displayText}
                        </button>
                    );
                } else {
                    elements.push(<span key={elementKey++} className={markdownTheme.text.link}>{displayText}</span>);
                }
                remaining = remaining.slice(wikiMatch[0].length);
                continue;
            }

            // 3. Standard Markdown links [text](url)
            const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
            if (linkMatch) {
                const linkText = linkMatch[1];
                const url = linkMatch[2];
                elements.push(
                    <a
                        key={elementKey++}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={markdownTheme.text.link}
                    >
                        {linkText}
                    </a>
                );
                remaining = remaining.slice(linkMatch[0].length);
                continue;
            }

            // 4. Bold **...**
            const boldMatch = remaining.match(/^\*\*(.*?)\*\*/);
            if (boldMatch) {
                elements.push(
                    <strong key={elementKey++} className={markdownTheme.text.bold}>
                        {boldMatch[1]}
                    </strong>
                );
                remaining = remaining.slice(boldMatch[0].length);
                continue;
            }

            // 5. Italic *...*
            const italicMatch = remaining.match(/^\*(.+?)\*/);
            if (italicMatch) {
                elements.push(
                    <em key={elementKey++} className={markdownTheme.text.italic}>
                        {italicMatch[1]}
                    </em>
                );
                remaining = remaining.slice(italicMatch[0].length);
                continue;
            }

            // 6. No match, take one character
            elements.push(<span key={elementKey++}>{remaining[0]}</span>);
            remaining = remaining.slice(1);
        }

        return <>{elements}</>;
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

    // Helper function to render simple text (for callouts and blockquotes)
    const renderSimpleText = (text: string): React.ReactNode => {
        const lines = text.split('\n');
        return lines.map((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={idx} className="h-4" />;
            return (
                <p key={idx} className="my-2 text-slate-300 leading-relaxed">
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
                                    {content}</h1>);
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
                                    <div className="w-1.5 h-1.5 rounded-full  bg-amber-400" />
                                    {content}</h4>);
                                break;
                            default:
                                result.push(<h5 key={key} className="font-bold text-slate-300 mt-3">{content}</h5>);
                        }
                        i++;
                        continue;
                    }

                    // D. Obsidian Embeds ![[...]] - distinguish between images and article embeds
                    if (trimmed.match(/!\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/)) {
                        const match = trimmed.match(/!\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/);
                        if (match) {
                            const filename = match[1];
                            const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp'];
                            const isImage = imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));

                            if (isImage) {
                                // Render as image
                                const encodedName = encodeURIComponent(filename);
                                const imageUrl = `https://raw.githubusercontent.com/66six11/BlogsWeb/main/attachments/${encodedName}`;
                                result.push(
                                    <div key={key} className="my-6 flex flex-col items-center">
                                        <img
                                            src={imageUrl}
                                            alt={filename}
                                            className="max-w-full md:max-w-lg rounded-lg border border-white/10 shadow-lg opacity-100"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                        <span className="text-xs text-slate-500 mt-2 italic">{filename}</span>
                                    </div>
                                );
                            } else {
                                // Render as article embed card
                                result.push(
                                    <div
                                        key={key}
                                        className={`my-6 rounded-lg border ${markdownTheme.border.embedCard} ${markdownTheme.background.embedCard} p-4`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className={`text-lg font-semibold ${markdownTheme.text.embedCard}`}>
                                                📄 {filename}
                                            </h4>
                                            {onNavigate && (
                                                <button
                                                    onClick={() => onNavigate(filename)}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md ${markdownTheme.background.embedCard} ${markdownTheme.border.embedCard} border ${markdownTheme.text.embedCard} hover:bg-cyan-500/10 transition-colors text-sm`}
                                                >
                                                    查看文章
                                                    <ExternalLink size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-slate-400 text-sm">
                                            点击上方按钮查看完整文章内容
                                        </p>
                                    </div>
                                );
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
                                    className="max-w-full rounded-lg border border-white/10 shadow-lg opacity-100" />
                                {altText &&
                                    <span className="text-xs text-slate-500 mt-2 italic">{altText}</span>}
                            </div>
                        );
                        i++;
                        continue;
                    }

                    // F. Obsidian Callouts & Blockquotes
                    if (trimmed.startsWith('>')) {
                        const quoteLines = [];
                        let j = i;
                        while (j < lines.length && (lines[j].trim().startsWith('>') || lines[j].trim() === '')) {
                            if (lines[j].trim() !== '') {
                                quoteLines.push(lines[j]);
                            } else if (lines[j].trim() === '' && quoteLines.length > 0) {
                                // Empty line inside a quote block, keep it
                                quoteLines.push(lines[j]);
                            }
                            j++;
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
                                        className="my-6 border-l-4 border-amber-500/50 pl-4 py-2 bg-slate-900/30 italic text-slate-300">
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
                        while (j < lines.length && (lines[j].trim().match(/^(\s*[-*+]|\s*\d+\.)/) || lines[j].trim() === '')) {
                            listLines.push(lines[j]);
                            j++;
                        }

                        const renderList = (items: string[], depth = 0): React.ReactNode => {
                            const result: React.ReactNode[] = [];
                            let currentList: string[] = [];
                            let currentType: 'ul' | 'ol' | null = null;

                            items.forEach((item, idx) => {
                                const trimmedItem = item.trim();
                                if (!trimmedItem) {
                                    if (currentList.length > 0) {
                                        result.push(renderListItems(currentList, currentType!, depth));
                                        currentList = [];
                                        currentType = null;
                                    }
                                    return;
                                }

                                const isOrdered = /^\d+\./.test(trimmedItem);
                                const type = isOrdered ? 'ol' : 'ul';

                                if (currentType === null) {
                                    currentType = type;
                                }

                                if (currentType === type) {
                                    currentList.push(item);
                                } else {
                                    if (currentList.length > 0) {
                                        result.push(renderListItems(currentList, currentType!, depth));
                                    }
                                    currentList = [item];
                                    currentType = type;
                                }
                            });

                            if (currentList.length > 0) {
                                result.push(renderListItems(currentList, currentType!, depth));
                            }

                            return <React.Fragment key={`list-${depth}`}>{result}</React.Fragment>;
                        };

                        const renderListItems = (items: string[], type: 'ul' | 'ol', depth: number) => {
                            const ListTag = type === 'ul' ? 'ul' : 'ol';
                            const className = type === 'ul'
                                ? 'list-disc pl-6 space-y-1'
                                : 'list-decimal pl-6 space-y-1';

                            return (
                                <ListTag key={`${type}-${depth}`} className={`${className} ${depth > 0 ? 'ml-4' : ''}`}>
                                    {items.map((item, idx) => {
                                        const trimmed = item.trim();
                                        const taskMatch = trimmed.match(/^[-*+]\s*\[(.)\]\s*(.*)/);
                                        const orderedMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
                                        const unorderedMatch = trimmed.match(/^[-*+]\s*(.*)/);

                                        let content = '';
                                        if (taskMatch) {
                                            const checked = taskMatch[1] !== ' ';
                                            content = taskMatch[2];
                                            return (
                                                <li key={idx} className="flex items-start gap-2">
                                                    {checked ? (
                                                        <CheckSquare size={15} className="text-emerald-400 mt-0.5" />
                                                    ) : (
                                                        <Square size={15} className="text-slate-500 mt-0.5" />
                                                    )}
                                                    <span className="text-slate-300">{parseInline(content)}</span>
                                                </li>
                                            );
                                        } else if (orderedMatch) {
                                            content = orderedMatch[2];
                                        } else if (unorderedMatch) {
                                            content = unorderedMatch[1];
                                        }

                                        // Check for nested lists
                                        const indentMatch = item.match(/^(\s+)/);
                                        const indent = indentMatch ? indentMatch[1].length : 0;
                                        const nestedDepth = Math.floor(indent / 2);

                                        if (nestedDepth > depth) {
                                            // Find all items at this nested level
                                            const nestedItems = [];
                                            let k = idx;
                                            while (k < items.length) {
                                                const currentIndent = (items[k].match(/^(\s+)/)?.[1]?.length || 0);
                                                const currentDepth = Math.floor(currentIndent / 2);
                                                if (currentDepth === nestedDepth) {
                                                    nestedItems.push(items[k]);
                                                    k++;
                                                } else if (currentDepth < nestedDepth) {
                                                    break;
                                                } else {
                                                    k++;
                                                }
                                            }

                                            return (
                                                <React.Fragment key={idx}>
                                                    <li className="text-slate-300">
                                                        {parseInline(content)}
                                                    </li>
                                                    {renderList(nestedItems, nestedDepth)}
                                                </React.Fragment>
                                            );
                                        }

                                        return (
                                            <li key={idx} className="text-slate-300">
                                                {parseInline(content)}
                                            </li>
                                        );
                                    })}
                                </ListTag>
                            );
                        };

                        result.push(
                            <div key={key} className="my-4">
                                {renderList(listLines)}
                            </div>
                        );
                        i = j;
                        continue;
                    }

                    // H. Horizontal Rule
                    if (trimmed.match(/^[-*_]{3,}$/)) {
                        result.push(<hr key={key} className="my-8 border-t border-slate-700/50" />);
                        i++;
                        continue;
                    }

                    // I. Paragraph
                    result.push(
                        <p key={key} className="my-3 text-slate-300 leading-relaxed">
                            {parseInline(trimmed)}
                        </p>
                    );
                    i++;
                }
            }
        });

        return result;
    };

    return <div className="markdown-content">{parseBlocks()}</div>;
};

// Export the component for reuse
export default MarkdownRenderer;