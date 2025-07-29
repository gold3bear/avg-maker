// src/types/preview.ts
// Preview组件相关的类型定义

export interface HistoryEntry {
  /** 当前步骤的输出文本 */
  output: string[];
  /** 当前步骤的选择项 */
  choices: any[];
  /** 用户选择的选项索引（如果有） */
  choiceIndex?: number;
  /** 当前所在的Knot名称 */
  knotName: string;
  /** 步骤创建时间戳 */
  timestamp: number;
  /** Ink Story的状态快照 */
  storyState?: string;
}

export interface GameState {
  /** 当前所在的Knot名称 */
  currentKnot: string;
  /** 总步数 */
  stepCount: number;
  /** 历史记录栈 */
  history: HistoryEntry[];
  /** 当前Ink变量状态 */
  variables: Record<string, any>;
  /** 是否可以前进（重做） */
  canRedo: boolean;
  /** 是否可以后退 */
  canUndo: boolean;
}

export interface SaveData {
  /** 保存的游戏状态 */
  gameState: GameState;
  /** 保存时间 */
  savedAt: number;
  /** 保存的文件路径 */
  filePath: string;
  /** 保存名称 */
  saveName: string;
}

export interface NavigationAction {
  type: 'RESET' | 'UNDO' | 'REDO' | 'CHOICE' | 'EXPORT_WEB' | 'EXPORT_DESKTOP';
  payload?: any;
}