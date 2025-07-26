import React from 'react';

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
  const activeClass = 'bg-indigo-600 text-white';
  const inactiveClass = 'bg-white text-gray-700 hover:bg-gray-100';

  return (
    <div className="flex items-center justify-between bg-gray-200 p-2 border-b">
      {/* 左侧按钮组：打开项目 + 视图切换 */}
      <div className="flex space-x-2">
        <button
          onClick={onOpenProject}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500"
        >
          打开项目
        </button>
        <button
          onClick={() => onViewChange('preview')}
          className={`px-3 py-1 rounded ${view === 'preview' ? activeClass : inactiveClass}`}
        >
          预览
        </button>
        <button
          onClick={() => onViewChange('graph')}
          className={`px-3 py-1 rounded ${view === 'graph' ? activeClass : inactiveClass}`}
        >
          节点图
        </button>
      </div>

      {/* 右侧按钮组：导出 */}
      <div className="flex space-x-2">
        <button
          onClick={onExportWeb}
          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-500"
        >
          导出网页
        </button>
        <button
          onClick={onExportDesktop}
          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-500"
        >
          导出桌面
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
