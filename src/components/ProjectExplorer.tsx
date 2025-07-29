import React, { useContext } from 'react';
import { ProjectContext } from '../context/ProjectContext';
import { useSave } from '../context/SaveContext';

/**
 * 文件节点类型
 */
interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

interface ProjectExplorerProps {
  /** 选中文件时回调，返回文件绝对路径 */
  onSelect: (filePath: string) => void;
}

/**
 * 本地 Ink 项目文件浏览器
 */
export const ProjectExplorer: React.FC<ProjectExplorerProps> = ({ onSelect }) => {
  const projectContext = useContext(ProjectContext);
  const { getFileStatus } = useSave();
  
  if (!projectContext) {
    throw new Error('ProjectExplorer must be used within ProjectProvider');
  }
  
  const { fileTree } = projectContext;

  // 渲染树状列表
  const renderTree = (nodes: FileNode[]) => (
    <ul className="pl-2">
      {nodes.map((node) => (
        <li key={node.path} className="mt-1">
          {node.isDirectory ? (
            <div 
              className="font-medium px-2 py-1 rounded"
              style={{ color: 'var(--color-textSecondary)' }}
            >
              📁 {node.name}
            </div>
          ) : (
            <button
              className="text-left px-2 py-1 rounded w-full text-sm transition-colors flex items-center justify-between"
              style={{ 
                color: 'var(--color-textPrimary)',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              onClick={() => onSelect(node.path)}
            >
              <span>📄 {node.name}</span>
              {getFileStatus(node.path)?.isDirty && (
                <div 
                  className="w-2 h-2 bg-orange-500 rounded-full ml-1" 
                  title="未保存的更改"
                />
              )}
            </button>
          )}
          {node.isDirectory && node.children && renderTree(node.children)}
        </li>
      ))}
    </ul>
  );

  return (
    <div 
      className="w-64 flex flex-col"
      style={{ 
        backgroundColor: 'var(--color-sidebarBackground)',
        borderRight: `1px solid var(--color-sidebarBorder)`,
        color: 'var(--color-sidebarForeground)'
      }}
    >
      <div className="flex-1 overflow-auto p-2">
        {fileTree.length > 0 ? (
          renderTree(fileTree)
        ) : (
          <div 
            className="p-2 text-sm text-center"
            style={{ color: 'var(--color-textMuted)' }}
          >
            未打开项目
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectExplorer;
