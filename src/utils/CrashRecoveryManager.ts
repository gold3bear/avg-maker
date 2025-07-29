// 崩溃恢复管理器 - 专门处理意外崩溃的数据恢复
import type { ApplicationState } from './StateManager';

export interface FileBackup {
  filePath: string;
  content: string;
  lastModified: number;
  originalModified: number;
}

export interface CrashRecoveryData {
  sessionId: string;
  timestamp: number;
  lastKnownState: ApplicationState;
  fileBackups: Record<string, FileBackup>;
  crashDetected: boolean;
}

const CRASH_RECOVERY_KEY = 'avg-master-crash-recovery';
const FILE_BACKUP_KEY = 'avg-master-file-backups';
const SESSION_ID_KEY = 'avg-master-session-id';
const RECOVERY_EXPIRY = 24 * 60 * 60 * 1000; // 24小时

/**
 * 崩溃恢复管理器
 * 职责：专门处理意外崩溃的检测和数据恢复
 */
export class CrashRecoveryManager {
  private sessionId: string;
  private lastBackupTime: number = 0;
  private backupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeSession();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeSession(): void {
    // 标记新会话开始
    localStorage.setItem(SESSION_ID_KEY, this.sessionId);
    console.log('🔄 CrashRecovery: 新会话开始:', this.sessionId);
  }

  /**
   * 检查是否存在崩溃恢复数据
   */
  checkForCrash(): { crashDetected: boolean; recoveryData?: CrashRecoveryData } {
    try {
      const recoveryData = localStorage.getItem(CRASH_RECOVERY_KEY);
      const lastSessionId = localStorage.getItem(SESSION_ID_KEY);

      if (!recoveryData) {
        return { crashDetected: false };
      }

      const data: CrashRecoveryData = JSON.parse(recoveryData);
      
      // 检查数据是否过期
      if (Date.now() - data.timestamp > RECOVERY_EXPIRY) {
        console.log('🧹 CrashRecovery: 恢复数据已过期，清理');
        this.clearRecoveryData();
        return { crashDetected: false };
      }

      // 检查是否是同一个会话（正常关闭）
      if (lastSessionId === this.sessionId) {
        console.log('🔄 CrashRecovery: 同会话重启，非崩溃情况');
        return { crashDetected: false, recoveryData: data };
      }

      // 不同会话且有数据 = 崩溃
      console.log('💥 CrashRecovery: 检测到崩溃恢复数据');
      return { crashDetected: true, recoveryData: data };

    } catch (error) {
      console.warn('CrashRecovery: 检查崩溃数据失败:', error);
      return { crashDetected: false };
    }
  }

  /**
   * 备份应用状态
   */
  backupState(state: ApplicationState): void {
    try {
      const recoveryData: CrashRecoveryData = {
        sessionId: this.sessionId,
        timestamp: Date.now(),
        lastKnownState: state,
        fileBackups: this.getFileBackups(),
        crashDetected: false
      };

      localStorage.setItem(CRASH_RECOVERY_KEY, JSON.stringify(recoveryData));
      this.lastBackupTime = Date.now();
      
      console.log('💾 CrashRecovery: 状态已备份', {
        sessionId: this.sessionId,
        activeFile: state.editor.activeFile,
        projectPath: state.workspace.projectPath
      });
    } catch (error) {
      console.warn('CrashRecovery: 状态备份失败:', error);
    }
  }

  /**
   * 备份文件内容
   */
  backupFile(filePath: string, content: string): void {
    try {
      const backups = this.getFileBackups();
      const now = Date.now();
      
      backups[filePath] = {
        filePath,
        content,
        lastModified: now,
        originalModified: now
      };
      
      localStorage.setItem(FILE_BACKUP_KEY, JSON.stringify(backups));
      console.log('💾 CrashRecovery: 文件已备份:', filePath);
    } catch (error) {
      console.warn('CrashRecovery: 文件备份失败:', error);
    }
  }

  /**
   * 获取文件备份
   */
  private getFileBackups(): Record<string, FileBackup> {
    try {
      const data = localStorage.getItem(FILE_BACKUP_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.warn('CrashRecovery: 获取文件备份失败:', error);
      return {};
    }
  }

  /**
   * 获取特定文件的备份
   */
  getFileBackup(filePath: string): FileBackup | null {
    const backups = this.getFileBackups();
    return backups[filePath] || null;
  }

  /**
   * 开始自动备份
   */
  startAutoBackup(stateProvider: () => ApplicationState, intervalMs: number = 10000): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }

    this.backupInterval = setInterval(() => {
      try {
        const state = stateProvider();
        this.backupState(state);
      } catch (error) {
        console.warn('CrashRecovery: 自动备份失败:', error);
      }
    }, intervalMs);

    console.log('🔄 CrashRecovery: 自动备份已启动，间隔:', intervalMs, 'ms');
  }

  /**
   * 停止自动备份
   */
  stopAutoBackup(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
      console.log('⏹️ CrashRecovery: 自动备份已停止');
    }
  }

  /**
   * 清理恢复数据
   */
  clearRecoveryData(): void {
    localStorage.removeItem(CRASH_RECOVERY_KEY);
    localStorage.removeItem(FILE_BACKUP_KEY);
    console.log('🧹 CrashRecovery: 恢复数据已清理');
  }

  /**
   * 正常关闭清理
   */
  cleanup(): void {
    this.stopAutoBackup();
    // 正常关闭时不清理数据，以支持会话恢复
    console.log('🚪 CrashRecovery: 正常关闭，保留恢复数据');
  }

  /**
   * 获取会话ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
}