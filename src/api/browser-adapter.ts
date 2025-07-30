// 浏览器平台API适配器
import type { IInkAPI, FileNode, CompilationResult, PluginManifest, CurrentFileResponse, APIConfig } from './types';

/**
 * 浏览器平台的API实现
 * 通过HTTP请求与预览服务器通信
 */
export class BrowserAPIAdapter implements IInkAPI {
  private config: APIConfig;
  private currentFileCallback: ((filePath: string) => void) | null = null;
  private pollingInterval: number | null = null;

  constructor(config: APIConfig) {
    this.config = config;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const controller = new AbortController();
    
    // 设置超时
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout || 10000);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      // 检查响应类型
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text() as unknown as T;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.timeout}ms`);
      }
      throw error;
    }
  }

  // 项目管理 - 浏览器模式不支持
  async openProject(): Promise<string | null> {
    throw new Error('Project management not supported in browser mode');
  }

  async loadProjectPath(projectPath: string): Promise<string | null> {
    throw new Error('Project management not supported in browser mode');
  }

  // 文件操作
  async readFile(filePath: string): Promise<string> {
    return this.request<string>('/api/read-file', {
      method: 'POST',
      body: JSON.stringify({ filePath }),
    });
  }

  async writeFile(filePath: string, content: string): Promise<boolean> {
    throw new Error('File writing not supported in browser mode');
  }

  async readDir(dirPath: string): Promise<FileNode[]> {
    throw new Error('Directory reading not supported in browser mode');
  }

  // 文件监听 - 浏览器模式使用轮询
  watchFiles(paths: string[]): void {
    console.log('File watching in browser mode - using polling for current file');
  }

  onFileChanged(callback: (filePath: string) => void): void {
    console.log('File change events in browser mode - limited to current file polling');
  }

  // Ink编译
  async compileInk(source: string, lintOnly = false, sourceFilePath?: string): Promise<CompilationResult> {
    try {
      const result = await this.request<any>('/api/compile-ink', {
        method: 'POST',
        body: JSON.stringify({ source, lintOnly, sourceFilePath }),
      });
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // 插件系统
  async loadPlugins(): Promise<PluginManifest[]> {
    try {
      return await this.request<PluginManifest[]>('/api/load-plugins');
    } catch (error) {
      console.warn('Plugin loading failed in browser mode:', error);
      return [];
    }
  }

  // 游戏导出 - 浏览器模式不支持
  async exportGame(mode: 'web' | 'desktop'): Promise<void> {
    throw new Error('Game export not supported in browser mode');
  }

  // 预览相关API - 浏览器模式特有
  async getCurrentFile(): Promise<CurrentFileResponse> {
    return this.request<CurrentFileResponse>('/api/current-file');
  }

  async setCurrentFile(filePath: string): Promise<void> {
    await this.request<void>('/api/set-file', {
      method: 'POST',
      body: JSON.stringify({ filePath }),
    });
  }

  // 预览相关方法
  async updatePreviewFile(filePath: string): Promise<void> {
    await this.setCurrentFile(filePath);
  }

  onSetActiveFile(callback: (filePath: string) => void): void {
    this.currentFileCallback = callback;
    
    // 启动轮询检查当前文件
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    let lastFilePath: string | null = null;
    
    this.pollingInterval = window.setInterval(async () => {
      try {
        const response = await this.getCurrentFile();
        if (response.filePath && response.filePath !== lastFilePath) {
          lastFilePath = response.filePath;
          callback(response.filePath);
        }
      } catch (error) {
        console.error('Error polling current file:', error);
      }
    }, 2000); // 每2秒检查一次
  }

  // 窗口控制 - 浏览器模式不支持
  async minimizeWindow(): Promise<void> {
    throw new Error('Window control not supported in browser mode');
  }

  async maximizeWindow(): Promise<void> {
    throw new Error('Window control not supported in browser mode');
  }

  async closeWindow(): Promise<void> {
    // 在浏览器模式下，关闭当前标签页
    if (window.close) {
      window.close();
    } else {
      throw new Error('Cannot close window in browser mode');
    }
  }

  async setWindowTitle(title: string): Promise<void> {
    document.title = title;
  }

  // 应用生命周期 - 浏览器模式使用beforeunload
  onAppWillClose(callback: () => void): void {
    window.addEventListener('beforeunload', callback);
  }

  removeAppWillCloseListener(callback: () => void): void {
    window.removeEventListener('beforeunload', callback);
  }

  async confirmClose(): Promise<void> {
    // 浏览器环境下无需确认
  }

  async cancelClose(): Promise<void> {
    // 浏览器环境下无需取消
  }

  // 系统对话框 - 浏览器模式使用内置对话框
  async showSaveDialog(unsavedFiles: string[]): Promise<any> {
    const message = `以下文件有未保存的更改:\n${unsavedFiles.join('\n')}\n\n是否保存更改?`;
    return window.confirm(message);
  }

  // 调试日志
  async logToMain(message: string): Promise<void> {
    console.log('[Browser Mode]', message);
  }

  // 清理资源
  dispose(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
}