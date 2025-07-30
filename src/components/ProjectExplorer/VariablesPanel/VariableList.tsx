import React from 'react';
import type { VariableDecl } from '../../../context/ProjectContext';
import { VariableNodeComponent } from './VariableNode';

interface VariableWithCount extends VariableDecl {
  count: number;
}

interface VariableListProps {
  variables: VariableWithCount[];
  onSelect: (filePath: string, line: number) => void;
  searchTerm: string;
}

export const VariableList: React.FC<VariableListProps> = ({ 
  variables, 
  onSelect, 
  searchTerm 
}) => {
  const groupedVariables = variables.reduce((acc, variable) => {
    if (!acc[variable.name]) {
      acc[variable.name] = [];
    }
    acc[variable.name].push(variable);
    return acc;
  }, {} as Record<string, VariableWithCount[]>);

  return (
    <div className="space-y-1">
      {Object.entries(groupedVariables).map(([varName, varDeclarations]) => (
        <div key={varName}>
          {varDeclarations.length === 1 ? (
            <VariableNodeComponent
              variable={varDeclarations[0]}
              onSelect={onSelect}
              searchTerm={searchTerm}
              showFile={true}
            />
          ) : (
            <div>
              <div
                className="text-xs font-medium px-1 py-1 rounded flex items-center justify-between"
                style={{ 
                  color: 'var(--color-textSecondary)',
                  backgroundColor: 'var(--color-sidebarBackground)'
                }}
              >
                <span>{varName}</span>
                <span className="text-xs">({varDeclarations.length})</span>
              </div>
              <div className="ml-2 space-y-1">
                {varDeclarations.map((variable, index) => (
                  <VariableNodeComponent
                    key={`${variable.file}-${variable.line}-${index}`}
                    variable={variable}
                    onSelect={onSelect}
                    searchTerm={searchTerm}
                    showFile={true}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};