// 测试工具函数

// 开发测试工具
export const setupTestingUtils = () => {
  if (process.env.NODE_ENV !== 'development') return;

  window.__DEV_TESTING__ = {
    crashRecovery: {
      // 模拟崩溃 - 直接关闭窗口不清理数据
      simulateCrash: () => {
        console.log('🧪 模拟崩溃 - 强制关闭窗口');
        localStorage.setItem('avg-master-session-id', 'crash-test-session');
        window.close();
      },

      // 清除所有恢复数据
      clearAllData: () => {
        localStorage.removeItem('avg-master-recovery');
        localStorage.removeItem('avg-master-file-backups');
        localStorage.removeItem('avg-master-session-id');
        console.log('🧹 已清除所有恢复数据');
      },

      // 显示当前恢复数据
      showRecoveryData: () => {
        const recovery = localStorage.getItem('avg-master-recovery');
        const backups = localStorage.getItem('avg-master-file-backups');
        const sessionId = localStorage.getItem('avg-master-session-id');
        
        const data = {
          recovery: recovery ? JSON.parse(recovery) : null,
          backups: backups ? JSON.parse(backups) : null,
          sessionId
        };
        
        console.log('📊 当前恢复数据:', data);
        return data;
      },

      // 强制备份文件
      forceBackup: (filePath: string, content: string) => {
        const backups = JSON.parse(localStorage.getItem('avg-master-file-backups') || '{}');
        backups[filePath] = {
          filePath,
          content,
          lastModified: Date.now(),
          originalModified: Date.now()
        };
        localStorage.setItem('avg-master-file-backups', JSON.stringify(backups));
        console.log(`💾 强制备份文件: ${filePath}`);
      }
    },

    refresh: {
      // 临时允许刷新（用于测试 beforeunload）
      allowRefresh: () => {
        console.log('🔓 临时允许页面刷新 - 用于测试 beforeunload');
        // 这需要向主进程发送消息来临时禁用拦截
        // 或者直接使用 location.reload()
      },

      // 恢复刷新阻止
      blockRefresh: () => {
        console.log('🔒 恢复刷新阻止');
      }
    },
    
    recovery: {
      // 显示所有存储的数据
      showAllData: () => {
        console.log('📊 所有存储的恢复数据:');
        const data = {
          sessionStorage: sessionStorage.getItem('avg-master-state'),
          emergencyBackup: localStorage.getItem('avg-master-emergency-state'),
          crashRecovery: localStorage.getItem('avg-master-recovery'),
          fileBackups: localStorage.getItem('avg-master-file-backups')
        };
        console.log(data);
        return data;
      },
      
      // 清除所有恢复数据
      clearAllRecoveryData: () => {
        console.log('🗑️ 清除所有恢复数据');
        sessionStorage.removeItem('avg-master-state');
        localStorage.removeItem('avg-master-emergency-state');
        localStorage.removeItem('avg-master-recovery');
        localStorage.removeItem('avg-master-file-backups');
        localStorage.removeItem('avg-master-session-id');
        console.log('✅ 所有恢复数据已清除');
      },
      
      // 强制重载测试恢复
      testRecovery: () => {
        console.log('🔄 测试数据恢复功能 - 5秒后刷新页面');
        setTimeout(() => {
          window.location.reload();
        }, 5000);
      }
    }
  };

  console.log('🧪 测试工具已加载到 window.__DEV_TESTING__');
  console.log('可用命令:');
  console.log('- window.__DEV_TESTING__.crashRecovery.simulateCrash()');
  console.log('- window.__DEV_TESTING__.crashRecovery.showRecoveryData()');
  console.log('- window.__DEV_TESTING__.crashRecovery.clearAllData()');
  console.log('- window.__DEV_TESTING__.crashRecovery.forceBackup(path, content)');
  console.log('- window.__DEV_TESTING__.recovery.showAllData()');
  console.log('- window.__DEV_TESTING__.recovery.clearAllRecoveryData()');
  console.log('- window.__DEV_TESTING__.recovery.testRecovery()');
};