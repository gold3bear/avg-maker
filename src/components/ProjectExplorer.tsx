import React, { useState, useEffect } from 'react';

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
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [tree, setTree] = useState<FileNode[]>([]);

  // 打开项目根目录，读取文件树
  const handleOpen = async () => {
    const dir = await window.inkAPI.openProject();
    if (dir) {
      setProjectPath(dir);
      loadTree(dir);
      // 可选：监听文件变更，自动刷新
      window.inkAPI.watchFiles([dir]);
      window.inkAPI.onFileChanged((changedPath: string) => {
        loadTree(projectPath!);
      });
    }
  };

  // 递归加载目录结构
  const loadTree = async (dirPath: string) => {
    try {
      // 假设 ipc 已实现 readDir，返回 FileNode[]
      const nodes: FileNode[] = await window.inkAPI.readDir(dirPath);
      setTree(nodes);
    } catch (err) {
      console.error('读取项目文件树失败:', err);
    }
  };

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
        onClick={handleOpen}
      >
        打开项目
      </button>
      <div className="flex-1 overflow-auto">
        {tree.length > 0 ? (
          renderTree(tree)
        ) : (
          <div className="p-2 text-gray-500">未打开项目</div>
        )}
      </div>
    </div>
  );
};

export default ProjectExplorer;
