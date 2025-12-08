// Markdown 渲染器配色方案
// 可以随时修改这些颜色来调整 Markdown 的显示效果

export const markdownTheme = {
  // 文本颜色
  text: {
    primary: 'text-slate-300',
    secondary: 'text-slate-500',
    heading1: 'text-slate-100',
    heading2: 'text-slate-200',
    heading3: 'text-purple-200',
    heading4: 'text-amber-200/80',
    heading5: 'text-slate-300',
    bold: 'text-amber-200',
    italic: 'text-purple-200',
    code: 'text-purple-200',
    link: 'text-blue-400 hover:text-blue-300',
    linkInternal: 'text-emerald-400 hover:text-emerald-300', // Obsidian 内部链接
  },

  // 背景颜色
  background: {
    codeBlock: 'bg-slate-950/80',
    inlineCode: 'bg-slate-800/50',
    blockquote: 'bg-slate-900/30',
    math: 'bg-slate-950/30',
    table: 'bg-slate-900/50',
    tableHeader: 'bg-slate-900',
    tableRowAlt: 'bg-slate-800/20',
  },

  // 边框颜色
  border: {
    heading1: 'border-amber-500/30',
    heading2: 'border-purple-500',
    codeBlock: 'border-slate-700/50',
    blockquote: 'border-amber-500/50',
    table: 'border-slate-700',
    horizontalRule: 'border-slate-700/50',
    math: 'border-white/5',
    image: 'border-white/10',
  },

  // Callout 样式
  callout: {
    note: {
      border: 'border-blue-500',
      bg: 'bg-blue-500/10',
      text: 'text-blue-200',
      icon: 'text-blue-400',
    },
    tip: {
      border: 'border-emerald-500',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-200',
      icon: 'text-emerald-400',
    },
    warning: {
      border: 'border-orange-500',
      bg: 'bg-orange-500/10',
      text: 'text-orange-200',
      icon: 'text-orange-400',
    },
    error: {
      border: 'border-red-500',
      bg: 'bg-red-500/10',
      text: 'text-red-200',
      icon: 'text-red-400',
    },
    question: {
      border: 'border-amber-500',
      bg: 'bg-amber-500/10',
      text: 'text-amber-200',
      icon: 'text-amber-400',
    },
    example: {
      border: 'border-purple-500',
      bg: 'bg-purple-500/10',
      text: 'text-purple-200',
      icon: 'text-purple-400',
    },
    quote: {
      border: 'border-slate-500',
      bg: 'bg-slate-500/10',
      text: 'text-slate-300',
      icon: 'text-slate-400',
    },
    summary: {
      border: 'border-cyan-500',
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-200',
      icon: 'text-cyan-400',
    },
    default: {
      border: 'border-slate-600',
      bg: 'bg-slate-800/50',
      text: 'text-slate-300',
      icon: 'text-slate-400',
    },
  },
};

export type MarkdownTheme = typeof markdownTheme;
