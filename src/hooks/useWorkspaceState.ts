// src/hooks/useWorkspaceState.ts
// VS Code风格的工作区状态管理Hook

import { useEffect, useCallback } from 'react';
import { crashRecovery } from '../utils/crashRecovery';

interface WorkspaceState {
  projectPath: string | null;
  recentProjects: string[];
  lastAccessed: number;
}

interface EditorState {
  activeFile: string | null;
  openFiles: string[];
  fileStates: Record<string, {
    content: string;
    cursorPosition?: { line: number; column: number };
    scrollTop?: number;
    lastModified: number;
  }>;
}

interface UIState {
  view: 'preview' | 'graph';
  activeTab: 'explorer' | 'search' | 'git' | 'bot' | 'settings';
  sidebarVisible: boolean;
  sidebarWidth?: number;
  editorWidth?: number;
}

interface UseWorkspaceStateProps {
  projectPath: string | null;
  activeFile: string | null;
  view: 'preview' | 'graph';
  activeTab: 'explorer' | 'search' | 'git' | 'bot' | 'settings';
  sidebarVisible: boolean;
  sidebarWidth?: number;
  editorWidth?: number;
}

export const useWorkspaceState = ({
  projectPath,
  activeFile,
  view,
  activeTab,
  sidebarVisible,
  sidebarWidth,
  editorWidth
}: UseWorkspaceStateProps) => {
  
  // 持续保存工作区状态
  const saveWorkspaceState = useCallback(() => {
    if (projectPath) {
      const workspaceState: WorkspaceState = {
        projectPath,
        recentProjects: [projectPath], // TODO: 实际应该从历史记录获取
        lastAccessed: Date.now()
      };
      crashRecovery.saveWorkspaceState(workspaceState);
    }
  }, [projectPath]);

  // 持续保存编辑器状态
  const saveEditorState = useCallback(() => {
    const editorState: EditorState = {
      activeFile,
      openFiles: activeFile ? [activeFile] : [], // TODO: 实际应该维护打开文件列表
      fileStates: {} // TODO: 从编辑器获取文件状态
    };
    crashRecovery.saveEditorState(editorState);
  }, [activeFile]);

  // 持续保存UI状态
  const saveUIState = useCallback(() => {
    const uiState: UIState = {
      view,
      activeTab,
      sidebarVisible,
      sidebarWidth,
      editorWidth
    };
    crashRecovery.saveUIState(uiState);
  }, [view, activeTab, sidebarVisible, sidebarWidth, editorWidth]);

  // 恢复状态
  const restoreStates = useCallback(() => {
    console.log('🔄 开始恢复工作区状态...');
    
    const workspaceState = crashRecovery.restoreWorkspaceState();
    const editorState = crashRecovery.restoreEditorState();
    const uiState = crashRecovery.restoreUIState();
    
    // 如果编辑器状态为空或没有activeFile，尝试从主崩溃恢复数据获取
    let finalEditorState = editorState;
    if (!editorState || !editorState.activeFile) {
      console.log('🔄 编辑器状态为空或无activeFile，尝试从主崩溃恢复数据获取');
      console.log('🔄 原始编辑器状态:', editorState);
      const mainRecovery = crashRecovery.checkForCrashRecovery();
      console.log('🔄 主崩溃恢复数据:', mainRecovery);
      if (mainRecovery.hasRecovery && mainRecovery.appState && mainRecovery.appState.activeFile) {
        console.log('🔄 从主崩溃恢复数据中找到activeFile:', mainRecovery.appState.activeFile);
        finalEditorState = {
          activeFile: mainRecovery.appState.activeFile,
          openFiles: [mainRecovery.appState.activeFile],
          fileStates: {}
        };
        console.log('🔄 构建的finalEditorState:', finalEditorState);
      } else {
        console.log('🔄 主崩溃恢复数据中没有找到activeFile');
      }
    } else {
      console.log('🔄 使用原有编辑器状态:', editorState);
    }
    
    return {
      workspace: workspaceState,
      editor: finalEditorState,
      ui: uiState
    };
  }, []);

  // 检查是否应该恢复状态
  const shouldRestore = useCallback(() => {
    return crashRecovery.shouldRestore();
  }, []);

  // 自动保存状态
  useEffect(() => {
    const saveAll = () => {
      saveWorkspaceState();
      saveEditorState();
      saveUIState();
    };

    // 立即保存一次
    saveAll();

    // 每次状态变化时保存
    const timeoutId = setTimeout(saveAll, 100);

    return () => clearTimeout(timeoutId);
  }, [saveWorkspaceState, saveEditorState, saveUIState]);

  // 页面卸载时保存状态
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveWorkspaceState();
      saveEditorState();
      saveUIState();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // 页面隐藏时保存状态
        handleBeforeUnload();
      }
    };

    // 监听多种事件确保状态被保存
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [saveWorkspaceState, saveEditorState, saveUIState]);

  return {
    restoreStates,
    shouldRestore,
    saveWorkspaceState,
    saveEditorState,
    saveUIState
  };
};