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
import { storageSystem } from './utils/StorageSystem';
import { setupTestingUtils } from './utils/testingUtils';
import { appStartupManager } from './utils/AppStartupManager';
import { WelcomeScreen } from './components/WelcomeScreen';
import { LicenseNotice } from './components/LicenseNotice';
import type { SidebarTab } from './types/sidebar';

const AppContent: React.FC = () => {
  const { plugins, activeFile, selectFile, openProject, loadProjectPath, projectPath } = useContext(ProjectContext)!;
  const { hasUnsavedChanges, getUnsavedFiles, saveAllFiles } = useSave();
  const [view, setView] = useState<'preview' | 'graph'>('preview');
  const [activeTab, setActiveTab] = useState<SidebarTab>('explorer');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [pluginCtx, setPluginCtx] = useState<{
    manifest: any;
    params?: any;
  } | null>(null);
  
  // 应用启动状态
  const [appMode, setAppMode] = useState<'loading' | 'welcome' | 'normal' | 'crash-recovery'>('loading');
  
  // 许可证接受状态
  const [licenseAccepted, setLicenseAccepted] = useState(false);
  
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
  
  // 防止恢复逻辑重复执行 - 使用useRef确保在组件重新渲染时不会重置
  const hasAttemptedRecoveryRef = useRef(false);
  
  // 防止在恢复完成前定期保存覆盖正确数据
  const isRecoveryCompleteRef = useRef(false);


  // 使用ref保存最新状态，避免在beforeunload时状态被重置
  const latestStateRef = useRef({
    projectPath,
    activeFile,
    view,
    activeTab,
    sidebarVisible
  });

  // 更新最新状态ref并立即保存重要状态变化
  React.useEffect(() => {
    latestStateRef.current = {
      projectPath,
      activeFile,
      view,
      activeTab,
      sidebarVisible
    };
    
    if (isRecoveryCompleteRef.current && (projectPath || activeFile)) {
      try {
        storageSystem.updateWorkspace({ projectPath });
        storageSystem.updateEditor({ activeFile });
        storageSystem.updateUI({ view, activeTab, sidebarVisible });
        console.log('🔄 App: 重要状态变化，立即保存:', { projectPath, activeFile });
      } catch (error) {
        console.warn('立即保存状态失败:', error);
      }
    } else if (!isRecoveryCompleteRef.current) {
      console.log('⏸️ App: 恢复未完成，跳过立即保存:', { projectPath, activeFile });
    }
  }, [projectPath, activeFile, view, activeTab, sidebarVisible]);

  // 防止页面刷新导致数据丢失
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // 检查是否被测试工具标记禁止自动保存
      if ((window as any).__PREVENT_AUTO_SAVE__) {
        console.log('🧪 App: 测试工具禁止自动保存，跳过beforeunload保存');
        return;
      }
      
      console.log('🔄 App: beforeunload 事件触发，保存状态');
      
      // 使用ref中的最新状态，避免使用可能被重置的React状态
      const currentState = latestStateRef.current;
      console.log('🔄 App: 当前状态 from ref:', currentState);
      
      try {
        storageSystem.updateWorkspace({ projectPath: currentState.projectPath });
        storageSystem.updateEditor({ activeFile: currentState.activeFile });
        storageSystem.updateUI({
          view: currentState.view,
          activeTab: currentState.activeTab,
          sidebarVisible: currentState.sidebarVisible
        });
      } catch (error) {
        console.warn('Failed to save app state:', error);
      }

      // 如果是窗口正在关闭，不阻止
      if (isClosing) {
        storageSystem.cleanup();
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
        try {
          storageSystem.updateWorkspace({ projectPath });
          storageSystem.updateEditor({ activeFile });
          storageSystem.updateUI({ view, activeTab, sidebarVisible });
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
      // 只有在真正关闭应用时才清理数据，而不是在热重载或刷新时
      // 在开发模式下，组件卸载通常是因为热重载，不应该清理恢复数据
      if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'development') {
        storageSystem.cleanup();
      } else {
        console.log('🔧 App: 开发模式下跳过正常退出清理，保留恢复数据');
      }
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
              storageSystem.cleanup();
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
            storageSystem.cleanup();
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
        storageSystem.cleanup();
        
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

  // 检查许可证接受状态
  React.useEffect(() => {
    const accepted = localStorage.getItem('avg-master-license-accepted');
    if (accepted === 'true') {
      setLicenseAccepted(true);
    }
  }, []);

  // 应用初始化与恢复
  React.useEffect(() => {
    setupTestingUtils();

    async function init() {
      const startupResult = appStartupManager.checkStartupMode();

      if (startupResult.mode === 'welcome') {
        setAppMode('welcome');
        isRecoveryCompleteRef.current = true;
        return;
      }

      if (startupResult.mode === 'crash-recovery') {
        setShowRecoveryModal(true);
        setRecoveryData(startupResult.recoveryData);
      }

      const result = await storageSystem.initialize();
      const state = storageSystem.getCurrentState();

      setView(state.ui.view);
      setActiveTab(state.ui.activeTab);
      setSidebarVisible(state.ui.sidebarVisible);

      if (state.workspace.projectPath) {
        await loadProjectPath(state.workspace.projectPath);
      }

      if (state.editor.activeFile) {
        selectFile(state.editor.activeFile);
      }

      if (result.showRecoveryModal) {
        setShowRecoveryModal(true);
      }

      isRecoveryCompleteRef.current = true;
      setAppMode('normal');
    }

    init();

    return () => {
      storageSystem.cleanup();
    };
  }, [loadProjectPath, selectFile]);

  // 定期保存状态用于崩溃恢复
  React.useEffect(() => {
    const saveState = () => {
      // 检查是否被测试工具标记禁止自动保存
      if ((window as any).__PREVENT_AUTO_SAVE__) {
        console.log('🧪 App: 测试工具禁止自动保存，跳过定期保存');
        return;
      }
      
      // 如果恢复还没完成，不要保存空状态覆盖正确数据
      if (!isRecoveryCompleteRef.current) {
        console.log('⏸️ App: 恢复未完成，跳过定期保存避免覆盖正确数据');
        return;
      }
      
      // 使用ref中的最新状态确保数据准确性
      const appState = {
        ...latestStateRef.current
      };
      
      console.log('💾 App: 定期保存状态:', appState);

      try {
        storageSystem.updateWorkspace({ projectPath: appState.projectPath });
        storageSystem.updateEditor({ activeFile: appState.activeFile });
        storageSystem.updateUI({
          view: appState.view,
          activeTab: appState.activeTab,
          sidebarVisible: appState.sidebarVisible
        });
      } catch (error) {
        console.warn('定期保存状态失败:', error);
      }
    };

    // 立即保存一次
    saveState();

    // 每10秒保存一次（增加频率）
    const interval = setInterval(saveState, 10000);

    return () => clearInterval(interval);
  }, [projectPath, activeFile, view, activeTab, sidebarVisible]);

  // 处理崩溃恢复
  const handleCrashRestore = async (restoreFiles: boolean, restoreProject: boolean) => {
    try {
      if (restoreFiles && recoveryData.fileBackups) {
        // TODO: implement file restoration via storageSystem
      }

      if (restoreProject && recoveryData.appState) {
        const appState = recoveryData.appState;
        console.log('🔄 恢复项目状态:', appState);
        
        setView(appState.view || 'preview');
        setActiveTab((appState.activeTab as SidebarTab) || 'explorer');
        setSidebarVisible(appState.sidebarVisible !== undefined ? appState.sidebarVisible : true);
        
        // 恢复项目路径
        if (appState.projectPath && appState.projectPath !== projectPath) {
          console.log('🔄 崩溃恢复：恢复项目路径:', appState.projectPath);
          try {
            const success = await loadProjectPath(appState.projectPath);
            if (success) {
              console.log('✅ 崩溃恢复：项目路径恢复成功');
            } else {
              console.error('❌ 崩溃恢复：项目路径恢复失败');
            }
          } catch (error) {
            console.error('❌ 崩溃恢复：项目路径恢复出错:', error);
          }
        }
        
        // 恢复当前打开的文件
        if (appState.activeFile && appState.activeFile !== activeFile) {
          console.log('🔄 崩溃恢复：恢复当前打开的文件:', appState.activeFile);
          // 延迟执行确保项目路径已经恢复
          setTimeout(() => {
            selectFile(appState.activeFile);
            console.log('✅ 崩溃恢复：文件恢复完成');
          }, 1000); // 使用更长的延迟确保项目加载完成
        }
      }

      setShowRecoveryModal(false);
      storageSystem.clearRecoveryData();
      setAppMode('normal');
      
      console.log('✅ 崩溃恢复完成');
    } catch (error) {
      console.error('❌ 崩溃恢复失败:', error);
    }
  };

  const handleRecoveryDismiss = () => {
    setShowRecoveryModal(false);
    storageSystem.clearRecoveryData();
    setAppMode('normal');
  };

  // 欢迎页面事件处理
  const handleWelcomeCreateProject = () => {
    console.log('🆕 App: 创建新项目');
    appStartupManager.handleWelcomeComplete();
    setAppMode('normal');
    // 这里可以调用实际的创建项目逻辑
    // 暂时跳过，用户可以通过工具栏创建
  };

  const handleWelcomeOpenProject = (projectPath?: string) => {
    console.log('📂 App: 打开项目', projectPath);
    appStartupManager.handleWelcomeComplete();
    setAppMode('normal');
    
    if (projectPath) {
      // 打开指定的项目路径
      loadProjectPath(projectPath);
    } else {
      // 打开项目选择对话框
      openProject();
    }
  };

  const handleWelcomeSkip = () => {
    console.log('⏭️ App: 跳过欢迎页面');
    appStartupManager.handleWelcomeComplete();
    setAppMode('normal');
  };

  const getWindowTitle = () => {
    const defaultTitle = 'AVG Maker';
    
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
        {/* 加载状态 */}
        {appMode === 'loading' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">正在启动应用...</p>
            </div>
          </div>
        )}

        {/* 欢迎页面 */}
        {appMode === 'welcome' && (
          <WelcomeScreen
            onCreateProject={handleWelcomeCreateProject}
            onOpenProject={handleWelcomeOpenProject}
            onSkip={handleWelcomeSkip}
          />
        )}

        {/* 正常模式和崩溃恢复模式 */}
        {(appMode === 'normal' || appMode === 'crash-recovery') && (
          <>
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
          </>
        )}
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

      {/* 许可证接受模态框 */}
      {!licenseAccepted && (
        <LicenseNotice 
          onAccept={() => setLicenseAccepted(true)} 
        />
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
