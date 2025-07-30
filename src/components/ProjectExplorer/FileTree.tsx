import React from 'react';
import type { FileNode } from '../../context/ProjectContext';

interface FileTreeProps {
  nodes: FileNode[];
  onSelect: (path: string) => void;
  renderNodeExtra?: (node: FileNode) => React.ReactNode;
}

export const FileTree: React.FC<FileTreeProps> = ({ nodes, onSelect, renderNodeExtra }) => {
  const renderTree = (items: FileNode[]) => (
    <ul className="pl-2">
      {items.map((node) => (
        <li key={node.path} className="mt-1">
          {node.isDirectory ? (
            <div className="font-medium px-2 py-1 rounded" style={{ color: 'var(--color-textSecondary)' }}>
              📁 {node.name}
            </div>
          ) : (
            <button
              className="text-left px-2 py-1 rounded w-full text-sm transition-colors flex items-center justify-between"
              style={{ color: 'var(--color-textPrimary)', backgroundColor: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              onClick={() => onSelect(node.path)}
            >
              <span>📄 {node.name}</span>
              {renderNodeExtra && renderNodeExtra(node)}
            </button>
          )}
          {node.isDirectory && node.children && renderTree(node.children)}
        </li>
      ))}
    </ul>
  );

  return renderTree(nodes);
};
