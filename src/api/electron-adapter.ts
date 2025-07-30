// Electron平台API适配器
import type { IInkAPI, FileNode, CompilationResult, PluginManifest, CurrentFileResponse } from './types';

/**
 * Electron平台的API实现
 * 直接委托给window.inkAPI
 */
export class ElectronAPIAdapter implements IInkAPI {
  private get api() {
    if (!window.inkAPI) {
      throw new Error('Electron API not available. Make sure you are running in Electron environment.');
    }
    return window.inkAPI;
  }

  // 项目管理
  async openProject(): Promise<string | null> {
    return this.api.openProject();
  }

  async loadProjectPath(projectPath: string): Promise<string | null> {
    return this.api.loadProjectPath(projectPath);
  }

  // 文件操作
  async readFile(filePath: string): Promise<string> {
    return this.api.readFile(filePath);
  }

  async writeFile(filePath: string, content: string): Promise<boolean> {
    return this.api.writeFile(filePath, content);
  }

  async readDir(dirPath: string): Promise<FileNode[]> {
    return this.api.readDir(dirPath);
  }

  // 文件监听
  watchFiles(paths: string[]): void {
    this.api.watchFiles(paths);
  }

  onFileChanged(callback: (filePath: string) => void): void {
    this.api.onFileChanged(callback);
  }

  // Ink编译
  async compileInk(source: string, lintOnly = false, sourceFilePath?: string): Promise<CompilationResult> {
    try {
      const result = await this.api.compileInk(source, lintOnly, sourceFilePath);
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
    return this.api.loadPlugins();
  }

  // 游戏导出
  async exportGame(mode: 'web' | 'desktop'): Promise<void> {
    return this.api.exportGame(mode);
  }

  // 预览窗口控制
  async openPreviewWindow(filePath: string): Promise<void> {
    if (this.api.openPreviewWindow) {
      return this.api.openPreviewWindow(filePath);
    }
    throw new Error('Preview window not supported in this environment');
  }

  async updatePreviewFile(filePath: string): Promise<void> {
    if (this.api.updatePreviewFile) {
      return this.api.updatePreviewFile(filePath);
    }
    throw new Error('Preview file update not supported in this environment');
  }

  onSetActiveFile(callback: (filePath: string) => void): void {
    if (this.api.onSetActiveFile) {
      this.api.onSetActiveFile(callback);
    } else {
      console.warn('onSetActiveFile not available in this environment');
    }
  }

  // 窗口控制
  async minimizeWindow(): Promise<void> {
    if (this.api.minimizeWindow) {
      return this.api.minimizeWindow();
    }
    throw new Error('Window control not supported in this environment');
  }

  async maximizeWindow(): Promise<void> {
    if (this.api.maximizeWindow) {
      return this.api.maximizeWindow();
    }
    throw new Error('Window control not supported in this environment');
  }

  async closeWindow(): Promise<void> {
    if (this.api.closeWindow) {
      return this.api.closeWindow();
    }
    throw new Error('Window control not supported in this environment');
  }

  async setWindowTitle(title: string): Promise<void> {
    if (this.api.setWindowTitle) {
      return this.api.setWindowTitle(title);
    }
    throw new Error('Window control not supported in this environment');
  }

  // 应用生命周期
  onAppWillClose(callback: () => void): void {
    if (this.api.onAppWillClose) {
      this.api.onAppWillClose(callback);
    } else {
      console.warn('onAppWillClose not available in this environment');
    }
  }

  removeAppWillCloseListener(callback: () => void): void {
    if (this.api.removeAppWillCloseListener) {
      this.api.removeAppWillCloseListener(callback);
    } else {
      console.warn('removeAppWillCloseListener not available in this environment');
    }
  }

  async confirmClose(): Promise<void> {
    if (this.api.confirmClose) {
      return this.api.confirmClose();
    }
    throw new Error('confirmClose not supported in this environment');
  }

  async cancelClose(): Promise<void> {
    if (this.api.cancelClose) {
      return this.api.cancelClose();
    }
    throw new Error('cancelClose not supported in this environment');
  }

  // 系统对话框
  async showSaveDialog(unsavedFiles: string[]): Promise<any> {
    if (this.api.showSaveDialog) {
      return this.api.showSaveDialog(unsavedFiles);
    }
    throw new Error('System dialogs not supported in this environment');
  }

  // 调试日志
  async logToMain(message: string): Promise<void> {
    if (this.api.logToMain) {
      return this.api.logToMain(message);
    } else {
      console.log('[Main Process]', message);
    }
  }
}