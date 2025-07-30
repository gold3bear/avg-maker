import React, { useState } from 'react';
import type { FileNode } from '../../../context/ProjectContext';
import { FileNodeComponent } from './FileNode';

interface FileTreeProps {
  nodes: FileNode[];
  onSelect: (path: string) => void;
  onMove?: (sourcePath: string, targetPath: string) => Promise<void>;
  level?: number;
  expandedDirs?: Set<string>;
  onToggleExpanded?: (path: string) => void;
  onContextMenu?: (e: React.MouseEvent, node: FileNode) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({ 
  nodes, 
  onSelect, 
  onMove,
  level = 0,
  expandedDirs: externalExpandedDirs,
  onToggleExpanded,
  onContextMenu
}) => {
  const [internalExpandedDirs, setInternalExpandedDirs] = useState<Set<string>>(new Set());
  const [draggedNode, setDraggedNode] = useState<FileNode | null>(null);
  const [expandedDropTarget, setExpandedDropTarget] = useState<string | null>(null);
  
  // 使用外部提供的展开状态或内部状态
  const expandedDirs = externalExpandedDirs || internalExpandedDirs;

  const toggleDirectory = (path: string) => {
    if (onToggleExpanded) {
      // 使用外部状态管理
      onToggleExpanded(path);
    } else {
      // 使用内部状态管理
      const newExpanded = new Set(internalExpandedDirs);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      setInternalExpandedDirs(newExpanded);
    }
  };

  const handleDragStart = (node: FileNode) => {
    setDraggedNode(node);
  };

  const handleDragEnd = () => {
    setDraggedNode(null);
  };

  const handleDrop = async (targetNode: FileNode) => {
    if (!draggedNode || !onMove || draggedNode.path === targetNode.path) {
      return;
    }

    // 只能拖拽到文件夹中
    if (!targetNode.isDirectory) {
      return;
    }

    // 不能拖拽到自己的子目录中
    if (targetNode.path.startsWith(draggedNode.path + '/')) {
      return;
    }

    try {
      const sourcePath = draggedNode.path;
      const targetPath = targetNode.path;
      await onMove(sourcePath, targetPath);
    } catch (error) {
      console.error('移动文件失败:', error);
    }
  };

  // 展开文件夹区域的拖拽处理
  const handleExpandedAreaDragOver = (e: React.DragEvent, folderPath: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setExpandedDropTarget(folderPath);
  };

  const handleExpandedAreaDragLeave = (e: React.DragEvent, folderPath: string) => {
    // 只有当离开整个区域时才清除高亮
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setExpandedDropTarget(null);
    }
  };

  const handleExpandedAreaDrop = async (e: React.DragEvent, folderPath: string) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedDropTarget(null);
    
    if (draggedNode && onMove && draggedNode.path !== folderPath) {
      // 不能拖拽到自己的子目录中
      if (!folderPath.startsWith(draggedNode.path + '/')) {
        try {
          await onMove(draggedNode.path, folderPath);
        } catch (error) {
          console.error('移动文件失败:', error);
        }
      }
    }
  };

  return (
    <div>
      {nodes.map((node) => {
        const isExpanded = expandedDirs.has(node.path);
        const isExpandedDropTarget = expandedDropTarget === node.path;
        
        return (
          <div key={node.path}>
            <FileNodeComponent
              node={node}
              level={level}
              isExpanded={isExpanded}
              onSelect={onSelect}
              onToggle={toggleDirectory}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              isDragging={draggedNode?.path === node.path}
              isDragOver={false}
              onContextMenu={onContextMenu}
            />
            {node.isDirectory && 
             node.children && 
             isExpanded && (
              <div
                className="relative"
                style={{
                  backgroundColor: isExpandedDropTarget 
                    ? 'var(--color-highlight)' 
                    : 'transparent',
                  border: isExpandedDropTarget 
                    ? '1px dashed var(--color-textSecondary)' 
                    : 'none',
                  borderRadius: isExpandedDropTarget ? '4px' : '0',
                  margin: isExpandedDropTarget ? '2px' : '0',
                  minHeight: node.children.length === 0 ? '20px' : 'auto'
                }}
                onDragOver={(e) => handleExpandedAreaDragOver(e, node.path)}
                onDragLeave={(e) => handleExpandedAreaDragLeave(e, node.path)}
                onDrop={(e) => handleExpandedAreaDrop(e, node.path)}
              >
                <FileTree
                  nodes={node.children}
                  onSelect={onSelect}
                  onMove={onMove}
                  level={level + 1}
                  expandedDirs={externalExpandedDirs}
                  onToggleExpanded={onToggleExpanded}
                  onContextMenu={onContextMenu}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};