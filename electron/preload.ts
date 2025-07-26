// electron/preload.ts

import { contextBridge, ipcRenderer } from 'electron';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  main: string;
}

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('inkAPI', {
  // Project management
  openProject: () => ipcRenderer.invoke('open-project'),
  
  // File operations
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('write-file', filePath, content),
  readDir: (dirPath: string) => ipcRenderer.invoke('read-dir', dirPath),
  
  // File watching
  watchFiles: (paths: string[]) => ipcRenderer.invoke('watch-files', paths),
  onFileChanged: (callback: (filePath: string) => void) => {
    ipcRenderer.on('file-changed', (_, filePath) => callback(filePath));
  },
  
  // Ink compilation
  compileInk: (source: string, lintOnly: boolean = false, sourceFilePath?: string) => ipcRenderer.invoke('compile-ink', source, lintOnly, sourceFilePath),
  
  // Plugin system
  loadPlugins: () => ipcRenderer.invoke('load-plugins'),
  
  // Export functionality
  exportGame: (mode: 'web' | 'desktop') => ipcRenderer.invoke('export-game', mode),
});

// Add type declaration for the exposed API
declare global {
  interface Window {
    inkAPI: {
      openProject: () => Promise<string | null>;
      readFile: (filePath: string) => Promise<string>;
      writeFile: (filePath: string, content: string) => Promise<boolean>;
      readDir: (dirPath: string) => Promise<FileNode[]>;
      watchFiles: (paths: string[]) => Promise<boolean>;
      onFileChanged: (callback: (filePath: string) => void) => void;
      compileInk: (source: string, lintOnly?: boolean) => Promise<unknown>;
      loadPlugins: () => Promise<PluginManifest[]>;
      exportGame: (mode: 'web' | 'desktop') => Promise<{ success: boolean; path: string; canceled?: boolean }>;
    };
  }
}