/// <reference path="./types/global.d.ts" />
import React, { useContext, useState, useRef } from 'react';
import { ProjectContext } from './context/ProjectContext';
import { ThemeProvider } from './context/ThemeContext';
import { SaveProvider, useSave } from './context/SaveContext';
import { TitleBar } from './components/TitleBar';
import { Toolbar } from './components/Toolbar';
import { ProjectExplorer } from './components/ProjectExplorer';
import { ActivityBar } from './components/ActivityBar';
import { StatusBar } from './components/StatusBar';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { NodeGraph } from './components/NodeGraph';
import { PluginHost } from './components/PluginHost';
import { CrashRecoveryModal } from './components/CrashRecoveryModal';
// import { SaveConfirmDialog } from './components/SaveConfirmDialog'; // 改用系统对话框
import { crashRecovery } from './utils/crashRecovery';
import { setupTestingUtils } from './utils/testingUtils';
import { useWorkspaceState } from './hooks/useWorkspaceState';
import type { SidebarTab } from './types/sidebar';

const AppContent: React.FC = () => {
  const { plugins, activeFile, selectFile, openProject, projectPath } = useContext(ProjectContext)!;
  const { hasUnsavedChanges, getUnsavedFiles, saveAllFiles } = useSave();
  const [view, setView] = useState<'preview' | 'graph'>('preview');
  const [activeTab, setActiveTab] = useState<SidebarTab>('explorer');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [pluginCtx, setPluginCtx] = useState<{
    manifest: any;
    params?: any;
  } | null>(null);
  
  // 崩溃恢复状态
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryData, setRecoveryData] = useState<{
    appState?: any;
    fileBackups?: Record<string, any>;
  }>({});
  
  // 窗口关闭状态
  const [isClosing, setIsClosing] = useState(false);
  
  // 保存确认对话框状态（保留作为降级方案）
  const [showSaveDialog] = useState(false);
  
  // 防止重复处理关闭事件
  const [isHandlingClose, setIsHandlingClose] = useState(false);

  // VS Code风格的状态管理
  const workspaceState = useWorkspaceState({
    projectPath,
    activeFile,
    view,
    activeTab,
    sidebarVisible
  });

  // 防止页面刷新导致数据丢失
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // 保存当前状态到 sessionStorage
      const appState = {
        projectPath,
        activeFile,
        view,
        activeTab,
        sidebarVisible,
        timestamp: Date.now()
      };
      
      try {
        sessionStorage.setItem('avg-master-state', JSON.stringify(appState));
      } catch (error) {
        console.warn('Failed to save app state:', error);
      }

      // 如果是窗口正在关闭，不阻止
      if (isClosing) {
        crashRecovery.normalExit();
        return;
      }

      // 检查是否有未保存的更改
      if (hasUnsavedChanges() && !isClosing) {
        const message = '您有未保存的文件更改。确定要离开吗？';
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // 强化的键盘事件保护，特别是在开发者工具打开时
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        console.warn('🚫 页面刷新已被禁用以防止数据丢失 (Cmd+R)');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // 立即保存当前状态以防意外刷新
        const appState = {
          projectPath,
          activeFile,
          view,
          activeTab,
          sidebarVisible,
          timestamp: Date.now()
        };
        
        try {
          sessionStorage.setItem('avg-master-emergency-state', JSON.stringify(appState));
          localStorage.setItem('avg-master-emergency-backup', JSON.stringify(appState));
          console.log('💾 紧急状态已保存');
        } catch (error) {
          console.warn('Failed to save emergency state:', error);
        }
        
        return false;
      }
      
      if (e.key === 'F5') {
        console.warn('🚫 页面刷新已被禁用以防止数据丢失 (F5)');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
      
      // 允许 Cmd+S 保存快捷键通过
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        console.log('⌨️ App: 检测到Cmd+S，允许通过');
        // 不阻止这个事件，让Editor处理
        return;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    // 使用捕获模式确保在开发者工具打开时也能拦截
    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      // 组件卸载时进行正常退出清理
      crashRecovery.normalExit();
    };
  }, [activeFile, projectPath, view, activeTab, sidebarVisible]);

  // 使用useRef保存最新的函数引用，避免重复注册监听器
  const closeHandlerRef = useRef<() => Promise<void>>();
  
  // 更新关闭处理函数
  closeHandlerRef.current = async () => {
    console.log('🔥 App: ===== 关闭处理函数开始执行 =====');
    // 发送到主进程确保能看到日志
    window.inkAPI?.logToMain?.('🔥 App: ===== 关闭处理函数开始执行 =====');
    console.log('🚪 App: 收到应用即将关闭通知，当前处理状态:', isHandlingClose);
    window.inkAPI?.logToMain?.(`🚪 App: 收到应用即将关闭通知，当前处理状态: ${isHandlingClose}`);
    
    // 防止重复处理关闭事件
    if (isHandlingClose || isClosing) {
      console.log('🚪 App: 已经在处理关闭事件或已经关闭，忽略重复调用');
      return;
    }
    
    console.log('🚪 App: 开始处理关闭事件...');
    setIsHandlingClose(true);
    
    try {
      // 添加微小延迟确保状态更新完成
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 检查是否有未保存的文件
      const hasUnsaved = hasUnsavedChanges();
      const unsavedFilesList = getUnsavedFiles();
      
      console.log('🚪 App: 未保存文件检查结果:', hasUnsaved);
      console.log('🚪 App: 未保存文件数量:', unsavedFilesList.length);
      console.log('🚪 App: 未保存文件详情:', unsavedFilesList.map(f => ({
        path: f.filePath,
        isDirty: f.isDirty,
        lastSaved: new Date(f.lastSaved).toISOString()
      })));
      
      // 强制再次检查确保准确性
      if (unsavedFilesList.length === 0 && hasUnsaved) {
        console.warn('⚠️ App: hasUnsavedChanges和getUnsavedFiles结果不一致！');
      }
      
      if (unsavedFilesList.length > 0) {
        console.log('⚠️ App: 发现未保存的文件，显示系统保存确认对话框');
        window.inkAPI?.logToMain?.(`⚠️ App: 发现未保存的文件，数量: ${unsavedFilesList.length}`);
        console.log('🚪 App: 准备显示对话框，文件列表:', unsavedFilesList.map(f => f.filePath));
        
        const filePaths = unsavedFilesList.map(f => f.filePath);
        
        try {
          // 在显示对话框之前进行最终确认
          if (filePaths.length === 0) {
            console.log('⚠️ App: 文件列表为空，跳过对话框显示');
            setIsHandlingClose(false);
            window.inkAPI?.cancelClose?.();
            return;
          }
          
          console.log('🚪 App: 即将调用showSaveDialog，文件数量:', filePaths.length);
          console.log('🚪 App: showSaveDialog API 可用性:', !!window.inkAPI?.showSaveDialog);
          
          if (!window.inkAPI?.showSaveDialog) {
            console.error('❌ App: showSaveDialog API 不可用');
            setIsHandlingClose(false);
            window.inkAPI?.cancelClose?.();
            return;
          }
          
          console.log('🚪 App: 开始等待用户选择...');
          window.inkAPI?.logToMain?.('🚪 App: 开始等待用户选择...');
          
          let choice;
          try {
            choice = await window.inkAPI.showSaveDialog(filePaths);
            console.log('🚪 App: 用户选择结果:', choice, '类型:', typeof choice);
            window.inkAPI?.logToMain?.(`🚪 App: 用户选择结果: ${choice}, 类型: ${typeof choice}`);
          } catch (dialogError) {
            console.error('🚪 App: showSaveDialog 调用失败:', dialogError);
            window.inkAPI?.logToMain?.(`🚪 App: showSaveDialog 调用失败: ${dialogError}`);
            throw dialogError;
          }
          
          // 如果返回null，说明对话框被重复调用或出错，取消关闭
          if (choice === null || choice === undefined) {
            console.log('⚠️ App: 对话框调用失败或被忽略，取消关闭');
            setIsHandlingClose(false);
            return;
          }
          
          if (choice === 0) {
            // 用户选择保存
            console.log('💾 App: 用户选择保存，开始保存所有文件...');
            const success = await saveAllFiles();
            if (success) {
              console.log('✅ App: 保存成功，确认关闭');
              setIsClosing(true);
              crashRecovery.normalExit();
              window.inkAPI?.confirmClose();
            } else {
              console.error('❌ App: 保存失败，取消关闭');
              setIsHandlingClose(false);
              return;
            }
          } else if (choice === 1) {
            // 用户选择不保存
            console.log('🗑️ App: 用户选择不保存，直接关闭');
            setIsClosing(true);
            crashRecovery.normalExit();
            window.inkAPI?.confirmClose();
          } else {
            // 用户选择取消 (choice === 2)
            console.log('❌ App: 用户取消关闭');
            setIsHandlingClose(false);
            // 通知主进程取消关闭操作，重置主进程的处理状态
            window.inkAPI?.cancelClose?.();
            return;
          }
        } catch (error) {
          console.error('🚪 App: 显示系统对话框失败:', error);
          setIsHandlingClose(false);
          // 通知主进程取消关闭操作，重置主进程的处理状态
          window.inkAPI?.cancelClose?.();
          // 不再降级到自定义对话框，直接取消关闭操作
          return;
        }
      } else {
        // 没有未保存的文件，直接关闭
        console.log('✅ App: 没有未保存文件，直接关闭');
        window.inkAPI?.logToMain?.('✅ App: 没有未保存文件，直接关闭');
        setIsClosing(true);
        crashRecovery.normalExit();
        
        // 立即通知主进程可以关闭
        if (window.inkAPI?.confirmClose) {
          console.log('🚪 App: 通知主进程确认关闭');
          window.inkAPI?.logToMain?.('🚪 App: 通知主进程确认关闭');
          window.inkAPI.confirmClose();
        }
      }
    } catch (error) {
      console.error('🚪 App: 关闭处理过程出错:', error);
      setIsHandlingClose(false);
    }
  };

  // 监听窗口关闭事件 - 只注册一次
  React.useEffect(() => {
    const handleAppWillClose = () => {
      console.log('🚪 App: handleAppWillClose 被调用');
      if (closeHandlerRef.current) {
        console.log('🚪 App: 执行 closeHandlerRef.current');
        closeHandlerRef.current();
      } else {
        console.error('🚪 App: closeHandlerRef.current 不存在');
      }
    };

    // 监听来自主进程的关闭通知
    if (window.inkAPI?.onAppWillClose) {
      console.log('🚪 App: 注册关闭监听器');
      window.inkAPI.onAppWillClose(handleAppWillClose);
      
      // 测试监听器是否正确注册
      console.log('🚪 App: 关闭监听器已注册，函数引用:', typeof handleAppWillClose);
    } else {
      console.error('🚪 App: onAppWillClose API不可用');
    }

    return () => {
      // 清理监听器
      console.log('🚪 App: 清理关闭监听器');
      if (window.inkAPI?.removeAppWillCloseListener) {
        window.inkAPI.removeAppWillCloseListener(handleAppWillClose);
      }
    };
  }, []); // 空依赖数组，只注册一次

  // 页面加载时检查崩溃恢复
  React.useEffect(() => {
    // 设置开发测试工具
    setupTestingUtils();
    
    const checkRecovery = () => {
      // VS Code风格：检查是否应该恢复状态
      if (workspaceState.shouldRestore()) {
        console.log('🔄 VS Code风格恢复：检测到需要恢复的状态');
        
        const states = workspaceState.restoreStates();
        
        // 恢复UI状态
        if (states.ui) {
          console.log('🎨 恢复UI状态:', states.ui);
          setView(states.ui.view || 'preview');
          setActiveTab(states.ui.activeTab || 'explorer');
          setSidebarVisible(states.ui.sidebarVisible !== undefined ? states.ui.sidebarVisible : true);
        }
        
        // 恢复编辑器状态
        if (states.editor) {
          console.log('📝 恢复编辑器状态:', states.editor);
          // TODO: 恢复activeFile等编辑器状态
        }
        
        // 恢复工作区状态
        if (states.workspace) {
          console.log('📁 恢复工作区状态:', states.workspace);
          // TODO: 恢复projectPath等工作区状态
        }
        
        return; // VS Code风格恢复完成
      }
      
      // 首先检查紧急备份（由Cmd+R触发的紧急保存）
      try {
        const emergencyState = sessionStorage.getItem('avg-master-emergency-state') || 
                              localStorage.getItem('avg-master-emergency-backup');
        
        if (emergencyState) {
          const appState = JSON.parse(emergencyState);
          console.log('🚨 检测到紧急备份数据，正在恢复:', appState);
          
          // 恢复状态
          if (appState.view) setView(appState.view);
          if (appState.activeTab) setActiveTab(appState.activeTab as SidebarTab);
          if (appState.sidebarVisible !== undefined) setSidebarVisible(appState.sidebarVisible);
          
          // 清除紧急备份
          sessionStorage.removeItem('avg-master-emergency-state');
          localStorage.removeItem('avg-master-emergency-backup');
          
          // 显示恢复提示
          console.log('✅ 紧急备份恢复完成');
          return; // 紧急备份优先级更高
        }
      } catch (error) {
        console.warn('紧急备份恢复失败:', error);
      }
      
      // 常规的崩溃恢复检查
      const recovery = crashRecovery.checkForCrashRecovery();
      
      if (recovery.hasRecovery && recovery.crashDetected) {
        console.log('🔄 检测到崩溃恢复数据:', recovery);
        setRecoveryData({
          appState: recovery.appState,
          fileBackups: recovery.fileBackups
        });
        setShowRecoveryModal(true);
      } else if (recovery.hasRecovery && recovery.appState) {
        // 静默恢复基本状态（非崩溃情况）
        const appState = recovery.appState;
        console.log('🔄 静默恢复应用状态:', appState);
        setView(appState.view || 'preview');
        setActiveTab((appState.activeTab as SidebarTab) || 'explorer');
        setSidebarVisible(appState.sidebarVisible !== undefined ? appState.sidebarVisible : true);
      }
    };

    // 延迟检查，确保组件完全加载
    setTimeout(checkRecovery, 1000);
  }, [workspaceState]);

  // 定期保存状态用于崩溃恢复
  React.useEffect(() => {
    const saveState = () => {
      crashRecovery.saveAppState({
        projectPath,
        activeFile,
        view,
        activeTab,
        sidebarVisible
      });
    };

    // 立即保存一次
    saveState();

    // 每30秒保存一次
    const interval = setInterval(saveState, 30000);

    return () => clearInterval(interval);
  }, [projectPath, activeFile, view, activeTab, sidebarVisible]);

  // 处理崩溃恢复
  const handleCrashRestore = async (restoreFiles: boolean, restoreProject: boolean) => {
    try {
      if (restoreFiles && recoveryData.fileBackups) {
        for (const filePath of Object.keys(recoveryData.fileBackups)) {
          await crashRecovery.restoreFile(filePath);
        }
      }

      if (restoreProject && recoveryData.appState) {
        const appState = recoveryData.appState;
        setView(appState.view || 'preview');
        setActiveTab((appState.activeTab as SidebarTab) || 'explorer');
        setSidebarVisible(appState.sidebarVisible !== undefined ? appState.sidebarVisible : true);
        
        // 这里可以添加重新打开项目和文件的逻辑
        // 需要 ProjectContext 提供相应的方法
      }

      setShowRecoveryModal(false);
      crashRecovery.clearRecoveryData();
      
      console.log('✅ 崩溃恢复完成');
    } catch (error) {
      console.error('❌ 崩溃恢复失败:', error);
    }
  };

  const handleRecoveryDismiss = () => {
    setShowRecoveryModal(false);
    crashRecovery.clearRecoveryData();
  };


  const getWindowTitle = () => {
    const defaultTitle = 'AVG Master';
    
    // 如果没有项目路径，返回默认标题
    if (!projectPath) {
      return defaultTitle;
    }
    
    const projectName = projectPath.split('/').pop() || defaultTitle;
    
    // 如果没有打开文件，只显示项目名
    if (!activeFile) {
      return projectName;
    }
    
    // 如果有打开文件，显示 "文件名 - 项目名"
    const fileName = activeFile.split('/').pop()?.replace('.ink', '') || 'Untitled';
    return `${fileName} - ${projectName}`;
  };

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--color-primary)' }}
    >
      {/* 顶部：标题栏 */}
      <div style={{ flexShrink: 0 }}>
        <TitleBar 
          title={getWindowTitle()}
          onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
          sidebarVisible={sidebarVisible}
        />
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：活动栏 */}
        {sidebarVisible && <ActivityBar activeTab={activeTab} onTabChange={setActiveTab} />}

        {/* 侧边栏 */}
        {sidebarVisible && activeTab === 'explorer' && <ProjectExplorer onSelect={selectFile} />}

        {/* 右侧：主区域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 顶部工具栏 */}
          <Toolbar
            view={view}
            onViewChange={setView}
            onOpenProject={openProject}
            onExportWeb={() => window.inkAPI.exportGame('web')}
            onExportDesktop={() => window.inkAPI.exportGame('desktop')}
          />

          {/* 内容区：分栏布局 */}
          <div className="flex flex-1 overflow-hidden">
            {/* 编辑器区域 */}
            <div
              className="w-2/3 h-full overflow-hidden"
              style={{
                borderRight: `1px solid var(--color-border)`,
                backgroundColor: 'var(--color-editorBackground)',
              }}
            >
              <Editor
                filePath={activeFile}
                onRunPlugin={(id, params) => {
                  const manifest = plugins.find((p) => p.id === id);
                  if (manifest) setPluginCtx({ manifest, params });
                }}
              />
            </div>

            {/* 预览 / 节点图 / 插件宿主 */}
            <div
              className="w-1/3 relative overflow-hidden"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              {pluginCtx ? (
                <PluginHost
                  plugin={pluginCtx.manifest}
                  params={pluginCtx.params}
                  onClose={() => setPluginCtx(null)}
                />
              ) : view === 'graph' ? (
                <NodeGraph filePath={activeFile} />
              ) : (
                <Preview filePath={activeFile} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 底部：状态栏 */}
      <div style={{ flexShrink: 0 }}>
        <StatusBar filePath={activeFile} />
      </div>

      {/* 崩溃恢复模态框 */}
      <CrashRecoveryModal
        isOpen={showRecoveryModal}
        appState={recoveryData.appState}
        fileBackups={recoveryData.fileBackups}
        onRestore={handleCrashRestore}
        onDismiss={handleRecoveryDismiss}
      />

      {/* 保存确认对话框 - 现在使用系统级对话框，保留作为降级方案 */}
      {showSaveDialog && (
        <div>
          {/* 如果系统对话框失败，这里可以显示自定义对话框作为降级方案 */}
          {/* 暂时隐藏，因为我们主要使用系统对话框 */}
        </div>
      )}
    </div>
  );
};

// 使用Provider包装App
export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <SaveProvider>
        <AppContent />
      </SaveProvider>
    </ThemeProvider>
  );
};

export default App;
