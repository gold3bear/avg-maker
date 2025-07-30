/// <reference path="../types/global.d.ts" />
import React, { useEffect, useState } from 'react';
import { Minus, Square, X, Sidebar, Layers, Search, Play } from 'lucide-react';
import { useSave } from '../context/SaveContext';

interface TitleBarProps {
  title?: string;
  onToggleSidebar?: () => void;
  sidebarVisible?: boolean;
  activeFile?: string | null;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  title = 'AVG Maker',
  onToggleSidebar,
  sidebarVisible = true,
  activeFile = null,
}) => {
  const platform = navigator.platform.toLowerCase();
  const isMacOS = platform.includes('mac');
  const [, setIsFullscreen] = useState(false);
  const { hasUnsavedChanges, getUnsavedFiles } = useSave();

  // 同步窗口标题
  useEffect(() => {
    if (window.inkAPI?.setWindowTitle) {
      window.inkAPI.setWindowTitle(title);
    }
  }, [title]);

  useEffect(() => {
    if (!isMacOS) return;

    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [isMacOS]);

  const handleMinimize = () => {
    window.inkAPI?.minimizeWindow?.();
  };

  const handleMaximize = () => {
    window.inkAPI?.maximizeWindow?.();
  };

  const handlePreview = () => {
    if (activeFile) {
      window.inkAPI?.openPreviewWindow?.(activeFile);
    }
  };

  const handleClose = () => {
    console.log('🔴 TitleBar: 关闭按钮被点击');
    if (window.inkAPI?.closeWindow) {
      console.log('🔴 TitleBar: 调用closeWindow API');
      window.inkAPI.closeWindow();
    } else {
      console.error('🔴 TitleBar: closeWindow API不可用');
    }
  };

  return (
    <div
      className="flex items-center justify-between select-none titlebar-fix"
      style={{
        backgroundColor: 'var(--color-titlebar)',
        borderBottom: '1px solid var(--color-border)',
        WebkitAppRegion: 'drag',
      }}
    >
      {/* 左侧：为 macOS 系统 traffic lights 预留空间 */}
      {isMacOS && (
        <div className="w-20" style={{ WebkitAppRegion: 'no-drag' }} />
      )}

      {/* 非 macOS 的左侧留空 */}
      {!isMacOS && <div className="w-3" />}

      {/* 中间：标题 */}
      <div className="flex-1 flex justify-center items-center space-x-2">
        <span
          className="text-sm font-medium"
          style={{ color: 'var(--color-text)' }}
        >
          {title}
        </span>
        {hasUnsavedChanges() && (
          <div className="flex items-center space-x-1">
            <div 
              className="w-2 h-2 bg-orange-500 rounded-full" 
              title={`${getUnsavedFiles().length} 个文件有未保存的更改`}
            />
            <span 
              className="text-xs"
              style={{ color: 'var(--color-textMuted)' }}
            >
              未保存
            </span>
          </div>
        )}
      </div>

      {/* 右侧：控制按钮 */}
      <div className="flex items-center px-3 space-x-1">
        {/* 侧边栏切换按钮 */}
        {onToggleSidebar && (
          <button
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            style={{ WebkitAppRegion: 'no-drag' }}
            onClick={onToggleSidebar}
            title="Toggle Sidebar"
          >
            <Sidebar 
              size={14} 
              style={{ color: 'var(--color-text)' }}
              className={sidebarVisible ? '' : 'opacity-50'} 
            />
          </button>
        )}

        {/* 面板切换按钮 */}
        <button
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          style={{ WebkitAppRegion: 'no-drag' }}
          title="Toggle Panel"
        >
          <Layers size={14} style={{ color: 'var(--color-text)' }} />
        </button>

        {/* 搜索按钮 */}
        <button
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          style={{ WebkitAppRegion: 'no-drag' }}
          title="Search"
        >
          <Search size={14} style={{ color: 'var(--color-text)' }} />
        </button>

        {/* Preview button */}
        <button
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          style={{ WebkitAppRegion: 'no-drag' }}
          title="Preview"
          onClick={handlePreview}
        >
          <Play size={14} style={{ color: 'var(--color-text)' }} />
        </button>

        {/* Windows 风格的窗口控制按钮 */}
        {!isMacOS && (
          <div className="flex">
            <button
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
              style={{ WebkitAppRegion: 'no-drag' }}
              onClick={handleMinimize}
            >
              <Minus size={14} style={{ color: 'var(--color-text)' }} />
            </button>
            <button
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
              style={{ WebkitAppRegion: 'no-drag' }}
              onClick={handleMaximize}
            >
              <Square size={14} style={{ color: 'var(--color-text)' }} />
            </button>
            <button
              className="p-1 hover:bg-red-500 hover:text-white"
              style={{ WebkitAppRegion: 'no-drag' }}
              onClick={handleClose}
            >
              <X size={14} style={{ color: 'var(--color-text)' }} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};