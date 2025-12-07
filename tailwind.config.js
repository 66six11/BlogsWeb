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
        // Direct colors from theme.css - Dark mode defaults
        theme: {
          // Background colors - Dark mode
          'primary': '#0f172a',      // --bg-primary (dark)
          'secondary': '#1e293b',    // --bg-secondary (dark)
          'tertiary': '#334155',     // --bg-tertiary (dark)
          // Text colors - Dark mode
          'text-primary': '#f1f5f9', // --text-primary (dark)
          'text-secondary': '#94a3b8', // --text-secondary (dark)
          // Accent colors - Dark mode
          'accent-1': '#deb99a',     // --accent-1 (dark/light)
          'accent-2': '#7C85EB',     // --accent-2 (dark/light)
          'accent-3': '#c493b1',     // --accent-3 (dark/light)
        },
        // Additional dark mode specific colors
        dark: {
          'primary': '#3b3442',      // --bg-primary (dark theme)
          'secondary': '#4d4658',    // --bg-secondary (dark theme)
          'tertiary': '#897b8c',     // --bg-tertiary (dark theme)
          'text-primary': '#f1f5f9', // --text-primary (dark theme)
          'text-secondary': '#e2e8f0', // --text-secondary (dark theme)
          'accent-2': '#c493b1',     // --accent-2 (dark theme)
          'accent-3': '#7C85EB',     // --accent-3 (dark theme)
        },
        // Light mode specific colors
        light: {
          'primary': '#F7F8F3',      // --bg-primary (light)
          'secondary': '#EBECF2',    // --bg-secondary (light)
          'tertiary': 'rgba(227, 216, 216, 0.74)', // --bg-tertiary (light)
          'text-primary': '#1e293b', // --text-primary (light)
          'text-secondary': '#475569', // --text-secondary (light)
          'accent-2': '#7C85EB',     // --accent-2 (light)
          'accent-3': '#c493b1',     // --accent-3 (light)
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

