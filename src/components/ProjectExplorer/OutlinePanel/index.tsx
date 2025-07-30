import React, { useContext, useState } from 'react';
import { ProjectContext } from '../../../context/ProjectContext';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import { EmptyState } from '../shared/EmptyState';
import { KnotList } from './KnotList';

interface OutlinePanelProps {
  onKnotSelect: (filePath: string, line: number) => void;
}

export const OutlinePanel: React.FC<OutlinePanelProps> = ({ onKnotSelect }) => {
  const projectContext = useContext(ProjectContext);
  const [searchTerm, setSearchTerm] = useState('');

  if (!projectContext) {
    throw new Error('OutlinePanel must be used within ProjectProvider');
  }

  const { knotMap, projectPath } = projectContext;

  const allKnots = Object.entries(knotMap).flatMap(([filePath, knots]) =>
    knots.map(knot => ({ ...knot, filePath }))
  );

  const filteredKnots = searchTerm
    ? allKnots.filter(knot =>
        knot.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allKnots;

  const headerActions = projectPath && allKnots.length > 0 ? (
    <input
      type="text"
      placeholder="Search knots..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="px-2 py-1 text-xs rounded"
      style={{
        backgroundColor: 'var(--color-inputBackground)',
        border: `1px solid var(--color-inputBorder)`,
        color: 'var(--color-inputForeground)',
      }}
      onClick={(e) => e.stopPropagation()}
    />
  ) : undefined;

  return (
    <CollapsibleSection
      title="Outline"
      storageKey="outline"
      defaultExpanded={false}
      headerActions={headerActions}
      stickyZIndex={20}
    >
      {!projectPath ? (
        <EmptyState
          icon="📖"
          message="未打开项目"
        />
      ) : allKnots.length === 0 ? (
        <EmptyState
          icon="📝"
          message="未找到章节"
        />
      ) : (
        <div className="px-2">
          <KnotList
            knots={filteredKnots}
            onSelect={onKnotSelect}
            searchTerm={searchTerm}
          />
        </div>
      )}
    </CollapsibleSection>
  );
};