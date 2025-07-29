// 存储系统统一入口 - 新架构的使用示例
import { StateManager, stateManager } from './StateManager';
import { CrashRecoveryManager } from './CrashRecoveryManager';
import { SessionPersistenceManager } from './SessionPersistenceManager';
import { RecoveryOrchestrator } from './RecoveryOrchestrator';

/**
 * 存储系统 - 统一入口
 * 提供简化的API，隐藏内部复杂性
 */
class StorageSystem {
  private stateManager: StateManager;
  private crashRecovery: CrashRecoveryManager;
  private sessionPersistence: SessionPersistenceManager;
  private recoveryOrchestrator: RecoveryOrchestrator;
  private isInitialized: boolean = false;

  constructor() {
    this.stateManager = stateManager;
    this.crashRecovery = new CrashRecoveryManager();
    this.sessionPersistence = new SessionPersistenceManager();
    this.recoveryOrchestrator = new RecoveryOrchestrator(
      this.stateManager,
      this.crashRecovery,
      this.sessionPersistence
    );
  }

  /**
   * 初始化存储系统并执行恢复
   */
  async initialize(): Promise<{
    type: 'crash' | 'session' | 'default';
    message: string;
    showRecoveryModal: boolean;
  }> {
    if (this.isInitialized) {
      throw new Error('StorageSystem already initialized');
    }

    console.log('🚀 StorageSystem: 初始化开始');

    const recoveryResult = await this.recoveryOrchestrator.recoverApplication();
    
    // 标记恢复完成，开始正常的状态管理
    this.recoveryOrchestrator.markRecoveryComplete();
    this.isInitialized = true;

    console.log('✅ StorageSystem: 初始化完成');

    return {
      type: recoveryResult.type,
      message: recoveryResult.message,
      showRecoveryModal: recoveryResult.type === 'crash'
    };
  }

  /**
   * 获取状态管理器（用于React组件）
   */
  getStateManager(): StateManager {
    return this.stateManager;
  }

  /**
   * 获取当前应用状态
   */
  getCurrentState() {
    return this.stateManager.getState();
  }

  /**
   * 更新工作区状态
   */
  updateWorkspace(update: { projectPath?: string | null; recentProjects?: string[] }) {
    this.stateManager.updateWorkspace(update);
  }

  /**
   * 更新编辑器状态
   */
  updateEditor(update: { 
    activeFile?: string | null; 
    openFiles?: string[];
    fileStates?: Record<string, any>;
  }) {
    this.stateManager.updateEditor(update);
  }

  /**
   * 更新UI状态
   */
  updateUI(update: {
    view?: 'preview' | 'graph';
    activeTab?: 'explorer' | 'search' | 'git' | 'bot' | 'settings';
    sidebarVisible?: boolean;
    sidebarWidth?: number;
    editorWidth?: number;
  }) {
    this.stateManager.updateUI(update);
  }

  /**
   * 备份文件内容
   */
  backupFile(filePath: string, content: string) {
    this.crashRecovery.backupFile(filePath, content);
  }

  /**
   * 获取文件备份
   */
  async getFileBackup(filePath: string) {
    return this.recoveryOrchestrator.getFileRecoveryData(filePath);
  }

  /**
   * 订阅状态变化
   */
  subscribe(callback: (state: any) => void) {
    return this.stateManager.subscribe(callback);
  }

  /**
   * 清理恢复数据（恢复完成后调用）
   */
  async clearRecoveryData() {
    await this.recoveryOrchestrator.cleanupRecoveryData();
  }

  /**
   * 获取恢复信息
   */
  getRecoveryInfo() {
    return this.recoveryOrchestrator.getRecoveryInfo();
  }

  /**
   * 应用关闭时清理
   */
  cleanup() {
    this.recoveryOrchestrator.cleanup();
  }
}

// 导出单例实例
export const storageSystem = new StorageSystem();

// 导出类型定义供TypeScript使用
export type { ApplicationState, WorkspaceState, EditorState, UIState } from './StateManager';
export type { RecoveryResult } from './RecoveryOrchestrator';
export type { CrashRecoveryData, FileBackup } from './CrashRecoveryManager';