import React, { useContext } from 'react';
import { ProjectContext } from '../../context/ProjectContext';
import { FileTree } from './FileTree';
import { KnotManager } from './KnotManager';
import { VariableManager } from './VariableManager';

interface ProjectExplorerProps {
  onSelect: (filePath: string) => void;
}

export const ProjectExplorer: React.FC<ProjectExplorerProps> = ({ onSelect }) => {
  const projectContext = useContext(ProjectContext);

  if (!projectContext) {
    throw new Error('ProjectExplorer must be used within ProjectProvider');
  }

  const { fileTree, readFile } = projectContext;

  const renderNodeExtra = (node: any) => {
    if (!node.isDirectory && node.path.endsWith('.ink')) {
      return <KnotManager file={node} readFile={readFile} />;
    }
    return null;
  };

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
          <FileTree nodes={fileTree} onSelect={onSelect} renderNodeExtra={renderNodeExtra} />
        ) : (
          <div className="p-2 text-sm text-center" style={{ color: 'var(--color-textMuted)' }}>
            未打开项目
          </div>
        )}
      </div>
      <VariableManager files={fileTree} readFile={readFile} />
    </div>
  );
};

export default ProjectExplorer;
