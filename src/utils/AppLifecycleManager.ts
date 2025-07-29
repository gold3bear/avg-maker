// 统一的应用生命周期管理器
// 解决当前状态管理混乱的问题

export enum AppLifecycleState {
  INITIALIZING = 'initializing',
  CHECKING_RECOVERY = 'checking_recovery',
  WELCOME = 'welcome', 
  RESTORING = 'restoring',
  READY = 'ready',
  ERROR = 'error'
}

export interface AppContext {
  projectPath: string | null;
  activeFile: string | null;
  view: 'preview' | 'graph';
  activeTab: string;
  sidebarVisible: boolean;
}

export interface RecoveryDecision {
  shouldShowWelcome: boolean;
  shouldRestore: boolean;
  recoveryData?: AppContext;
  reason: string;
}

export class AppLifecycleManager {
  private state: AppLifecycleState = AppLifecycleState.INITIALIZING;
  private listeners: Set<(state: AppLifecycleState, context?: AppContext) => void> = new Set();
  
  // 单一入口点 - 解决多处重复调用问题
  async initializeApp(): Promise<RecoveryDecision> {
    console.log('🚀 AppLifecycle: 开始应用初始化');
    
    try {
      this.setState(AppLifecycleState.CHECKING_RECOVERY);
      
      // 统一检查所有恢复数据源
      const decision = await this.makeRecoveryDecision();
      
      if (decision.shouldShowWelcome) {
        this.setState(AppLifecycleState.WELCOME);
      } else if (decision.shouldRestore) {
        this.setState(AppLifecycleState.RESTORING);
      } else {
        this.setState(AppLifecycleState.READY);
      }
      
      return decision;
      
    } catch (error) {
      console.error('❌ AppLifecycle: 初始化失败:', error);
      this.setState(AppLifecycleState.ERROR);
      return {
        shouldShowWelcome: false,
        shouldRestore: false,
        reason: 'initialization_error'
      };
    }
  }
  
  // 统一恢复决策 - 解决多个管理器重复检查问题
  private async makeRecoveryDecision(): Promise<RecoveryDecision> {
    // 1. 检查是否正常退出
    const sessionId = localStorage.getItem('avg-master-session-id');
    if (sessionId === '') {
      console.log('✅ AppLifecycle: 检测到正常退出');
      this.clearAllRecoveryData();
      return {
        shouldShowWelcome: true,
        shouldRestore: false,
        reason: 'normal_exit'
      };
    }
    
    // 2. 检查是否有恢复数据
    const recoveryData = await this.gatherAllRecoveryData();
    if (!recoveryData) {
      console.log('👋 AppLifecycle: 无恢复数据，显示欢迎页面');
      return {
        shouldShowWelcome: true,
        shouldRestore: false,
        reason: 'no_recovery_data'
      };
    }
    
    // 3. 检查是否是崩溃恢复
    if (this.isCrashRecovery(sessionId)) {
      console.log('💥 AppLifecycle: 检测到崩溃，需要用户确认');
      return {
        shouldShowWelcome: false,
        shouldRestore: true,
        recoveryData,
        reason: 'crash_detected'
      };
    }
    
    // 4. 静默恢复会话状态
    console.log('🔄 AppLifecycle: 静默恢复会话状态');
    return {
      shouldShowWelcome: false,
      shouldRestore: true,
      recoveryData,
      reason: 'session_restore'
    };
  }
  
  // 统一数据收集 - 解决多处数据访问问题
  private async gatherAllRecoveryData(): Promise<AppContext | null> {
    const sources = [
      this.getSessionStorageData(),
      this.getLocalStorageData(),
      this.getCrashRecoveryData()
    ];
    
    // 按优先级选择最佳数据源
    for (const data of sources) {
      if (data && (data.projectPath || data.activeFile)) {
        return data;
      }
    }
    
    return null;
  }
  
  private getSessionStorageData(): AppContext | null {
    try {
      const data = sessionStorage.getItem('avg-master-state');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
  
  private getLocalStorageData(): AppContext | null {
    try {
      const data = localStorage.getItem('avg-master-emergency-state');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
  
  private getCrashRecoveryData(): AppContext | null {
    try {
      const data = localStorage.getItem('avg-master-recovery');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
  
  private isCrashRecovery(sessionId: string | null): boolean {
    // 简化的崩溃检测逻辑
    return sessionId !== null && sessionId !== '';
  }
  
  // 统一数据清理 - 解决多处重复清理问题
  private clearAllRecoveryData(): void {
    console.log('🧹 AppLifecycle: 清理所有恢复数据');
    sessionStorage.removeItem('avg-master-state');
    localStorage.removeItem('avg-master-emergency-state');
    localStorage.removeItem('avg-master-emergency-backup');
    localStorage.removeItem('avg-master-recovery');
  }
  
  // 状态管理
  private setState(newState: AppLifecycleState, context?: AppContext): void {
    const oldState = this.state;
    this.state = newState;
    console.log(`🔄 AppLifecycle: ${oldState} -> ${newState}`);
    
    // 通知监听器
    this.listeners.forEach(listener => listener(newState, context));
  }
  
  // 订阅状态变化
  onStateChange(listener: (state: AppLifecycleState, context?: AppContext) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  getCurrentState(): AppLifecycleState {
    return this.state;
  }
}

// 单例实例
export const appLifecycleManager = new AppLifecycleManager();