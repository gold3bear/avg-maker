/// <reference path="../types/global.d.ts" />
import React, { useEffect, useState, useCallback, useContext } from 'react';
import { Minus, Square, X, Sidebar, FolderOpen, Eye, Network, Download, Package } from 'lucide-react';
import { useSave } from '../context/SaveContext';
import { ProjectContext } from '../context/ProjectContext';
import { ThemeSelector } from './ThemeSelector';
import type { PreviewRef } from './Preview';

interface TitleBarProps {
  title?: string;
  onToggleSidebar?: () => void;
  sidebarVisible?: boolean;
  activeFile?: string | null; // 保留但不用于CompilePreviewer逻辑
  onOpenProject?: () => void;
  onExportWeb?: () => void;
  onExportDesktop?: () => void;
  // Preview组件的ref，用于控制导航
  previewRef?: React.RefObject<PreviewRef>;
  // 预览文件变更回调
  onPreviewFileChange?: (filePath: string | null) => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  title = 'AVG Maker',
  onToggleSidebar,
  sidebarVisible = true,
  activeFile = null,
  onOpenProject,
  onExportWeb,
  onExportDesktop,
  previewRef,
  onPreviewFileChange,
}) => {
  const platform = navigator.platform.toLowerCase();
  const isMacOS = platform.includes('mac');
  const [, setIsFullscreen] = useState(false);
  const { hasUnsavedChanges, getUnsavedFiles } = useSave();
  const { projectPath, fileTree } = useContext(ProjectContext) || { projectPath: null, fileTree: [] };

  // CompilePreviewer现在已移动到Preview组件中

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

  // CompilePreviewer相关的逻辑已移至Preview组件

  const handleMinimize = () => {
    window.inkAPI?.minimizeWindow?.();
  };

  const handleMaximize = () => {
    window.inkAPI?.maximizeWindow?.();
  };

  // 移除了依赖activeFile的旧预览函数，现在由CompilePreviewer独立管理

  // CompilePreviewer的handlePlay已移至Preview组件

  // 所有CompilePreviewer的功能函数已移至Preview组件

  // handleTogglePreview和相关的useEffect已移至Preview组件

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

      {/* 中间：编译预览器和工具按钮 */}
      <div className="flex-1 flex justify-center items-center space-x-4">
        {/* 左侧工具按钮组 */}
        <div className="flex items-center space-x-1" style={{ WebkitAppRegion: 'no-drag' }}>
          {/* 打开项目 */}
          {onOpenProject && (
            <button
              onClick={onOpenProject}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              title="打开项目"
            >
              <FolderOpen size={14} style={{ color: 'var(--color-text)' }} />
            </button>
          )}
          
          {/* 视图切换按钮现在由CompilePreviewer内部管理，这里不再需要单独的按钮 */}
        </div>

        {/* 中间：未保存状态指示器 */}
        <div className="flex items-center space-x-2" style={{ WebkitAppRegion: 'no-drag' }}>
          {hasUnsavedChanges() && (
            <div className="flex items-center space-x-1" title={`${getUnsavedFiles().length} 个文件有未保存的更改`}>
              <div className="w-2 h-2 bg-orange-500 rounded-full" />
              <span className="text-xs" style={{ color: 'var(--color-textMuted)' }}>
                未保存
              </span>
            </div>
          )}
        </div>

        {/* 右侧工具按钮组 */}
        <div className="flex items-center space-x-1" style={{ WebkitAppRegion: 'no-drag' }}>
          {/* 主题选择器 */}
          <ThemeSelector />
          
          {/* 导出按钮 */}
          {(onExportWeb || onExportDesktop) && (
            <>
              {onExportWeb && (
                <button
                  onClick={onExportWeb}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                  title="导出网页"
                >
                  <Package size={14} style={{ color: 'var(--color-text)' }} />
                </button>
              )}
              {onExportDesktop && (
                <button
                  onClick={onExportDesktop}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                  title="导出桌面应用"
                >
                  <Download size={14} style={{ color: 'var(--color-text)' }} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 右侧：控制按钮 */}
      <div className="flex items-center px-3 space-x-1">
        {/* 侧边栏切换按钮 */}
        {onToggleSidebar && (
          <button
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            style={{ WebkitAppRegion: 'no-drag' }}
            onClick={onToggleSidebar}
            title="切换侧边栏"
          >
            <Sidebar 
              size={14} 
              style={{ color: 'var(--color-text)' }}
              className={sidebarVisible ? '' : 'opacity-50'} 
            />
          </button>
        )}

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