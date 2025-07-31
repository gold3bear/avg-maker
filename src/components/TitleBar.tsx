/// <reference path="../types/global.d.ts" />
import React, { useEffect, useState, useCallback, useContext } from 'react';
import { Minus, Square, X, Sidebar, FolderOpen, Eye, Network, Download, Package } from 'lucide-react';
import { useSave } from '../context/SaveContext';
import { ProjectContext } from '../context/ProjectContext';
import { ThemeSelector } from './ThemeSelector';
import { CompilePreviewer, type PreviewPlatform, type EntryFile } from './CompilePreviewer';
import type { PreviewRef } from './Preview';

interface TitleBarProps {
  title?: string;
  onToggleSidebar?: () => void;
  sidebarVisible?: boolean;
  activeFile?: string | null;
  // 添加Toolbar的功能属性
  view?: 'preview' | 'graph';
  onViewChange?: (view: 'preview' | 'graph') => void;
  onOpenProject?: () => void;
  onExportWeb?: () => void;
  onExportDesktop?: () => void;
  // Preview组件的ref，用于控制导航
  previewRef?: React.RefObject<PreviewRef>;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  title = 'AVG Maker',
  onToggleSidebar,
  sidebarVisible = true,
  activeFile = null,
  view = 'preview',
  onViewChange,
  onOpenProject,
  onExportWeb,
  onExportDesktop,
  previewRef,
}) => {
  const platform = navigator.platform.toLowerCase();
  const isMacOS = platform.includes('mac');
  const [, setIsFullscreen] = useState(false);
  const { hasUnsavedChanges, getUnsavedFiles } = useSave();
  const { projectPath, fileTree } = useContext(ProjectContext) || { projectPath: null, fileTree: [] };

  // 编译预览器状态
  const [selectedPlatform, setSelectedPlatform] = useState<PreviewPlatform>('browser');
  const [entryFiles, setEntryFiles] = useState<EntryFile[]>([]);
  const [selectedEntryFile, setSelectedEntryFile] = useState<EntryFile | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

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

  // 从项目文件树中提取ink文件作为入口文件
  const scanEntryFiles = useCallback(() => {
    if (!projectPath || !fileTree || fileTree.length === 0) {
      setEntryFiles([]);
      return [];
    }

    // 递归遍历文件树提取所有.ink文件
    const extractInkFiles = (nodes: any[]): EntryFile[] => {
      const files: EntryFile[] = [];
      
      const traverse = (node: any, relativePath: string = '') => {
        if (node.isDirectory && node.children) {
          const newPath = relativePath ? `${relativePath}/${node.name}` : node.name;
          node.children.forEach((child: any) => traverse(child, newPath));
        } else if (node.path && node.path.endsWith('.ink')) {
          const fileName = node.name || node.path.split('/').pop() || 'Untitled';
          const relPath = relativePath ? `${relativePath}/${fileName}` : fileName;
          files.push({
            id: node.path,
            name: fileName,
            path: node.path,
            relativePath: relPath
          });
        }
      };
      
      nodes.forEach(node => traverse(node));
      return files;
    };

    const files = extractInkFiles(fileTree);
    setEntryFiles(files);
    return files;
  }, [projectPath, fileTree]);

  // 单独处理文件选择逻辑
  useEffect(() => {
    const files = scanEntryFiles();
    
    if (files.length === 0) {
      setSelectedEntryFile(null);
      return;
    }

    // 如果当前有活动文件，尝试选择它
    if (activeFile) {
      const activeEntryFile = files.find(f => f.path === activeFile);
      if (activeEntryFile) {
        setSelectedEntryFile(activeEntryFile);
        return;
      }
    }
    
    // 如果没有选中的文件，选择第一个
    if (!selectedEntryFile || !files.some(f => f.id === selectedEntryFile.id)) {
      setSelectedEntryFile(files[0]);
    }
  }, [projectPath, fileTree, activeFile]);

  // 当选中文件不在文件列表中时，重新选择
  useEffect(() => {
    if (selectedEntryFile && entryFiles.length > 0) {
      const fileExists = entryFiles.some(f => f.id === selectedEntryFile.id);
      if (!fileExists && entryFiles.length > 0) {
        setSelectedEntryFile(entryFiles[0]);
      }
    }
  }, [entryFiles, selectedEntryFile]);

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

  const handleBrowserPreview = () => {
    if (activeFile) {
      // 在浏览器中打开预览
      const previewUrl = 'http://localhost:3001/preview';
      if (typeof window !== 'undefined' && window.open) {
        window.open(previewUrl, '_blank');
      }
    }
  };

  const copyPreviewUrl = () => {
    const previewUrl = 'http://localhost:3001/preview';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(previewUrl).then(() => {
        // 可以添加一个提示
        console.log('Preview URL copied to clipboard:', previewUrl);
      });
    }
  };

  // 编译预览器回调函数
  const handlePlay = useCallback(async () => {
    console.log('🎯 Play button clicked!', {
      selectedEntryFile: selectedEntryFile?.path,
      selectedPlatform,
      isCompiling
    });
    
    if (!selectedEntryFile || isCompiling) {
      console.log('⚠️ Play button blocked:', { 
        hasSelectedFile: !!selectedEntryFile, 
        isCompiling 
      });
      return;
    }
    
    setIsCompiling(true);
    try {
      if (selectedPlatform === 'browser') {
        console.log('🌐 Starting browser preview...');
        
        // 设置预览文件（这会触发SSR预览服务器更新）
        await window.inkAPI.updatePreviewFile(selectedEntryFile.path);
        
        // 在系统默认浏览器中打开预览
        const previewUrl = 'http://localhost:3001/preview';
        console.log('🌐 Opening URL in system browser:', previewUrl);
        
        const result = await window.inkAPI.openExternalUrl?.(previewUrl);
        if (result?.success) {
          console.log('✅ Browser preview opened successfully for:', selectedEntryFile.path);
        } else {
          console.error('❌ Failed to open browser preview:', result?.error);
          // 备用方案：使用window.open
          window.open(previewUrl, '_blank');
        }
      } else {
        console.log('🖥️ Starting editor preview...');
        
        // 编辑器预览模式，切换到预览视图
        if (onViewChange) {
          onViewChange('preview');
        }
        // 设置预览文件并触发编译
        await window.inkAPI.updatePreviewFile(selectedEntryFile.path);
        
        console.log('✅ Editor preview started for:', selectedEntryFile.path);
      }
    } catch (error) {
      console.error('❌ Preview failed:', error);
    } finally {
      setIsCompiling(false);
    }
  }, [selectedEntryFile, selectedPlatform, isCompiling, onViewChange]);

  const handleRefresh = useCallback(async () => {
    console.log('🔄 Refresh button clicked!', {
      selectedEntryFile: selectedEntryFile?.path,
      selectedPlatform,
      isCompiling
    });
    
    if (!selectedEntryFile || isCompiling) {
      console.log('⚠️ Refresh button blocked:', { 
        hasSelectedFile: !!selectedEntryFile, 
        isCompiling 
      });
      return;
    }
    
    setIsCompiling(true);
    try {
      // 重新设置预览文件，触发重新编译
      await window.inkAPI.updatePreviewFile(selectedEntryFile.path);
      
      if (selectedPlatform === 'browser') {
        console.log('🔄 Refreshing browser preview...');
        
        // 触发浏览器自动刷新
        const refreshResult = await window.inkAPI.triggerPreviewRefresh?.();
        if (refreshResult?.success) {
          console.log('✅ Browser preview refresh triggered successfully');
        } else {
          console.error('❌ Failed to trigger browser refresh:', refreshResult?.error);
        }
      } else {
        // 编辑器预览：内置预览会自动更新
        console.log('🔄 Editor preview refreshed for:', selectedEntryFile.path);
      }
    } catch (error) {
      console.error('❌ Refresh failed:', error);
    } finally {
      setIsCompiling(false);
    }
  }, [selectedEntryFile, selectedPlatform, isCompiling]);

  // 更新导航状态
  const updateNavigationState = useCallback(() => {
    if (selectedPlatform === 'editor' && previewRef?.current) {
      setCanGoBack(previewRef.current.canGoBack());
      setCanGoForward(previewRef.current.canGoForward());
    } else {
      setCanGoBack(false);
      setCanGoForward(false);
    }
  }, [selectedPlatform, previewRef]);

  const handleBack = useCallback(() => {
    if (selectedPlatform === 'editor' && previewRef?.current) {
      previewRef.current.goBack();
    }
  }, [selectedPlatform, previewRef]);

  const handleForward = useCallback(() => {
    if (selectedPlatform === 'editor' && previewRef?.current) {
      previewRef.current.goForward();
    }
  }, [selectedPlatform, previewRef]);

  const handleReset = useCallback(() => {
    if (selectedPlatform === 'editor' && previewRef?.current) {
      previewRef.current.reset();
    }
  }, [selectedPlatform, previewRef]);

  // 当平台切换或状态变化时更新导航状态
  useEffect(() => {
    updateNavigationState();
  }, [selectedPlatform, selectedEntryFile, updateNavigationState]);

  // 监听Preview组件的状态变化（仅在编辑器预览模式下）
  useEffect(() => {
    if (selectedPlatform !== 'editor' || !previewRef?.current) return;

    const unsubscribe = previewRef.current.onStateChange((canGoBack, canGoForward) => {
      setCanGoBack(canGoBack);
      setCanGoForward(canGoForward);
    });

    return unsubscribe;
  }, [selectedPlatform, previewRef]);

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
          
          {/* 视图切换按钮 */}
          {onViewChange && (
            <>
              <button
                onClick={() => onViewChange('preview')}
                className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
                  view === 'preview' ? 'bg-blue-500 hover:bg-blue-600' : ''
                }`}
                title="预览模式"
              >
                <Eye size={14} style={{ color: view === 'preview' ? 'white' : 'var(--color-text)' }} />
              </button>
              <button
                onClick={() => onViewChange('graph')}
                className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
                  view === 'graph' ? 'bg-blue-500 hover:bg-blue-600' : ''
                }`}
                title="节点图模式"
              >
                <Network size={14} style={{ color: view === 'graph' ? 'white' : 'var(--color-text)' }} />
              </button>
            </>
          )}
        </div>

        {/* 中间编译预览器 */}
        <div className="flex items-center space-x-2" style={{ WebkitAppRegion: 'no-drag' }}>
          <CompilePreviewer
            selectedPlatform={selectedPlatform}
            onPlatformChange={setSelectedPlatform}
            entryFiles={entryFiles}
            selectedEntryFile={selectedEntryFile}
            onEntryFileChange={setSelectedEntryFile}
            onPlay={handlePlay}
            onRefresh={handleRefresh}
            onBack={handleBack}
            onForward={handleForward}
            onReset={handleReset}
            isCompiling={isCompiling}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
          />
          
          {/* 未保存状态指示器 */}
          {hasUnsavedChanges() && (
            <div className="flex items-center space-x-1 ml-2" title={`${getUnsavedFiles().length} 个文件有未保存的更改`}>
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