/**
 * 主题切换组件 - 实现暗色/亮色主题的切换和持久化
 * @file src/components/common/ThemeToggle.tsx
 * @description 提供主题切换功能，支持本地存储和系统主题偏好检测
 * @created 2025-12-13
 */

import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

/**
 * 主题类型定义
 * @type Theme
 * @description 限定主题只能是 'dark' 或 'light'
 */
type Theme = 'dark' | 'light';

/**
 * 主题切换组件属性接口
 * @interface ThemeToggleProps
 * @description 定义了主题切换组件的输入属性
 */
interface ThemeToggleProps {
  className?: string;  // 自定义 CSS 类名（可选，默认空字符串）
}

/**
 * 主题切换组件
 * @component ThemeToggle
 * @description 实现暗色/亮色主题的切换，支持本地存储和系统主题偏好检测
 */
const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  /** 主题状态 - 初始值为 'dark' */
  const [theme, setTheme] = useState<Theme>('dark');

  /**
   * 组件挂载时初始化主题
   * @description 1. 检查本地存储中是否有保存的主题偏好
   *              2. 如果有，使用保存的主题
   *              3. 如果没有，检查系统主题偏好
   *              4. 将主题应用到文档根元素
   */
  useEffect(() => {
    // 检查本地存储中是否有保存的主题偏好
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    } else {
      // 检查系统主题偏好
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = prefersDark ? 'dark' : 'light';
      setTheme(initialTheme);
      document.documentElement.className = initialTheme;
    }
  }, []);

  /**
   * 切换主题
   * @description 1. 切换主题状态（从 dark 到 light 或从 light 到 dark）
   *              2. 将新主题应用到文档根元素
   *              3. 将新主题保存到本地存储，实现持久化
   */
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.className = newTheme;
    localStorage.setItem('theme', newTheme);
  };

  return (
    <button
      onClick={toggleTheme}  // 点击时切换主题
      className={`p-2 rounded-full transition-all duration-300 border hover:opacity-80 ${
        theme === 'dark' ? 'theme-toggle-dark' : 'theme-toggle-light'
      } ${className}`}
      title={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}  // 悬停提示文本
    >
      {/* 根据当前主题显示不同的图标 */}
      {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
};

export default ThemeToggle;
