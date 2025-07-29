// 统一的状态数据管理器
// 解决activeFile等数据在多个存储系统中重复的问题

export interface AppState {
  projectPath: string | null;
  activeFile: string | null;
  view: 'preview' | 'graph';
  activeTab: string;
  sidebarVisible: boolean;
  timestamp: number;
}

export interface FileState {
  content: string;
  cursorPosition?: { line: number; column: number };
  scrollTop?: number;
  isDirty: boolean;
  lastModified: number;
}

export enum StorageType {
  SESSION = 'session',     // 临时会话数据，页面关闭即失效
  PERSISTENT = 'persistent', // 持久化数据，崩溃恢复用
  BACKUP = 'backup'        // 紧急备份，多重保险
}

/**
 * 统一状态数据管理器
 * 职责明确：
 * - 应用状态只存储一次，有明确的存储策略
 * - 文件内容与应用状态分离
 * - 提供统一的数据访问接口
 */
export class StateDataManager {
  private static readonly KEYS = {
    APP_STATE: 'avg-master-app-state',        // 应用状态（唯一）
    FILE_CONTENTS: 'avg-master-file-contents', // 文件内容（崩溃恢复用）
    SESSION_ID: 'avg-master-session-id'       // 会话标识
  };

  // 单一职责：保存应用状态
  saveAppState(state: AppState, storageType: StorageType = StorageType.PERSISTENT): void {
    const stateWithTimestamp = {
      ...state,
      timestamp: Date.now()
    };

    try {
      switch (storageType) {
        case StorageType.SESSION:
          // 会话数据：页面刷新恢复
          sessionStorage.setItem(this.KEYS.APP_STATE, JSON.stringify(stateWithTimestamp));
          console.log('💾 StateManager: 应用状态已保存到会话存储');
          break;
          
        case StorageType.PERSISTENT:
          // 持久数据：崩溃恢复
          localStorage.setItem(this.KEYS.APP_STATE, JSON.stringify(stateWithTimestamp));
          console.log('💾 StateManager: 应用状态已保存到持久存储');
          break;
          
        case StorageType.BACKUP:
          // 备份数据：双重保险
          localStorage.setItem(`${this.KEYS.APP_STATE}-backup`, JSON.stringify(stateWithTimestamp));
          console.log('💾 StateManager: 应用状态已保存到备份存储');
          break;
      }
    } catch (error) {
      console.error('❌ StateManager: 状态保存失败:', error);
    }
  }

  // 单一职责：获取应用状态（按优先级）
  getAppState(): AppState | null {
    const sources = [
      () => this.getFromStorage(sessionStorage, this.KEYS.APP_STATE),          // 优先级1: 会话数据
      () => this.getFromStorage(localStorage, this.KEYS.APP_STATE),            // 优先级2: 持久数据  
      () => this.getFromStorage(localStorage, `${this.KEYS.APP_STATE}-backup`) // 优先级3: 备份数据
    ];

    for (const getSource of sources) {
      const state = getSource();
      if (state && this.isValidState(state)) {
        console.log('✅ StateManager: 找到有效应用状态');
        return state;
      }
    }

    console.log('ℹ️ StateManager: 未找到有效应用状态');
    return null;
  }

  // 单一职责：保存文件内容（仅用于崩溃恢复）
  saveFileContent(filePath: string, content: string, isDirty: boolean): void {
    try {
      const fileContents = this.getFileContents();
      fileContents[filePath] = {
        content,
        isDirty,
        lastModified: Date.now()
      };

      localStorage.setItem(this.KEYS.FILE_CONTENTS, JSON.stringify(fileContents));
      console.log('💾 StateManager: 文件内容已备份:', filePath);
    } catch (error) {
      console.error('❌ StateManager: 文件内容保存失败:', error);
    }
  }

  // 获取文件内容备份
  getFileContents(): Record<string, { content: string; isDirty: boolean; lastModified: number }> {
    try {
      const stored = localStorage.getItem(this.KEYS.FILE_CONTENTS);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('❌ StateManager: 文件内容读取失败:', error);
      return {};
    }
  }

  // 会话管理
  markNormalExit(): void {
    localStorage.setItem(this.KEYS.SESSION_ID, '');
    console.log('✅ StateManager: 标记正常退出');
  }

  isNormalExit(): boolean {
    const sessionId = localStorage.getItem(this.KEYS.SESSION_ID);
    return sessionId === '';
  }

  // 数据清理
  clearAllData(): void {
    console.log('🧹 StateManager: 清理所有数据');
    
    // 清理应用状态
    sessionStorage.removeItem(this.KEYS.APP_STATE);
    localStorage.removeItem(this.KEYS.APP_STATE);
    localStorage.removeItem(`${this.KEYS.APP_STATE}-backup`);
    
    // 清理文件内容
    localStorage.removeItem(this.KEYS.FILE_CONTENTS);
    
    // 清理会话标识
    localStorage.removeItem(this.KEYS.SESSION_ID);
    
    // 清理旧的分散存储（向后兼容）
    this.clearLegacyData();
  }

  // 清理旧系统的分散数据
  private clearLegacyData(): void {
    const legacyKeys = [
      'avg-master-state',
      'avg-master-emergency-state', 
      'avg-master-recovery',
      'avg-master-editor-state',
      'avg-master-workspace-state',
      'avg-master-project-state'
    ];

    legacyKeys.forEach(key => {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    });
    
    console.log('🧹 StateManager: 旧数据已清理');
  }

  // 数据验证
  private isValidState(state: any): state is AppState {
    return state && 
           typeof state === 'object' &&
           typeof state.timestamp === 'number' &&
           Date.now() - state.timestamp < 24 * 60 * 60 * 1000; // 24小时有效期
  }

  private getFromStorage(storage: Storage, key: string): AppState | null {
    try {
      const stored = storage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error(`❌ StateManager: 读取${key}失败:`, error);
      return null;
    }
  }

  // 获取调试信息
  getDebugInfo(): object {
    return {
      sessionState: this.getFromStorage(sessionStorage, this.KEYS.APP_STATE),
      persistentState: this.getFromStorage(localStorage, this.KEYS.APP_STATE),
      backupState: this.getFromStorage(localStorage, `${this.KEYS.APP_STATE}-backup`),
      fileContents: Object.keys(this.getFileContents()),
      isNormalExit: this.isNormalExit()
    };
  }
}

// 单例实例
export const stateDataManager = new StateDataManager();