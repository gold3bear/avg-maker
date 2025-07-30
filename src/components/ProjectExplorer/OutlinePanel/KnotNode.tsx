import React from 'react';
import type { KnotNode } from '../../../context/ProjectContext';

interface KnotWithFile extends KnotNode {
  filePath: string;
}

interface KnotNodeProps {
  knot: KnotWithFile;
  onSelect: (filePath: string, line: number) => void;
  searchTerm: string;
}

export const KnotNodeComponent: React.FC<KnotNodeProps> = ({
  knot,
  onSelect,
  searchTerm
}) => {
  const handleClick = () => {
    onSelect(knot.filePath, knot.line);
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
      <span className="mr-2 text-blue-400">◦</span>
      <span className="flex-1 truncate">
        {highlightText(knot.name, searchTerm)}
      </span>
      <span
        className="text-xs ml-2"
        style={{ color: 'var(--color-textMuted)' }}
      >
        :{knot.line}
      </span>
    </div>
  );
};