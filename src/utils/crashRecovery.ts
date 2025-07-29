// src/utils/crashRecovery.ts
// 崩溃恢复工具

import type { SidebarTab } from '../types/sidebar';

export interface AppState {
  projectPath: string | null;
  activeFile: string | null;
  view: 'preview' | 'graph';
  activeTab: SidebarTab;
  sidebarVisible: boolean;
  timestamp: number;
  sessionId: string;
}

export interface FileBackup {
  filePath: string;
  content: string;
  lastModified: number;
  originalModified: number;
}

const RECOVERY_KEY = 'avg-master-recovery';
const FILE_BACKUP_KEY = 'avg-master-file-backups';
const SESSION_ID_KEY = 'avg-master-session-id';
const WORKSPACE_STATE_KEY = 'avg-master-workspace-state';
const EDITOR_STATE_KEY = 'avg-master-editor-state';
const PROJECT_STATE_KEY = 'avg-master-project-state';
const RECOVERY_EXPIRY = 24 * 60 * 60 * 1000; // 24小时

// VS Code风格的状态管理
interface WorkspaceState {
  projectPath: string | null;
  recentProjects: string[];
  lastAccessed: number;
}

interface EditorState {
  activeFile: string | null;
  openFiles: string[];
  fileStates: Record<string, {
    content: string;
    cursorPosition?: { line: number; column: number };
    scrollTop?: number;
    lastModified: number;
  }>;
}

interface UIState {
  view: 'preview' | 'graph';
  activeTab: 'explorer' | 'search' | 'git' | 'bot' | 'settings';
  sidebarVisible: boolean;
  sidebarWidth?: number;
  editorWidth?: number;
}

class CrashRecovery {
  private sessionId: string;
  private backupInterval: number | null = null;
  private stateBackupInterval: number | null = null;
  
  constructor() {
    this.sessionId = this.generateSessionId();
    // 立即保存当前会话ID，确保崩溃检测能正常工作
    localStorage.setItem(SESSION_ID_KEY, this.sessionId);
    this.startPeriodicBackup();
    this.startStateBackup();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 保存应用状态
  saveAppState(state: Omit<AppState, 'timestamp' | 'sessionId'>): void {
    try {
      const fullState: AppState = {
        ...state,
        timestamp: Date.now(),
        sessionId: this.sessionId
      };
      
      localStorage.setItem(RECOVERY_KEY, JSON.stringify(fullState));
      console.log('✅ App state saved for crash recovery:', {
        projectPath: fullState.projectPath,
        activeFile: fullState.activeFile,
        sessionId: fullState.sessionId
      });
    } catch (error) {
      console.warn('Failed to save app state for recovery:', error);
    }
  }

  // 备份文件内容
  backupFile(filePath: string, content: string): void {
    try {
      const backups = this.getFileBackups();
      const now = Date.now();
      
      // 获取文件的原始修改时间
      window.inkAPI?.readFile(filePath).then(_originalContent => {
        backups[filePath] = {
          filePath,
          content,
          lastModified: now,
          originalModified: now // 这里可以通过文件系统API获取真实时间
        };
        
        localStorage.setItem(FILE_BACKUP_KEY, JSON.stringify(backups));
        console.log(`📄 File backup saved: ${filePath}`);
      }).catch(err => {
        console.warn('Failed to read original file for backup:', err);
      });
    } catch (error) {
      console.warn('Failed to backup file:', error);
    }
  }

  // 获取文件备份
  private getFileBackups(): Record<string, FileBackup> {
    try {
      const backups = localStorage.getItem(FILE_BACKUP_KEY);
      return backups ? JSON.parse(backups) : {};
    } catch (error) {
      console.warn('Failed to get file backups:', error);
      return {};
    }
  }

  // 检查是否有崩溃恢复数据
  checkForCrashRecovery(): {
    hasRecovery: boolean;
    appState?: AppState;
    fileBackups?: Record<string, FileBackup>;
    crashDetected?: boolean;
  } {
    try {
      const savedState = localStorage.getItem(RECOVERY_KEY);
      const lastSessionId = localStorage.getItem(SESSION_ID_KEY);
      const fileBackups = this.getFileBackups();
      
      if (!savedState) {
        return { hasRecovery: false };
      }
      
      const appState: AppState = JSON.parse(savedState);
      const now = Date.now();
      
      // 检查数据是否过期
      if (now - appState.timestamp > RECOVERY_EXPIRY) {
        this.clearRecoveryData();
        return { hasRecovery: false };
      }
      
      // 检测是否为崩溃恢复
      // 如果有保存的状态且满足以下条件之一，则认为是崩溃恢复：
      // 1. 上次会话ID存在且与当前不同，且有数据需要恢复
      // 2. 没有上次会话ID但有状态数据（可能是首次启动后的崩溃）
      const hasDataToRecover = appState.projectPath || appState.activeFile || Object.keys(fileBackups).length > 0;
      const crashDetected = hasDataToRecover && (
        (lastSessionId && lastSessionId !== this.sessionId) ||  // 有旧会话且不同
        (!lastSessionId && appState.sessionId !== this.sessionId)  // 无旧会话但状态中的会话ID不同
      );
      
      // 暂时不更新会话ID，等到真正开始恢复时再更新
      // localStorage.setItem(SESSION_ID_KEY, this.sessionId);
      
      console.log('🔍 崩溃恢复检测结果:', {
        hasRecovery: true,
        crashDetected: !!crashDetected,
        hasProjectPath: !!appState.projectPath,
        hasActiveFile: !!appState.activeFile,
        activeFile: appState.activeFile,
        projectPath: appState.projectPath,
        lastSessionId,
        currentSessionId: this.sessionId,
        appStateSessionId: appState.sessionId,
        hasDataToRecover,
        condition1: lastSessionId && lastSessionId !== this.sessionId,
        condition2: !lastSessionId && appState.sessionId !== this.sessionId
      });
      
      return {
        hasRecovery: true,
        appState,
        fileBackups,
        crashDetected: !!crashDetected
      };
    } catch (error) {
      console.warn('Failed to check crash recovery:', error);
      return { hasRecovery: false };
    }
  }

  // 恢复应用状态
  restoreAppState(): AppState | null {
    try {
      const savedState = localStorage.getItem(RECOVERY_KEY);
      if (!savedState) return null;
      
      const appState: AppState = JSON.parse(savedState);
      const now = Date.now();
      
      if (now - appState.timestamp > RECOVERY_EXPIRY) {
        this.clearRecoveryData();
        return null;
      }
      
      return appState;
    } catch (error) {
      console.warn('Failed to restore app state:', error);
      return null;
    }
  }

  // 获取未保存的文件更改
  getUnsavedChanges(): FileBackup[] {
    const backups = this.getFileBackups();
    const unsavedFiles: FileBackup[] = [];
    
    for (const backup of Object.values(backups)) {
      // 这里可以添加更复杂的逻辑来检测文件是否真的有未保存的更改
      // 比如对比文件的最后修改时间等
      unsavedFiles.push(backup);
    }
    
    return unsavedFiles;
  }

  // 恢复单个文件
  async restoreFile(filePath: string): Promise<boolean> {
    try {
      const backups = this.getFileBackups();
      const backup = backups[filePath];
      
      if (!backup) {
        console.warn(`No backup found for file: ${filePath}`);
        return false;
      }
      
      await window.inkAPI.writeFile(filePath, backup.content);
      
      // 移除已恢复的备份
      delete backups[filePath];
      localStorage.setItem(FILE_BACKUP_KEY, JSON.stringify(backups));
      
      console.log(`✅ File restored: ${filePath}`);
      return true;
    } catch (error) {
      console.error('Failed to restore file:', error);
      return false;
    }
  }

  // 清除恢复数据
  clearRecoveryData(): void {
    localStorage.removeItem(RECOVERY_KEY);
    localStorage.removeItem(FILE_BACKUP_KEY);
    console.log('🧹 Recovery data cleared');
  }

  // 清除特定文件的备份
  clearFileBackup(filePath: string): void {
    try {
      const backups = this.getFileBackups();
      delete backups[filePath];
      localStorage.setItem(FILE_BACKUP_KEY, JSON.stringify(backups));
    } catch (error) {
      console.warn('Failed to clear file backup:', error);
    }
  }

  // 开始定期备份
  private startPeriodicBackup(): void {
    // 每30秒备份一次状态
    this.backupInterval = window.setInterval(() => {
      // 这里需要从外部获取当前状态，暂时留空
      // 实际使用时会通过回调函数获取状态
    }, 30000);
  }

  private startStateBackup(): void {
    // VS Code风格：每2秒持久化状态（增加频率）
    this.stateBackupInterval = window.setInterval(() => {
      this.persistCurrentState();
    }, 2000);
  }

  private persistCurrentState(): void {
    try {
      // 持久化到多个存储位置
      const timestamp = Date.now();
      const stateSnapshot = {
        sessionId: this.sessionId,
        timestamp,
        url: window.location.href,
        userAgent: navigator.userAgent
      };

      // 确保会话ID始终是最新的
      localStorage.setItem(SESSION_ID_KEY, this.sessionId);

      // 使用多种存储方式确保可靠性
      localStorage.setItem('avg-master-state-snapshot', JSON.stringify(stateSnapshot));
      sessionStorage.setItem('avg-master-state-snapshot', JSON.stringify(stateSnapshot));
      
      // 也存储到IndexedDB作为备用（异步）
      this.storeToIndexedDB(stateSnapshot).catch(err => {
        console.warn('IndexedDB backup failed:', err);
      });
    } catch (error) {
      console.warn('State persistence failed:', error);
    }
  }

  private async storeToIndexedDB(data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('avg-master-backup', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['states'], 'readwrite');
        const store = transaction.objectStore('states');
        
        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        
        transaction.onerror = () => reject(transaction.error);
        
        store.put({ id: 'current', data, timestamp: Date.now() });
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('states')) {
          db.createObjectStore('states', { keyPath: 'id' });
        }
      };
    });
  }

  // 停止定期备份
  stopPeriodicBackup(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
    if (this.stateBackupInterval) {
      clearInterval(this.stateBackupInterval);
      this.stateBackupInterval = null;
    }
  }

  // VS Code风格的工作区状态保存
  saveWorkspaceState(state: WorkspaceState): void {
    try {
      localStorage.setItem(WORKSPACE_STATE_KEY, JSON.stringify(state));
      sessionStorage.setItem(WORKSPACE_STATE_KEY, JSON.stringify(state));
      console.log('💾 工作区状态已保存');
    } catch (error) {
      console.warn('工作区状态保存失败:', error);
    }
  }

  // VS Code风格的编辑器状态保存
  saveEditorState(state: EditorState): void {
    try {
      localStorage.setItem(EDITOR_STATE_KEY, JSON.stringify(state));
      sessionStorage.setItem(EDITOR_STATE_KEY, JSON.stringify(state));
      console.log('💾 编辑器状态已保存');
    } catch (error) {
      console.warn('编辑器状态保存失败:', error);
    }
  }

  // VS Code风格的UI状态保存
  saveUIState(state: UIState): void {
    try {
      localStorage.setItem(PROJECT_STATE_KEY, JSON.stringify(state));
      sessionStorage.setItem(PROJECT_STATE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('UI状态保存失败:', error);
    }
  }

  // 恢复工作区状态
  restoreWorkspaceState(): WorkspaceState | null {
    try {
      const stored = localStorage.getItem(WORKSPACE_STATE_KEY) || 
                    sessionStorage.getItem(WORKSPACE_STATE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('工作区状态恢复失败:', error);
      return null;
    }
  }

  // 恢复编辑器状态
  restoreEditorState(): EditorState | null {
    try {
      const stored = localStorage.getItem(EDITOR_STATE_KEY) || 
                    sessionStorage.getItem(EDITOR_STATE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('编辑器状态恢复失败:', error);
      return null;
    }
  }

  // 恢复UI状态
  restoreUIState(): UIState | null {
    try {
      const stored = localStorage.getItem(PROJECT_STATE_KEY) || 
                    sessionStorage.getItem(PROJECT_STATE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('UI状态恢复失败:', error);
      return null;
    }
  }

  // 检查是否需要恢复状态（类似VS Code的恢复检测）
  shouldRestore(): boolean {
    try {
      const snapshot = localStorage.getItem('avg-master-state-snapshot') || 
                      sessionStorage.getItem('avg-master-state-snapshot');
      
      console.log('🔍 恢复检测: 查找状态快照...', snapshot ? '找到' : '未找到');
      
      if (!snapshot) return false;
      
      const data = JSON.parse(snapshot);
      const now = Date.now();
      
      console.log('🔍 恢复检测: 快照数据', {
        savedSessionId: data.sessionId,
        currentSessionId: this.sessionId,
        timeDiff: now - data.timestamp,
        timestamp: new Date(data.timestamp).toLocaleString()
      });
      
      // 如果状态是在最近保存的（4小时内），且session ID不同，说明可能是刷新后的新会话
      // 开发环境下可能会有长时间的调试间隔
      const recentlySaved = (now - data.timestamp) < 4 * 60 * 60 * 1000;
      const differentSession = data.sessionId !== this.sessionId;
      
      console.log('🔍 恢复检测: 判断结果', {
        recentlySaved,
        differentSession,
        shouldRestore: recentlySaved && differentSession
      });
      
      return recentlySaved && differentSession;
    } catch (error) {
      console.warn('状态恢复检测失败:', error);
      return false;
    }
  }

  // 正常退出时清理
  // 确认开始恢复，更新会话ID
  confirmRecoveryStart(): void {
    localStorage.setItem(SESSION_ID_KEY, this.sessionId);
    console.log('🔄 App: 确认开始恢复，更新会话ID:', this.sessionId);
  }

  normalExit(): void {
    this.stopPeriodicBackup();
    this.clearRecoveryData();
    localStorage.setItem(SESSION_ID_KEY, ''); // 标记正常退出
  }
}

export const crashRecovery = new CrashRecovery();