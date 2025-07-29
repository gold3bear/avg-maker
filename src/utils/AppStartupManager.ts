// 应用启动管理器 - 处理崩溃自动恢复 vs 正常启动
import { crashRecovery } from './crashRecovery';

export interface StartupResult {
  mode: 'crash-recovery' | 'welcome' | 'restore-session';
  shouldShowRecoveryModal: boolean;
  shouldShowWelcome: boolean;
  recoveryData?: any;
  message: string;
}

/**
 * 应用启动管理器
 * 职责：根据应用退出方式决定启动流程
 */
export class AppStartupManager {
  /**
   * 检查应用启动模式
   */
  checkStartupMode(): StartupResult {
    console.log('🚀 AppStartup: 检查应用启动模式');

    // 1. 检查是否有崩溃恢复数据
    const recoveryCheck = crashRecovery.checkForCrashRecovery();
    
    if (recoveryCheck.hasRecovery && recoveryCheck.crashDetected) {
      // 检测到崩溃，自动恢复
      console.log('💥 AppStartup: 检测到崩溃，进入自动恢复模式');
      return {
        mode: 'crash-recovery',
        shouldShowRecoveryModal: true,
        shouldShowWelcome: false,
        recoveryData: recoveryCheck,
        message: '检测到应用意外关闭，正在恢复您的工作...'
      };
    }

    if (recoveryCheck.hasRecovery && !recoveryCheck.crashDetected) {
      // 有恢复数据但不是崩溃（可能是开发模式重载等）
      console.log('🔄 AppStartup: 检测到会话数据，进入会话恢复模式');
      return {
        mode: 'restore-session',
        shouldShowRecoveryModal: false,
        shouldShowWelcome: false,
        recoveryData: recoveryCheck,
        message: '恢复上次会话状态'
      };
    }

    // 2. 检查是否是首次启动或正常关闭后启动
    const isFirstTime = this.isFirstTimeUser();
    if (isFirstTime) {
      console.log('👋 AppStartup: 首次启动，显示欢迎页面');
      return {
        mode: 'welcome',
        shouldShowRecoveryModal: false,
        shouldShowWelcome: true,
        message: '欢迎使用 AVG Maker！'
      };
    }

    // 3. 正常启动（有使用历史但正常关闭）
    console.log('🏠 AppStartup: 正常启动，显示欢迎页面');
    return {
      mode: 'welcome',
      shouldShowRecoveryModal: false,
      shouldShowWelcome: true,
      message: '欢迎回来！'
    };
  }

  /**
   * 检查是否是首次用户
   */
  private isFirstTimeUser(): boolean {
    // 检查是否有任何历史数据
    const hasAnyHistory = 
      localStorage.getItem('avg-master-user-preferences') ||
      localStorage.getItem('avg-master-recent-projects') ||
      this.hasAnyProjectHistory();
    
    return !hasAnyHistory;
  }

  /**
   * 检查是否有项目历史
   */
  private hasAnyProjectHistory(): boolean {
    // 可以检查最近项目列表等
    try {
      const workspaceState = localStorage.getItem('avg-master-workspace-state');
      if (workspaceState) {
        const parsed = JSON.parse(workspaceState);
        return parsed.recentProjects && parsed.recentProjects.length > 0;
      }
    } catch (error) {
      // 忽略解析错误
    }
    return false;
  }

  /**
   * 标记用户已经不是首次用户
   */
  markUserAsReturning(): void {
    localStorage.setItem('avg-master-user-preferences', JSON.stringify({
      isFirstTime: false,
      lastVisit: Date.now()
    }));
  }

  /**
   * 获取启动模式的详细信息
   */
  getStartupInfo(): {
    hasRecoveryData: boolean;
    isFirstTime: boolean;
    lastCrashTime?: number;
    sessionId?: string;
  } {
    const recoveryCheck = crashRecovery.checkForCrashRecovery();
    
    return {
      hasRecoveryData: recoveryCheck.hasRecovery,
      isFirstTime: this.isFirstTimeUser(),
      lastCrashTime: recoveryCheck.appState?.timestamp,
      sessionId: recoveryCheck.appState?.sessionId
    };
  }

  /**
   * 处理崩溃恢复完成
   */
  handleRecoveryComplete(): void {
    console.log('✅ AppStartup: 崩溃恢复完成');
    this.markUserAsReturning();
  }

  /**
   * 处理欢迎页面完成
   */
  handleWelcomeComplete(): void {
    console.log('👋 AppStartup: 欢迎页面完成');
    this.markUserAsReturning();
  }

  /**
   * 强制显示欢迎页面（调试用）
   */
  forceWelcomeMode(): void {
    console.log('🔧 AppStartup: 强制进入欢迎模式');
    localStorage.removeItem('avg-master-user-preferences');
    // 清理所有恢复数据
    crashRecovery.clearRecoveryData();
  }

  /**
   * 获取欢迎页面应该显示的内容
   */
  getWelcomeContent(): {
    title: string;
    subtitle: string;
    showRecentProjects: boolean;
    recentProjects: string[];
  } {
    const isFirstTime = this.isFirstTimeUser();
    const recentProjects = this.getRecentProjects();

    if (isFirstTime) {
      return {
        title: '欢迎使用 AVG Maker',
        subtitle: '开始创建您的第一个互动小说项目',
        showRecentProjects: false,
        recentProjects: []
      };
    }

    return {
      title: '欢迎回来',
      subtitle: recentProjects.length > 0 ? '继续您的项目或创建新项目' : '创建新项目开始写作',
      showRecentProjects: recentProjects.length > 0,
      recentProjects
    };
  }

  /**
   * 获取最近项目列表
   */
  private getRecentProjects(): string[] {
    try {
      const workspaceState = localStorage.getItem('avg-master-workspace-state');
      if (workspaceState) {
        const parsed = JSON.parse(workspaceState);
        return parsed.recentProjects || [];
      }
    } catch (error) {
      console.warn('AppStartup: 获取最近项目失败:', error);
    }
    return [];
  }
}

// 导出单例实例
export const appStartupManager = new AppStartupManager();