// 统一的恢复执行器
// 解决当前恢复逻辑分散、重复调用的问题

import type { AppContext } from './AppLifecycleManager';

export interface RestoreAction {
  type: 'project' | 'file' | 'ui';
  payload: any;
}

export class RecoveryExecutor {
  private isExecuting = false;
  
  // 统一恢复入口 - 解决6个地方重复恢复逻辑问题
  async executeRestore(
    recoveryData: AppContext, 
    handlers: {
      loadProject: (path: string) => Promise<boolean>;
      selectFile: (path: string) => void;
      setView: (view: 'preview' | 'graph') => void;
      setActiveTab: (tab: string) => void;
      setSidebarVisible: (visible: boolean) => void;
    }
  ): Promise<boolean> {
    
    if (this.isExecuting) {
      console.warn('⚠️ RecoveryExecutor: 恢复已在进行中，忽略重复调用');
      return false;
    }
    
    this.isExecuting = true;
    console.log('🔄 RecoveryExecutor: 开始执行恢复');
    
    try {
      // 按顺序执行恢复步骤
      const success = await this.executeRestoreSteps(recoveryData, handlers);
      
      if (success) {
        console.log('✅ RecoveryExecutor: 恢复完成');
      } else {
        console.error('❌ RecoveryExecutor: 恢复失败');
      }
      
      return success;
      
    } finally {
      this.isExecuting = false;
    }
  }
  
  private async executeRestoreSteps(
    data: AppContext,
    handlers: any
  ): Promise<boolean> {
    
    // 1. 恢复UI状态（同步，快速）
    if (data.view) {
      console.log('🎨 RecoveryExecutor: 恢复视图状态:', data.view);
      handlers.setView(data.view);
    }
    
    if (data.activeTab) {
      console.log('🎨 RecoveryExecutor: 恢复标签状态:', data.activeTab);
      handlers.setActiveTab(data.activeTab);
    }
    
    if (data.sidebarVisible !== undefined) {
      console.log('🎨 RecoveryExecutor: 恢复侧边栏状态:', data.sidebarVisible);
      handlers.setSidebarVisible(data.sidebarVisible);
    }
    
    // 2. 恢复项目路径（异步，可能失败）
    if (data.projectPath) {
      console.log('📁 RecoveryExecutor: 恢复项目路径:', data.projectPath);
      const projectSuccess = await handlers.loadProject(data.projectPath);
      if (!projectSuccess) {
        console.warn('⚠️ RecoveryExecutor: 项目路径恢复失败');
        return false;
      }
    }
    
    // 3. 恢复文件选择（依赖项目加载完成）
    if (data.activeFile) {
      console.log('📝 RecoveryExecutor: 恢复活动文件:', data.activeFile);
      // 使用Promise确保在项目加载后执行
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          handlers.selectFile(data.activeFile);
          resolve();
        }, 200); // 短暂延迟确保项目已加载
      });
    }
    
    return true;
  }
  
  // 检查是否正在执行
  isRestoring(): boolean {
    return this.isExecuting;
  }
}

// 单例实例
export const recoveryExecutor = new RecoveryExecutor();