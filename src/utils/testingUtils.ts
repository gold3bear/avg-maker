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

      // 清除旧系统所有数据
      clearLegacySystem: () => {
        console.log('🗑️ 清除旧系统所有数据');
        const legacyKeys = [
          'avg-master-recovery',
          'avg-master-file-backups', 
          'avg-master-session-id',
          'avg-master-workspace-state',
          'avg-master-editor-state',
          'avg-master-project-state',
          'avg-master-state',
          'avg-master-emergency-state'
        ];
        
        legacyKeys.forEach(key => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
          console.log(`  ✅ 已清除: ${key}`);
        });
        console.log('✅ 旧系统数据清除完成');
      },

      // 清除新系统所有数据
      clearNewSystem: () => {
        console.log('🗑️ 清除新系统所有数据');
        const newKeys = [
          'avg-master-crash-recovery',
          'avg-master-workspace-session',
          'avg-master-editor-session', 
          'avg-master-ui-session'
        ];
        
        newKeys.forEach(key => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
          console.log(`  ✅ 已清除: ${key}`);
        });
        console.log('✅ 新系统数据清除完成');
      },

      // 显示所有存储数据
      showAllStorageData: () => {
        console.log('📊 所有存储数据:');
        console.log('\n=== localStorage ===');
        const localData: Record<string, any> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('avg-master')) {
            try {
              localData[key] = JSON.parse(localStorage.getItem(key) || '');
            } catch {
              localData[key] = localStorage.getItem(key);
            }
          }
        }
        console.table(localData);

        console.log('\n=== sessionStorage ===');
        const sessionData: Record<string, any> = {};
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key?.startsWith('avg-master')) {
            try {
              sessionData[key] = JSON.parse(sessionStorage.getItem(key) || '');
            } catch {
              sessionData[key] = sessionStorage.getItem(key);
            }
          }
        }
        console.table(sessionData);
      },
      
      // 强制重载测试恢复
      testRecovery: () => {
        console.log('🔄 测试数据恢复功能 - 5秒后刷新页面');
        setTimeout(() => {
          window.location.reload();
        }, 5000);
      }
    },

    // 启动模式测试工具
    startup: {
      // 检查当前启动模式
      checkStartupMode: async () => {
        // 动态导入避免循环依赖
        const { appStartupManager } = await import('./AppStartupManager');
        const result = appStartupManager.checkStartupMode();
        console.log('🚀 当前启动模式:', result);
        console.log('💡 提示: 如果是 welcome 模式，刷新页面查看欢迎界面');
        return result;
      },

      // 获取启动信息
      getStartupInfo: async () => {
        const { appStartupManager } = await import('./AppStartupManager');
        const info = appStartupManager.getStartupInfo();
        console.log('📊 启动信息:', info);
        return info;
      },

      // 强制进入欢迎模式
      forceWelcomeMode: async () => {
        const { appStartupManager } = await import('./AppStartupManager');
        
        // 临时标记防止自动保存
        window.__PREVENT_AUTO_SAVE__ = true;
        
        appStartupManager.forceWelcomeMode();
        console.log('👋 已强制进入欢迎模式，刷新页面查看效果');
        
        // 延迟刷新，确保清理完成
        setTimeout(() => {
          // 强制清理，防止beforeunload保存状态
          sessionStorage.clear();
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.startsWith('avg-master') || key.startsWith('inkEditor')) {
              localStorage.removeItem(key);
            }
          });
          window.location.reload();
        }, 100);
        return '欢迎模式已激活';
      },

      // 模拟首次用户
      simulateFirstTimeUser: () => {
        console.log('👶 模拟首次用户环境');
        
        // 临时标记防止自动保存
        window.__PREVENT_AUTO_SAVE__ = true;
        
        // 清理所有用户数据
        const allKeys = [
          'avg-master-user-preferences', 'avg-master-workspace-state', 
          'avg-master-recent-projects', 'avg-master-recovery',
          'avg-master-file-backups', 'avg-master-session-id',
          'inkEditor_crashRecovery', 'avg-master-state',
          'avg-master-emergency-state', 'avg-master-editor-state',
          'avg-master-project-state'
        ];
        
        allKeys.forEach(key => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        });
        
        console.log('✅ 首次用户环境模拟完成，刷新页面查看效果');
        setTimeout(() => {
          // 再次确保清理，防止beforeunload保存状态
          sessionStorage.clear();
          allKeys.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
          });
          window.location.reload();
        }, 100);
        return '首次用户环境已模拟';
      },

      // 模拟崩溃恢复场景
      simulateCrashRecovery: () => {
        console.log('💥 模拟崩溃恢复场景');
        // 创建崩溃恢复数据
        const crashData = {
          sessionId: 'crash_test_' + Date.now(),
          timestamp: Date.now(),
          projectPath: '/test/project',
          activeFile: '/test/project/test.ink',
          view: 'preview',
          activeTab: 'explorer',
          sidebarVisible: true
        };
        localStorage.setItem('inkEditor_crashRecovery', JSON.stringify(crashData));
        localStorage.setItem('avg-master-session-id', 'old_session_id'); // 不同的session id表示崩溃
        console.log('✅ 崩溃场景模拟完成，刷新页面查看效果');
        setTimeout(() => window.location.reload(), 1000);
        return '崩溃恢复场景已模拟';
      },

      // 强力清理 - 直接清除所有数据并刷新
      forceCleanAndReload: () => {
        console.log('🗑️ 强力清理所有数据');
        
        // 设置标记防止保存
        window.__PREVENT_AUTO_SAVE__ = true;
        
        // 立即清理所有存储
        sessionStorage.clear();
        localStorage.clear();
        
        console.log('✅ 所有数据已清理，正在刷新页面...');
        
        // 立即刷新
        setTimeout(() => {
          window.location.reload();
        }, 50);
        
        return '强力清理完成';
      }
    }
  };

  console.log('🧪 测试工具已加载到 window.__DEV_TESTING__');
  console.log('可用命令:');
  console.log('\n📱 崩溃恢复测试:');
  console.log('- window.__DEV_TESTING__.crashRecovery.simulateCrash()');
  console.log('- window.__DEV_TESTING__.crashRecovery.showRecoveryData()');
  console.log('- window.__DEV_TESTING__.crashRecovery.clearAllData()');
  console.log('- window.__DEV_TESTING__.crashRecovery.forceBackup(path, content)');
  console.log('\n🔄 数据恢复管理:');
  console.log('- window.__DEV_TESTING__.recovery.showAllData()');
  console.log('- window.__DEV_TESTING__.recovery.clearAllRecoveryData()');
  console.log('- window.__DEV_TESTING__.recovery.testRecovery()');
  console.log('\n🗑️ 数据清理工具:');
  console.log('- window.__DEV_TESTING__.recovery.clearLegacySystem()');
  console.log('- window.__DEV_TESTING__.recovery.clearNewSystem()');
  console.log('- window.__DEV_TESTING__.recovery.showAllStorageData()');
  console.log('\n🚀 启动模式测试:');
  console.log('- await window.__DEV_TESTING__.startup.checkStartupMode()');
  console.log('- await window.__DEV_TESTING__.startup.getStartupInfo()');
  console.log('- await window.__DEV_TESTING__.startup.forceWelcomeMode()');
  console.log('- window.__DEV_TESTING__.startup.simulateFirstTimeUser()');
  console.log('- window.__DEV_TESTING__.startup.simulateCrashRecovery()');
  console.log('- window.__DEV_TESTING__.startup.forceCleanAndReload() [强力清理]');
};