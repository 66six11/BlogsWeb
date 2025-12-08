/**
 * Centralized theme configuration for Markdown renderer
 * Provides consistent styling across all markdown elements
 */

export const markdownTheme = {
  text: {
    base: 'text-slate-300',
    bold: 'text-amber-200 font-semibold',
    italic: 'text-purple-200',
    link: 'text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/50 hover:decoration-cyan-400/70 transition-colors',
    embedCard: 'text-cyan-300 hover:text-cyan-200',
  },
  background: {
    code: 'bg-slate-950/80',
    callout: 'bg-blue-500/10',
    blockquote: 'bg-slate-900/30',
    embedCard: 'bg-cyan-500/5',
  },
  border: {
    code: 'border-slate-700/50',
    table: 'border-slate-700',
    embedCard: 'border-cyan-500/30',
  },
  callout: {
    note: {
      border: 'border-blue-500',
      background: 'bg-blue-500/10',
      text: 'text-blue-200',
    },
    tip: {
      border: 'border-emerald-500',
      background: 'bg-emerald-500/10',
      text: 'text-emerald-200',
    },
    warning: {
      border: 'border-orange-500',
      background: 'bg-orange-500/10',
      text: 'text-orange-200',
    },
    error: {
      border: 'border-red-500',
      background: 'bg-red-500/10',
      text: 'text-red-200',
    },
  },
};
