import React from 'react';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state: { hasError: boolean; error: any };
  props: any;

  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Uncaught Error:', error, errorInfo);
  }

  render() {
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
    return this.props.children;
  }
}

export default ErrorBoundary;
