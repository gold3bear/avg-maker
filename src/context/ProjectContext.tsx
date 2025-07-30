import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { PluginManifest } from '../components/PluginHost';
import { extractKnots, extractVariables } from '../utils/inkLanguage';

export interface KnotNode { name: string; line: number; file: string; }
export interface VariableDecl { name: string; file: string; line: number; }

/**
 * 本地文件树节点
 */
export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
  knots?: string[];
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
  knotMap: Record<string, KnotNode[]>;
  variableMap: Record<string, VariableDecl[]>;

  openProject: () => Promise<void>;
  loadProjectPath: (projectPath: string) => Promise<boolean>;
  readDir: (dirPath: string) => Promise<FileNode[]>;
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<boolean>;
  watchFiles: (paths: string[]) => void;
  onFileChanged: (callback: (changedPath: string) => void) => void;
  selectFile: (filePath: string) => void;
  refreshFileTree: () => Promise<void>;
}

export const ProjectContext = createContext<ProjectContextValue | null>(null);

export const ProjectProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [plugins, setPlugins] = useState<PluginManifest[]>([]);
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [knotMap, setKnotMap] = useState<Record<string, KnotNode[]>>({});
  const [variableMap, setVariableMap] = useState<Record<string, VariableDecl[]>>({});

  // 加载所有本地 H5 插件
  useEffect(() => {
    window.inkAPI.loadPlugins().then((list: PluginManifest[]) => {
      setPlugins(list);
    });
  }, []);

  const buildIndexes = useCallback(async (nodes: FileNode[]) => {
    const kMap: Record<string, KnotNode[]> = {};
    const vMap: Record<string, VariableDecl[]> = {};
    const traverse = async (node: FileNode) => {
      if (node.isDirectory && node.children) {
        for (const child of node.children) await traverse(child);
      } else if (node.path.endsWith('.ink')) {
        const content = await window.inkAPI.readFile(node.path);
        const lines = content.split('\n');
        const knots = extractKnots(content).map(name => ({ name, line: lines.findIndex(l => l.includes(name)) + 1, file: node.path }));
        node.knots = knots.map(k => k.name);
        kMap[node.path] = knots;
        extractVariables(content).forEach(v => {
          if (!vMap[v]) vMap[v] = [];
          vMap[v].push({ name: v, file: node.path, line: lines.findIndex(l => l.includes(v)) + 1 });
        });
      }
    };
    for (const n of nodes) await traverse(n);
    setKnotMap(kMap);
    setVariableMap(vMap);
  }, []);

  useEffect(() => {
    if (fileTree.length > 0) {
      buildIndexes(fileTree);
    }
  }, [fileTree, buildIndexes]);

  // 打开项目文件夹并加载文件树
  const openProject = useCallback(async () => {
    const dir = await window.inkAPI.openProject();
    if (dir) {
      setProjectPath(dir);
      const nodes = await window.inkAPI.readDir(dir);
      await buildIndexes(nodes);
      setFileTree(nodes);
      // 监听文件改动，自动刷新树
      window.inkAPI.watchFiles([dir]);
      window.inkAPI.onFileChanged((_: string) => {
        window.inkAPI.readDir(dir).then(setFileTree);
      });
    }
  }, []);

  // 直接加载指定路径的项目（用于恢复）
  const loadProjectPath = useCallback(async (projectPath: string): Promise<boolean> => {
    try {
      const dir = await window.inkAPI.loadProjectPath(projectPath);
      if (dir) {
        console.log('🔄 ProjectContext: 加载项目路径成功:', dir);
        setProjectPath(dir);
        const nodes = await window.inkAPI.readDir(dir);
        await buildIndexes(nodes);
        setFileTree(nodes);
        // 监听文件改动，自动刷新树
        window.inkAPI.watchFiles([dir]);
        window.inkAPI.onFileChanged((_: string) => {
          window.inkAPI.readDir(dir).then(setFileTree);
        });
        return true;
      } else {
        console.error('🔄 ProjectContext: 加载项目路径失败，API返回null');
        return false;
      }
    } catch (error) {
      console.error('🔄 ProjectContext: 加载项目路径出错:', error);
      return false;
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

  const refreshFileTree = useCallback(async () => {
    if (projectPath) {
      console.log('🔄 ProjectContext: 刷新文件树');
      const nodes = await window.inkAPI.readDir(projectPath);
      await buildIndexes(nodes);
      setFileTree(nodes);
    }
  }, [projectPath, buildIndexes]);

  return (
    <ProjectContext.Provider
      value={{
        plugins,
        projectPath,
        fileTree,
        activeFile,
        knotMap,
        variableMap,
        openProject,
        loadProjectPath,
        readDir,
        readFile,
        writeFile,
        watchFiles,
        onFileChanged,
        selectFile,
        refreshFileTree
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};
