import React from 'react';
import type { VariableDecl } from '../../../context/ProjectContext';

interface VariableWithCount extends VariableDecl {
  count: number;
}

interface VariableNodeProps {
  variable: VariableWithCount;
  onSelect: (filePath: string, line: number) => void;
  searchTerm: string;
  showFile?: boolean;
}

export const VariableNodeComponent: React.FC<VariableNodeProps> = ({
  variable,
  onSelect,
  searchTerm,
  showFile = false
}) => {
  const handleClick = () => {
    onSelect(variable.file, variable.line);
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight) return text;
    
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark
          key={index}
          style={{
            backgroundColor: 'var(--color-highlight)',
            color: 'var(--color-highlightForeground)'
          }}
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getVariableIcon = () => {
    return '📊'; // Could be enhanced to detect variable types
  };

  const fileName = variable.file.split('/').pop() || variable.file;

  return (
    <div
      className="flex items-center py-1 px-2 cursor-pointer text-sm rounded transition-colors"
      style={{
        color: 'var(--color-textPrimary)',
        backgroundColor: 'transparent'
      }}
      onClick={handleClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--color-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <span className="mr-2">{getVariableIcon()}</span>
      <span className="flex-1 truncate">
        {highlightText(variable.name, searchTerm)}
        {variable.count > 1 && (
          <span
            className="ml-1 text-xs"
            style={{ color: 'var(--color-textMuted)' }}
          >
            ({variable.count})
          </span>
        )}
      </span>
      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-textMuted)' }}>
        {showFile && (
          <span className="truncate max-w-20">{fileName}</span>
        )}
        <span>:{variable.line}</span>
      </div>
    </div>
  );
};