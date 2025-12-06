/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
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
  plugins: [],
}

