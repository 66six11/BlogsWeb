import React, { useState, useRef, useEffect } from 'react';
import { Database, Cloud, X, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';

interface PreviewConsoleProps {
  useMockData: boolean;
  onToggleMockData: () => void;
  onRefresh: () => void;
}

const PreviewConsole: React.FC<PreviewConsoleProps> = ({
  useMockData,
  onToggleMockData,
  onRefresh,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (consoleRef.current) {
      const rect = consoleRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  return (
    <div
      ref={consoleRef}
      className="fixed z-50 backdrop-blur-md bg-black/80 border border-purple-500/30 rounded-lg shadow-2xl shadow-purple-500/20"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        minWidth: '280px',
        maxWidth: '320px',
      }}
    >
      {/* Header - Draggable */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-move border-b border-purple-500/20"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripVertical size={16} className="text-purple-400/60" />
          <span className="text-xs font-semibold text-purple-300">
            预览模式控制台
          </span>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-white/10 rounded transition-colors"
          title={isCollapsed ? "展开" : "折叠"}
        >
          {isCollapsed ? (
            <ChevronDown size={14} className="text-purple-300" />
          ) : (
            <ChevronUp size={14} className="text-purple-300" />
          )}
        </button>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="px-3 py-3 space-y-3">
          {/* Data Source Toggle */}
          <div className="space-y-2">
            <div className="text-xs text-purple-300/70 font-medium">数据源</div>
            <button
              onClick={onToggleMockData}
              className="w-full flex items-center justify-between px-3 py-2 rounded bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition-all"
            >
              <div className="flex items-center gap-2">
                {useMockData ? (
                  <>
                    <Database size={16} className="text-purple-400" />
                    <span className="text-sm text-purple-200">示例数据</span>
                  </>
                ) : (
                  <>
                    <Cloud size={16} className="text-blue-400" />
                    <span className="text-sm text-blue-200">真实数据</span>
                  </>
                )}
              </div>
              <div className="text-xs text-purple-300/50">点击切换</div>
            </button>
          </div>

          {/* Status Indicator */}
          <div className="text-xs text-purple-300/50 border-t border-purple-500/20 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span>预览模式已启用</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewConsole;
