# App.tsx 重构示例

## 现有问题的App.tsx (1000+行)
```typescript
const AppContent: React.FC = () => {
  // 多个状态管理
  const [appMode, setAppMode] = useState('loading');
  const hasAttemptedRecoveryRef = useRef(false);
  const isRecoveryCompleteRef = useRef(false);
  
  // 复杂的恢复逻辑
  const checkRecovery = async () => {
    // 100+ 行复杂逻辑
    // 多处重复调用
    // 6个setTimeout selectFile
    // 多个setAppMode调用
  };
  
  // 其他复杂逻辑...
}
```

## 重构后的App.tsx (简洁版本)
```typescript
const AppContent: React.FC = () => {
  const [appMode, setAppMode] = useState<AppLifecycleState>(AppLifecycleState.INITIALIZING);
  const [recoveryData, setRecoveryData] = useState<AppContext | null>(null);
  
  // 单一初始化逻辑
  useEffect(() => {
    initializeApplication();
  }, []);
  
  const initializeApplication = async () => {
    try {
      // 单一入口点
      const decision = await appLifecycleManager.initializeApp();
      
      if (decision.shouldShowWelcome) {
        setAppMode(AppLifecycleState.WELCOME);
      } else if (decision.shouldRestore) {
        await performRestore(decision.recoveryData!);
        setAppMode(AppLifecycleState.READY);
      } else {
        setAppMode(AppLifecycleState.READY);
      }
      
    } catch (error) {
      console.error('应用初始化失败:', error);
      setAppMode(AppLifecycleState.ERROR);
    }
  };
  
  const performRestore = async (data: AppContext) => {
    const success = await recoveryExecutor.executeRestore(data, {
      loadProject: loadProjectPath,
      selectFile,
      setView,
      setActiveTab,
      setSidebarVisible
    });
    
    if (!success) {
      // 恢复失败，显示欢迎页面
      setAppMode(AppLifecycleState.WELCOME);
    }
  };
  
  // 渲染逻辑更清晰
  if (appMode === AppLifecycleState.INITIALIZING) {
    return <LoadingScreen />;
  }
  
  if (appMode === AppLifecycleState.WELCOME) {
    return <WelcomeScreen onComplete={() => setAppMode(AppLifecycleState.READY)} />;
  }
  
  return <MainApplication />;
};
```

## 主要改进

### 1. 消除重复调用
- **之前**: 6个地方的setTimeout selectFile
- **现在**: 统一的RecoveryExecutor.executeRestore()

### 2. 简化状态管理  
- **之前**: 多层状态管理，ref状态，复杂检查
- **现在**: 单一状态机，清晰的状态转换

### 3. 统一数据访问
- **之前**: 多处分散的存储访问
- **现在**: AppLifecycleManager统一管理

### 4. 清晰的职责分离
- **AppLifecycleManager**: 决策应用如何启动
- **RecoveryExecutor**: 执行具体的恢复操作  
- **App.tsx**: 只负责UI渲染和状态展示

## 迁移策略

### 阶段1: 并行运行
```typescript
// 保留现有逻辑，添加新系统
const legacyRecovery = () => { /* 现有逻辑 */ };
const newRecovery = () => { /* 新系统 */ };

// 开发模式下可切换
const useNewSystem = process.env.NODE_ENV === 'development';
```

### 阶段2: 逐步替换
- 先替换数据收集逻辑
- 再替换决策逻辑  
- 最后替换执行逻辑

### 阶段3: 清理代码
- 移除旧的管理器
- 清理重复的状态
- 简化组件结构