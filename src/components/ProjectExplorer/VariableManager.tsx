import React, { useEffect, useState } from 'react';
import { extractVariables } from '../../utils/inkLanguage';
import type { FileNode } from '../../context/ProjectContext';

interface VariableManagerProps {
  files: FileNode[];
  readFile: (path: string) => Promise<string>;
}

export const VariableManager: React.FC<VariableManagerProps> = ({ files, readFile }) => {
  const [variables, setVariables] = useState<Record<string, number>>( {} );

  useEffect(() => {
    const scan = async () => {
      const map: Record<string, number> = {};
      const walk = async (node: FileNode) => {
        if (node.isDirectory && node.children) {
          for (const c of node.children) await walk(c);
        } else if (node.path.endsWith('.ink')) {
          const content = await readFile(node.path);
          extractVariables(content).forEach(v => {
            map[v] = (map[v] || 0) + 1;
          });
        }
      };
      for (const n of files) await walk(n);
      setVariables(map);
    };
    scan();
  }, [files, readFile]);

  return (
    <div className="p-2 text-sm">
      <h3 className="font-bold mb-2">Variables</h3>
      <ul className="pl-2 list-disc">
        {Object.entries(variables).map(([name, count]) => (
          <li key={name}>{name} ({count})</li>
        ))}
      </ul>
    </div>
  );
};
