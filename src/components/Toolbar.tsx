import React from 'react';
import { ThemeSelector } from './ThemeSelector';

/**
 * 工具栏属性
 */
interface ToolbarProps {
  /** 当前视图：预览 or 节点图 */
  view: 'preview' | 'graph';
  /** 切换视图 */
  onViewChange: (view: 'preview' | 'graph') => void;
  /** 打开本地项目 */
  onOpenProject: () => void;
  /** 导出为网页包 */
  onExportWeb: () => void;
  /** 导出为桌面 App */
  onExportDesktop: () => void;
}

/**
 * Toolbar：包含项目操作和视图切换按钮
 */
export const Toolbar: React.FC<ToolbarProps> = ({
  view,
  onViewChange,
  onOpenProject,
  onExportWeb,
  onExportDesktop
}) => {
  return (
    <div 
      className="flex items-center justify-between p-2"
      style={{
        backgroundColor: 'var(--color-toolbarBackground)',
        borderBottom: `1px solid var(--color-toolbarBorder)`,
        color: 'var(--color-toolbarForeground)',
      }}
    >
      {/* 左侧按钮组：打开项目 + 视图切换 */}
      <div className="flex space-x-2">
        <button
          onClick={onOpenProject}
          className="px-3 py-1 rounded text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--color-buttonPrimary)',
            color: 'var(--color-surface)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-buttonPrimaryHover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-buttonPrimary)';
          }}
        >
          打开项目
        </button>
        
        <button
          onClick={() => onViewChange('preview')}
          className="px-3 py-1 rounded text-sm font-medium transition-colors"
          style={{
            backgroundColor: view === 'preview' ? 'var(--color-active)' : 'var(--color-buttonSecondary)',
            color: view === 'preview' ? 'var(--color-surface)' : 'var(--color-textPrimary)',
            border: `1px solid var(--color-border)`,
          }}
          onMouseEnter={(e) => {
            if (view !== 'preview') {
              e.currentTarget.style.backgroundColor = 'var(--color-hover)';
            }
          }}
          onMouseLeave={(e) => {
            if (view !== 'preview') {
              e.currentTarget.style.backgroundColor = 'var(--color-buttonSecondary)';
            }
          }}
        >
          预览
        </button>
        
        <button
          onClick={() => onViewChange('graph')}
          className="px-3 py-1 rounded text-sm font-medium transition-colors"
          style={{
            backgroundColor: view === 'graph' ? 'var(--color-active)' : 'var(--color-buttonSecondary)',
            color: view === 'graph' ? 'var(--color-surface)' : 'var(--color-textPrimary)',
            border: `1px solid var(--color-border)`,
          }}
          onMouseEnter={(e) => {
            if (view !== 'graph') {
              e.currentTarget.style.backgroundColor = 'var(--color-hover)';
            }
          }}
          onMouseLeave={(e) => {
            if (view !== 'graph') {
              e.currentTarget.style.backgroundColor = 'var(--color-buttonSecondary)';
            }
          }}
        >
          节点图
        </button>
      </div>

      {/* 右侧按钮组：主题选择器 + 导出 */}
      <div className="flex items-center space-x-2">
        <ThemeSelector />
        
        <div className="w-px h-6" style={{ backgroundColor: 'var(--color-border)' }} />
        
        <button
          onClick={onExportWeb}
          className="px-3 py-1 rounded text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--color-success)',
            color: 'var(--color-surface)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          导出网页
        </button>
        
        <button
          onClick={onExportDesktop}
          className="px-3 py-1 rounded text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--color-success)',
            color: 'var(--color-surface)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          导出桌面
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
