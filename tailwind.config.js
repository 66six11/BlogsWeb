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
        'loader': 'loader 2s infinite',
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
        loader: {
          '0%, 100%': {
            textShadow: '0 0 #000, -10ch 0 #000, -20ch 0 #000, -30ch 0 #000, -40ch 0 #000, -50ch 0 #000, -60ch 0 #000, -70ch 0 #000, -80ch 0 #000, -90ch 0 #000'
          },
          '9%': {
            textShadow: '0 0 #000, -10ch 0 #000, -20ch -20px transparent, -30ch 0 #000, -40ch 0 #000, -50ch 0 #000, -60ch 0 #000, -70ch 0 #000, -80ch 0 #000, -90ch 0 #000'
          },
          '18%': {
            textShadow: '0 0 #000, -10ch 0 #000, -20ch -20px transparent, -30ch 0 #000, -40ch 0 #000, -50ch 0 #000, -60ch -20px transparent, -70ch 0 #000, -80ch 0 #000, -90ch 0 #000'
          },
          '27%': {
            textShadow: '0 -20px transparent, -10ch 0 #000, -20ch -20px transparent, -30ch 0 #000, -40ch 0 #000, -50ch 0 #000, -60ch -20px transparent, -70ch 0 #000, -80ch 0 #000, -90ch 0 #000'
          },
          '36%': {
            textShadow: '0 -20px transparent, -10ch 0 #000, -20ch -20px transparent, -30ch 0 #000, -40ch 0 #000, -50ch -20px transparent, -60ch -20px transparent, -70ch 0 #000, -80ch 0 #000, -90ch 0 #000'
          },
          '45%': {
            textShadow: '0 -20px transparent, -10ch 0 #000, -20ch -20px transparent, -30ch 0 #000, -40ch 0 #000, -50ch -20px transparent, -60ch -20px transparent, -70ch 0 #000, -80ch -20px transparent, -90ch 0 #000'
          },
          '54%': {
            textShadow: '0 -20px transparent, -10ch 0 #000, -20ch -20px transparent, -30ch 0 #000, -40ch -20px transparent, -50ch -20px transparent, -60ch -20px transparent, -70ch 0 #000, -80ch -20px transparent, -90ch 0 #000'
          },
          '63%': {
            textShadow: '0 -20px transparent, -10ch 0 #000, -20ch -20px transparent, -30ch 0 #000, -40ch -20px transparent, -50ch -20px transparent, -60ch -20px transparent, -70ch 0 #000, -80ch -20px transparent, -90ch -20px transparent'
          },
          '72%': {
            textShadow: '0 -20px transparent, -10ch -20px transparent, -20ch -20px transparent, -30ch 0 #000, -40ch -20px transparent, -50ch -20px transparent, -60ch -20px transparent, -70ch 0 #000, -80ch -20px transparent, -90ch -20px transparent'
          },
          '81%': {
            textShadow: '0 -20px transparent, -10ch -20px transparent, -20ch -20px transparent, -30ch 0 #000, -40ch -20px transparent, -50ch -20px transparent, -60ch -20px transparent, -70ch -20px transparent, -80ch -20px transparent, -90ch -20px transparent'
          },
          '90%': {
            textShadow: '0 -20px transparent, -10ch -20px transparent, -20ch -20px transparent, -30ch -20px transparent, -40ch -20px transparent, -50ch -20px transparent, -60ch -20px transparent, -70ch -20px transparent, -80ch -20px transparent, -90ch -20px transparent'
          }
        }
      }
    }
  },
  plugins: [],
}

