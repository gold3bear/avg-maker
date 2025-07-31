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
      loadProjectPath: (projectPath: string) => Promise<string | null>;
      
      // File operations
      readFile: (filePath: string) => Promise<string>;
      writeFile: (filePath: string, content: string) => Promise<boolean>;
      readDir: (dirPath: string) => Promise<FileNode[]>;
      renameFile?: (filePath: string, newName: string) => Promise<boolean>;
      deleteFile?: (filePath: string) => Promise<boolean>;
      moveFile?: (src: string, dest: string) => Promise<boolean>;
      createDirectory?: (dirPath: string) => Promise<boolean>;
      showInExplorer?: (filePath: string) => Promise<{ success: boolean; error?: string }>;
      copyFile?: (src: string, dest: string) => Promise<boolean>;
      
      // File watching
      watchFiles: (paths: string[]) => Promise<boolean>;
      onFileChanged: (callback: (filePath: string) => void) => void;
      
      // Ink compilation
      compileInk: (source: string, lintOnly?: boolean, sourceFilePath?: string) => Promise<unknown>;
      compileProject?: (root: string) => Promise<unknown>;
      
      // Plugin system
      loadPlugins: () => Promise<PluginManifest[]>;
      
      // Export functionality
      exportGame: (mode: 'web' | 'desktop') => Promise<{ success: boolean; path: string; canceled?: boolean }>;

      // Preview window
      openPreviewWindow: (filePath: string) => Promise<void>;
      updatePreviewFile: (filePath: string) => Promise<void>;
      onSetActiveFile: (callback: (filePath: string) => void) => void;
      
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
      
      // AI API请求代理
      aiApiRequest: (config: {
        url: string;
        headers: Record<string, string>;
        body: any;
      }) => Promise<{
        success: boolean;
        data?: any;
        status?: number;
        error?: string;
      }>;
      
      // AI API流式请求代理
      aiApiStreamRequest: (config: {
        url: string;
        headers: Record<string, string>;
        body: any;
      }) => Promise<{
        success: boolean;
        message?: string;
        error?: string;
      }>;
      
      // 流式响应事件监听
      onAIStreamData: (callback: (data: string) => void) => () => void;
      onAIStreamEnd: (callback: () => void) => () => void;
      onAIStreamError: (callback: (error: string) => void) => () => void;
      
      // 代理信息查询
      getProxyInfo: () => Promise<{
        success: boolean;
        proxyInfo?: string;
        error?: string;
      }>;
      
      // AI模型配置持久化存储
      saveAIModels: (models: any[]) => Promise<{
        success: boolean;
        error?: string;
      }>;
      loadAIModels: () => Promise<{
        success: boolean;
        data: any[];
        error?: string;
      }>;
      saveSelectedAIModel: (modelId: string) => Promise<{
        success: boolean;
        error?: string;
      }>;
      loadSelectedAIModel: () => Promise<{
        success: boolean;
        data: string;
        error?: string;
      }>;
      verifyAIStorage: () => Promise<{
        success: boolean;
        data?: any;
        error?: string;
      }>;
      clearAIStorage: () => Promise<{
        success: boolean;
        data?: any;
        error?: string;
      }>;
      
      // 存储方案配置
      getStorageConfig: () => Promise<{
        success: boolean;
        data: {
          storageType: 'localStorage' | 'file' | 'hybrid';
          enableLocalStorageSync: boolean;
        };
        error?: string;
      }>;
      saveStorageConfig: (config: {
        storageType: 'localStorage' | 'file' | 'hybrid';
        enableLocalStorageSync: boolean;
      }) => Promise<{
        success: boolean;
        error?: string;
      }>;
      
      // 会话历史管理
      saveChatSession: (session: any) => Promise<{
        success: boolean;
        error?: string;
      }>;
      loadChatSessions: () => Promise<{
        success: boolean;
        data: any[];
        error?: string;
      }>;
      deleteChatSession: (sessionId: string) => Promise<{
        success: boolean;
        error?: string;
      }>;
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