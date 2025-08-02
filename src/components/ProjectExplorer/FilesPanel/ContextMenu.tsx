import React, { useEffect, useRef } from 'react';
import type { FileNode } from '../../../context/ProjectContext';

interface ContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  targetNode: FileNode | null;
  onClose: () => void;
  onCreateFile: (parentPath: string) => void;
  onCreateFolder: (parentPath: string) => void;
  onShowInExplorer: (path: string) => void;
  onCopy: (path: string) => void;
  onCut: (path: string) => void;
  onPaste: (targetPath: string) => void;
  onRename: (path: string) => void;
  onDelete: (path: string) => void;
  hasClipboard: boolean;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  visible,
  x,
  y,
  targetNode,
  onClose,
  onCreateFile,
  onCreateFolder,
  onShowInExplorer,
  onCopy,
  onCut,
  onPaste,
  onRename,
  onDelete,
  hasClipboard
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  const isDirectory = targetNode?.isDirectory || false;
  const targetPath = targetNode?.path || '';
  const parentPath = isDirectory ? targetPath : targetPath.split('/').slice(0, -1).join('/');

  const menuItems = [
    // 创建操作（在文件夹中或文件的父目录中）
    {
      label: '新建文件',
      icon: '📄',
      onClick: () => {
        onCreateFile(isDirectory ? targetPath : parentPath);
        onClose();
      }
    },
    {
      label: '新建文件夹',
      icon: '📁',
      onClick: () => {
        onCreateFolder(isDirectory ? targetPath : parentPath);
        onClose();
      }
    },
    { type: 'separator' },
    // 文件系统操作
    {
      label: (typeof window !== 'undefined' && window.navigator?.platform?.toLowerCase().includes('mac')) ? '在 Finder 中显示' : '在资源管理器中显示',
      icon: '👁️',
      onClick: () => {
        onShowInExplorer(targetPath);
        onClose();
      },
      disabled: !targetNode
    },
    { type: 'separator' },
    // 剪贴板操作
    {
      label: '复制',
      icon: '📋',
      onClick: () => {
        onCopy(targetPath);
        onClose();
      },
      disabled: !targetNode
    },
    {
      label: '剪切',
      icon: '✂️',
      onClick: () => {
        onCut(targetPath);
        onClose();
      },
      disabled: !targetNode
    },
    {
      label: '粘贴',
      icon: '📋',
      onClick: () => {
        onPaste(isDirectory ? targetPath : parentPath);
        onClose();
      },
      disabled: !hasClipboard
    },
    { type: 'separator' },
    // 文件操作
    {
      label: '重命名',
      icon: '✏️',
      onClick: () => {
        onRename(targetPath);
        onClose();
      },
      disabled: !targetNode
    },
    {
      label: '删除',
      icon: '🗑️',
      onClick: () => {
        onDelete(targetPath);
        onClose();
      },
      disabled: !targetNode,
      danger: true
    }
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-50 py-1 rounded-md shadow-lg border"
      style={{
        left: x,
        top: y,
        backgroundColor: 'var(--color-sidebarBackground)',
        borderColor: 'var(--color-sidebarBorder)',
        color: 'var(--color-textPrimary)',
        minWidth: '180px'
      }}
    >
      {menuItems.map((item, index) => {
        if (item.type === 'separator') {
          return (
            <div
              key={index}
              className="h-px my-1 mx-2"
              style={{ backgroundColor: 'var(--color-sidebarBorder)' }}
            />
          );
        }

        return (
          <div
            key={index}
            className={`px-3 py-2 text-sm cursor-pointer flex items-center gap-2 ${
              item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600'
            }`}
            style={{
              color: item.danger ? '#ff6b6b' : 'var(--color-textPrimary)'
            }}
            onClick={item.disabled ? undefined : item.onClick}
            onMouseEnter={(e) => {
              if (!item.disabled) {
                e.currentTarget.style.backgroundColor = 'var(--color-hover)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};