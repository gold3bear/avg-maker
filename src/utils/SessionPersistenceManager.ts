// 会话持久化管理器 - 处理正常的会话状态持久化
import type { ApplicationState, WorkspaceState, EditorState, UIState } from './StateManager';

interface SessionData {
  workspace: WorkspaceState;
  editor: EditorState;
  ui: UIState;
  lastSaved: number;
  version: string;
}

const WORKSPACE_SESSION_KEY = 'avg-master-workspace-session';
const EDITOR_SESSION_KEY = 'avg-master-editor-session';
const UI_SESSION_KEY = 'avg-master-ui-session';
const SESSION_VERSION = '1.0.0';

/**
 * 会话持久化管理器
 * 职责：处理正常的会话状态持久化（类似VS Code的workbench状态）
 */
export class SessionPersistenceManager {
  private saveTimeout: NodeJS.Timeout | null = null;
  private readonly debounceMs: number = 500;

  /**
   * 保存应用状态到会话存储
   */
  saveState(state: ApplicationState): void {
    // 防抖保存，避免频繁写入
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.doSaveState(state);
    }, this.debounceMs);
  }

  private doSaveState(state: ApplicationState): void {
    try {
      const sessionData: SessionData = {
        workspace: state.workspace,
        editor: state.editor,
        ui: state.ui,
        lastSaved: Date.now(),
        version: SESSION_VERSION
      };

      // 分别保存到不同的键，便于独立管理
      this.saveWorkspaceSession(sessionData.workspace);
      this.saveEditorSession(sessionData.editor);
      this.saveUISession(sessionData.ui);

      console.log('💾 SessionPersistence: 会话状态已保存');
    } catch (error) {
      console.warn('SessionPersistence: 保存会话状态失败:', error);
    }
  }

  private saveWorkspaceSession(workspace: WorkspaceState): void {
    const data = {
      ...workspace,
      lastSaved: Date.now(),
      version: SESSION_VERSION
    };
    
    localStorage.setItem(WORKSPACE_SESSION_KEY, JSON.stringify(data));
    sessionStorage.setItem(WORKSPACE_SESSION_KEY, JSON.stringify(data));
  }

  private saveEditorSession(editor: EditorState): void {
    const data = {
      ...editor,
      lastSaved: Date.now(),
      version: SESSION_VERSION
    };
    
    localStorage.setItem(EDITOR_SESSION_KEY, JSON.stringify(data));
    sessionStorage.setItem(EDITOR_SESSION_KEY, JSON.stringify(data));
  }

  private saveUISession(ui: UIState): void {
    const data = {
      ...ui,
      lastSaved: Date.now(),
      version: SESSION_VERSION
    };
    
    localStorage.setItem(UI_SESSION_KEY, JSON.stringify(data));
    sessionStorage.setItem(UI_SESSION_KEY, JSON.stringify(data));
  }

  /**
   * 加载会话状态
   */
  loadSession(): ApplicationState | null {
    try {
      const workspace = this.loadWorkspaceSession();
      const editor = this.loadEditorSession();
      const ui = this.loadUISession();

      // 如果任何一部分都没有，返回null
      if (!workspace && !editor && !ui) {
        console.log('📭 SessionPersistence: 没有找到会话数据');
        return null;
      }

      console.log('📂 SessionPersistence: 会话状态已加载');
      
      return {
        workspace: workspace || this.getDefaultWorkspace(),
        editor: editor || this.getDefaultEditor(),
        ui: ui || this.getDefaultUI(),
        timestamp: Date.now()
      };
    } catch (error) {
      console.warn('SessionPersistence: 加载会话状态失败:', error);
      return null;
    }
  }

  private loadWorkspaceSession(): WorkspaceState | null {
    // 优先从sessionStorage加载，然后是localStorage
    const sessionData = sessionStorage.getItem(WORKSPACE_SESSION_KEY);
    const localData = localStorage.getItem(WORKSPACE_SESSION_KEY);
    
    const data = sessionData || localData;
    if (!data) return null;

    try {
      const parsed = JSON.parse(data);
      return {
        projectPath: parsed.projectPath,
        recentProjects: parsed.recentProjects || []
      };
    } catch (error) {
      console.warn('SessionPersistence: 解析工作区会话失败:', error);
      return null;
    }
  }

  private loadEditorSession(): EditorState | null {
    const sessionData = sessionStorage.getItem(EDITOR_SESSION_KEY);
    const localData = localStorage.getItem(EDITOR_SESSION_KEY);
    
    const data = sessionData || localData;
    if (!data) return null;

    try {
      const parsed = JSON.parse(data);
      return {
        activeFile: parsed.activeFile,
        openFiles: parsed.openFiles || [],
        fileStates: parsed.fileStates || {}
      };
    } catch (error) {
      console.warn('SessionPersistence: 解析编辑器会话失败:', error);
      return null;
    }
  }

  private loadUISession(): UIState | null {
    const sessionData = sessionStorage.getItem(UI_SESSION_KEY);
    const localData = localStorage.getItem(UI_SESSION_KEY);
    
    const data = sessionData || localData;
    if (!data) return null;

    try {
      const parsed = JSON.parse(data);
      return {
        view: parsed.view || 'preview',
        activeTab: parsed.activeTab || 'explorer',
        sidebarVisible: parsed.sidebarVisible !== undefined ? parsed.sidebarVisible : true,
        sidebarWidth: parsed.sidebarWidth,
        editorWidth: parsed.editorWidth
      };
    } catch (error) {
      console.warn('SessionPersistence: 解析UI会话失败:', error);
      return null;
    }
  }

  private getDefaultWorkspace(): WorkspaceState {
    return {
      projectPath: null,
      recentProjects: []
    };
  }

  private getDefaultEditor(): EditorState {
    return {
      activeFile: null,
      openFiles: [],
      fileStates: {}
    };
  }

  private getDefaultUI(): UIState {
    return {
      view: 'preview',
      activeTab: 'explorer',
      sidebarVisible: true
    };
  }

  /**
   * 清理会话数据
   */
  clearSession(): void {
    localStorage.removeItem(WORKSPACE_SESSION_KEY);
    localStorage.removeItem(EDITOR_SESSION_KEY);
    localStorage.removeItem(UI_SESSION_KEY);
    
    sessionStorage.removeItem(WORKSPACE_SESSION_KEY);
    sessionStorage.removeItem(EDITOR_SESSION_KEY);
    sessionStorage.removeItem(UI_SESSION_KEY);
    
    console.log('🧹 SessionPersistence: 会话数据已清理');
  }

  /**
   * 获取会话统计信息
   */
  getSessionInfo(): {
    hasWorkspace: boolean;
    hasEditor: boolean;
    hasUI: boolean;
    lastSaved?: number;
  } {
    const workspaceData = localStorage.getItem(WORKSPACE_SESSION_KEY);
    const editorData = localStorage.getItem(EDITOR_SESSION_KEY);
    const uiData = localStorage.getItem(UI_SESSION_KEY);

    let lastSaved: number | undefined;
    try {
      if (workspaceData) {
        const parsed = JSON.parse(workspaceData);
        lastSaved = parsed.lastSaved;
      }
    } catch (error) {
      // 忽略解析错误
    }

    return {
      hasWorkspace: !!workspaceData,
      hasEditor: !!editorData,
      hasUI: !!uiData,
      lastSaved
    };
  }

  /**
   * 立即保存（跳过防抖）
   */
  saveStateImmediate(state: ApplicationState): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.doSaveState(state);
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
  }
}