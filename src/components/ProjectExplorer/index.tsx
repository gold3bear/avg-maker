import React from 'react';
import { FilesPanel } from './FilesPanel';
import { OutlinePanel } from './OutlinePanel';
import { VariablesPanel } from './VariablesPanel';

interface ProjectExplorerProps {
  onSelect: (filePath: string) => void;
  onNavigate?: (filePath: string, line: number) => void;
}

export const ProjectExplorer: React.FC<ProjectExplorerProps> = ({ 
  onSelect, 
  onNavigate 
}) => {
  const handleKnotSelect = (filePath: string, line: number) => {
    onSelect(filePath);
    if (onNavigate) {
      onNavigate(filePath, line);
    }
  };

  const handleVariableSelect = (filePath: string, line: number) => {
    onSelect(filePath);
    if (onNavigate) {
      onNavigate(filePath, line);
    }
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
      <div className="flex-1 overflow-auto">
        <FilesPanel onFileSelect={onSelect} />
        <OutlinePanel onKnotSelect={handleKnotSelect} />
        <VariablesPanel onVariableSelect={handleVariableSelect} />
      </div>
    </div>
  );
};

export default ProjectExplorer;
