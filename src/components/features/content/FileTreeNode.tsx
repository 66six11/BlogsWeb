import React, { useState } from 'react';
import { Folder, FileText } from 'lucide-react';
import { DirectoryNode } from '../../../types';

interface FileTreeNodeProps {
  node: DirectoryNode;
  onSelect: (node: DirectoryNode) => void;
  depth?: number;
}

const FileTreeNode: React.FC<FileTreeNodeProps> = ({ node, onSelect, depth = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isFolder = node.type === 'folder';

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer transition-colors hover:bg-white/5 ${
          depth > 0 ? 'ml-3' : ''
        } border-l border-transparent hover:border-amber-500/30`}
        onClick={() => {
          if (isFolder) setIsOpen(!isOpen);
          else onSelect(node);
        }}
      >
        <span className="opacity-70 text-amber-400">
          {isFolder ? (
            isOpen ? (
              <Folder size={16} fill="currentColor" fillOpacity={0.2} />
            ) : (
              <Folder size={16} />
            )
          ) : (
            <FileText size={15} className="text-slate-400" />
          )}
        </span>
        <span
          className={`text-sm truncate ${
            isFolder
              ? 'font-bold text-slate-200'
              : 'text-slate-400 hover:text-purple-300'
          }`}
        >
          {node.name}
        </span>
      </div>
      {isFolder && isOpen && (
        <div className="border-l border-slate-700/50 ml-2.5">
          {node.children.map((child) => (
            <FileTreeNode key={child.path} node={child} onSelect={onSelect} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FileTreeNode;
