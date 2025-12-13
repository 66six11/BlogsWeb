/**
 * 错误边界组件 - 捕获和处理 React 应用中的未捕获错误
 * @file src/components/common/ErrorBoundary.tsx
 * @description 用于捕获子组件树中的 JavaScript 错误，记录错误信息，并显示友好的错误界面
 * @created 2025-12-13
 */

import React from 'react';

/**
 * 错误边界组件类
 * @class ErrorBoundary
 * @extends React.Component
 * @description 捕获子组件树中的未捕获错误，防止整个应用崩溃
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  /** 组件状态类型定义 */
  state: { hasError: boolean; error: Error | null };
  /** 组件属性类型定义 */
  props: { children: React.ReactNode };

  /**
   * 构造函数 - 初始化组件状态
   * @param {object} props - 组件属性
   */
  constructor(props: { children: React.ReactNode }) {
    super(props);
    // 初始状态：无错误
    this.state = { hasError: false, error: null };
  }

  /**
   * 从错误中获取派生状态
   * @static
   * @param {Error} error - 捕获到的错误对象
   * @returns {object} 更新后的状态
   * @description 在渲染阶段捕获到错误后调用，用于更新组件状态以显示错误界面
   */
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  /**
   * 组件捕获错误后的处理
   * @param {Error} error - 捕获到的错误对象
   * @param {any} errorInfo - 错误上下文信息
   * @description 在提交阶段捕获到错误后调用，用于记录错误日志
   */
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('未捕获的错误:', error, errorInfo);
  }

  /**
   * 渲染组件
   * @returns {React.ReactNode} 渲染的 React 元素
   * @description 如果有错误，显示友好的错误界面；否则渲染子组件
   */
  render() {
    // 如果捕获到错误，显示错误界面
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen text-white p-8 text-center theme-bg-primary">
          <h1 className="text-4xl font-serif mb-4 theme-text-accent1">发生了魔法事故</h1>
          <p className="mb-6 max-w-lg theme-text-secondary">
            渲染咒语执行时出了问题。
            <br />
            <span className="text-xs font-mono text-red-300 mt-2 block bg-black/30 p-2 rounded">
              {this.state.error?.message}
            </span>
          </p>
          <button
            onClick={() => {
              // 清除本地存储并刷新页面
              localStorage.clear();
              window.location.reload();
            }}
            className="px-6 py-2 rounded hover:opacity-90 transition-colors theme-btn-primary"
          >
            重置并重新加载魔法书
          </button>
        </div>
      );
    }

    // 没有错误时，渲染子组件
    return this.props.children;
  }
}

export default ErrorBoundary;
