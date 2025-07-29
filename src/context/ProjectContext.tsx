import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { PluginManifest } from '../components/PluginHost';

/**
 * 本地文件树节点
 */
export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

/**
 * ProjectContext 提供的值
 */
export interface ProjectContextValue {
  /** 已加载的 H5 插件清单 */
  plugins: PluginManifest[];
  /** 当前打开的项目根目录 */
  projectPath: string | null;
  /** 项目文件树 */
  fileTree: FileNode[];
  /** 当前激活的文件 */
  activeFile: string | null;

  openProject: () => Promise<void>;
  readDir: (dirPath: string) => Promise<FileNode[]>;
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<boolean>;
  watchFiles: (paths: string[]) => void;
  onFileChanged: (callback: (changedPath: string) => void) => void;
  selectFile: (filePath: string) => void;
}

export const ProjectContext = createContext<ProjectContextValue | null>(null);

export const ProjectProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [plugins, setPlugins] = useState<PluginManifest[]>([]);
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);

  // 加载所有本地 H5 插件
  useEffect(() => {
    window.inkAPI.loadPlugins().then((list: PluginManifest[]) => {
      setPlugins(list);
    });
  }, []);

  // 打开项目文件夹并加载文件树
  const openProject = useCallback(async () => {
    const dir = await window.inkAPI.openProject();
    if (dir) {
      setProjectPath(dir);
      const nodes = await window.inkAPI.readDir(dir);
      setFileTree(nodes);
      // 监听文件改动，自动刷新树
      window.inkAPI.watchFiles([dir]);
      window.inkAPI.onFileChanged((_: string) => {
        window.inkAPI.readDir(dir).then(setFileTree);
      });
    }
  }, []);

  const readDir = useCallback((dirPath: string) => {
    return window.inkAPI.readDir(dirPath);
  }, []);

  const readFile = useCallback((filePath: string) => {
    return window.inkAPI.readFile(filePath);
  }, []);

  const writeFile = useCallback((filePath: string, content: string) => {
    return window.inkAPI.writeFile(filePath, content);
  }, []);

  const watchFiles = useCallback((paths: string[]) => {
    window.inkAPI.watchFiles(paths);
  }, []);

  const onFileChanged = useCallback((callback: (changedPath: string) => void) => {
    window.inkAPI.onFileChanged(callback);
  }, []);

  const selectFile = useCallback((filePath: string) => {
    setActiveFile(filePath);
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        plugins,
        projectPath,
        fileTree,
        activeFile,
        openProject,
        readDir,
        readFile,
        writeFile,
        watchFiles,
        onFileChanged,
        selectFile
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};
