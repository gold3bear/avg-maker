import React, { useEffect, useState } from 'react';
import Preview from './components/Preview';
import { ProjectProvider } from './context/ProjectContext';
import { InkProvider } from './context/InkContext';
import { ThemeProvider } from './context/ThemeContext';

const PreviewWindow: React.FC = () => {
  const [file, setFile] = useState<string | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    console.log('PreviewWindow: Setting up event listeners');
    
    const handleSetActiveFile = (path: string) => {
      console.log('PreviewWindow: Received file path:', path);
      setFile(path);
    };

    window.inkAPI.onSetActiveFile(handleSetActiveFile);

    // Mark as ready after a short delay to ensure all context providers are initialized
    const readyTimer = setTimeout(() => {
      console.log('PreviewWindow: Marking as ready');
      setIsReady(true);
    }, 200);

    return () => {
      clearTimeout(readyTimer);
    };
  }, []);

  // Don't render until we're ready
  if (!isReady) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#1e1e1e',
        color: '#ffffff'
      }}>
        Loading Preview...
      </div>
    );
  }

  return (
    <ThemeProvider>
      <ProjectProvider>
        <InkProvider>
          <div style={{ height: '100vh' }}>
            <Preview filePath={file} />
          </div>
        </InkProvider>
      </ProjectProvider>
    </ThemeProvider>
  );
};

export default PreviewWindow;
