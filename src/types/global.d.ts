// src/types/global.d.ts
// 全局类型定义

import React from 'react';

// Electron API 类型定义
export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

export interface PluginManifest {
  id: string;
  name: string;
  version?: string;
  description?: string;
  entry: string;
  width?: number;
  height?: number;
}

// 扩展 CSSProperties 以支持 WebkitAppRegion
declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag';
  }
}

// 全局 Window 接口扩展
declare global {
  interface Window {
    inkAPI: {
      // Project management
      openProject: () => Promise<string | null>;
      
      // File operations
      readFile: (filePath: string) => Promise<string>;
      writeFile: (filePath: string, content: string) => Promise<boolean>;
      readDir: (dirPath: string) => Promise<FileNode[]>;
      
      // File watching
      watchFiles: (paths: string[]) => Promise<boolean>;
      onFileChanged: (callback: (filePath: string) => void) => void;
      
      // Ink compilation
      compileInk: (source: string, lintOnly?: boolean, sourceFilePath?: string) => Promise<unknown>;
      
      // Plugin system
      loadPlugins: () => Promise<PluginManifest[]>;
      
      // Export functionality
      exportGame: (mode: 'web' | 'desktop') => Promise<{ success: boolean; path: string; canceled?: boolean }>;
      
      // Window controls
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      setWindowTitle: (title: string) => Promise<void>;
      
      // Window lifecycle
      onAppWillClose: (callback: () => void) => void;
      removeAppWillCloseListener: (callback: () => void) => void;
      confirmClose: () => Promise<void>;
      cancelClose?: () => Promise<void>;
      
      // System dialogs
      showSaveDialog: (unsavedFiles: string[]) => Promise<number>; // 0=保存, 1=不保存, 2=取消
      
      // Debug logging
      logToMain?: (message: string) => Promise<void>;
    };
    
    // 开发测试工具
    __DEV_TESTING__?: {
      crashRecovery: {
        simulateCrash: () => void;
        clearAllData: () => void;
        showRecoveryData: () => any;
        forceBackup: (filePath: string, content: string) => void;
      };
      refresh: {
        allowRefresh: () => void;
        blockRefresh: () => void;
      };
    };
  }
}