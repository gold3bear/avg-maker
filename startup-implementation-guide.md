# 崩溃自动恢复 vs 正常退出欢迎页面 - 实现指南

## 核心逻辑

### 当前实现机制
1. **正常退出**: 调用 `crashRecovery.normalExit()` → 清理恢复数据
2. **崩溃退出**: 不调用清理 → 恢复数据保留 → 下次启动检测到崩溃

### 新增启动管理器
`AppStartupManager` 根据恢复数据存在情况决定启动模式：

- **崩溃恢复模式**: 有恢复数据且检测到崩溃 → 自动恢复
- **会话恢复模式**: 有恢复数据但非崩溃 → 静默恢复
- **欢迎页面模式**: 无恢复数据 → 显示欢迎界面

## 实现方案

### 1. 在App.tsx中集成启动管理器

```typescript
import { appStartupManager } from './utils/AppStartupManager';

function App() {
  const [startupMode, setStartupMode] = useState<'loading' | 'crash-recovery' | 'welcome' | 'normal'>('loading');
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryData, setRecoveryData] = useState(null);

  useEffect(() => {
    // 检查启动模式
    const startupResult = appStartupManager.checkStartupMode();
    
    switch (startupResult.mode) {
      case 'crash-recovery':
        setStartupMode('crash-recovery');
        setShowRecoveryModal(true);
        setRecoveryData(startupResult.recoveryData);
        break;
        
      case 'welcome':
        setStartupMode('welcome');
        break;
        
      case 'restore-session':
        setStartupMode('normal');
        // 执行现有的恢复逻辑
        handleSessionRestore(startupResult.recoveryData);
        break;
    }
  }, []);

  const handleRecoveryComplete = () => {
    appStartupManager.handleRecoveryComplete();
    setStartupMode('normal');
    setShowRecoveryModal(false);
  };

  const handleWelcomeComplete = (action: 'new-project' | 'open-project' | 'skip') => {
    appStartupManager.handleWelcomeComplete();
    
    switch (action) {
      case 'new-project':
        // 创建新项目
        break;
      case 'open-project':
        // 打开项目选择器
        break;
      case 'skip':
        setStartupMode('normal');
        break;
    }
  };

  // 渲染不同的界面
  if (startupMode === 'loading') {
    return <LoadingScreen />;
  }

  if (startupMode === 'welcome') {
    return <WelcomeScreen onComplete={handleWelcomeComplete} />;
  }

  if (startupMode === 'crash-recovery') {
    return (
      <>
        <MainAppInterface />
        {showRecoveryModal && (
          <CrashRecoveryModal
            recoveryData={recoveryData}
            onRecover={handleRecoveryComplete}
            onDismiss={() => setShowRecoveryModal(false)}
          />
        )}
      </>
    );
  }

  // 正常模式
  return <MainAppInterface />;
}
```

### 2. 创建欢迎屏幕组件

```typescript
// src/components/WelcomeScreen.tsx
interface WelcomeScreenProps {
  onComplete: (action: 'new-project' | 'open-project' | 'skip') => void;
}

function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const welcomeContent = appStartupManager.getWelcomeContent();

  return (
    <div className="welcome-screen">
      <h1>{welcomeContent.title}</h1>
      <p>{welcomeContent.subtitle}</p>
      
      {welcomeContent.showRecentProjects && (
        <div className="recent-projects">
          <h2>最近的项目</h2>
          {welcomeContent.recentProjects.map(project => (
            <div key={project} onClick={() => openProject(project)}>
              {project}
            </div>
          ))}
        </div>
      )}
      
      <div className="actions">
        <button onClick={() => onComplete('new-project')}>
          创建新项目
        </button>
        <button onClick={() => onComplete('open-project')}>
          打开项目
        </button>
        <button onClick={() => onComplete('skip')}>
          跳过
        </button>
      </div>
    </div>
  );
}
```

## 测试命令

可以使用以下开发者控制台命令测试不同场景：

### 基础测试
```javascript
// 检查当前启动模式
window.__DEV_TESTING__.startup.checkStartupMode()

// 获取启动信息
window.__DEV_TESTING__.startup.getStartupInfo()
```

### 场景模拟
```javascript
// 模拟首次用户体验
window.__DEV_TESTING__.startup.simulateFirstTimeUser()

// 模拟崩溃恢复场景
window.__DEV_TESTING__.startup.simulateCrashRecovery()

// 强制进入欢迎模式
window.__DEV_TESTING__.startup.forceWelcomeMode()
```

### 数据清理
```javascript
// 清理所有数据重新开始
window.__DEV_TESTING__.recovery.clearLegacySystem()

// 查看所有存储数据
window.__DEV_TESTING__.recovery.showAllStorageData()
```

## 用户体验流程

### 正常使用流程
1. **首次启动** → 欢迎页面 → 选择创建/打开项目
2. **正常关闭** → 下次启动显示欢迎页面
3. **工作中崩溃** → 下次启动自动恢复工作状态

### 开发调试流程
1. 使用测试命令模拟不同场景
2. 验证启动模式是否正确
3. 测试欢迎页面和恢复功能

## 配置说明

### 启动模式检测逻辑
- **崩溃检测**: 比较sessionId，不同则认为是崩溃
- **首次用户检测**: 检查是否有用户偏好设置和项目历史
- **欢迎内容**: 根据是否首次用户和项目历史动态生成

### 数据持久化
- **用户偏好**: `avg-master-user-preferences`
- **恢复数据**: `inkEditor_crashRecovery` (兼容现有系统)
- **会话标识**: `avg-master-session-id`

这个实现保持了与现有系统的兼容性，同时提供了清晰的用户体验区分。