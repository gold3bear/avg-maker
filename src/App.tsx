/// <reference path="./types/global.d.ts" />
import React, { useContext, useState, useRef, useCallback } from 'react';
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
import AIChatPanel from './components/ai/AIChatPanel';
import { CrashRecoveryModal } from './components/CrashRecoveryModal';
import { crashRecovery } from './utils/crashRecovery';
import { setupTestingUtils } from './utils/testingUtils';
import { useWorkspaceState } from './hooks/useWorkspaceState';
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
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [editorWidth, setEditorWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth * 0.66 : 800
  );
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

  // 清理所有恢复数据的辅助函数
  const clearAllRecoveryData = useCallback(() => {
    console.log('🧹 App: 清理所有恢复数据');
    crashRecovery.normalExit();
    sessionStorage.removeItem('avg-master-state');
    localStorage.removeItem('avg-master-emergency-state');
    localStorage.removeItem('avg-master-emergency-backup');
    console.log('✅ App: 所有恢复数据已清理');
  }, []);

  // 安全的文件选择函数，检查当前模式
  const safeSelectFile = useCallback((filePath: string) => {
    // 检查当前appMode，只有在normal或crash-recovery模式下才执行
    if (appMode === 'welcome' || appMode === 'loading') {
      console.log('⚠️ App: 跳过文件选择，当前处于:', appMode);
      return;
    }
    console.log('📁 App: 安全选择文件:', filePath);
    selectFile(filePath);
  }, [appMode, selectFile]);

  const handleSidebarResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    const onMouseMove = (e: MouseEvent) => {
      const newWidth = Math.min(Math.max(startWidth + e.clientX - startX, 150), 600);
      setSidebarWidth(newWidth);
    };
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleEditorResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = editorWidth;
    const onMouseMove = (e: MouseEvent) => {
      const containerWidth = window.innerWidth - (sidebarVisible ? sidebarWidth + 48 : 0);
      const maxWidth = containerWidth - 200;
      const newWidth = Math.min(Math.max(startWidth + e.clientX - startX, 200), maxWidth);
      setEditorWidth(newWidth);
    };
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // VS Code风格的状态管理
  const workspaceState = useWorkspaceState({
    projectPath,
    activeFile,
    view,
    activeTab,
    sidebarVisible,
    sidebarWidth,
    editorWidth
  });

  // 使用ref保存最新状态，避免在beforeunload时状态被重置
  const latestStateRef = useRef({
    projectPath,
    activeFile,
    view,
    activeTab,
    sidebarVisible,
    sidebarWidth,
    editorWidth
  });

  // 更新最新状态ref并立即保存重要状态变化
  React.useEffect(() => {
    latestStateRef.current = {
      projectPath,
      activeFile,
      view,
      activeTab,
      sidebarVisible,
      sidebarWidth,
      editorWidth
    };
    
    // 当重要状态变化时立即保存到sessionStorage（恢复完成后）
    if (isRecoveryCompleteRef.current && (projectPath || activeFile)) {
      const appState = {
        projectPath,
        activeFile,
        view,
        activeTab,
        sidebarVisible,
        sidebarWidth,
        editorWidth,
        timestamp: Date.now()
      };
      
      try {
        sessionStorage.setItem('avg-master-state', JSON.stringify(appState));
        localStorage.setItem('avg-master-emergency-state', JSON.stringify(appState));
        console.log('🔄 App: 重要状态变化，立即保存:', { projectPath, activeFile });
      } catch (error) {
        console.warn('立即保存状态失败:', error);
      }
    } else if (!isRecoveryCompleteRef.current) {
      console.log('⏸️ App: 恢复未完成，跳过立即保存:', { projectPath, activeFile });
    }
  }, [projectPath, activeFile, view, activeTab, sidebarVisible, sidebarWidth, editorWidth]);

  // 更新独立预览窗口中的文件
  React.useEffect(() => {
    console.log('🔄 App: activeFile changed:', activeFile);
    if (activeFile) {
      console.log('📤 App: Updating preview file:', activeFile);
      // 优先使用统一API，回退到直接调用
      import('./api').then(({ api }) => {
        console.log('✅ App: Unified API loaded, calling updatePreviewFile');
        if (api.updatePreviewFile) {
          api.updatePreviewFile(activeFile).then(() => {
            console.log('✅ App: Preview file updated successfully via unified API');
          }).catch((error) => {
            console.warn('❌ App: Failed to update preview file via unified API:', error);
            // 回退到旧API
            console.log('🔄 App: Falling back to old API');
            window.inkAPI.updatePreviewFile?.(activeFile);
          });
        } else {
          console.log('⚠️ App: updatePreviewFile not available in unified API, using old API');
          window.inkAPI.updatePreviewFile?.(activeFile);
        }
      }).catch((error) => {
        // 统一API加载失败，使用旧API
        console.log('❌ App: Unified API failed to load, using old API:', error);
        window.inkAPI.updatePreviewFile?.(activeFile);
      });
    } else {
      console.log('⚠️ App: No activeFile to update preview');
    }
  }, [activeFile]);

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
      
      // 如果是窗口正在关闭，标记正常退出但不保存状态
      if (isClosing) {
        clearAllRecoveryData();
        console.log('🚪 App: 正常关闭，已清理所有恢复数据');
        return;
      }

      // 只有在非正常关闭时才保存状态到多个存储位置确保可靠性
      const appState = {
        ...currentState,
        timestamp: Date.now()
      };
      
      try {
        // 保存到 sessionStorage（优先）
        sessionStorage.setItem('avg-master-state', JSON.stringify(appState));
        console.log('💾 App: 状态已保存到 sessionStorage');
        
        // 同时保存到 localStorage 作为备份
        localStorage.setItem('avg-master-emergency-state', JSON.stringify(appState));
        console.log('💾 App: 状态已保存到 localStorage 作为备份');
        
        // 使用崩溃恢复系统保存
        crashRecovery.saveAppState(appState);
        console.log('💾 App: 状态已保存到崩溃恢复系统');
      } catch (error) {
        console.warn('Failed to save app state:', error);
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
          sidebarWidth,
          editorWidth,
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
      // 只有在真正关闭应用时才清理数据，而不是在热重载或刷新时
      // 在开发模式下，组件卸载通常是因为热重载，不应该清理恢复数据
      if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'development') {
        crashRecovery.normalExit();
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
              clearAllRecoveryData();
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
            clearAllRecoveryData();
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
        clearAllRecoveryData();
        
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

  // 页面加载时检查崩溃恢复
  React.useEffect(() => {
    // 设置开发测试工具
    setupTestingUtils();
    
    const checkRecovery = async () => {
      try {
        // 如果已经尝试过恢复，不再执行
        if (hasAttemptedRecoveryRef.current) {
          console.log('🔄 App: 已经尝试过恢复，跳过重复执行');
          setAppMode('normal'); // 确保设置为正常模式
          return;
        }
        
        console.log('🔄 App: 开始检查数据恢复 (第一次)');
        console.log('🔄 App: hasAttemptedRecoveryRef.current 当前值:', hasAttemptedRecoveryRef.current);
        
        // 立即标记已经尝试过恢复，防止重复执行
        hasAttemptedRecoveryRef.current = true;
        console.log('🔄 App: 已设置 hasAttemptedRecoveryRef.current = true');

        // 用于跟踪是否应该继续恢复逻辑
        let shouldContinueRecovery = true;
      
      // 使用启动管理器检查启动模式
      const startupResult = appStartupManager.checkStartupMode();
      console.log('🚀 App: 启动模式检测结果:', startupResult);
      
      // 检查是否是正常退出
      const sessionId = localStorage.getItem('avg-master-session-id');
      const isNormalExit = sessionId === ''; // normalExit()会设置空字符串
      
      // 检查是否有任何恢复数据
      const sessionData = sessionStorage.getItem('avg-master-state');
      const emergencyData = localStorage.getItem('avg-master-emergency-state');
      const hasAnyRecoveryData = sessionData || emergencyData;
      
      console.log('🔍 App: 启动状态检查:', {
        sessionData: !!sessionData,
        emergencyData: !!emergencyData,
        startupMode: startupResult.mode,
        isNormalExit: isNormalExit,
        sessionId: sessionId
      });
      
      // 如果是正常退出，清理所有恢复数据并进入欢迎模式
      if (isNormalExit) {
        console.log('✅ App: 检测到正常退出，清理恢复数据并进入欢迎模式');
        // 只清理状态数据，不调用crashRecovery.normalExit()避免重复
        sessionStorage.removeItem('avg-master-state');
        localStorage.removeItem('avg-master-emergency-state');
        localStorage.removeItem('avg-master-emergency-backup');
        setAppMode('welcome');
        isRecoveryCompleteRef.current = true;
        shouldContinueRecovery = false; // 停止后续恢复逻辑
        return;
      }
      
      // 根据启动模式设置应用状态
      if (startupResult.mode === 'welcome' && !hasAnyRecoveryData) {
        console.log('👋 App: 进入欢迎页面模式（无恢复数据）');
        setAppMode('welcome');
        isRecoveryCompleteRef.current = true; // 欢迎模式下标记恢复完成
        shouldContinueRecovery = false; // 停止后续恢复逻辑
        return;
      }
      
      // 如果有恢复数据，即使启动管理器建议欢迎模式，也继续恢复流程
      if (startupResult.mode === 'welcome' && hasAnyRecoveryData) {
        console.log('🔄 App: 检测到恢复数据，覆盖欢迎模式，继续恢复流程');
      }
      
      if (startupResult.mode === 'crash-recovery') {
        console.log('💥 App: 进入崩溃恢复模式');
        console.log('💥 App: 崩溃恢复数据:', startupResult.recoveryData);
        setAppMode('crash-recovery');
        setShowRecoveryModal(true);
        setRecoveryData(startupResult.recoveryData);
        return;
      }
      
      // 继续现有的恢复逻辑（用于restore-session模式）
      console.log('🔄 App: 继续会话恢复逻辑');
      
      // 确认开始恢复过程，更新会话ID
      crashRecovery.confirmRecoveryStart();
      
      // 检查崩溃恢复数据
      const crashRecoveryData = crashRecovery.checkForCrashRecovery();
      
      console.log('🔍 App: 恢复数据检查结果:', {
        sessionData: !!sessionData,
        sessionDataContent: sessionData ? JSON.parse(sessionData) : null,
        emergencyData: !!emergencyData,
        emergencyDataContent: emergencyData ? JSON.parse(emergencyData) : null,
        crashRecovery: crashRecoveryData.hasRecovery,
        crashRecoveryData: crashRecoveryData,
        workspaceRestore: workspaceState.shouldRestore()
      });
      
      // 额外的调试信息
      console.log('🔍 App: localStorage崩溃恢复原始数据:', localStorage.getItem('avg-master-recovery'));
      console.log('🔍 App: localStorage会话ID:', localStorage.getItem('avg-master-session-id'));
      console.log('🔍 App: crashRecoveryData完整信息:', crashRecoveryData);
      
      // 检查sessionData中的activeFile信息
      if (sessionData) {
        const sessionState = JSON.parse(sessionData);
        console.log('🔍 App: sessionStorage中的activeFile:', sessionState.activeFile);
      }
      
      // 优先检查 sessionStorage 中的状态数据，因为它包含最完整的状态
      if (shouldContinueRecovery && sessionData) {
        try {
          const appState = JSON.parse(sessionData);
          console.log('🔄 App: 从 sessionStorage 恢复状态:', appState);
          console.log('🔄 App: 当前状态对比:', {
            当前projectPath: projectPath,
            恢复projectPath: appState.projectPath,
            当前activeFile: activeFile,
            恢复activeFile: appState.activeFile,
            当前view: view,
            恢复view: appState.view
          });
          
          // 恢复状态 - 确保所有状态都被恢复
          if (appState.view) setView(appState.view);
          if (appState.activeTab) setActiveTab(appState.activeTab as SidebarTab);
          if (appState.sidebarVisible !== undefined) setSidebarVisible(appState.sidebarVisible);
          if (appState.sidebarWidth !== undefined) setSidebarWidth(appState.sidebarWidth);
          if (appState.editorWidth !== undefined) setEditorWidth(appState.editorWidth);
          
          // 特别处理projectPath恢复 - 使用loadProjectPath
          if (appState.projectPath && appState.projectPath !== projectPath) {
            console.log('🔄 App: 恢复项目路径:', appState.projectPath);
            try {
              const success = await loadProjectPath(appState.projectPath);
              if (!success) {
                console.warn('恢复项目路径失败');
              }
            } catch (error) {
              console.warn('恢复项目路径失败:', error);
            }
          }
          
          // 恢复当前打开的文件
          if (appState.activeFile && appState.activeFile !== activeFile) {
            console.log('🔄 App: 恢复当前打开的文件:', appState.activeFile);
            // 延迟执行确保项目路径已经恢复
            setTimeout(() => {
              safeSelectFile(appState.activeFile);
            }, 500);
          }
          
          // 延迟清除数据，确保不会影响其他可能的恢复逻辑
          setTimeout(() => {
            sessionStorage.removeItem('avg-master-state');
            console.log('🧹 App: 已清除sessionStorage恢复数据');
          }, 2000);
          
          console.log('✅ sessionStorage 状态恢复完成');
          isRecoveryCompleteRef.current = true;
          return;
        } catch (error) {
          console.warn('从 sessionStorage 恢复状态失败:', error);
        }
      }
      
      // VS Code风格：检查是否应该恢复状态（作为备用方案）
      // 但如果已经进入欢迎模式就不要再恢复了
      if (shouldContinueRecovery && workspaceState.shouldRestore()) {
        console.log('🔄 VS Code风格恢复：检测到需要恢复的状态（备用方案）');
        
        const states = workspaceState.restoreStates();
        
        // 恢复UI状态
        if (states.ui) {
          console.log('🎨 恢复UI状态:', states.ui);
          setView(states.ui.view || 'preview');
          setActiveTab(states.ui.activeTab || 'explorer');
          setSidebarVisible(states.ui.sidebarVisible !== undefined ? states.ui.sidebarVisible : true);
          if (states.ui.sidebarWidth !== undefined) setSidebarWidth(states.ui.sidebarWidth);
          if (states.ui.editorWidth !== undefined) setEditorWidth(states.ui.editorWidth);
        }
        
        // 恢复编辑器状态 (包括从主崩溃恢复数据中获取的)
        if (states.editor && states.editor.activeFile) {
          console.log('📝 恢复编辑器状态:', states.editor);
          console.log('📝 编辑器状态详情:', {
            hasActiveFile: !!states.editor.activeFile,
            savedActiveFile: states.editor.activeFile,
            currentActiveFile: activeFile,
            filesAreDifferent: states.editor.activeFile !== activeFile
          });
          
          if (states.editor.activeFile !== activeFile) {
            console.log('📝 恢复当前打开的文件:', states.editor.activeFile);
            setTimeout(() => {
              safeSelectFile(states.editor.activeFile);
            }, 800); // 延迟确保项目已加载
          } else {
            console.log('📝 跳过文件恢复，文件已经是当前活动文件');
          }
        } else {
          console.log('📝 没有找到有效的编辑器状态数据，尝试备用恢复方案');
          
          // 备用方案：直接从主要的崩溃恢复数据中获取
          if (crashRecoveryData.hasRecovery && crashRecoveryData.appState && crashRecoveryData.appState.activeFile) {
            console.log('📝 从主崩溃恢复数据中恢复文件:', crashRecoveryData.appState.activeFile);
            setTimeout(() => {
              safeSelectFile(crashRecoveryData.appState.activeFile);
            }, 1000); // 延迟更长时间确保项目已加载
          } else {
            console.log('📝 没有找到任何可恢复的文件信息');
          }
        }
        
        // 恢复工作区状态 - 实际调用openProject
        if (states.workspace && states.workspace.projectPath) {
          console.log('📁 恢复工作区状态:', states.workspace);
          console.log('📁 当前projectPath:', projectPath, '需要恢复的projectPath:', states.workspace.projectPath);
          
          if (states.workspace.projectPath !== projectPath) {
            console.log('📁 开始恢复项目路径:', states.workspace.projectPath);
            try {
              const success = await loadProjectPath(states.workspace.projectPath);
              if (success) {
                console.log('✅ 项目路径恢复成功');
              } else {
                console.error('❌ 项目路径恢复失败');
              }
            } catch (error) {
              console.error('❌ 项目路径恢复出错:', error);
            }
          } else {
            console.log('📁 项目路径已经是正确的，无需恢复');
          }
        }
        
        // 检查是否成功恢复了activeFile，如果没有，继续检查主崩溃恢复数据
        if (!states.editor || !states.editor.activeFile) {
          console.log('📝 VS Code风格恢复没有找到activeFile，继续检查主崩溃恢复数据');
          // 不设置恢复完成，让后面的主恢复逻辑继续执行
        } else {
          console.log('✅ VS Code风格恢复完成，成功找到activeFile:', states.editor.activeFile);
          isRecoveryCompleteRef.current = true;
          return; // VS Code风格恢复完成
        }
      }
      
      // 检查紧急备份（localStorage）
      if (shouldContinueRecovery && emergencyData) {
        try {
          const appState = JSON.parse(emergencyData);
          console.log('🚨 App: 从紧急备份恢复状态:', appState);
          
          // 恢复状态
          if (appState.view) setView(appState.view);
          if (appState.activeTab) setActiveTab(appState.activeTab as SidebarTab);
          if (appState.sidebarVisible !== undefined) setSidebarVisible(appState.sidebarVisible);
          
          // 恢复项目路径
          if (appState.projectPath && appState.projectPath !== projectPath) {
            console.log('🚨 App: 从紧急备份恢复项目路径:', appState.projectPath);
            try {
              const success = await loadProjectPath(appState.projectPath);
              if (!success) {
                console.warn('从紧急备份恢复项目路径失败');
              }
            } catch (error) {
              console.warn('从紧急备份恢复项目路径失败:', error);
            }
          }
          
          // 恢复当前打开的文件
          if (appState.activeFile && appState.activeFile !== activeFile) {
            console.log('🚨 App: 从紧急备份恢复当前打开的文件:', appState.activeFile);
            setTimeout(() => {
              safeSelectFile(appState.activeFile);
            }, 500);
          }
          
          // 延迟清除紧急备份，确保不会影响其他可能的恢复逻辑
          setTimeout(() => {
            localStorage.removeItem('avg-master-emergency-state');
            console.log('🧹 App: 已清除localStorage紧急备份数据');
          }, 2000);
          
          console.log('✅ 紧急备份恢复完成');
          isRecoveryCompleteRef.current = true;
          return;
        } catch (error) {
          console.warn('紧急备份恢复失败:', error);
        }
      }
      
      // 常规的崩溃恢复检查
      const recovery = crashRecovery.checkForCrashRecovery();
      
      if (shouldContinueRecovery && recovery.hasRecovery && recovery.crashDetected) {
        console.log('🔄 检测到崩溃恢复数据:', recovery);
        setRecoveryData({
          appState: recovery.appState,
          fileBackups: recovery.fileBackups
        });
        setShowRecoveryModal(true);
      } else if (shouldContinueRecovery && recovery.hasRecovery && recovery.appState) {
        // 静默恢复基本状态（非崩溃情况）
        const appState = recovery.appState;
        console.log('🔄 静默恢复应用状态:', appState);
        setView(appState.view || 'preview');
        setActiveTab((appState.activeTab as SidebarTab) || 'explorer');
        setSidebarVisible(appState.sidebarVisible !== undefined ? appState.sidebarVisible : true);
        if (appState.sidebarWidth !== undefined) setSidebarWidth(appState.sidebarWidth);
        if (appState.editorWidth !== undefined) setEditorWidth(appState.editorWidth);
        
        // 恢复项目路径
        if (appState.projectPath && appState.projectPath !== projectPath) {
          console.log('🔄 App: 静默恢复项目路径:', appState.projectPath);
          try {
            const success = await loadProjectPath(appState.projectPath);
            if (!success) {
              console.warn('静默恢复项目路径失败');
            }
          } catch (error) {
            console.warn('静默恢复项目路径失败:', error);
          }
        }
        
        // 恢复当前打开的文件
        if (appState.activeFile && appState.activeFile !== activeFile) {
          console.log('🔄 App: 静默恢复当前打开的文件:', appState.activeFile);
          setTimeout(() => {
            safeSelectFile(appState.activeFile);
          }, 500);
        } else if (appState.activeFile) {
          console.log('🔄 App: 文件已经是当前活动文件，无需恢复:', appState.activeFile);
        } else {
          console.log('🔄 App: 没有找到需要恢复的活动文件');
        }
        
        console.log('✅ 静默恢复完成');
        isRecoveryCompleteRef.current = true;
        if (shouldContinueRecovery) {
          setAppMode('normal');
        }
      } else if (shouldContinueRecovery) {
        console.log('🔄 App: 没有找到需要恢复的数据');
        isRecoveryCompleteRef.current = true; // 即使没有数据恢复也标记完成
        setAppMode('normal'); // 确保在没有数据恢复时也设置为正常模式
      }
      
      // 只有在需要继续恢复且没有其他模式设置时，才设置为正常模式
      if (shouldContinueRecovery) {
        console.log('🔄 App: 恢复流程完成，设置为正常模式');
        setAppMode('normal');
      }
      } catch (error) {
        console.error('❌ App: 恢复过程出错，设置为正常模式:', error);
        isRecoveryCompleteRef.current = true;
        // 错误情况下确保应用不会卡住，但如果已经设置为欢迎模式就保持
        if (appMode === 'loading') {
          setAppMode('normal'); // 确保即使出错也能进入正常模式
        }
      }
    };

    // 延迟检查，确保组件完全加载（减少延迟以提高启动速度）
    const timeoutId = setTimeout(async () => {
      try {
        await checkRecovery();
      } catch (error) {
        console.error('❌ App: checkRecovery执行失败，强制进入正常模式:', error);
        hasAttemptedRecoveryRef.current = true;
        isRecoveryCompleteRef.current = true;
        // 只有在loading状态时才强制设置为normal
        if (appMode === 'loading') {
          setAppMode('normal');
        }
      }
    }, 100);
    
    // 添加超时保险机制，确保加载状态绝对不会永远卡住
    const emergencyTimeoutId = setTimeout(() => {
      console.warn('⚠️ App: 应急超时触发，强制进入正常模式');
      hasAttemptedRecoveryRef.current = true;
      isRecoveryCompleteRef.current = true;
      // 只有在loading状态时才强制设置为normal，避免覆盖欢迎模式
      if (appMode === 'loading') {
        setAppMode('normal');
      }
    }, 3000); // 3秒超时，更快响应
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(emergencyTimeoutId);
    };
  }, [loadProjectPath]);

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
      console.log('💾 App: 检查状态内容:', {
        hasProjectPath: !!appState.projectPath,
        hasActiveFile: !!appState.activeFile,
        projectPath: appState.projectPath,
        activeFile: appState.activeFile
      });
      
      // 多重保存确保可靠性
      try {
        // 1. 保存到崩溃恢复系统
        crashRecovery.saveAppState(appState);
        
        // 2. 保存到 sessionStorage
        sessionStorage.setItem('avg-master-state', JSON.stringify({
          ...appState,
          timestamp: Date.now()
        }));
        
        // 3. 保存到 localStorage 作为备份
        localStorage.setItem('avg-master-emergency-state', JSON.stringify({
          ...appState,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.warn('定期保存状态失败:', error);
      }
    };

    // 立即保存一次
    saveState();

    // 每10秒保存一次（增加频率）
    const interval = setInterval(saveState, 10000);

    return () => clearInterval(interval);
  }, [projectPath, activeFile, view, activeTab, sidebarVisible, sidebarWidth, editorWidth]);

  // 处理崩溃恢复
  const handleCrashRestore = async (restoreFiles: boolean, restoreProject: boolean) => {
    try {
      // 确认开始恢复过程
      crashRecovery.confirmRecoveryStart();
      if (restoreFiles && recoveryData.fileBackups) {
        for (const filePath of Object.keys(recoveryData.fileBackups)) {
          await crashRecovery.restoreFile(filePath);
        }
      }

      if (restoreProject && recoveryData.appState) {
        const appState = recoveryData.appState;
        console.log('🔄 恢复项目状态:', appState);

        setView(appState.view || 'preview');
        setActiveTab((appState.activeTab as SidebarTab) || 'explorer');
        setSidebarVisible(appState.sidebarVisible !== undefined ? appState.sidebarVisible : true);
        if (appState.sidebarWidth !== undefined) setSidebarWidth(appState.sidebarWidth);
        if (appState.editorWidth !== undefined) setEditorWidth(appState.editorWidth);
        
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
            safeSelectFile(appState.activeFile);
            console.log('✅ 崩溃恢复：文件恢复完成');
          }, 1000); // 使用更长的延迟确保项目加载完成
        }
      }

      setShowRecoveryModal(false);
      crashRecovery.clearRecoveryData();
      setAppMode('normal');
      
      console.log('✅ 崩溃恢复完成');
    } catch (error) {
      console.error('❌ 崩溃恢复失败:', error);
    }
  };

  const handleRecoveryDismiss = () => {
    setShowRecoveryModal(false);
    crashRecovery.clearRecoveryData();
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
          activeFile={activeFile}
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
            {/* 左侧：活动栏和侧边栏 */}
            {sidebarVisible && (
              <>
                <ActivityBar activeTab={activeTab} onTabChange={setActiveTab} />
                <div
                  className="flex flex-col relative flex-shrink-0 h-full"
                  style={{
                    width: sidebarWidth,
                    backgroundColor: 'var(--color-sidebarBackground)',
                    color: 'var(--color-sidebarForeground)'
                  }}
                >
                  {activeTab === 'explorer' && <ProjectExplorer onSelect={selectFile} />}
                  {activeTab === 'bot' && (
                    <AIChatPanel
                      isOpen={true}
                      onToggle={() => {}}
                      projectContext={{
                        currentFile: activeFile,
                        projectName: projectPath ? projectPath.split(/[/\\]/).pop() : ''
                      }}
                    />
                  )}
                  <div
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize"
                    style={{ backgroundColor: 'var(--color-sidebarBorder)' }}
                    onMouseDown={handleSidebarResizeStart}
                  />
                </div>
              </>
            )}

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
                  className="h-full overflow-hidden flex-shrink-0"
                  style={{
                    width: editorWidth,
                    borderRight: `1px solid var(--color-border)`,
                    backgroundColor: 'var(--color-editorBackground)'
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
                <div
                  className="w-1 cursor-col-resize flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-border)' }}
                  onMouseDown={handleEditorResizeStart}
                />

                {/* 预览 / 节点图 / 插件宿主 */}
                <div
                  className="relative overflow-hidden flex-1"
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
