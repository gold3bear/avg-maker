// 恢复协调器 - 统一管理应用恢复流程
import { StateManager, type ApplicationState } from './StateManager';
import { CrashRecoveryManager, type CrashRecoveryData } from './CrashRecoveryManager';
import { SessionPersistenceManager } from './SessionPersistenceManager';

export interface RecoveryResult {
  type: 'crash' | 'session' | 'default';
  state: ApplicationState;
  recoveryData?: CrashRecoveryData;
  message: string;
}

/**
 * 恢复协调器
 * 职责：统一管理应用的恢复流程，实现清晰的优先级策略
 */
export class RecoveryOrchestrator {
  private stateManager: StateManager;
  private crashRecovery: CrashRecoveryManager;
  private sessionPersistence: SessionPersistenceManager;

  constructor(
    stateManager: StateManager,
    crashRecovery: CrashRecoveryManager,
    sessionPersistence: SessionPersistenceManager
  ) {
    this.stateManager = stateManager;
    this.crashRecovery = crashRecovery;
    this.sessionPersistence = sessionPersistence;
  }

  /**
   * 执行应用恢复
   * 优先级：崩溃恢复 > 会话恢复 > 默认状态
   */
  async recoverApplication(): Promise<RecoveryResult> {
    console.log('🔄 RecoveryOrchestrator: 开始应用恢复流程');

    // 1. 最高优先级：检查崩溃恢复
    const crashCheck = this.crashRecovery.checkForCrash();
    if (crashCheck.crashDetected && crashCheck.recoveryData) {
      console.log('💥 RecoveryOrchestrator: 检测到崩溃，进行崩溃恢复');
      return this.handleCrashRecovery(crashCheck.recoveryData);
    }

    // 2. 如果有非崩溃的恢复数据，也可以用于会话恢复
    if (crashCheck.recoveryData) {
      console.log('🔄 RecoveryOrchestrator: 发现非崩溃恢复数据，用于会话恢复');
      const state = crashCheck.recoveryData.lastKnownState;
      this.stateManager.updateState(state);
      return {
        type: 'session',
        state,
        message: '从上次会话恢复应用状态'
      };
    }

    // 3. 中等优先级：正常会话恢复
    const sessionState = this.sessionPersistence.loadSession();
    if (sessionState) {
      console.log('📂 RecoveryOrchestrator: 进行正常会话恢复');
      return this.handleSessionRecovery(sessionState);
    }

    // 4. 最低优先级：默认状态
    console.log('🆕 RecoveryOrchestrator: 使用默认状态');
    return this.handleDefaultState();
  }

  private handleCrashRecovery(recoveryData: CrashRecoveryData): RecoveryResult {
    const state = recoveryData.lastKnownState;
    
    // 更新状态管理器
    this.stateManager.updateState(state);
    
    console.log('✅ RecoveryOrchestrator: 崩溃恢复完成', {
      sessionId: recoveryData.sessionId,
      activeFile: state.editor.activeFile,
      projectPath: state.workspace.projectPath,
      fileBackupCount: Object.keys(recoveryData.fileBackups).length
    });

    return {
      type: 'crash',
      state,
      recoveryData,
      message: `从崩溃中恢复应用状态 (会话: ${recoveryData.sessionId})`
    };
  }

  private handleSessionRecovery(sessionState: ApplicationState): RecoveryResult {
    // 更新状态管理器
    this.stateManager.updateState(sessionState);
    
    console.log('✅ RecoveryOrchestrator: 会话恢复完成', {
      activeFile: sessionState.editor.activeFile,
      projectPath: sessionState.workspace.projectPath
    });

    return {
      type: 'session',
      state: sessionState,
      message: '从上次会话恢复应用状态'
    };
  }

  private handleDefaultState(): RecoveryResult {
    // 状态管理器已经有默认状态
    const state = this.stateManager.getState();
    
    console.log('✅ RecoveryOrchestrator: 使用默认状态');

    return {
      type: 'default',
      state,
      message: '应用以默认状态启动'
    };
  }

  /**
   * 获取文件恢复数据
   */
  async getFileRecoveryData(filePath: string): Promise<{
    hasBackup: boolean;
    content?: string;
    backupTime?: number;
  }> {
    const backup = this.crashRecovery.getFileBackup(filePath);
    
    if (backup) {
      return {
        hasBackup: true,
        content: backup.content,
        backupTime: backup.lastModified
      };
    }

    return { hasBackup: false };
  }

  /**
   * 清理恢复数据
   */
  async cleanupRecoveryData(): Promise<void> {
    console.log('🧹 RecoveryOrchestrator: 清理恢复数据');
    this.crashRecovery.clearRecoveryData();
  }

  /**
   * 获取恢复统计信息
   */
  getRecoveryInfo(): {
    crash: { available: boolean; sessionId?: string };
    session: { hasWorkspace: boolean; hasEditor: boolean; hasUI: boolean };
  } {
    const crashCheck = this.crashRecovery.checkForCrash();
    const sessionInfo = this.sessionPersistence.getSessionInfo();

    return {
      crash: {
        available: crashCheck.crashDetected || !!crashCheck.recoveryData,
        sessionId: crashCheck.recoveryData?.sessionId
      },
      session: sessionInfo
    };
  }

  /**
   * 设置恢复完成标记
   * 恢复完成后应该调用此方法，开始正常的状态管理
   */
  markRecoveryComplete(): void {
    console.log('✅ RecoveryOrchestrator: 恢复流程完成，开始正常状态管理');
    
    // 启动自动备份
    this.crashRecovery.startAutoBackup(() => this.stateManager.getState());
    
    // 订阅状态变化，自动保存会话
    this.stateManager.subscribe((state) => {
      this.sessionPersistence.saveState(state);
      // 崩溃恢复的备份由定时器处理，这里不需要重复备份
    });
  }

  /**
   * 应用关闭时清理
   */
  cleanup(): void {
    console.log('🚪 RecoveryOrchestrator: 应用关闭清理');
    
    // 立即保存最后状态
    const currentState = this.stateManager.getState();
    this.sessionPersistence.saveStateImmediate(currentState);
    this.crashRecovery.backupState(currentState);
    
    // 清理资源
    this.crashRecovery.cleanup();
    this.sessionPersistence.cleanup();
  }
}