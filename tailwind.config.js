/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./public/**/*.{html,js,ts,jsx,tsx}",
  ],
  safelist: [
    // Essential positioning classes
    'top-0', 'top-2', 'top-20', 'top-24', 'left-0', 'right-0',
    // Essential spacing classes
    'pt-16', 'pb-16', 'pb-24', 'pb-8', 'mt-auto',
    // Essential layout classes
    'fixed', 'absolute', 'relative', 'flex', 'flex-col', 'flex-1', 'w-full', 'h-full',
    // Essential border classes
    'border', 'border-t', 'border-b', 'border-l', 'border-r', 'border-2', 'border-4', 'border-transparent',
    // Essential appearance classes
    'opacity-90', 'opacity-80', 'backdrop-blur-md', 'backdrop-blur-sm', 'backdrop-blur-xl',
    // Essential z-index classes
    'z-40', 'z-50',
    // Essential utility classes
    'rounded', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-3xl', 'rounded-full',
    'rounded-tl-none', 'rounded-tr-none',
    // Common text and color classes
    'text-center', 'text-left', 'text-right', 'text-white', 'text-slate-100', 'text-slate-200', 'text-slate-300',
    'text-amber-400', 'bg-transparent', 'bg-white', 'bg-slate-900', 'bg-slate-950',
    // Common font classes
    'font-bold', 'font-medium', 'font-semibold', 'font-light',
    // Common shadow classes
    'shadow', 'shadow-lg', 'shadow-xl', 'shadow-2xl', 'shadow-inner', 'shadow-sm',
    // Common animation classes
    'animate-pulse', 'animate-spin', 'animate-float', 'animate-fade-in-up',
    // Common transition classes
    'transition', 'transition-all', 'transition-colors', 'transition-opacity', 'transition-transform',
    'duration-200', 'duration-300', 'duration-500', 'duration-700', 'ease-out',
    // Hover states
    'hover:opacity-80', 'hover:opacity-90', 'hover:bg-white/5', 'hover:bg-white/10', 'hover:scale-105', 'hover:scale-110',
    // Interactive states
    'disabled:opacity-30', 'disabled:cursor-not-allowed', 'select-none', 'cursor-pointer', 'cursor-not-allowed',
    // Layout helpers
    'overflow-hidden', 'overflow-auto', 'overflow-x-auto', 'overflow-y-auto', 'truncate', 'whitespace-nowrap',
    'grid', 'grid-cols-1', 'grid-cols-2', 'flex-wrap', 'items-start', 'items-end', 'items-center',
    'justify-start', 'justify-end', 'justify-center', 'justify-between', 'justify-around',
    'divide-y', 'divide-slate-700', 'divide-slate-800',
    // Spacing helpers
    'mx-auto', 'mt-2', 'mt-4', 'mb-2', 'mb-4', 'mb-6', 'mb-8', 'mb-10', 'mb-12',
    'ml-2', 'ml-3', 'ml-4', 'mr-1', 'mr-2', 'p-1', 'p-2', 'p-3', 'p-4', 'p-6', 'p-8',
    'px-2', 'px-3', 'px-4', 'px-6', 'px-8', 'py-1', 'py-2', 'py-3', 'py-4', 'py-8', 'py-12', 'py-16',
    'pb-2', 'pl-3', 'pr-2', 'pt-2', 'pt-6', 'gap-1', 'gap-2', 'gap-3', 'gap-4', 'gap-6', 'gap-8', 'gap-10',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      colors: {
        magic: {
          dark: '#0f172a',
          purple: '#7c3aed',
          gold: '#fbbf24',
        },
        // Semantic theme colors using CSS variables
        // These automatically adapt to light/dark mode
        theme: {
          // Background colors
          'primary': 'var(--bg-primary)',
          'secondary': 'var(--bg-secondary)',
          'tertiary': 'var(--bg-tertiary)',
          // Text colors
          'text-primary': 'var(--text-primary)',
          'text-secondary': 'var(--text-secondary)',
          // Accent colors
          'accent-1': 'var(--accent-1)',
          'accent-2': 'var(--accent-2)',
          'accent-3': 'var(--accent-3)',
        }
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'spin-slow': 'spin 12s linear infinite',
        'loading-bar': 'loadingBar 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        loadingBar: {
          '0%': { width: '30%' },
          '100%': { width: '100%' },
        },
      }
    }
  },
  corePlugins: {
    // Disable Tailwind's Preflight CSS reset to preserve existing custom styles
    // This prevents Tailwind from overriding custom border-radius, margins, padding, sizes, etc.
    // defined in custom stylesheets (e.g., public/styles/theme.css)
    preflight: false,
  },
  plugins: [],
}

