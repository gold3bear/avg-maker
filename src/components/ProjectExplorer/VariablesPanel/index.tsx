import React, { useContext, useState, useMemo } from 'react';
import { ProjectContext } from '../../../context/ProjectContext';
import { CollapsibleSection } from '../shared/CollapsibleSection';
import { EmptyState } from '../shared/EmptyState';
import { VariableList } from './VariableList';

interface VariablesPanelProps {
  onVariableSelect: (filePath: string, line: number) => void;
}

export const VariablesPanel: React.FC<VariablesPanelProps> = ({ onVariableSelect }) => {
  const projectContext = useContext(ProjectContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'count' | 'file'>('name');

  if (!projectContext) {
    throw new Error('VariablesPanel must be used within ProjectProvider');
  }

  const { variableMap, projectPath } = projectContext;

  const allVariables = useMemo(() => {
    return Object.entries(variableMap).flatMap(([varName, declarations]) =>
      declarations.map(decl => ({
        name: varName,
        ...decl,
        count: declarations.length
      }))
    );
  }, [variableMap]);

  const filteredAndSortedVariables = useMemo(() => {
    let filtered = searchTerm
      ? allVariables.filter(variable =>
          variable.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : allVariables;

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'count':
          return b.count - a.count;
        case 'file':
          return a.file.localeCompare(b.file);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [allVariables, searchTerm, sortBy]);

  const headerActions = projectPath && allVariables.length > 0 ? (
    <div className="flex items-center gap-2">
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as 'name' | 'count' | 'file')}
        className="px-1 py-1 text-xs rounded"
        style={{
          backgroundColor: 'var(--color-inputBackground)',
          border: `1px solid var(--color-inputBorder)`,
          color: 'var(--color-inputForeground)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <option value="name">Name</option>
        <option value="count">Count</option>
        <option value="file">File</option>
      </select>
      <input
        type="text"
        placeholder="Search..."
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
    </div>
  ) : undefined;

  return (
    <CollapsibleSection
      title="Variables"
      storageKey="variables"
      defaultExpanded={false}
      headerActions={headerActions}
      stickyZIndex={10}
    >
      {!projectPath ? (
        <EmptyState
          icon="🔢"
          message="未打开项目"
        />
      ) : allVariables.length === 0 ? (
        <EmptyState
          icon="📊"
          message="未找到变量"
        />
      ) : (
        <div className="px-2">
          <VariableList
            variables={filteredAndSortedVariables}
            onSelect={onVariableSelect}
            searchTerm={searchTerm}
          />
        </div>
      )}
    </CollapsibleSection>
  );
};