import React from 'react';
import type { KnotNode } from '../../../context/ProjectContext';
import { KnotNodeComponent } from './KnotNode';

interface KnotWithFile extends KnotNode {
  filePath: string;
}

interface KnotListProps {
  knots: KnotWithFile[];
  onSelect: (filePath: string, line: number) => void;
  searchTerm: string;
}

export const KnotList: React.FC<KnotListProps> = ({ 
  knots, 
  onSelect, 
  searchTerm 
}) => {
  const groupedKnots = knots.reduce((acc, knot) => {
    const fileName = knot.filePath.split('/').pop() || knot.filePath;
    if (!acc[fileName]) {
      acc[fileName] = [];
    }
    acc[fileName].push(knot);
    return acc;
  }, {} as Record<string, KnotWithFile[]>);

  return (
    <div className="space-y-2">
      {Object.entries(groupedKnots).map(([fileName, fileKnots]) => (
        <div key={fileName}>
          <div
            className="text-xs font-medium px-1 py-1 rounded"
            style={{ 
              color: 'var(--color-textSecondary)',
              backgroundColor: 'var(--color-sidebarBackground)'
            }}
          >
            {fileName} ({fileKnots.length})
          </div>
          <div className="ml-2 space-y-1">
            {fileKnots.map((knot) => (
              <KnotNodeComponent
                key={`${knot.filePath}-${knot.name}-${knot.line}`}
                knot={knot}
                onSelect={onSelect}
                searchTerm={searchTerm}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};