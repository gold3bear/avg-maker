import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Globe, Monitor, Play, RotateCcw, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

// 预览平台类型
export type PreviewPlatform = 'browser' | 'editor';

// 入口文件信息
export interface EntryFile {
  id: string;
  name: string;
  path: string;
  relativePath: string;
}

// 编译预览器属性
interface CompilePreviewerProps {
  // 当前选中的平台
  selectedPlatform: PreviewPlatform;
  onPlatformChange: (platform: PreviewPlatform) => void;
  
  // 入口文件相关
  entryFiles: EntryFile[];
  selectedEntryFile: EntryFile | null;
  onEntryFileChange: (file: EntryFile) => void;
  
  // 功能按钮回调
  onPlay: () => void;
  onRefresh: () => void;
  onBack: () => void;
  onForward: () => void;
  onReset: () => void;
  
  // 状态
  isCompiling?: boolean;
  canGoBack?: boolean;
  canGoForward?: boolean;
}

// 平台配置
const PLATFORM_CONFIG = {
  browser: {
    id: 'browser' as const,
    name: '浏览器预览',
    icon: Globe,
    description: '在系统浏览器中预览'
  },
  editor: {
    id: 'editor' as const,
    name: '编辑器预览',
    icon: Monitor,
    description: '在内置编辑器中预览'
  }
};

// 下拉菜单组件
const Dropdown: React.FC<{
  trigger: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}> = ({ trigger, children, isOpen, onToggle, className = '' }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isOpen) onToggle();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  return (
    <div ref={dropdownRef} className={`relative ${className}`} style={{ WebkitAppRegion: 'no-drag' }}>
      <div onClick={onToggle} className="cursor-pointer">
        {trigger}
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-50 min-w-48">
          {children}
        </div>
      )}
    </div>
  );
};

// 平台选择器
const PlatformSelector: React.FC<{
  selectedPlatform: PreviewPlatform;
  onPlatformChange: (platform: PreviewPlatform) => void;
}> = ({ selectedPlatform, onPlatformChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentPlatform = PLATFORM_CONFIG[selectedPlatform];

  const handleSelect = (platform: PreviewPlatform) => {
    onPlatformChange(platform);
    setIsOpen(false);
  };

  const trigger = (
    <div 
      className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
      title={currentPlatform.name}
    >
      <currentPlatform.icon size={14} style={{ color: 'var(--color-text)' }} />
      <ChevronDown size={12} style={{ color: 'var(--color-text)' }} />
    </div>
  );

  return (
    <Dropdown trigger={trigger} isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)}>
      {Object.values(PLATFORM_CONFIG).map((platform) => (
        <div
          key={platform.id}
          onClick={() => handleSelect(platform.id)}
          className={`flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
            selectedPlatform === platform.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
          }`}
        >
          <platform.icon size={14} style={{ color: 'var(--color-text)' }} />
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              {platform.name}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-textMuted)' }}>
              {platform.description}
            </div>
          </div>
        </div>
      ))}
    </Dropdown>
  );
};

// 入口文件选择器
const EntryFileSelector: React.FC<{
  entryFiles: EntryFile[];
  selectedEntryFile: EntryFile | null;
  onEntryFileChange: (file: EntryFile) => void;
}> = ({ entryFiles, selectedEntryFile, onEntryFileChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (file: EntryFile) => {
    onEntryFileChange(file);
    setIsOpen(false);
  };

  const trigger = (
    <div className="flex items-center space-x-2 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
      <span className="text-sm" style={{ color: 'var(--color-text)' }}>
        {selectedEntryFile ? selectedEntryFile.name : '选择入口文件'}
      </span>
      <ChevronDown size={12} style={{ color: 'var(--color-text)' }} />
    </div>
  );

  return (
    <Dropdown trigger={trigger} isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)}>
      {entryFiles.length === 0 ? (
        <div className="px-3 py-2 text-sm" style={{ color: 'var(--color-textMuted)' }}>
          项目中没有找到 .ink 文件
        </div>
      ) : (
        entryFiles.map((file) => (
          <div
            key={file.id}
            onClick={() => handleSelect(file)}
            className={`px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
              selectedEntryFile?.id === file.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
            }`}
          >
            <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              {file.name}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-textMuted)' }}>
              {file.relativePath}
            </div>
          </div>
        ))
      )}
    </Dropdown>
  );
};

// 功能按钮组
const ActionButtons: React.FC<{
  platform: PreviewPlatform;
  onPlay: () => void;
  onRefresh: () => void;
  onBack: () => void;
  onForward: () => void;
  onReset: () => void;
  isCompiling?: boolean;
  canGoBack?: boolean;
  canGoForward?: boolean;
}> = ({ platform, onPlay, onRefresh, onBack, onForward, onReset, isCompiling, canGoBack, canGoForward }) => {
  if (platform === 'browser') {
    return (
      <div className="flex items-center space-x-1">
        <button
          onClick={onPlay}
          disabled={isCompiling}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          title="编译并在浏览器中预览"
        >
          <Play size={14} style={{ color: 'var(--color-text)' }} />
        </button>
        <button
          onClick={onRefresh}
          disabled={isCompiling}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
          title="重新编译并刷新"
        >
          <RotateCcw size={14} style={{ color: 'var(--color-text)' }} />
        </button>
      </div>
    );
  }

  // 编辑器预览按钮
  return (
    <div className="flex items-center space-x-1">
      <button
        onClick={onBack}
        disabled={!canGoBack}
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        title="后退"
      >
        <ChevronLeft size={14} style={{ color: 'var(--color-text)' }} />
      </button>
      <button
        onClick={onForward}
        disabled={!canGoForward}
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        title="前进"
      >
        <ChevronRight size={14} style={{ color: 'var(--color-text)' }} />
      </button>
      <button
        onClick={onReset}
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
        title="重置到开始"
      >
        <RefreshCw size={14} style={{ color: 'var(--color-text)' }} />
      </button>
    </div>
  );
};

// 主编译预览器组件
export const CompilePreviewer: React.FC<CompilePreviewerProps> = ({
  selectedPlatform,
  onPlatformChange,
  entryFiles,
  selectedEntryFile,
  onEntryFileChange,
  onPlay,
  onRefresh,
  onBack,
  onForward,
  onReset,
  isCompiling = false,
  canGoBack = false,
  canGoForward = false
}) => {
  return (
    <div className="flex items-center space-x-3 px-2 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-600" style={{ height: '28px' }}>
      {/* 平台选择器 */}
      <PlatformSelector
        selectedPlatform={selectedPlatform}
        onPlatformChange={onPlatformChange}
      />

      {/* 分隔符 */}
      <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />

      {/* 入口文件选择器 */}
      <EntryFileSelector
        entryFiles={entryFiles}
        selectedEntryFile={selectedEntryFile}
        onEntryFileChange={onEntryFileChange}
      />

      {/* 分隔符 */}
      <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />

      {/* 功能按钮组 */}
      <ActionButtons
        platform={selectedPlatform}
        onPlay={onPlay}
        onRefresh={onRefresh}
        onBack={onBack}
        onForward={onForward}
        onReset={onReset}
        isCompiling={isCompiling}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
      />

      {/* 编译状态指示器 */}
      {isCompiling && (
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-xs" style={{ color: 'var(--color-textMuted)' }}>
            编译中...
          </span>
        </div>
      )}
    </div>
  );
};

export default CompilePreviewer;

// 确保所有类型都被正确导出
export type { PreviewPlatform, EntryFile };