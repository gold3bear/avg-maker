// 统一状态管理器 - 符合单一职责原则
import type { SidebarTab } from '../types/sidebar';

// 应用状态接口定义
export interface WorkspaceState {
  projectPath: string | null;
  recentProjects: string[];
}

export interface EditorState {
  activeFile: string | null;
  openFiles: string[];
  fileStates: Record<string, {
    content: string;
    cursorPosition?: { line: number; column: number };
    scrollTop?: number;
    lastModified: number;
  }>;
}

export interface UIState {
  view: 'preview' | 'graph';
  activeTab: SidebarTab;
  sidebarVisible: boolean;
  sidebarWidth?: number;
  editorWidth?: number;
}

export interface ApplicationState {
  workspace: WorkspaceState;
  editor: EditorState;
  ui: UIState;
  timestamp: number;
}

export type StateUpdateCallback = (state: ApplicationState) => void;

/**
 * 应用状态管理器
 * 职责：管理应用的实时状态，提供单一数据源
 */
export class StateManager {
  private state: ApplicationState;
  private listeners: Set<StateUpdateCallback> = new Set();

  constructor(initialState?: Partial<ApplicationState>) {
    this.state = this.createDefaultState();
    if (initialState) {
      this.state = { ...this.state, ...initialState };
    }
  }

  private createDefaultState(): ApplicationState {
    return {
      workspace: {
        projectPath: null,
        recentProjects: []
      },
      editor: {
        activeFile: null,
        openFiles: [],
        fileStates: {}
      },
      ui: {
        view: 'preview',
        activeTab: 'explorer',
        sidebarVisible: true
      },
      timestamp: Date.now()
    };
  }

  // 获取当前状态（只读）
  getState(): Readonly<ApplicationState> {
    return { ...this.state };
  }

  // 获取特定部分的状态
  getWorkspaceState(): Readonly<WorkspaceState> {
    return { ...this.state.workspace };
  }

  getEditorState(): Readonly<EditorState> {
    return { ...this.state.editor };
  }

  getUIState(): Readonly<UIState> {
    return { ...this.state.ui };
  }

  // 更新状态 - 单一入口
  updateState(update: Partial<ApplicationState>): void {
    const oldState = this.state;
    this.state = {
      ...oldState,
      ...update,
      timestamp: Date.now()
    };

    // 深度合并嵌套对象
    if (update.workspace) {
      this.state.workspace = { ...oldState.workspace, ...update.workspace };
    }
    if (update.editor) {
      this.state.editor = { ...oldState.editor, ...update.editor };
    }
    if (update.ui) {
      this.state.ui = { ...oldState.ui, ...update.ui };
    }

    // 通知监听器
    this.notifyListeners();
  }

  // 便捷的更新方法
  updateWorkspace(update: Partial<WorkspaceState>): void {
    this.updateState({ workspace: update });
  }

  updateEditor(update: Partial<EditorState>): void {
    this.updateState({ editor: update });
  }

  updateUI(update: Partial<UIState>): void {
    this.updateState({ ui: update });
  }

  // 订阅状态变化
  subscribe(callback: StateUpdateCallback): () => void {
    this.listeners.add(callback);
    
    // 返回取消订阅函数
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.state);
      } catch (error) {
        console.warn('状态监听器执行失败:', error);
      }
    });
  }

  // 重置状态
  reset(): void {
    this.state = this.createDefaultState();
    this.notifyListeners();
  }

  // 序列化状态用于存储
  serialize(): string {
    return JSON.stringify(this.state);
  }

  // 从序列化数据恢复状态
  deserialize(data: string): boolean {
    try {
      const parsed = JSON.parse(data) as ApplicationState;
      this.state = parsed;
      this.notifyListeners();
      return true;
    } catch (error) {
      console.warn('状态反序列化失败:', error);
      return false;
    }
  }
}

// 全局状态管理器实例
export const stateManager = new StateManager();