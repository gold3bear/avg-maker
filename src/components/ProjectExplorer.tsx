import React, { useContext } from 'react';
import { ProjectContext } from '../context/ProjectContext';

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
  
  if (!projectContext) {
    throw new Error('ProjectExplorer must be used within ProjectProvider');
  }
  
  const { fileTree, openProject } = projectContext;

  // 渲染树状列表
  const renderTree = (nodes: FileNode[]) => (
    <ul className="pl-2">
      {nodes.map((node) => (
        <li key={node.path} className="mt-1">
          {node.isDirectory ? (
            <div className="font-medium text-gray-700">📁 {node.name}</div>
          ) : (
            <button
              className="text-left hover:underline text-blue-600"
              onClick={() => onSelect(node.path)}
            >
              📄 {node.name}
            </button>
          )}
          {node.isDirectory && node.children && renderTree(node.children)}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="w-64 bg-gray-50 border-r flex flex-col">
      <button
        className="m-2 px-3 py-1 bg-blue-500 text-white rounded"
        onClick={openProject}
      >
        打开项目
      </button>
      <div className="flex-1 overflow-auto">
        {fileTree.length > 0 ? (
          renderTree(fileTree)
        ) : (
          <div className="p-2 text-gray-500">未打开项目</div>
        )}
      </div>
    </div>
  );
};

export default ProjectExplorer;
