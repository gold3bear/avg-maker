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
      className="flex flex-col h-full w-full"
      style={{
        backgroundColor: 'var(--color-sidebarBackground)',
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
