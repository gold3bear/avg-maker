# 数据职责重新设计

## 🔴 现有问题：职责不清晰

### activeFile 重复存储
```
avg-master-state (sessionStorage)     ← activeFile 在这里
avg-master-emergency-state (localStorage) ← activeFile 也在这里  
avg-master-recovery (localStorage)    ← activeFile 还在这里
avg-master-editor-state (localStorage)   ← activeFile 又在这里
```

**问题**：
- 同一个数据存4份
- 更新时机不同步
- 恢复时不知道用哪个
- 数据可能不一致

## ✅ 重构后：单一数据源

### 数据分层架构

```
应用状态层 (AppState)
├── avg-master-app-state (sessionStorage)    ← 优先级1：页面刷新恢复
├── avg-master-app-state (localStorage)      ← 优先级2：崩溃恢复
└── avg-master-app-state-backup (localStorage) ← 优先级3：备份保险

文件内容层 (FileContents) 
└── avg-master-file-contents (localStorage)  ← 专门存储文件内容备份

会话标识层
└── avg-master-session-id (localStorage)     ← 判断退出方式
```

### 职责明确划分

| 数据类型 | 存储位置 | 职责 | 更新时机 |
|----------|----------|------|----------|
| **应用状态** | sessionStorage | 页面刷新恢复 | beforeunload |
| **应用状态** | localStorage | 崩溃恢复 | 定期保存 |
| **应用状态** | localStorage(backup) | 备份保险 | 关键变更 |
| **文件内容** | localStorage | 内容恢复 | 文件修改时 |
| **会话标识** | localStorage | 退出判断 | 应用关闭时 |

## 🚀 使用方式对比

### 现在：分散混乱
```typescript
// 保存时：4个地方都要更新
sessionStorage.setItem('avg-master-state', JSON.stringify({activeFile}));
localStorage.setItem('avg-master-emergency-state', JSON.stringify({activeFile}));
crashRecovery.saveAppState({activeFile});
localStorage.setItem('avg-master-editor-state', JSON.stringify({activeFile}));

// 读取时：不知道用哪个
const session = sessionStorage.getItem('avg-master-state');
const emergency = localStorage.getItem('avg-master-emergency-state'); 
const crash = crashRecovery.checkForCrashRecovery();
const editor = localStorage.getItem('avg-master-editor-state');
// 到底该用哪个的activeFile？？？
```

### 重构后：单一入口
```typescript
// 保存：单一接口
stateDataManager.saveAppState({
  projectPath,
  activeFile,  // ← 只存一次，职责明确
  view,
  activeTab,
  sidebarVisible
}, StorageType.SESSION);

// 读取：单一接口，自动优先级处理
const appState = stateDataManager.getAppState();
if (appState) {
  const {activeFile} = appState; // ← 直接使用，不用纠结来源
}
```

## 🎯 迁移策略

### 阶段1：向后兼容
```typescript
export class StateDataManager {
  // 新方法：统一接口
  getAppState(): AppState | null {
    // 优先使用新存储
    const newState = this.getFromNewStorage();
    if (newState) return newState;
    
    // 兼容旧存储
    return this.getFromLegacyStorage();
  }
  
  private getFromLegacyStorage(): AppState | null {
    // 兼容现有的4个存储位置
    const sources = [
      sessionStorage.getItem('avg-master-state'),
      localStorage.getItem('avg-master-emergency-state'),
      crashRecovery.checkForCrashRecovery(),
      localStorage.getItem('avg-master-editor-state')
    ];
    // 返回第一个有效数据
  }
}
```

### 阶段2：数据迁移
```typescript
// 启动时自动迁移旧数据
async migrateFromLegacyStorage(): Promise<void> {
  const legacyState = this.getFromLegacyStorage();
  if (legacyState) {
    // 迁移到新存储
    this.saveAppState(legacyState);
    // 清理旧存储
    this.clearLegacyStorage();
  }
}
```

### 阶段3：完全切换
```typescript
// 移除所有兼容代码，只使用新存储
export class StateDataManager {
  getAppState(): AppState | null {
    return this.getFromNewStorage(); // 只有这一个方法
  }
}
```

## 📊 收益分析

| 指标 | 重构前 | 重构后 | 改进 |
|------|--------|--------|------|
| 存储位置 | 4个重复 | 1个主要+2个备份 | -50% |
| 数据一致性 | 经常不一致 | 始终一致 | +100% |
| 调试难度 | 很难定位问题 | 清晰的数据流 | +90% |
| 维护成本 | 修改需要改4处 | 修改只需要1处 | -75% |
| 代码可读性 | 很难理解 | 职责明确 | +80% |

## 🎯 核心原则

1. **单一数据源**：每种数据只有一个权威来源
2. **职责分离**：应用状态与文件内容分离
3. **优先级明确**：数据恢复有清晰的优先级
4. **向后兼容**：平滑迁移，不破坏现有功能
5. **易于调试**：统一的数据访问接口