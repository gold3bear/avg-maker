import React, { useState } from 'react';
import type { FileNode } from '../../../context/ProjectContext';
import { useSave } from '../../../context/SaveContext';

interface FileNodeProps {
  node: FileNode;
  level: number;
  isExpanded: boolean;
  onSelect: (path: string) => void;
  onToggle: (path: string) => void;
  onDragStart?: (node: FileNode) => void;
  onDragEnd?: () => void;
  onDrop?: (node: FileNode) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  onContextMenu?: (e: React.MouseEvent, node: FileNode) => void;
}

export const FileNodeComponent: React.FC<FileNodeProps> = ({
  node,
  level,
  isExpanded,
  onSelect,
  onToggle,
  onDragStart,
  onDragEnd,
  onDrop,
  isDragging = false,
  isDragOver = false,
  onContextMenu
}) => {
  const { hasUnsavedChanges } = useSave();
  const isUnsaved = !node.isDirectory && hasUnsavedChanges(node.path);
  const [dragOver, setDragOver] = useState(false);
  
  const indentStyle = {
    paddingLeft: `${level * 12 + 8}px`
  };

  const getFileIcon = (fileName: string, isDirectory: boolean) => {
    if (isDirectory) {
      return isExpanded ? '📂' : '📁';
    }
    if (fileName.endsWith('.ink')) {
      return '📝';
    }
    if (fileName.endsWith('.json')) {
      return '📋';
    }
    if (fileName.endsWith('.md')) {
      return '📄';
    }
    return '📄';
  };

  const handleClick = () => {
    if (node.isDirectory) {
      onToggle(node.path);
    } else {
      onSelect(node.path);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', node.path);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(node);
  };

  const handleDragEnd = () => {
    onDragEnd?.();
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (node.isDirectory) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (node.isDirectory) {
      onDrop?.(node);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu?.(e, node);
  };

  return (
    <div
      className="flex items-center py-1 cursor-pointer text-sm select-none transition-colors"
      style={{
        ...indentStyle,
        color: 'var(--color-textPrimary)',
        backgroundColor: dragOver 
          ? 'var(--color-highlight)' 
          : isDragging 
            ? 'var(--color-hover)' 
            : 'transparent',
        opacity: isDragging ? 0.5 : 1,
        border: dragOver ? '1px dashed var(--color-textSecondary)' : 'none'
      }}
      draggable
      onClick={handleClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseEnter={(e) => {
        if (!dragOver && !isDragging) {
          e.currentTarget.style.backgroundColor = 'var(--color-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (!dragOver && !isDragging) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
      onContextMenu={handleContextMenu}
    >
      {node.isDirectory && (
        <span
          className="text-xs mr-1 transform transition-transform duration-150"
          style={{
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            color: 'var(--color-textSecondary)'
          }}
        >
          ▶
        </span>
      )}
      <span className="mr-2">
        {getFileIcon(node.name, node.isDirectory)}
      </span>
      <span className="truncate flex-1">
        {node.name}
      </span>
      {isUnsaved && (
        <span
          className="ml-1 text-xs"
          style={{ color: '#ff6b6b' }}
          title="文件有未保存的更改"
        >
          ●
        </span>
      )}
    </div>
  );
};