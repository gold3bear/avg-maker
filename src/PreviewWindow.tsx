import React, { useEffect, useState } from 'react';
import Preview from './components/Preview';
import { ProjectProvider } from './context/ProjectContext';
import { InkProvider } from './context/InkContext';

const PreviewWindow: React.FC = () => {
  const [file, setFile] = useState<string | null>(null);

  useEffect(() => {
    window.inkAPI.onSetActiveFile((path: string) => {
      setFile(path);
    });
  }, []);

  return (
    <ProjectProvider>
      <InkProvider>
        <div style={{ height: '100vh' }}>
          <Preview filePath={file} />
        </div>
      </InkProvider>
    </ProjectProvider>
  );
};

export default PreviewWindow;
