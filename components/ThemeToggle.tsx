import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { buttonStyles, textStyles, borderStyles, mergeStyles } from '../utils/styles';

type Theme = 'dark' | 'light';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = prefersDark ? 'dark' : 'light';
      setTheme(initialTheme);
      document.documentElement.className = initialTheme;
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.className = newTheme;
    localStorage.setItem('theme', newTheme);
  };

  // Define theme-specific styles using the styles utility
  const darkModeStyles = mergeStyles(
    buttonStyles.secondary,
    textStyles.secondary,
    { borderColor: 'var(--bg-tertiary)' }
  );

  const lightModeStyles = mergeStyles(
    { backgroundColor: 'var(--accent-1)', opacity: 0.3 },
    { borderColor: 'var(--accent-1)' },
    { color: 'var(--text-primary)' }
  );

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-full transition-all duration-300 border hover:opacity-80 ${className}`}
      style={theme === 'dark' ? darkModeStyles : lightModeStyles}
      title={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
    >
      {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
};

export default ThemeToggle;
