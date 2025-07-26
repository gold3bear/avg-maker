// src/global.d.ts

import type { PluginManifest } from './components/PluginHost';

declare global {
  interface Window {
    inkAPI: {
      // 项目管理
      openProject: () => Promise<string | null>;
      readDir: (dirPath: string) => Promise<Array<{
        name: string;
        path: string;
        isDirectory: boolean;
        children?: any[];
      }>>;
      readFile: (filePath: string) => Promise<string>;
      writeFile: (filePath: string, content: string) => Promise<void>;
      watchFiles: (paths: string[]) => void;
      onFileChanged: (callback: (changedPath: string) => void) => void;

      // 插件
      loadPlugins: () => Promise<PluginManifest[]>;

      // Ink 编译与预览
      compileInk: (source: string, lintOnly?: boolean, sourceFilePath?: string) => Promise<any>;
      exportGame: (mode: 'web' | 'desktop') => Promise<{
        success: boolean;
        path: string;
      } | { canceled: true }>;
    };
  }
}

export {};
