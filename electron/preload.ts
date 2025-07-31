// electron/preload.ts

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('inkAPI', {
  // Project management
  openProject: () => ipcRenderer.invoke('open-project'),
  loadProjectPath: (projectPath: string) => ipcRenderer.invoke('load-project-path', projectPath),
  
  // File operations
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('write-file', filePath, content),
  readDir: (dirPath: string) => ipcRenderer.invoke('read-dir', dirPath),
  renameFile: (filePath: string, newName: string) => ipcRenderer.invoke('rename-file', filePath, newName),
  deleteFile: (filePath: string) => ipcRenderer.invoke('delete-file', filePath),
  moveFile: (src: string, dest: string) => ipcRenderer.invoke('move-file', src, dest),
  createDirectory: (dirPath: string) => ipcRenderer.invoke('create-directory', dirPath),
  showInExplorer: (filePath: string) => ipcRenderer.invoke('show-in-explorer', filePath),
  copyFile: (src: string, dest: string) => ipcRenderer.invoke('copy-file', src, dest),
  openExternalUrl: (url: string) => ipcRenderer.invoke('open-external-url', url),
  triggerPreviewRefresh: () => ipcRenderer.invoke('trigger-preview-refresh'),
  
  // File watching
  watchFiles: (paths: string[]) => ipcRenderer.invoke('watch-files', paths),
  onFileChanged: (callback: (filePath: string) => void) => {
    ipcRenderer.on('file-changed', (_, filePath) => callback(filePath));
  },
  
  // Ink compilation
  compileInk: (source: string, lintOnly: boolean = false, sourceFilePath?: string) => ipcRenderer.invoke('compile-ink', source, lintOnly, sourceFilePath),
  compileProject: (root: string) => ipcRenderer.invoke('compile-project', root),
  
  // Plugin system
  loadPlugins: () => ipcRenderer.invoke('load-plugins'),
  
  // Export functionality
  exportGame: (mode: 'web' | 'desktop') => ipcRenderer.invoke('export-game', mode),

  // Preview window controls
  openPreviewWindow: (filePath: string) => ipcRenderer.invoke('open-preview-window', filePath),
  updatePreviewFile: (filePath: string) => {
    // 同时更新两种预览方式
    ipcRenderer.invoke('update-preview-file', filePath); // Electron预览窗口
    ipcRenderer.invoke('update-ssr-preview-file', filePath); // SSR浏览器预览
  },
  onSetActiveFile: (callback: (filePath: string) => void) => {
    ipcRenderer.on('set-active-file', (_, filePath) => callback(filePath));
  },
  
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  setWindowTitle: (title: string) => ipcRenderer.invoke('set-window-title', title),
  
  // Window lifecycle
  onAppWillClose: (callback: () => void) => {
    console.log('🚪 Preload: 注册 app-will-close 监听器');
    // 同时发送到主进程确保能看到日志
    ipcRenderer.invoke('log-to-main', '🚪 Preload: 注册 app-will-close 监听器');
    ipcRenderer.on('app-will-close', () => {
      console.log('🚪 Preload: 收到 app-will-close 事件');
      ipcRenderer.invoke('log-to-main', '🚪 Preload: 收到 app-will-close 事件');
      callback();
    });
  },
  removeAppWillCloseListener: (callback: () => void) => {
    console.log('🚪 Preload: 移除 app-will-close 监听器');
    ipcRenderer.removeAllListeners('app-will-close');
  },
  confirmClose: () => {
    console.log('🚪 Preload: confirmClose 被调用');
    console.trace('🚪 Preload: confirmClose 调用栈');
    return ipcRenderer.invoke('confirm-close');
  },
  cancelClose: () => ipcRenderer.invoke('cancel-close'),
  
  // System dialogs
  showSaveDialog: (unsavedFiles: string[]) => ipcRenderer.invoke('show-save-dialog', unsavedFiles),
  
  // Debug logging
  logToMain: (message: string) => ipcRenderer.invoke('log-to-main', message),
  
  // AI API请求代理
  aiApiRequest: (config: {
    url: string;
    headers: Record<string, string>;
    body: any;
  }) => ipcRenderer.invoke('ai-api-request', config),
  
  // AI API流式请求代理
  aiApiStreamRequest: (config: {
    url: string;
    headers: Record<string, string>;
    body: any;
  }) => ipcRenderer.invoke('ai-api-stream-request', config),
  
  // 流式响应事件监听
  onAIStreamData: (callback: (data: string) => void) => {
    ipcRenderer.on('ai-stream-data', (_, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('ai-stream-data');
  },
  onAIStreamEnd: (callback: () => void) => {
    ipcRenderer.on('ai-stream-end', () => callback());
    return () => ipcRenderer.removeAllListeners('ai-stream-end');
  },
  onAIStreamError: (callback: (error: string) => void) => {
    ipcRenderer.on('ai-stream-error', (_, error) => callback(error));
    return () => ipcRenderer.removeAllListeners('ai-stream-error');
  },
  
  // 代理信息查询
  getProxyInfo: () => ipcRenderer.invoke('get-proxy-info'),
  
  // AI模型配置持久化存储
  saveAIModels: (models: any[]) => ipcRenderer.invoke('save-ai-models', models),
  loadAIModels: () => ipcRenderer.invoke('load-ai-models'),
  saveSelectedAIModel: (modelId: string) => ipcRenderer.invoke('save-selected-ai-model', modelId),
  loadSelectedAIModel: () => ipcRenderer.invoke('load-selected-ai-model'),
  verifyAIStorage: () => ipcRenderer.invoke('verify-ai-storage'),
  clearAIStorage: () => ipcRenderer.invoke('clear-ai-storage'),
  
  // 存储方案配置
  getStorageConfig: () => ipcRenderer.invoke('get-storage-config'),
  saveStorageConfig: (config: any) => ipcRenderer.invoke('save-storage-config', config),
  
  // 会话历史管理
  saveChatSession: (session: any) => ipcRenderer.invoke('save-chat-session', session),
  loadChatSessions: () => ipcRenderer.invoke('load-chat-sessions'),
  deleteChatSession: (sessionId: string) => ipcRenderer.invoke('delete-chat-session', sessionId),
});

// Type declarations are now in src/types/global.d.ts

// 创建React DevTools hook - 必须在React加载前创建
(() => {
  // 创建一个更完整的React DevTools hook，模拟真实的DevTools API
  const hook = {
    // React检查这些方法来确定DevTools是否可用
    checkDCE: function(fn: Function) {
      // React用这个来检查开发环境
      try {
        return fn.toString().indexOf('\n') === -1;
      } catch {
        return false;
      }
    },
    
    supportsFiber: true,
    
    // React Fiber相关的回调
    onCommitFiberRoot: function(id: any, root: any, priorityLevel?: any) {
      // 存储渲染器信息，让React知道DevTools在工作
      if (this.renderers && this.renderers.has && this.renderers.has(id)) {
        console.log('🔧 React DevTools: Fiber root committed for renderer', id);
      }
    },
    
    onCommitFiberUnmount: function(id: any, root: any) {
      // 处理React组件的卸载
      console.log('🔧 React DevTools: Fiber unmount for renderer', id);
    },
    
    inject: function(renderer: any) {
      // 注入渲染器，返回一个ID
      const id = Math.random().toString(36).substr(2, 9);
      if (this.renderers && this.renderers.set) {
        this.renderers.set(id, renderer);
      }
      console.log('🔧 React DevTools: Renderer injected with ID', id);
      
      // 通知React DevTools扩展（如果存在）
      if (this.emit) {
        this.emit('renderer', { id, renderer });
      }
      
      return id;
    },
    
    // 其他DevTools可能需要的属性
    reactDevtoolsAgent: null,
    renderers: new Map(),
    
    // 事件系统
    _listeners: new Map(),
    
    emit: function(event: string, data: any) {
      // 完整的事件发射器实现
      const listeners = this._listeners.get(event) || [];
      listeners.forEach((listener: Function) => {
        try {
          listener(data);
        } catch (error) {
          console.error('🔧 React DevTools: Error in event listener:', error);
        }
      });
    },
    
    sub: function(event: string, fn: Function) {
      // 完整的事件订阅器实现
      if (!this._listeners.has(event)) {
        this._listeners.set(event, []);
      }
      this._listeners.get(event)!.push(fn);
      
      // 返回取消订阅函数
      return () => {
        const listeners = this._listeners.get(event);
        if (listeners) {
          const index = listeners.indexOf(fn);
          if (index !== -1) {
            listeners.splice(index, 1);
          }
        }
      };
    },
    
    // 标记这是由我们创建的hook
    __electronDevTools: true,
    
    // 模拟DevTools扩展的存在
    isDisabled: false,
    
    // React会检查这个方法来判断DevTools是否可用
    getFiberRoots: function(rendererID: any) {
      return new Set();
    },
    
    // 一些React可能会调用的其他方法
    onCommitRoot: function(root: any, priorityLevel?: any) {
      // 兼容旧版本的回调
    }
  };
  
  // 确保在所有上下文中都能访问到hook
  if (typeof globalThis !== 'undefined') {
    if (!(globalThis as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      (globalThis as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = hook;
      console.log('🔧 React DevTools hook created on globalThis');
    }
  }
  
  if (typeof window !== 'undefined') {
    if (!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = hook;
      console.log('🔧 React DevTools hook created on window');
    }
  }
  
  if (typeof global !== 'undefined') {
    if (!(global as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      (global as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = hook;
      console.log('🔧 React DevTools hook created on global');
    }
  }
})();

// 监听DOM加载完成，再次确保hook存在
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 DOM loaded, checking React DevTools hook...');
    console.log('Hook exists on window:', !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__);
    console.log('Hook exists on globalThis:', !!(globalThis as any).__REACT_DEVTOOLS_GLOBAL_HOOK__);
  });
}