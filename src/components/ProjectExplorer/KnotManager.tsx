import React, { useEffect, useState } from 'react';
import { extractKnots } from '../../utils/inkLanguage';
import type { FileNode } from '../../context/ProjectContext';

interface KnotManagerProps {
  file: FileNode;
  readFile: (path: string) => Promise<string>;
}

export const KnotManager: React.FC<KnotManagerProps> = ({ file, readFile }) => {
  const [knots, setKnots] = useState<string[]>([]);

  useEffect(() => {
    if (!file.isDirectory && file.path.endsWith('.ink')) {
      readFile(file.path).then(content => {
        setKnots(extractKnots(content));
      });
    }
  }, [file, readFile]);

  if (knots.length === 0) return null;

  return (
    <ul className="pl-4 text-xs text-indigo-400">
      {knots.map(k => (
        <li key={k}>↪ {k}</li>
      ))}
    </ul>
  );
};
