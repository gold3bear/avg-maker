// API抽象层类型定义
export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

export interface CompilationResult {
  success: boolean;
  data?: any;
  error?: string;
  warnings?: string[];
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  main: string;
  [key: string]: any;
}

export interface CurrentFileResponse {
  filePath: string | null;
  timestamp: number;
}

// 统一API接口定义
export interface IInkAPI {
  // 项目管理
  openProject(): Promise<string | null>;
  loadProjectPath(projectPath: string): Promise<string | null>;
  
  // 文件操作
  readFile(filePath: string): Promise<string>;
  writeFile(filePath: string, content: string): Promise<boolean>;
  readDir(dirPath: string): Promise<FileNode[]>;
  
  // 文件监听
  watchFiles(paths: string[]): void;
  onFileChanged(callback: (filePath: string) => void): void;
  
  // Ink编译
  compileInk(source: string, lintOnly?: boolean, sourceFilePath?: string): Promise<CompilationResult>;
  
  // 插件系统
  loadPlugins(): Promise<PluginManifest[]>;
  
  // 游戏导出
  exportGame(mode: 'web' | 'desktop'): Promise<void>;
  
  // 预览窗口控制
  openPreviewWindow?(filePath: string): Promise<void>;
  updatePreviewFile?(filePath: string): Promise<void>;
  onSetActiveFile?(callback: (filePath: string) => void): void;
  
  // 预览服务器API (仅浏览器模式)
  getCurrentFile?(): Promise<CurrentFileResponse>;
  setCurrentFile?(filePath: string): Promise<void>;
  
  // 窗口控制 (仅Electron模式)
  minimizeWindow?(): Promise<void>;
  maximizeWindow?(): Promise<void>;
  closeWindow?(): Promise<void>;
  setWindowTitle?(title: string): Promise<void>;
  
  // 应用生命周期 (仅Electron模式)
  onAppWillClose?(callback: () => void): void;
  removeAppWillCloseListener?(callback: () => void): void;
  confirmClose?(): Promise<void>;
  cancelClose?(): Promise<void>;
  
  // 系统对话框 (仅Electron模式)
  showSaveDialog?(unsavedFiles: string[]): Promise<any>;
  
  // 调试日志
  logToMain?(message: string): Promise<void>;
}

// 平台类型
export type Platform = 'electron' | 'browser' | 'unknown';

// API工厂配置
export interface APIConfig {
  platform: Platform;
  baseUrl?: string; // 浏览器模式下的服务器地址
  timeout?: number; // 请求超时时间
}