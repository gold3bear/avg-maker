# 存储系统重构 - 单一职责原则(SRP)设计

## 当前问题

### 职责混淆
- **主崩溃恢复系统** (`AppState`): 混合了所有应用状态
- **VS Code风格系统** (`WorkspaceState`, `EditorState`, `UIState`): 重复存储相同数据
- **结果**: `activeFile` 等数据存储在两个地方，导致不一致和复杂的恢复逻辑

## 重构方案：清晰的职责分离

### 1. 应用状态管理器 (ApplicationStateManager)
**职责**: 管理应用的实时状态
```typescript
interface ApplicationState {
  workspace: {
    projectPath: string | null;
    recentProjects: string[];
  };
  editor: {
    activeFile: string | null;
    openFiles: string[];
    fileStates: Record<string, FileState>;
  };
  ui: {
    view: 'preview' | 'graph';
    activeTab: SidebarTab;
    sidebarVisible: boolean;
    layout: LayoutConfig;
  };
}
```

### 2. 崩溃恢复管理器 (CrashRecoveryManager)
**职责**: 专门处理意外崩溃的数据恢复
```typescript
interface CrashRecoveryData {
  sessionId: string;
  timestamp: number;
  lastKnownState: ApplicationState;
  fileBackups: Record<string, FileBackup>;
  crashDetected: boolean;
}
```

### 3. 会话持久化管理器 (SessionPersistenceManager)
**职责**: 处理正常的会话状态持久化（类似VS Code的workbench状态）
```typescript
interface SessionData {
  workspace: WorkspaceSession;
  editor: EditorSession;
  ui: UISession;
  lastSaved: number;
}
```

## 重构后的架构

### 单一数据源
```typescript
class StateManager {
  private state: ApplicationState;
  private crashRecovery: CrashRecoveryManager;
  private sessionPersistence: SessionPersistenceManager;

  // 单一状态更新入口
  updateState(update: Partial<ApplicationState>) {
    this.state = { ...this.state, ...update };
    
    // 自动同步到不同的存储系统
    this.sessionPersistence.saveState(this.state);
    this.crashRecovery.backupState(this.state);
  }
}
```

### 恢复优先级策略
```typescript
class RecoveryOrchestrator {
  async recoverApplication(): Promise<ApplicationState> {
    // 1. 检查崩溃恢复（最高优先级）
    const crashData = await this.crashRecovery.checkForCrash();
    if (crashData.crashDetected) {
      return this.handleCrashRecovery(crashData);
    }

    // 2. 正常会话恢复
    const sessionData = await this.sessionPersistence.loadSession();
    if (sessionData) {
      return this.restoreFromSession(sessionData);
    }

    // 3. 默认状态
    return this.getDefaultState();
  }
}
```

## 实现步骤

### 步骤1: 创建统一的状态管理器
- 定义清晰的状态接口
- 实现单一状态更新入口
- 建立状态变更监听机制

### 步骤2: 重构崩溃恢复系统
- 专注于崩溃检测和数据备份
- 移除与正常状态管理的混淆
- 优化文件备份策略

### 步骤3: 实现会话持久化
- 处理正常的状态保存/恢复
- 支持渐进式保存
- 实现清理机制

### 步骤4: 统一恢复入口
- 创建恢复协调器
- 实现清晰的优先级策略
- 简化应用启动逻辑

## 好处

1. **符合SRP**: 每个组件有单一明确的职责
2. **数据一致性**: 单一数据源，避免状态不同步
3. **可维护性**: 清晰的架构，容易理解和修改
4. **可测试性**: 职责分离使单元测试更容易
5. **扩展性**: 新的存储需求可以独立添加

## 实现成果

已完成符合SRP的新存储架构实现：

### 核心组件

1. **StateManager** (`src/utils/StateManager.ts`)
   - 单一状态管理，提供统一的数据源
   - 支持状态订阅和变更通知
   - 类型安全的状态更新接口

2. **CrashRecoveryManager** (`src/utils/CrashRecoveryManager.ts`)
   - 专门处理崩溃检测和数据恢复
   - 自动备份机制
   - 会话ID管理

3. **SessionPersistenceManager** (`src/utils/SessionPersistenceManager.ts`)
   - 正常会话状态持久化
   - 防抖保存优化
   - localStorage + sessionStorage双重保险

4. **RecoveryOrchestrator** (`src/utils/RecoveryOrchestrator.ts`)
   - 统一恢复流程管理
   - 清晰的优先级策略
   - 恢复完成后的状态管理启动

5. **StorageSystem** (`src/utils/StorageSystem.ts`)
   - 统一入口API
   - 简化使用复杂性
   - 类型安全的接口

## 使用示例

### 在App.tsx中的使用
```typescript
import { storageSystem } from './utils/StorageSystem';

function App() {
  const [isRecovering, setIsRecovering] = useState(true);
  
  useEffect(() => {
    async function initializeApp() {
      const result = await storageSystem.initialize();
      
      if (result.showRecoveryModal) {
        // 显示崩溃恢复对话框
        setShowRecoveryModal(true);
      }
      
      setIsRecovering(false);
    }
    
    initializeApp();
    
    // 应用关闭时清理
    return () => storageSystem.cleanup();
  }, []);
  
  // 状态更新示例
  const handleFileOpen = (filePath: string) => {
    storageSystem.updateEditor({ activeFile: filePath });
  };
  
  const handleProjectOpen = (projectPath: string) => {
    storageSystem.updateWorkspace({ projectPath });
  };
}
```

### 在组件中使用状态订阅
```typescript
import { storageSystem } from './utils/StorageSystem';

function FileExplorer() {
  const [projectPath, setProjectPath] = useState(null);
  
  useEffect(() => {
    const unsubscribe = storageSystem.subscribe((state) => {
      setProjectPath(state.workspace.projectPath);
    });
    
    return unsubscribe;
  }, []);
}
```

## 迁移策略

### 阶段1: 并行运行（当前）
- 新系统已实现，可以并行测试
- 保持现有系统继续工作
- 逐步迁移组件使用新API

### 阶段2: 数据迁移
- 实现从旧localStorage键到新键的数据迁移
- 确保用户数据不丢失
- 提供回退机制

### 阶段3: 切换
- 将App.tsx等核心组件切换到新系统
- 移除旧的crashRecovery.ts
- 清理无用代码

### 阶段4: 优化
- 性能优化
- 添加更多测试
- 文档完善

## 好处验证

✅ **单一职责**: 每个类有明确的单一职责  
✅ **数据一致性**: 统一状态管理，避免不同步  
✅ **可维护性**: 清晰的架构，易于理解和修改  
✅ **可测试性**: 职责分离使单元测试更容易  
✅ **扩展性**: 新的存储需求可以独立添加